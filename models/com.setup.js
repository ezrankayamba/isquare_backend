"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class Setup extends Model {
    static associate({ User }) {}
    toJSON() {
      return { ...this.get() };
    }
  }
  Setup.init(
    {
      name: {
        type: DataTypes.STRING,
      },
      category: {
        type: DataTypes.STRING,
      },
      other: {
        type: DataTypes.BOOLEAN,
      },
      order: {
        type: DataTypes.INTEGER,
      },
    },
    {
      sequelize,
      tableName: "setups",
      modelName: "Setup",
      timestamps: false,
    }
  );
  return Setup;
};
