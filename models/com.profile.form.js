"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class ProfileForm extends Model {
    static associate({ Profile, Field }) {
      this.belongsTo(Profile, {
        foreignKey: "profile_id",
        as: "profile",
      });
      this.hasMany(Field, {
        foreignKey: "owner_id",
        as: "fields",
        onDelete: "cascade",
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
      remark: {
        type: DataTypes.STRING,
      },
      request_to: {
        type: DataTypes.INTEGER,
      },
      approval_by: {
        type: DataTypes.INTEGER,
      },
      owner_id: {
        type: DataTypes.INTEGER,
      },
    },
    {
      sequelize,
      tableName: "profile_forms",
      modelName: "ProfileForm",
    }
  );
  return ProfileForm;
};
