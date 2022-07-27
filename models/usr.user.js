"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class User extends Model {
    static associate({ Profile, Hub, Incubatee, Verification, Service }) {
      this.hasMany(Profile, {
        foreignKey: "owner_id",
        as: "profiles",
      });
      this.hasMany(Hub, {
        foreignKey: "owner_id",
        as: "hubs",
      });
      this.hasMany(Incubatee, {
        foreignKey: "owner_id",
        as: "incubatees",
      });
      this.hasMany(Verification, {
        foreignKey: "user_id",
        as: "verifications",
      });
      this.hasMany(Service, {
        foreignKey: "owner_id",
        as: "services",
      });
    }
    toJSON() {
      return { ...this.get(), id: undefined, password: undefined };
    }
  }
  User.init(
    {
      uuid: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
      },
      first_name: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      last_name: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      email: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      password: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      isVerified: {
        type: DataTypes.BOOLEAN,
        field: "is_verified",
      },
    },
    {
      sequelize,
      tableName: "users",
      modelName: "User",
    }
  );
  return User;
};
