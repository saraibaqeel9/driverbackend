const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
    date: { type: Date, required: true },
    pickup_date: { type: Date },
    is_deleted: { type: Boolean, default: false },
    currency: { type: String, },
    invoice_number: { type: String, required: true },
    bookingReference: { type: String, required: true },
    bookingType: { type: String, required: true },
    clientName: { type: String },
    client_id: { type: mongoose.Schema.Types.ObjectId, ref: "clients" },
    supplier_id: { type: mongoose.Schema.Types.ObjectId, ref: "suppliers" },
    passengerName: { type: String, required: true },
    pickUpTime: { type: Number, required: true },
    pickUpLocation: { type: String, required: true },
    dropOffLocation: { type: String, required: true },
    passengerContact: { type: String, required: true },
    status: { type: String, default: "Pending" },
    passengerQty: {
        adult: { type: String, default: "0" },
        child: { type: String, default: "0" },
        booster: { type: String, default: "0" },
        infant: { type: String, default: "0" }
    },
    payment_type: { type: String, default: "" },
    price: { type: String, default: "" },
    flightNumber: { type: String, default: "" },
    driver_id: { type: mongoose.Schema.Types.ObjectId, ref: "users", default: null }, // 🔹 Added driver reference

    bags: { type: String, default: "0" },
    vehicleCategory: { type: String, required: true },
    remarks: { type: String, default: "" },
    createdAt: { type: Date, default: Date.now }
}, { timestamps: true });

module.exports = mongoose.model('Booking', bookingSchema);
