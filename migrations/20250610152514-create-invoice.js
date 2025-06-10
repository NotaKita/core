'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('invoices', {
      id: {
        allowNull: false,
        primaryKey: true,
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
      },
      companyId: { // This will now be a UUID
        type: Sequelize.UUID,
        allowNull: false,
        references: { // Foreign key to the companies table
          model: 'companies',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE' // If a company is deleted, delete its invoices
      },
      invoiceCode: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true // Invoice codes should be unique
      },
      invoiceDate: {
        type: Sequelize.DATEONLY, // Stores date without time (e.g., '2025-06-10')
        allowNull: false
      },
      dueDate: {
        type: Sequelize.DATEONLY, // Stores date without time
        allowNull: false
      },
      to: { // Who the invoice is addressed to (e.g., client name/company)
        type: Sequelize.STRING,
        allowNull: false
      },
      from: { // Who the invoice is from (e.g., your company name)
        type: Sequelize.STRING,
        allowNull: false
      },
      status: {
        type: Sequelize.ENUM('paid', 'unpaid', 'partially_paid'),
        allowNull: false,
        defaultValue: 'unpaid'
      },
      balance: { // Outstanding balance
        type: Sequelize.DECIMAL(10, 2), // 10 total digits, 2 after decimal
        allowNull: false,
        defaultValue: 0.00
      },
      total: { // Total amount of the invoice
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0.00
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE
      }
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('invoices');
  }
};