"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class Profile extends Model {
    static associate({ User, Role, Field, ProfileAttachment, Hub, Incubatee }) {
      this.belongsTo(User, {
        foreignKey: "owner_id",
        as: "owner",
      });
      this.belongsTo(Role, {
        foreignKey: "role_id",
        as: "role",
      });
      this.hasMany(Field, {
        foreignKey: "profile_id",
        as: "fields",
      });
      this.hasMany(ProfileAttachment, {
        foreignKey: "profile_id",
        as: "attachments",
      });
      this.hasMany(Hub, {
        foreignKey: "owner_id",
        as: "hubs",
      });
      this.hasMany(Incubatee, {
        foreignKey: "owner_id",
        as: "incubatees",
      });
    }
    toJSON() {
      return { ...this.get() };
    }
  }
  Profile.init(
    {
      owner_id: {
        type: DataTypes.INTEGER,
      },
      role_id: {
        type: DataTypes.INTEGER,
      },
      status: {
        type: DataTypes.STRING,
      },
      approval: {
        type: DataTypes.STRING,
      },
    },
    {
      sequelize,
      tableName: "profiles",
      modelName: "Profile",
    }
  );
  return Profile;
};
