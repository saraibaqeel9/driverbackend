const express = require('express');
const router = express.Router();
const auth = require('../middleware/authMiddleware');
const {
    createVehicle,
    getVehicles,
    getVehicleById,
    updateVehicle,
    deleteVehicle
} = require('../controllers/vehicleController');

// CRUD routes
router.post('/create', createVehicle);
router.get('/list', getVehicles);
router.get('/detail/:id', getVehicleById);
router.patch('/update', updateVehicle);
router.delete('/delete/:id', auth, deleteVehicle);

module.exports = router;
