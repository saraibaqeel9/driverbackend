const express = require('express');
const router = express.Router();
const { getStats,getDriverStats } = require('../controllers/statsController');

router.get('/stats', getStats);
router.get('/driverstats', getDriverStats);



module.exports = router;
