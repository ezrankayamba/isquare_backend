"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class Service extends Model {
    static associate({ User, Profile }) {
      this.belongsTo(User, {
        foreignKey: "owner_id",
        as: "owner",
      });
      this.belongsTo(Profile, {
        foreignKey: "profile_id",
        as: "profile",
      });
    }
    toJSON() {
      return { ...this.get() };
    }
  }
  Service.init(
    {
      name: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      description: {
        type: DataTypes.STRING,
        allowNull: true,
      },
    },
    {
      sequelize,
      tableName: "services",
      modelName: "Service",
    }
  );
  return Service;
};
