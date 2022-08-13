"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class ProfileForm extends Model {
    static associate({ Profile }) {
      this.belongsTo(Profile, {
        foreignKey: "profile_id",
        as: "profile",
      });
    }
    toJSON() {
      return { ...this.get() };
    }
  }
  ProfileForm.init(
    {
      profile_id: {
        type: DataTypes.INTEGER,
      },
      name: {
        type: DataTypes.STRING,
      },
      category: {
        type: DataTypes.STRING,
      },
      status: {
        type: DataTypes.STRING,
      },
    },
    {
      sequelize,
      tableName: "profile_forms",
      modelName: "ProfileForm",
      timestamps: false,
    }
  );
  return ProfileForm;
};
