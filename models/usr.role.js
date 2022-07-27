"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class Role extends Model {
    static associate({ Profile }) {
      this.hasMany(Profile, {
        foreignKey: "id",
        as: "profiles",
      });
    }
    toJSON() {
      return { ...this.get() };
    }
  }
  Role.init(
    {
      name: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      description: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      require_otp: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
      },
    },
    {
      sequelize,
      tableName: "roles",
      modelName: "Role",
    }
  );
  return Role;
};
