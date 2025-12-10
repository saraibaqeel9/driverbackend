// controllers/authController.js
const User = require('../models/users');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { sendSuccess, sendError } = require('../helpers/responseHelper');

const JWT_SECRET = process.env.JWT_SECRET || 'your_secret_key';

exports.signup = async (req, res) => {
    const { name, user_name, password, properties,profile } = req.body;

    try {
        // Check if username already exists
        const existingUserName = await User.findOne({ user_name });
        if (existingUserName) return sendError(res, 'Username already exists', 400);

        // // Optional: Check if email already exists
        // if (email) {
        //     const existingEmail = await User.findOne({ email });
        //     if (existingEmail) return sendError(res, 'Email already exists', 400);
        // }

        const hashedPassword = await bcrypt.hash(password, 10);
        const user = new User({ name, user_name, password: hashedPassword, properties ,profile});
        await user.save();

        const token = jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn: '7d' });

        const userWithToken = {
            _id: user._id,
            name: user.name,
          
            user_name: user.user_name,
            role: user.role,
            properties: user?.properties,
            token
        };

        return sendSuccess(res, 'User registered successfully', { user: userWithToken }, 200);
    } catch (err) {
        return sendError(res, 'Signup failed', 500, err.message);
    }
};

// ================= Login =================
exports.login = async (req, res) => {
    const { user_name, password } = req.body;
    try {
        const user = await User.findOne({ user_name });
        console.log(user,'useruser');
        
        if (!user) return sendError(res, 'Invalid username or password', 400);

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return sendError(res, 'Invalid username or password', 400);

        const token = jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn: '7d' });

        const userWithToken = {
            _id: user._id,
            name: user.name,
         
            user_name: user.user_name,
            role: user.role,
            token
        };

        return sendSuccess(res, 'Login successful', { user: userWithToken });
    } catch (err) {
        return sendError(res, 'Login failed', 500, err.message);
    }
};

exports.getInvestors = async (req, res) => {
    try {
        // Query params
        const { page = 1, limit = 10, search = '' } = req.query;

        const query = {
            role: 'investor', // ✅ Only fetch users with role = 'investor'
            $or: [
                { name: { $regex: search, $options: 'i' } },
                { location: { $regex: search, $options: 'i' } },
                { address: { $regex: search, $options: 'i' } },
                { type: { $regex: search, $options: 'i' } },
                { purpose: { $regex: search, $options: 'i' } },
                { category: { $regex: search, $options: 'i' } }
            ]
        };

        const skip = (parseInt(page) - 1) * parseInt(limit);
        const total = await User.countDocuments(query);
        const investors = await User.find(query).populate("properties")
            .skip(skip)
            .limit(parseInt(limit))
            .sort({ createdAt: -1 });

        return sendSuccess(res, 'Investors fetched successfully', {
            investors,
            count: total,
        });
    } catch (err) {
        return sendError(res, 'Failed to fetch investors', 500, err.message);
    }
};

exports.getInvestorsProperty = async (req, res) => {
    try {
        const { id } = req.query;

        // Fetch investor
        const investor = await User.findById(id).populate('properties');
        console.log(investor,'investor');
        
        if (!investor || investor.role !== 'investor') {
            return sendError(res, 'Investor not found or invalid role', 404);
        }

        return sendSuccess(res, 'Investor properties fetched successfully', {
            investor: investor.name,
            properties: investor.properties,
            count: investor.properties.length,
        });
    } catch (err) {
        return sendError(res, 'Failed to fetch investor properties', 500, err.message);
    }
};


exports.deleteInvestor = async (req, res) => {
    try {
        const user = await User.findByIdAndDelete(req.params.id);
        if (!user) return sendError(res, 'investor not found', 404);
        return sendSuccess(res, 'investor deleted successfully');
    } catch (err) {
        return sendError(res, 'Failed to delete investor', 500, err.message);
    }
};

exports.getInvestorById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).populate('properties');
    if (!user) return sendError(res, 'Investor not found', 404);

    return sendSuccess(res, 'Investor fetched successfully', { user });
  } catch (err) {
    return sendError(res, 'Failed to fetch investor', 500, err.message);
  }
};



exports.updateInvestor = async (req, res) => {
    try {
        const { id, ...updateData } = req.body;

        if (!id) return sendError(res, 'user ID is required in body', 400);

        const user = await User.findOneAndUpdate(
            { _id: id },
            updateData,
            { new: true }
        );

        if (!user) return sendError(res, 'user not found', 404);

        return sendSuccess(res, 'user updated successfully', { user });
    } catch (err) {
        return sendError(res, 'Failed to update user', 500, err.message);
    }
};