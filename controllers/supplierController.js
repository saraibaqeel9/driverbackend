// controllers/clientController.js
const Supplier = require('../models/supplier');
const { sendSuccess, sendError } = require('../helpers/responseHelper');

// ========== CREATE CLIENT ==========
exports.createSupplier = async (req, res) => {
    try {
        const { name, phone, email } = req.body;

        const supplier = new Supplier({ name, phone, email });
        await supplier.save();

        return sendSuccess(res, 'Supplier created successfully', { supplier }, 201);
    } catch (err) {
        return sendError(res, 'Failed to create supplier', 500, err.message);
    }
};

// ========== GET ALL CLIENTS ==========
exports.getSupplier = async (req, res) => {
    try {
        const { page = 1, limit = 10, search = '' } = req.query;

        const query = {
            $or: [
                { name: { $regex: search, $options: 'i' } },
                { phone: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } }
            ]
        };

        const skip = (parseInt(page) - 1) * parseInt(limit);
        const total = await Supplier.countDocuments(query);

        const suppliers = await Supplier.find(query)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(parseInt(limit));

        return sendSuccess(res, 'Suppliers fetched successfully', {
            suppliers,
            count: total,
        });
    } catch (err) {
        return sendError(res, 'Failed to fetch suppliers', 500, err.message);
    }
};

// ========== GET CLIENT BY ID ==========
exports.getSupplierById = async (req, res) => {
    try {
        const supplier = await Supplier.findById(req.params.id);
        if (!supplier) return sendError(res, 'Supplier not found', 404);

        return sendSuccess(res, 'Supplier fetched successfully', { supplier });
    } catch (err) {
        return sendError(res, 'Failed to fetch supplier', 500, err.message);
    }
};

// ========== UPDATE CLIENT ==========
exports.updateSupplier = async (req, res) => {
    try {
        const { id, name, phone, email } = req.body;
        if (!id) return sendError(res, 'Supplier ID is required', 400);

        const updatedClient = await Supplier.findByIdAndUpdate(
            id,
            { name, phone, email },
            { new: true, runValidators: true }
        );

        if (!updatedClient) return sendError(res, 'Supplier not found', 404);

        return sendSuccess(res, 'Supplier updated successfully', { supplier: updatedClient });
    } catch (err) {
        return sendError(res, 'Failed to update supplier', 500, err.message);
    }
};

// ========== DELETE CLIENT ==========
exports.deleteSupplier = async (req, res) => {
    try {
        const supplier = await Supplier.findByIdAndDelete(req.params.id);
        if (!supplier) return sendError(res, 'Supplier not found', 404);

        return sendSuccess(res, 'Supplier deleted successfully');
    } catch (err) {
        return sendError(res, 'Failed to delete supplier', 500, err.message);
    }
};
