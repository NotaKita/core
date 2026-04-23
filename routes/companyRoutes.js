const express = require('express');
const router = express.Router();
const companyController = require('../controllers/companyController');
const authMiddleware = require('../middlewares/authMiddleware');

router.post('/', authMiddleware, companyController.createCompany);

// New endpoint to get companies associated with the authenticated user
router.get('/my-companies', authMiddleware, async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { User } = require('../models'); // Re-import User if not already in scope

    const user = await User.findByPk(userId, {
      include: [{
        model: User.sequelize.models.Company, // Use the actual Company model
        as: 'companies', // Match the 'as' alias in User model association
        through: { attributes: [] } // Don't include the join table attributes in the response
      }]
    });

    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    res.status(200).json({
      message: 'Companies retrieved successfully',
      companies: user.companies
    });
  } catch (err) {
    // You might want more specific logging here
    next(err); // Pass to centralized error handler
  }
});

// Route to get a single company by ID
router.get('/:id', authMiddleware, companyController.getCompanyById);

// Route to update a company by ID
router.put('/:id', authMiddleware, companyController.updateCompanyById);

// Route to delete a company by ID
router.delete('/:id', authMiddleware, companyController.deleteCompanyById);

module.exports = router;