// controllers/clientController.js
const Client = require('../models/clients');
const { sendSuccess, sendError } = require('../helpers/responseHelper');

// ========== CREATE CLIENT ==========
exports.createClient = async (req, res) => {
    try {
        const { name, phone, email } = req.body;

        const client = new Client({ name, phone, email });
        await client.save();

        return sendSuccess(res, 'Client created successfully', { client }, 201);
    } catch (err) {
        return sendError(res, 'Failed to create client', 500, err.message);
    }
};

// ========== GET ALL CLIENTS ==========
exports.getClients = async (req, res) => {
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
        const total = await Client.countDocuments(query);

        const clients = await Client.find(query)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(parseInt(limit));

        return sendSuccess(res, 'Clients fetched successfully', {
            clients,
            count: total,
        });
    } catch (err) {
        return sendError(res, 'Failed to fetch clients', 500, err.message);
    }
};

// ========== GET CLIENT BY ID ==========
exports.getClientById = async (req, res) => {
    try {
        const client = await Client.findById(req.params.id);
        if (!client) return sendError(res, 'Client not found', 404);

        return sendSuccess(res, 'Client fetched successfully', { client });
    } catch (err) {
        return sendError(res, 'Failed to fetch client', 500, err.message);
    }
};

// ========== UPDATE CLIENT ==========
exports.updateClient = async (req, res) => {
    try {
        const { id, name, phone, email } = req.body;
        if (!id) return sendError(res, 'Client ID is required', 400);

        const updatedClient = await Client.findByIdAndUpdate(
            id,
            { name, phone, email },
            { new: true, runValidators: true }
        );

        if (!updatedClient) return sendError(res, 'Client not found', 404);

        return sendSuccess(res, 'Client updated successfully', { client: updatedClient });
    } catch (err) {
        return sendError(res, 'Failed to update client', 500, err.message);
    }
};

// ========== DELETE CLIENT ==========
exports.deleteClient = async (req, res) => {
    try {
        const client = await Client.findByIdAndDelete(req.params.id);
        if (!client) return sendError(res, 'Client not found', 404);

        return sendSuccess(res, 'Client deleted successfully');
    } catch (err) {
        return sendError(res, 'Failed to delete client', 500, err.message);
    }
};
