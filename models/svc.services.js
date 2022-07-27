"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class Service extends Model {
    static associate({ User }) {
      this.belongsTo(User, {
        foreignKey: "owner_id",
        as: "owner",
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
