"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class Incubatee extends Model {
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
  Incubatee.init(
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
      tableName: "incubatees",
      modelName: "Incubatee",
    }
  );
  return Incubatee;
};
