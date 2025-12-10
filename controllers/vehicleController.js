const Vehicle = require('../models/vehicle');
const { sendSuccess, sendError } = require('../helpers/responseHelper');

// Create Vehicle
exports.createVehicle = async (req, res) => {
    try {
        const vehicle = new Vehicle(req.body);
        await vehicle.save();
        return sendSuccess(res, 'Vehicle created successfully', { vehicle }, 200);
    } catch (err) {
        return sendError(res, 'Something went wrong while creating the vehicle', 500, err.message);
    }
};

// Get All Vehicles (with pagination + search)
exports.getVehicles = async (req, res) => {
    try {
        const { page = 1, limit = 10, search = '' } = req.query;

        const query = {
            $or: [
                { plate_number: { $regex: search, $options: 'i' } },
                { make: { $regex: search, $options: 'i' } },
                { model: { $regex: search, $options: 'i' } },
                { year: { $regex: search, $options: 'i' } },
                { car_type: { $regex: search, $options: 'i' } }
            ]
        };

        const skip = (parseInt(page) - 1) * parseInt(limit);

        const total = await Vehicle.countDocuments(query);

        const vehicles = await Vehicle.find(query)
            .skip(skip)
            .limit(parseInt(limit))
            .sort({ createdAt: -1 });

        return sendSuccess(res, 'Vehicles fetched successfully', {
            vehicles,
            count: total,
            page: parseInt(page),
            limit: parseInt(limit)
        });
    } catch (err) {
        return sendError(res, 'Failed to fetch vehicles', 500, err.message);
    }
};

// Get Vehicle By ID
exports.getVehicleById = async (req, res) => {
    try {
        const vehicle = await Vehicle.findById(req.params.id);
        if (!vehicle) return sendError(res, 'Vehicle not found', 404);
        return sendSuccess(res, 'Vehicle fetched successfully', { vehicle });
    } catch (err) {
        return sendError(res, 'Failed to fetch vehicle', 500, err.message);
    }
};

// Update Vehicle
exports.updateVehicle = async (req, res) => {
    try {
        const { id, ...updateData } = req.body;

        if (!id) return sendError(res, 'Vehicle ID is required in body', 400);

        const vehicle = await Vehicle.findByIdAndUpdate(id, updateData, { new: true });

        if (!vehicle) return sendError(res, 'Vehicle not found', 404);

        return sendSuccess(res, 'Vehicle updated successfully', { vehicle });
    } catch (err) {
        return sendError(res, 'Failed to update vehicle', 500, err.message);
    }
};

// Delete Vehicle
exports.deleteVehicle = async (req, res) => {
    try {
        const vehicle = await Vehicle.findByIdAndDelete(req.params.id);
        if (!vehicle) return sendError(res, 'Vehicle not found', 404);

        return sendSuccess(res, 'Vehicle deleted successfully');
    } catch (err) {
        return sendError(res, 'Failed to delete vehicle', 500, err.message);
    }
};
