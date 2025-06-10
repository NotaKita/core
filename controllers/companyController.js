const { Company, User } = require('../models');
const { default: logger } = require('../utils/logger');
const { UniqueConstraintError, ValidationError } = require('sequelize');
const { createCompanySchema, updateCompanySchema } = require('../schemas/companySchemas');

exports.createCompany = async (req, res, next) => {
  try {
    const { name, address, phone, email } = req.body;
    const userId = req.user.id;

    // 1. Input Validation using Joi
    const { error } = createCompanySchema.validate(req.body);
    if (error) {
      logger.warn(`Validation error during company creation: ${error.details[0].message}`);
      return res.status(400).json({
        message: 'Company creation failed due to invalid input',
        error: error.details[0].message
      });
    }

    // Check if a company with the same name already exists
    const existingCompanyByName = await Company.findOne({ where: { name } });
    if (existingCompanyByName) {
      logger.warn(`Company creation failed: Duplicate name '${name}'`);
      return res.status(409).json({
        message: 'Company creation failed.',
        error: `The name '${name}' is already in use.`
      });
    }

    // Check if a company with the same email already exists (if email is provided)
    if (email) { // Only check if email was provided in the request
      const existingCompanyByEmail = await Company.findOne({ where: { email } });
      if (existingCompanyByEmail) {
        logger.warn(`Company creation failed: Duplicate email '${email}'`);
        return res.status(409).json({
          message: 'Company creation failed.',
          error: `The email '${email}' is already in use.`
        });
      }
    }

    // 2. Create Company
    const company = await Company.create({ name, address, phone, email });

    // 3. Associate the created company with the user
    const user = await User.findByPk(userId);
    if (user) {
      await user.addCompany(company);
      logger.info(`User ${user.email} (ID: ${userId}) associated with new company ${company.name}`);
    } else {
      logger.warn(`User with ID ${userId} not found during company association.`);
    }

    // 4. Log Success
    logger.info(`New company created successfully: ${company.name} (ID: ${company.id})`);

    // 5. Send Success Response
    res.status(201).json({
      message: 'Company created successfully',
      company: {
        id: company.id,
        name: company.name,
        address: company.address,
        phone: company.phone,
        email: company.email,
      }
    });

  } catch (err) {
    // Keep the original UniqueConstraintError handling as a fallback
    // for race conditions or other unexpected unique violations
    if (err instanceof UniqueConstraintError) {
      logger.warn(`Company creation failed due to race condition or unexpected unique constraint: ${err.message}`);
      return res.status(409).json({
        message: 'Company creation failed.',
        error: 'A duplicate entry exists. Please try again or use different details.'
      });
    } else if (err instanceof ValidationError) {
      logger.error(`Sequelize validation error during company creation: ${err.message}`);
      return res.status(400).json({
        message: 'Company creation failed due to invalid data',
        error: err.message
      });
    }
    logger.error(`An unexpected error occurred during company creation: ${err.message}`, { stack: err.stack });
    next(err);
  }
};

exports.getCompanyById = async (req, res, next) => {
    try {
      const { id } = req.params; // Get company ID from URL parameters
  
      const company = await Company.findByPk(id);
  
      if (!company) {
        logger.warn(`Attempt to get non-existent company with ID: ${id}`);
        return res.status(404).json({ message: 'Company not found.' });
      }
  
      logger.info(`Company retrieved successfully: ${company.name} (ID: ${id})`);
      res.status(200).json({
        message: 'Company retrieved successfully',
        company
      });
  
    } catch (err) {
      logger.error(`Error retrieving company by ID ${req.params.id}: ${err.message}`, { stack: err.stack });
      next(err);
    }
  };
  
  exports.updateCompanyById = async (req, res, next) => {
    try {
      const { id } = req.params; // Company ID to update
      const updateData = req.body;
  
      // 1. Input Validation using Joi for update data
      const { error } = updateCompanySchema.validate(updateData);
      if (error) {
        logger.warn(`Validation error during company update for ID ${id}: ${error.details[0].message}`);
        return res.status(400).json({
          message: 'Company update failed due to invalid input',
          error: error.details[0].message
        });
      }
  
      const company = await Company.findByPk(id);
  
      if (!company) {
        logger.warn(`Attempt to update non-existent company with ID: ${id}`);
        return res.status(404).json({ message: 'Company not found.' });
      }
  
      // Pre-check for duplicate name (if name is being updated)
      if (updateData.name && updateData.name !== company.name) {
        const existingCompanyByName = await Company.findOne({ where: { name: updateData.name } });
        if (existingCompanyByName && existingCompanyByName.id !== company.id) {
          logger.warn(`Company update failed: Duplicate name '${updateData.name}' for ID ${id}`);
          return res.status(409).json({
            message: 'Company update failed.',
            error: `The name '${updateData.name}' is already in use by another company.`
          });
        }
      }
  
      // Pre-check for duplicate email (if email is being updated and is provided)
      if (updateData.email && updateData.email !== company.email) {
        const existingCompanyByEmail = await Company.findOne({ where: { email: updateData.email } });
        if (existingCompanyByEmail && existingCompanyByEmail.id !== company.id) {
          logger.warn(`Company update failed: Duplicate email '${updateData.email}' for ID ${id}`);
          return res.status(409).json({
            message: 'Company update failed.',
            error: `The email '${updateData.email}' is already in use by another company.`
          });
        }
      }
  
      // Update the company
      const [updatedRows] = await Company.update(updateData, {
        where: { id },
        returning: true // Returns the updated rows for PostgreSQL
      });
  
      if (updatedRows === 0) {
        // This case might be hit if the ID was found but no actual data changed or other internal issue
        logger.warn(`Company update for ID ${id} resulted in no changes or was not found.`);
        return res.status(400).json({ message: 'No changes applied or company not found.' });
      }
  
      // Fetch the updated company to return in the response (especially important if not using returning: true or for other DBs)
      const updatedCompany = await Company.findByPk(id);
  
      logger.info(`Company updated successfully: ${updatedCompany.name} (ID: ${id})`);
      res.status(200).json({
        message: 'Company updated successfully',
        company: updatedCompany
      });
  
    } catch (err) {
      if (err instanceof UniqueConstraintError) {
        // Fallback for race conditions during update
        logger.warn(`Company update failed due to race condition or unexpected unique constraint: ${err.message}`);
        return res.status(409).json({
          message: 'Company update failed.',
          error: 'A duplicate entry exists. Please try again or use different details.'
        });
      } else if (err instanceof ValidationError) {
        logger.error(`Sequelize validation error during company update for ID ${req.params.id}: ${err.message}`);
        return res.status(400).json({
          message: 'Company update failed due to invalid data',
          error: err.message
        });
      }
      logger.error(`An unexpected error occurred during company update for ID ${req.params.id}: ${err.message}`, { stack: err.stack });
      next(err);
    }
  };
  
  exports.deleteCompanyById = async (req, res, next) => {
    try {
      const { id } = req.params; // Company ID to delete
  
      const company = await Company.findByPk(id);
  
      if (!company) {
        logger.warn(`Attempt to delete non-existent company with ID: ${id}`);
        return res.status(404).json({ message: 'Company not found.' });
      }
  
      // Delete the company
      await company.destroy();
  
      logger.info(`Company deleted successfully: ${company.name} (ID: ${id})`);
      res.status(200).json({ message: 'Company deleted successfully.' });
  
    } catch (err) {
      logger.error(`Error deleting company by ID ${req.params.id}: ${err.message}`, { stack: err.stack });
      next(err);
    }
  };