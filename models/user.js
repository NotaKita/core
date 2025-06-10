'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class User extends Model {
    static associate(models) {
      // A User can belong to many Companies
      User.belongsToMany(models.Company, {
        through: models.UserCompany, // The join table model
        foreignKey: 'userId',         // Foreign key in UserCompany pointing to User
        otherKey: 'companyId',        // Foreign key in UserCompany pointing to Company
        as: 'companies'               // Alias for when you query (e.g., user.getCompanies())
      });
    }
  }
  User.init({
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: {
        isEmail: true,
      },
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false,
    },
  }, {
    sequelize,
    modelName: 'User',
    tableName: 'users',
    timestamps: true,
  });
  return User;
};