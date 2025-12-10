const Booking = require('../models/booking');
const Property = require('../models/property');
const { sendSuccess, sendError } = require('../helpers/responseHelper');
const cron = require('node-cron');
const { ObjectId } = require('mongodb')

exports.createBooking = async (req, res) => {
    try {
        const { date, time, property_id } = req.body;

        // // Check if booking already exists for the same date, time, and property
        // const existingBooking = await Booking.findOne({ date, time, property_id });

        // if (existingBooking) {
        //     return sendError(res, 'Booking already exists for the selected date and time slot.', 400);
        // }

        // If no conflict, proceed with saving the new booking
        req.body.driver_id = new ObjectId(req.body.driver_id)
        const booking = new Booking(req.body);
        await booking.save();
        return sendSuccess(res, 'Booking created successfully', { booking }, 200);
    } catch (err) {
        return sendError(res, 'Something went wrong while creating the booking', 500, err.message);
    }
};




exports.getBookings = async (req, res) => {
    try {
        let filter = {};

        // Deleted filter
        if (req.query.is_deleted === "true") {
            filter.is_deleted = true; // only deleted
        } else {
            filter.is_deleted = { $ne: true }; // only non-deleted
        }

        // Completed filter
        if (req.query.is_completed === "true") {
            filter.status = req.query.is_completed;
        }
        if (req.query.status) {
            filter.status = req.query.status;
        }

        // Driver filter
        if (req.query.driver_id) {
            filter.driver_id = new ObjectId(req.query.driver_id);
        }
         if (req.query.client_id) {
            filter.client_id = new ObjectId(req.query.client_id);
        }

        // Date range filter
        if (req.query.start_date && req.query.end_date) {
            filter.date = {
                $gte: new Date(req.query.start_date),
                $lte: new Date(req.query.end_date),
            };
        }

        // Today's date range
        const startOfDay = new Date();
        startOfDay.setHours(0, 0, 0, 0);

        const endOfDay = new Date();
        endOfDay.setHours(23, 59, 59, 999);

        const bookings = await Booking.aggregate([
            { $match: filter },
            {
                $addFields: {
                    isToday: {
                        $cond: [
                            {
                                $and: [
                                    { $gte: ["$date", startOfDay] },
                                    { $lte: ["$date", endOfDay] }
                                ]
                            },
                            1,
                            0
                        ]
                    },
                    sortPickup: {
                        $add: [
                            { $dateTrunc: { date: "$date", unit: "day" } }, // midnight timestamp
                            { $multiply: ["$pickUpTime", 60000] }           // minutes → ms
                        ]
                    }
                }
            },
            {
                $sort: {
                    isToday: -1,   // today’s bookings first
                    sortPickup: 1  // earliest pickup time first
                }
            }
            ,
            {
                $sort: {
                    isToday: -1,      // today first
                    sortPickup: 1     // earliest pickup time first
                }
            }
        ]);

        // Populate driver manually after aggregation
        await Booking.populate(bookings, { path: ["driver_id", "client_id","supplier_id"] });

        res.status(200).json({
            success: true,
            data: bookings,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};




exports.getDriverBookings = async (req, res) => {
    try {
        const { driver_id, status } = req.query;

        if (!driver_id) {
            return res.status(400).json({
                success: false,
                message: "driver_id is required"
            });
        }

        let filter = { driver_id: new ObjectId(driver_id) };

        if (status) {
            if (status.toLowerCase() === "pending") {
                filter.status = "Pending";
            } else if (status.toLowerCase() === "active") {
                filter.status = { $ne: "Pending" };
            }
            else if (status.toLowerCase() === "completed") {
                filter.status = 'Completed'
            }
            else if (status.toLowerCase() === "no show") {
                 filter.status = { $regex: /^(no show|cancelled)$/i };
            }
        }

        // Today's date range
        const startOfDay = new Date();
        startOfDay.setHours(0, 0, 0, 0);

        const endOfDay = new Date();
        endOfDay.setHours(23, 59, 59, 999);

        // Aggregate to prioritize today’s bookings and sort by pickup time
        const bookings = await Booking.aggregate([
            { $match: filter },
            {
                $addFields: {
                    isToday: {
                        $cond: [
                            {
                                $and: [
                                    { $gte: ["$date", startOfDay] },
                                    { $lte: ["$date", endOfDay] }
                                ]
                            },
                            1,
                            0
                        ]
                    },
                    sortPickup: {
                        $add: [
                            { $dateTrunc: { date: "$date", unit: "day" } }, // midnight timestamp
                            { $multiply: ["$pickUpTime", 60000] }           // pickup time (in minutes)
                        ]
                    }
                }
            },
            {
                $sort: {
                    isToday: -1,   // today’s bookings first
                    sortPickup: 1  // earliest pickup time first
                }
            }
        ]);

        // Populate driver manually after aggregation
        await Booking.populate(bookings, { path: "driver_id" });

        res.status(200).json({
            success: true,
            data: bookings
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};







// Function to generate invoice number format: INV-YYYYMMDD-XXX
const generateInvoiceNumber = async () => {
    const date = new Date();
    const formattedDate = date.toISOString().slice(0, 10).replace(/-/g, ""); // YYYYMMDD

    // Count how many bookings were created today
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    const countToday = await Booking.countDocuments({
        createdAt: { $gte: startOfDay, $lte: endOfDay }
    });

    const sequence = (countToday + 1).toString().padStart(3, "0"); // 001, 002, 003...
    return `INV-${formattedDate}-${sequence}`;
};

// 📌 New API: GET invoice number
exports.getInvoiceNumber = async (req, res) => {
    try {
        const invoiceNumber = await generateInvoiceNumber();
        return sendSuccess(res, "Invoice number generated successfully", {
            invoice_number: invoiceNumber
        });
    } catch (err) {
        return sendError(res, "Failed to generate invoice number", 500, err.message);
    }
};



exports.getBookingById = async (req, res) => {
    try {
        const booking = await Booking.findOne({ _id: req.query.id }).populate(["client_id"]);
        if (!booking) return sendError(res, 'Booking not found', 404);
        return sendSuccess(res, 'Booking fetched successfully', { booking });
    } catch (err) {
        return sendError(res, 'Failed to fetch booking', 500, err.message);
    }
};

exports.updateBooking = async (req, res) => {
    try {
        let { id, ...updateData } = req.body;
        //updateData.driver_id = new ObjectId(updateData.driver_id)

        if (!id) return sendError(res, "Booking ID is required in body", 400);

        // Update the booking
        const booking = await Booking.findByIdAndUpdate(id, updateData, { new: true });

        if (!booking) return sendError(res, "Booking not found", 404);



        return sendSuccess(res, "Booking updated successfully", { booking });
    } catch (err) {
        console.error("Error in updateBooking:", err);
        return sendError(res, "Failed to update booking", 500, err.message);
    }
};
exports.assignDriver = async (req, res) => {
    try {
        const { id, ...updateData } = req.body;

        if (!id) return sendError(res, "Booking ID is required in body", 400);

        // Update the booking
        const booking = await Booking.findByIdAndUpdate(id, updateData, { new: true });

        if (!booking) return sendError(res, "Booking not found", 404);



        return sendSuccess(res, "Driver assigned successfully", { booking });
    } catch (err) {
        console.error("Error in updateBooking:", err);
        return sendError(res, "Failed to update booking", 500, err.message);
    }
};

// exports.updateFeedback = async (req, res) => {
//   try {
//     const { id, feedback } = req.body;

//     if (!id) return sendError(res, "Booking ID is required", 400);
//     if (!feedback || typeof feedback !== 'object')
//       return sendError(res, "Feedback object is required", 400);

//     // Update the feedback field
//     const booking = await Booking.findByIdAndUpdate(
//       id,
//       { feedback },
//       { new: true }
//     );

//     if (!booking) return sendError(res, "Booking not found", 404);

//     return sendSuccess(res, "Feedback updated successfully", { booking });
//   } catch (err) {
//     console.error("Error in updateFeedback:", err);
//     return sendError(res, "Failed to update feedback", 500, err.message);
//   }
// };

exports.deleteBooking = async (req, res) => {
    try {
        const booking = await Booking.findById(req.query.id);

        if (!booking) return sendError(res, 'Booking not found', 404);

        // if key exists update, else add key
        booking.is_deleted = true;
        await booking.save();

        return sendSuccess(res, 'Booking marked as deleted successfully');
    } catch (err) {
        return sendError(res, 'Failed to mark booking as deleted', 500, err.message);
    }
};




cron.schedule('0 0 * * *', async () => {
    try {
        const now = new Date();

        // Update expired pending bookings → set is_deleted = true
        const result = await Booking.updateMany(
            {
                date: { $lt: now },
                status: 'pending'
            },
            { $set: { is_deleted: true } } // mark as deleted
        );

        console.log(`[CRON] Marked ${result.modifiedCount} expired pending bookings as deleted`);
    } catch (error) {
        console.error('[CRON] Error marking expired bookings as deleted:', error.message);
    }
});

