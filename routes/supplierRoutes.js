// routes/clientRoutes.js
const express = require('express');
const router = express.Router();
const {
    createSupplier,
    getSupplier,
    getSupplierById,
    updateSupplier,
    deleteSupplier
} = require('../controllers/supplierController');

// CREATE
router.post('/create', createSupplier);

// READ
router.get('/list', getSupplier);
router.get('/detail/:id', getSupplierById);

// UPDATE
router.put('/update/:id', updateSupplier);

// DELETE
router.delete('/delete/:id', deleteSupplier);

module.exports = router;
