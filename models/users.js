const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    name: String,

    user_name: { type: String, unique: true },
    password: String,
    password_string:String,
    phone: String,
    profile: String,
    eid: String,
    driving_license: String,
    vehicle_no: { type: String, default: '' },

    role: { type: String, default: 'driver' },  // optional
    createdAt: { type: Date, default: Date.now },
}, { timestamps: true });

module.exports = mongoose.model('users', userSchema);
