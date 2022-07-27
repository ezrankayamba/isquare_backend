"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class Enrollment extends Model {
    static associate({ Incubatee, Hub }) {
      this.belongsTo(Incubatee, {
        foreignKey: "incubatee_id",
        as: "incubatee",
      });
      this.belongsTo(Hub, {
        foreignKey: "hub_id",
        as: "hub",
      });
    }
    toJSON() {
      return { ...this.get() };
    }
  }
  Enrollment.init(
    {
      hub_id: {
        primaryKey: true,
        type: DataTypes.INTEGER,
      },
      incubatee_id: {
        primaryKey: true,
        type: DataTypes.INTEGER,
      },
      status: {
        type: DataTypes.STRING,
        allowNull: false,
      },
    },
    {
      sequelize,
      tableName: "enrollments",
      modelName: "Enrollment",
    }
  );
  return Enrollment;
};
