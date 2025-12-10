const mongoose = require('mongoose');

const driverSchema = new mongoose.Schema({
    name: String,

    user_name: { type: String, unique: true },
    password: String,
    phone: String,
    vehicle_no: { type: String, default: '' },
    eid: String,
    driving_license: String,

    role: { type: String, default: 'driver' },  // optional
    createdAt: { type: Date, default: Date.now },
}, { timestamps: true });

module.exports = mongoose.model('Driver', driverSchema);
