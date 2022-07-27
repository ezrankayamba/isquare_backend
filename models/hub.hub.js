"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class Hub extends Model {
    static associate({ User, Profile }) {
      this.belongsTo(User, {
        foreignKey: "owner_id",
        as: "owner",
      });
      this.belongsTo(Profile, {
        foreignKey: "owner_id",
        as: "profile",
        targetKey: "owner_id",
      });
    }
    toJSON() {
      return { ...this.get() };
    }
  }
  Hub.init(
    {
      name: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      description: {
        type: DataTypes.STRING,
        allowNull: false,
      },
    },
    {
      sequelize,
      tableName: "hubs",
      modelName: "Hub",
    }
  );
  return Hub;
};
