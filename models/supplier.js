const mongoose = require('mongoose');

const supplierSchema = new mongoose.Schema({
    name: {type:String,unique: true },
    phone: String,
    email:String,


      
}, { timestamps: true });

module.exports = mongoose.model('suppliers', supplierSchema);
