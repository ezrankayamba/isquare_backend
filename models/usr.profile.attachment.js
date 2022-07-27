"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class ProfileAttachment extends Model {
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
  ProfileAttachment.init(
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
      file: {
        type: DataTypes.STRING,
      },
    },
    {
      sequelize,
      tableName: "profile_attachments",
      modelName: "ProfileAttachment",
    }
  );
  return ProfileAttachment;
};
