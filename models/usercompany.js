'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class UserCompany extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }
  UserCompany.init({
    userId: {
      type: DataTypes.UUID, // Match User ID type
      primaryKey: true // Part of composite primary key
    },
    companyId: {
      type: DataTypes.INTEGER, // Match Company ID type
      primaryKey: true // Part of composite primary key
    },
    // Add any additional attributes here that are in your migration, e.g.,
    // role: DataTypes.STRING,
  }, {
    sequelize,
    modelName: 'UserCompany',
    tableName: 'user_companies', // Explicitly define table name
    timestamps: true // Ensure createdAt and updatedAt are handled
  });
  return UserCompany;
};