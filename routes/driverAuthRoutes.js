const express = require('express');
const router = express.Router();
const auth = require('../middleware/authMiddleware');
const { signup, login, getDrivers, deleteDriver, getDriverById ,updateDriver} = require('../controllers/driverAuthController');

router.post('/driver/signup', signup);
router.post('/driver/login', login);
router.get('/driver/list', getDrivers);
router.delete('/driver/delete',auth, deleteDriver);
router.get('/driver/detail', getDriverById);
router.patch('/driver/update', auth,updateDriver);
module.exports = router;
