'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Invoice extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // An Invoice belongs to a Company
      // foreignKey: 'companyId' in the Invoice model points to Company's primary key (id)
      // as: 'company' allows you to do invoice.getCompany() or include it as 'company'
      Invoice.belongsTo(models.Company, {
        foreignKey: 'companyId',
        as: 'company'
      });

      // An Invoice has many InvoiceItems
      // foreignKey: 'invoiceId' in the InvoiceItem model points back to Invoice's primary key (id)
      // as: 'items' allows you to do invoice.getItems() or include them as 'items'
      Invoice.hasMany(models.InvoiceItem, {
        foreignKey: 'invoiceId',
        as: 'items',
        onDelete: 'CASCADE' // If an invoice is deleted, its items should also be deleted
      });
    }
  }
  Invoice.init({
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    companyId: { // This MUST be DataTypes.UUID to match your Company model's ID
      type: DataTypes.UUID,
      allowNull: false
    },
    invoiceCode: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true // Ensures invoice codes are unique across all invoices
    },
    invoiceDate: {
      type: DataTypes.DATEONLY, // Stores only the date (e.g., '2025-06-10')
      allowNull: false
    },
    dueDate: {
      type: DataTypes.DATEONLY,
      allowNull: false
    },
    to: { // Who the invoice is addressed to (e.g., client name, company name)
      type: DataTypes.STRING,
      allowNull: false
    },
    from: { // Who the invoice is from (e.g., your company name)
      type: DataTypes.STRING,
      allowNull: false
    },
    status: { // Status of the invoice (e.g., 'paid', 'unpaid', 'partially_paid')
      type: DataTypes.ENUM('paid', 'unpaid', 'partially_paid'),
      allowNull: false,
      defaultValue: 'unpaid' // New invoices start as unpaid
    },
    balance: { // Outstanding balance on the invoice
      type: DataTypes.DECIMAL(10, 2), // Precision: 10 total digits, 2 after decimal
      allowNull: false,
      defaultValue: 0.00
    },
    total: { // Total amount of the invoice
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0.00
    }
  }, {
    sequelize,
    modelName: 'Invoice',
    tableName: 'invoices', // Explicitly define the table name as it's plural
    timestamps: true // Automatically adds createdAt and updatedAt columns
  });
  return Invoice;
};