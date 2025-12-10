const express = require('express');
const router = express.Router();
const auth = require('../middleware/authMiddleware');
const {
    createBooking,
    getBookings,
    getBookingById,
    updateBooking,
    deleteBooking,
    assignDriver,
    getInvoiceNumber,
    getDriverBookings
} = require('../controllers/bookingController');

router.post('/booking/create', createBooking);
router.get('/driver/booking', getDriverBookings);
router.get('/list', getBookings);
router.get('/booking/detail', getBookingById);
router.get('/getInvoiceNumber', getInvoiceNumber);
router.patch('/updatebooking', updateBooking);
router.patch('/assignDriver', assignDriver);
// router.patch('/create/feedback', updateFeedback);
router.delete('/delete', deleteBooking);

module.exports = router;
