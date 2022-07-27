"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class FieldValue extends Model {
    static associate({ Field }) {
      this.belongsTo(Field, {
        foreignKey: "field_id",
        as: "field",
      });
    }
    toJSON() {
      return { ...this.get() };
    }
  }
  FieldValue.init(
    {
      field_id: {
        type: DataTypes.INTEGER,
      },
      value: {
        type: DataTypes.STRING,
      },
      extra: {
        type: DataTypes.STRING,
      },
    },
    {
      sequelize,
      tableName: "field_values",
      modelName: "FieldValue",
      timestamps: false,
    }
  );
  return FieldValue;
};
