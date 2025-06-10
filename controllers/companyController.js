// controllers/companyController.js
const { Company, User } = require('../models');
const { default: logger } = require('../utils/logger');
const { UniqueConstraintError, ValidationError } = require('sequelize');
const { createCompanySchema } = require('../schemas/companySchemas');

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