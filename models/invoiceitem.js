'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class InvoiceItem extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // An InvoiceItem belongs to an Invoice
      // foreignKey: 'invoiceId' in the InvoiceItem model points to Invoice's primary key (id)
      // as: 'invoice' allows you to do invoiceItem.getInvoice() or include it as 'invoice'
      InvoiceItem.belongsTo(models.Invoice, {
        foreignKey: 'invoiceId',
        as: 'invoice'
      });
    }
  }
  InvoiceItem.init({
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    invoiceId: { // Foreign key linking to the Invoice
      type: DataTypes.INTEGER,
      allowNull: false
    },
    description: { // Description of the item (e.g., "Software License")
      type: DataTypes.STRING,
      allowNull: false
    },
    unitCost: { // Cost per unit of the item
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false
    },
    quantity: { // Number of units
      type: DataTypes.INTEGER,
      allowNull: false
    },
    price: { // Calculated price for this item (unitCost * quantity)
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false
    }
  }, {
    sequelize,
    modelName: 'InvoiceItem',
    tableName: 'invoice_items', // Explicitly define the table name
    timestamps: true // Automatically adds createdAt and updatedAt columns
  });
  return InvoiceItem;
};