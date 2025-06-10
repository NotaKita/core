const { Invoice, InvoiceItem, Company } = require('../models');
const { default: logger } = require('../utils/logger');
const { UniqueConstraintError, ValidationError, ForeignKeyConstraintError } = require('sequelize');
const { createInvoiceSchema, updateInvoiceStatusSchema } = require('../schemas/invoiceSchemas');

exports.createInvoice = async (req, res, next) => {
  const transaction = await Invoice.sequelize.transaction();
  try {
    const { companyId, invoiceCode, invoiceDate, dueDate, to, items } = req.body;

    // 1. Input Validation using Joi
    // Note: The Joi schema already excludes 'from', so it won't be validated here.
    const { error } = createInvoiceSchema.validate(req.body);
    if (error) {
      logger.warn(`Validation error during invoice creation: ${error.details[0].message}`);
      await transaction.rollback();
      return res.status(400).json({
        message: 'Invoice creation failed due to invalid input',
        error: error.details[0].message
      });
    }

    // 2. Verify Company exists
    const company = await Company.findByPk(companyId, { transaction });
    if (!company) {
      logger.warn(`Invoice creation failed: Company with ID ${companyId} not found.`);
      await transaction.rollback();
      return res.status(404).json({
        message: 'Invoice creation failed',
        error: `Company with ID ${companyId} not found. Please provide a valid company ID.`
      });
    }

    // Automatically set 'from' based on the company's name
    const fromCompanyName = company.name; // <<< NEW: Get company name here

    // 3. Check for Duplicate Invoice Code
    const existingInvoice = await Invoice.findOne({ where: { invoiceCode }, transaction });
    if (existingInvoice) {
      logger.warn(`Invoice creation failed: Duplicate invoice code '${invoiceCode}'`);
      await transaction.rollback();
      return res.status(409).json({
        message: 'Invoice creation failed.',
        error: `The invoice code '${invoiceCode}' is already in use.`
      });
    }

    // 4. Calculate Total and Balance from items
    let totalAmount = 0;
    const invoiceItemsToCreate = items.map(item => {
      const itemPrice = parseFloat(item.unitCost) * parseInt(item.quantity, 10);
      totalAmount += itemPrice;
      return {
        description: item.description,
        unitCost: parseFloat(item.unitCost),
        quantity: parseInt(item.quantity, 10),
        price: itemPrice
      };
    });

    const initialBalance = totalAmount;

    // 5. Create Invoice record
    const invoice = await Invoice.create({
      companyId,
      invoiceCode,
      invoiceDate,
      dueDate,
      to,
      from: fromCompanyName, // <<< NEW: Use the company name here
      status: 'unpaid',
      balance: initialBalance,
      total: totalAmount,
    }, { transaction });

    // 6. Create Invoice Items
    const itemsWithInvoiceId = invoiceItemsToCreate.map(item => ({
      ...item,
      invoiceId: invoice.id
    }));
    await InvoiceItem.bulkCreate(itemsWithInvoiceId, { transaction });

    await transaction.commit();

    // 7. Log Success
    logger.info(`New invoice created successfully: ${invoiceCode} (ID: ${invoice.id}) for Company ID: ${companyId}`);

    // 8. Send Success Response
    res.status(201).json({
      message: 'Invoice created successfully',
      invoice: {
        id: invoice.id,
        companyId: invoice.companyId,
        invoiceCode: invoice.invoiceCode,
        invoiceDate: invoice.invoiceDate,
        dueDate: invoice.dueDate,
        to: invoice.to,
        from: invoice.from, // Ensure 'from' is returned in the response
        status: invoice.status,
        balance: invoice.balance,
        total: invoice.total,
        items: items
      }
    });

  } catch (err) {
    await transaction.rollback();

    if (err instanceof UniqueConstraintError) {
      logger.warn(`Invoice creation failed due to unique constraint: ${err.message}`);
      return res.status(409).json({
        message: 'Invoice creation failed.',
        error: `The invoice code '${req.body.invoiceCode}' is already in use.`
      });
    } else if (err instanceof ForeignKeyConstraintError) {
        logger.error(`Foreign key constraint error during invoice creation: ${err.message}`);
        return res.status(400).json({
            message: 'Invoice creation failed due to invalid related data.',
            error: 'Provided Company ID does not exist or is invalid.'
        });
    }
    else if (err instanceof ValidationError) {
      logger.error(`Sequelize validation error during invoice creation: ${err.message}`);
      return res.status(400).json({
        message: 'Invoice creation failed due to invalid data',
        error: err.message
      });
    }
    logger.error(`An unexpected error occurred during invoice creation: ${err.message}`, { stack: err.stack });
    next(err);
  }
};

exports.patchInvoiceStatus = async (req, res, next) => {
    const transaction = await Invoice.sequelize.transaction(); // Start a transaction
    try {
      const { id } = req.params; // Invoice ID from URL
      const { status, balance } = req.body; // Expecting status to be 'paid'
  
      // 1. Input Validation using Joi
      const { error } = updateInvoiceStatusSchema.validate(req.body);
      if (error) {
        logger.warn(`Validation error during invoice status update for ID ${id}: ${error.details[0].message}`);
        await transaction.rollback();
        return res.status(400).json({
          message: 'Invoice status update failed due to invalid input',
          error: error.details[0].message
        });
      }
  
      const invoice = await Invoice.findByPk(id, { transaction });
  
      if (!invoice) {
        logger.warn(`Attempt to update status for non-existent invoice with ID: ${id}`);
        await transaction.rollback();
        return res.status(404).json({ message: 'Invoice not found.' });
      }
  
      // Check current status before update
      if (invoice.status === 'paid') {
        logger.warn(`Invoice with ID ${id} is already paid. No action taken.`);
        await transaction.rollback();
        return res.status(200).json({
          message: 'Invoice is already paid. No changes applied.',
          invoice
        });
      }
  
      // Prepare update data
      const updateData = { status: 'paid', balance: 0.00 };
  
      // Update the invoice status and balance
      const [updatedRows] = await Invoice.update(updateData, {
        where: { id },
        returning: true, // For PostgreSQL, returns the updated object
        transaction
      });
  
      if (updatedRows === 0) {
        logger.warn(`Invoice status update for ID ${id} resulted in no changes or was not found.`);
        await transaction.rollback();
        return res.status(400).json({ message: 'No changes applied to invoice status.' });
      }
  
      // Fetch the updated invoice to return in the response
      const updatedInvoice = await Invoice.findByPk(id, { transaction });
  
      await transaction.commit(); // Commit the transaction if all operations succeed
  
      logger.info(`Invoice ID ${id} status updated to 'paid'.`);
      res.status(200).json({
        message: 'Invoice status updated to paid successfully',
        invoice: updatedInvoice
      });
  
    } catch (err) {
      await transaction.rollback(); // Rollback transaction on any error
  
      // Centralized error logging for this controller function
      logger.error(`An unexpected error occurred during invoice status update for ID ${req.params.id}: ${err.message}`, { stack: err.stack });
      next(err); // Pass error to the centralized error handler middleware
    }
  };