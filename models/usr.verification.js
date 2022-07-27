"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class Verification extends Model {
    static associate({ User }) {
      this.belongsTo(User, {
        foreignKey: "user_id",
        as: "user",
      });
    }
    toJSON() {
      return { ...this.get() };
    }
  }
  Verification.init(
    {
      hash: {
        type: DataTypes.STRING,
      },
      action: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      user_id: {
        type: DataTypes.INTEGER,
      },
    },
    {
      sequelize,
      tableName: "verifications",
      modelName: "Verification",
      timestamps: false,
    }
  );
  return Verification;
};
