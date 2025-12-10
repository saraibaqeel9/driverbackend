// routes/clientRoutes.js
const express = require('express');
const router = express.Router();
const {
    createClient,
    getClients,
    getClientById,
    updateClient,
    deleteClient
} = require('../controllers/clientsController');

// CREATE
router.post('/create', createClient);

// READ
router.get('/list', getClients);
router.get('/detail/:id', getClientById);

// UPDATE
router.put('/update/:id', updateClient);

// DELETE
router.delete('/delete/:id', deleteClient);

module.exports = router;
