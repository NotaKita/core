'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('user_companies', {
      userId: {
        type: Sequelize.UUID, // Match the type of your User ID
        references: {
          model: 'users', // Name of the User table
          key: 'id'
        },
        onUpdate: 'CASCADE', // If a user's ID changes, update this foreign key
        onDelete: 'CASCADE', // If a user is deleted, remove their entries from this table
        primaryKey: true // Part of the composite primary key
      },
      companyId: {
        type: Sequelize.INTEGER, // Match the type of your Company ID
        references: {
          model: 'companies', // Name of the Company table
          key: 'id'
        },
        onUpdate: 'CASCADE', // If a company's ID changes, update this foreign key
        onDelete: 'CASCADE', // If a company is deleted, remove its entries from this table
        primaryKey: true // Part of the composite primary key
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
    await queryInterface.dropTable('user_companies');
  }
};