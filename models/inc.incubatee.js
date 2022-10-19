"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class Incubatee extends Model {
    static associate({ User, ProfileForm, Profile }) {
      this.belongsTo(User, {
        foreignKey: "owner_id",
        as: "owner",
      });
      this.hasMany(ProfileForm, {
        foreignKey: "owner_id",
        sourceKey: "owner_id",
        as: "forms",
      });
      this.belongsTo(Profile, {
        foreignKey: "owner_id",
        sourceKey: "owner_id",
        as: "profile",
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
