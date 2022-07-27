"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class Field extends Model {
    static associate({ Profile, FieldValue }) {
      this.belongsTo(Profile, {
        foreignKey: "profile_id",
        as: "profile",
      });
      this.hasMany(FieldValue, {
        foreignKey: "field_id",
        as: "values",
        onDelete: "cascade",
      });
    }
    toJSON() {
      return { ...this.get() };
    }
  }
  Field.init(
    {
      profile_id: {
        type: DataTypes.INTEGER,
      },
      name: {
        type: DataTypes.STRING,
      },
      type: {
        type: DataTypes.STRING,
      },
    },
    {
      sequelize,
      tableName: "fields",
      modelName: "Field",
      timestamps: false,
    }
  );
  return Field;
};
