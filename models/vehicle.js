const mongoose = require('mongoose');

const vehicleSchema = new mongoose.Schema({

    plate_number: { type: String, required: true },
    make: { type: String, required: true },
    model: { type: String, required: true },
    year: { type: String, required: true },
    car_type: { type: String, required: true },
    createdAt: { type: Date, default: Date.now }
}, { timestamps: true });

module.exports = mongoose.model('vehicle', vehicleSchema);
