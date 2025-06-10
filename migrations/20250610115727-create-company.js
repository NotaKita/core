'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('companies', {
      id: {
        allowNull: false,
        autoIncrement: true, // Assuming you want an auto-incrementing integer ID for companies
        primaryKey: true,
        type: Sequelize.INTEGER // Use INTEGER for auto-incrementing IDs
      },
      name: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true // Company names should probably be unique
      },
      address: {
        type: Sequelize.STRING,
        allowNull: true // Address can be optional
      },
      phone: {
        type: Sequelize.STRING,
        allowNull: true
      },
      email: {
        type: Sequelize.STRING,
        allowNull: true,
        unique: true // Company email should also be unique
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
    await queryInterface.dropTable('companies');
  }
};
