// statsController.js
const Property = require('../models/property');
const Driver = require('../models/users');
const Client = require('../models/clients');
const Booking = require('../models/booking');
const Vehicle = require('../models/vehicle');
const User = require('../models/users');

exports.getStats = async (req, res) => {
  try {
    // Always exclude deleted bookings for main counts
    const baseFilter = { is_deleted: { $ne: true } };

    // Top-level metrics
    const totalUsers = await Driver.countDocuments({ role: { $ne: "admin" } });
    const totalBookings = await Booking.countDocuments(baseFilter);
    const totalVehicles = await Vehicle.countDocuments();

    const totalActiveBookings = await Booking.countDocuments({
      ...baseFilter,
      status: { $nin: ["Pending", "Completed", "Cancelled"] } // adjust as per your definition
    });

    // Deleted bookings count
    const totalDeletedBookings = await Booking.countDocuments({ is_deleted: true });

    // Booking status counts (excluding deleted)
    const bookingStatusCountsRaw = await Booking.aggregate([
      { $match: baseFilter },
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 }
        }
      }
    ]);

    const countsObj = bookingStatusCountsRaw.reduce((acc, cur) => {
      acc[cur._id] = cur.count;
      return acc;
    }, {});

    const allStatuses = [
      "Pending",
      "Go/On the way",
      "Arrived at pickup location",
      "No show",
      "Collected",
      "Completed",
      "Cancelled"
    ];

    const finalStatusCounts = {};
    allStatuses.forEach((status) => {
      finalStatusCounts[status] = countsObj[status] || 0;
    });

    // ✅ Monthly stats (excluding deleted)
    const monthlyStats = await Booking.aggregate([
      { $match: baseFilter },
      {
        $group: {
          _id: { year: { $year: "$date" }, month: { $month: "$date" } },
          count: { $sum: 1 }
        }
      },
      { $sort: { "_id.year": 1, "_id.month": 1 } }
    ]);

    // Format monthly stats as YYYY-MM → count
    const formattedMonthlyStats = monthlyStats.map((item) => ({
      month: `${item._id.year}-${String(item._id.month).padStart(2, "0")}`,
      count: item.count
    }));

    // Response payload
    res.status(200).json({
      success: true,
      totalUsers,
      totalBookings,
      totalVehicles,
      totalActiveBookings,
      totalDeletedBookings,   // ✅ new metric
      bookingStatusCounts: finalStatusCounts,
      monthlyStats: formattedMonthlyStats // ✅ added back
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};



exports.getDriverStats = async (req, res) => {
  try {
    const { driver_id } = req.query;

    if (!driver_id) {
      return res.status(400).json({ message: "driver_id is required" });
    }


    const pendingBookings = await Booking.countDocuments({
      driver_id,
      status: "Pending"
    })


    const currentBooking = await Booking.countDocuments({
      driver_id,
      status: { $ne: "Pending" }
    });
    const completedBookings = await Booking.countDocuments({
      driver_id,
      status: 'Completed'
    });
    const noShowBookings = await Booking.countDocuments({
      driver_id,
      status : { $regex: /^(no show|cancelled)$/i }
    });

    return res.status(200).json({
      driver_id,
      pendingBookings,
      currentBooking,
      noShowBookings,
      completedBookings
    });

  } catch (error) {
    console.error('Driver Stats Error:', error);
    return res.status(500).json({ message: 'Failed to get driver stats', error: error.message });
  }
};