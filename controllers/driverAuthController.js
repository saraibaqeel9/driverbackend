// controllers/authController.js
const User = require('../models/users');
const Booking = require('../models/booking');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { sendSuccess, sendError } = require('../helpers/responseHelper');

const JWT_SECRET = process.env.JWT_SECRET || 'your_secret_key';

exports.signup = async (req, res) => {
    const { name, user_name, password, phone, eid, driving_license, role,profile } = req.body;

    try {
        // Check if username already exists
        const existingUser = await User.findOne({ user_name });
        if (existingUser) return sendError(res, 'Username already exists', 400);

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create new driver
        const user = new User({
            name,
            user_name,
            password: hashedPassword,
            password_string:password,
            phone,
            eid,
            driving_license,
            profile,
            role // Optional (will use default 'driver' if not provided)
        });

        await user.save();

        // Generate JWT token
        const token = jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn: '7d' });
        console.log(user,'useruseruser');

        // Send response
        const driverWithToken = {
            _id: user._id,
            name: user.name,
            user_name: user.user_name,
            phone: user.phone,
            eid: user.eid,
            driving_license: user.driving_license,
            role: user.role,
            createdAt: user.createdAt,
            token
        };

        return sendSuccess(res, 'Driver registered successfully', { driver: driverWithToken }, 200);
    } catch (err) {
        return sendError(res, 'Signup failed', 500, err.message);
    }
};

exports.login = async (req, res) => {
    const { user_name, password } = req.body; // use user_name instead of email
    try {
        // Find user by username
        const user = await User.findOne({ user_name });
        if (!user) return sendError(res, 'Invalid username or password', 400);

        // Compare password
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return sendError(res, 'Invalid username or password', 400);

        // Generate token
        const token = jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn: '7d' });

        // Prepare response
        const userWithToken = {
            _id: user._id,
            name: user.name,
            user_name: user.user_name,
            role: user.role,
            image: user?.image,
            token
        };

        return sendSuccess(res, 'Login successful', { user: userWithToken });
    } catch (err) {
        return sendError(res, 'Login failed', 500, err.message);
    }
};

exports.getDrivers = async (req, res) => {
    try {
        const { page = 1, limit = 10, search = '' } = req.query;

        const query = {
            role: { $ne: 'admin' },
            $or: [
                { name: { $regex: search, $options: 'i' } },
                { location: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } },
                { address: { $regex: search, $options: 'i' } },
                { type: { $regex: search, $options: 'i' } },
                { purpose: { $regex: search, $options: 'i' } },
                { category: { $regex: search, $options: 'i' } }
            ]
        };

        const skip = (parseInt(page) - 1) * parseInt(limit);
        const total = await User.countDocuments(query);

        const drivers = await User.find(query)
            .sort({ createdAt: -1 }) // latest first
            .skip(skip)
            .limit(parseInt(limit));

        return sendSuccess(res, 'Drivers fetched successfully', {
            drivers,
            count: total,
        });
    } catch (err) {
        return sendError(res, 'Failed to fetch drivers', 500, err.message);
    }
};


exports.deleteDriver = async (req, res) => {
    try {
        // Step 1: Delete the agent
        const agent = await User.findByIdAndDelete(req.query.id);
        if (!agent) return sendError(res, 'Driver not found', 404);

        // // Step 2: Delete all bookings associated with this agent
        // await Booking.deleteMany({ agent_id: agent._id.toString() });

        return sendSuccess(res, 'Driver deleted successfully');
    } catch (err) {
        console.error("Error deleting agent and their bookings:", err);
        return sendError(res, 'Failed to delete agent and their bookings', 500, err.message);
    }
};

exports.updateDriver = async (req, res) => {
    try {
        const { 
            id, 
            name, 
            email, 
            user_name, 
            oldPassword,  // <-- old password comes from frontend
            password,     // <-- new password comes from frontend
            phone, 
            eid, 
            driving_license, 
            role, 
            vehicle_no, 
            profile,
            password_string
        } = req.body;

        if (!id) return sendError(res, 'Driver ID is required', 400);

        const driver = await User.findById(id);
        if (!driver) return sendError(res, 'Driver not found', 404);

        let updatedData = { 
            name, 
            email, 
            user_name, 
            phone, 
            eid, 
            driving_license, 
            role, 
            vehicle_no, 
            profile, 
            password_string 
        };

        // ✅ Handle password update
        if (password) {
            // Check if old password is provided
            if (!oldPassword) {
                return sendError(res, 'Old password is required to update password', 400);
            }

            // Compare old password
            const isMatch = await bcrypt.compare(oldPassword, driver.password);
            if (!isMatch) {
                return sendError(res, 'Old password is incorrect', 400);
            }

            // Hash new password
            const hashedPassword = await bcrypt.hash(password, 10);
            updatedData.password = hashedPassword;
        }

        // Remove undefined fields
        Object.keys(updatedData).forEach(key => {
            if (updatedData[key] === undefined) {
                delete updatedData[key];
            }
        });

        const updatedDriver = await User.findByIdAndUpdate(id, updatedData, {
            new: true,
            runValidators: true
        });

        return sendSuccess(res, 'Driver updated successfully', { driver: updatedDriver });
    } catch (err) {
        return sendError(res, 'Failed to update driver', 500, err.message);
    }
};


exports.getDriverById = async (req, res) => {
    try {
        const agent = await User.findById(req.query.id);
        if (!agent) return sendError(res, 'driver not found', 404);
        return sendSuccess(res, 'Driver fetched successfully', { agent });
    } catch (err) {
        return sendError(res, 'Failed to fetch driver', 500, err.message);
    }
};
