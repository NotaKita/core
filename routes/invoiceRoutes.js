// routes/invoiceRoutes.js
const express = require('express');
const router = express.Router();
const invoiceController = require('../controllers/invoiceController');
const authMiddleware = require('../middlewares/authMiddleware'); // Import your auth middleware

// Route to create a new invoice
router.post('/', authMiddleware, invoiceController.createInvoice);
// Using PATCH for partial update (only status and implicitly balance)
router.patch('/:id/mark-paid', authMiddleware, invoiceController.patchInvoiceStatus);


module.exports = router;