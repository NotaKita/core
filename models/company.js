'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Company extends Model {
    static associate(models) {
      // A Company can have many Users
      Company.belongsToMany(models.User, {
        through: models.UserCompany,  // The join table model
        foreignKey: 'companyId',      // Foreign key in UserCompany pointing to Company
        otherKey: 'userId',           // Foreign key in UserCompany pointing to User
        as: 'users'                   // Alias for when you query (e.g., company.getUsers())
      });
    }
  }
  Company.init({
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true
    },
    address: {
      type: DataTypes.STRING,
      allowNull: true
    },
    phone: {
      type: DataTypes.STRING,
      allowNull: true
    },
    email: {
      type: DataTypes.STRING,
      allowNull: true,
      unique: true
    }
  }, {
    sequelize,
    modelName: 'Company',
    tableName: 'companies', // Explicitly define table name if it's different from pluralized model name
  });
  return Company;
};