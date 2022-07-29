const { sequelize } = require("../models");
const models = require("../models");
const path = require("path"),
  fs = require("fs");

const UPLOAD_DIR = path.resolve(__dirname, "..", "..", "uploads");
console.log("Upload DIR", UPLOAD_DIR);

function mashall(obj) {
  return JSON.parse(JSON.stringify(obj));
}

async function profileInfo(p) {
  let owner = await p.getOwner();
  let result;
  switch (p.role.name) {
    case "Hub Manager":
      let hubs = await owner.getHubs();
      result = {
        ...mashall(p),
        entity: hubs.length ? mashall(hubs[0]) : undefined,
      };
      break;
    case "Incubatee":
      let inc = await owner.getIncubatees();
      result = {
        ...mashall(p),
        entity: inc.length ? mashall(inc[0]) : undefined,
      };
      break;
    default:
      let services = await owner.getServices();
      result = {
        ...mashall(p),
        entity: services.length ? mashall(services[0]) : undefined,
      };
      break;
  }

  result.name = p.role.name;
  delete result["role"];
  return result;
}

exports.download = async (req, res) => {
  const file = `${__dirname}/upload-folder/dramaticpenguin.MOV`;
  res.download(file); // Set disposition and send it.
};

exports.hubs = async (req, res) => {
  let hubs = await models.Hub.findAll();

  res.send({
    message: "Successfully created profile successfully!",
    hubs,
  });
};
exports.profiles = async (req, res) => {
  let profiles = await models.Profile.findAll({
    include: [
      "role",
      "attachments",
      {
        model: models.Field,
        as: "fields",
        include: ["values"],
      },
    ],
  });

  let resProfiles = await Promise.all(
    profiles.map(async (p) => {
      return profileInfo(p);
    })
  );

  res.send({
    message: "Successfully fetched profiles!",
    profiles: resProfiles,
  });
};

exports.getMyProfiles = async (req, res) => {
  const { userUuid } = req;
  const { roleId } = req.params;
  let user = await models.User.findOne({
    where: {
      uuid: userUuid,
    },
  });
  let where = {
    owner_id: user.id,
  };
  if (roleId) {
    where.role_id = roleId;
  }
  let profiles = await models.Profile.findAll({
    where,
    include: [
      "role",
      "attachments",
      {
        model: models.Field,
        as: "fields",
        include: ["values"],
      },
    ],
  });

  let resProfiles = await Promise.all(
    profiles.map(async (p) => {
      return profileInfo(p);
    })
  );

  res.send({
    message: "Successfully fetched profiles!",
    profiles: resProfiles,
  });
};

const saveBase64File = (data, file) => {
  console.log("Data: ", data);
  let base64Data = data.split(";base64,").pop();

  fs.writeFile(
    path.join(UPLOAD_DIR, file),
    base64Data,
    { encoding: "base64" },
    function (err) {
      console.error(err);
    }
  );
};
function createValue(value) {
  let val = null;
  if (!value) {
    console.log("No value? ", value);
    return [
      {
        value,
      },
    ];
  }
  if (value.type === "FILE") {
    console.log("File: ", value.name);
    let fileName = `${Date.now()}_${value.name}`;
    saveBase64File(value.value, fileName);
    val = [
      {
        value: fileName,
      },
    ];
  } else {
    val =
      value && Array.isArray(value)
        ? value.map((v) => {
            return {
              value: v.name,
              extra: v.extra,
            };
          })
        : [
            {
              value,
            },
          ];
  }
  return val;
}
function createRecord(profile, key, value) {
  console.log("Create record", key, value);
  let obj = {
    profile_id: profile.id,
    name: key,
    type: value && Array.isArray(value) ? "MULTISELECT" : "SINGLE",
    values: createValue(value),
  };
  console.log("Inner: ", obj);
  return obj;
}
exports.registerProfile = async (req, res) => {
  try {
    await sequelize.transaction(async (transaction) => {
      let roleName = req.body.role;
      console.log("Request: ", req.body);
      let [role, created] = await models.Role.findOrCreate({
        where: { name: roleName },
        defaults: {
          require_otp: false,
          description: `Role for ${roleName}`,
        },
        transaction,
      });
      let user = await models.User.findOne({
        where: {
          uuid: req.userUuid,
        },
      });
      console.log("Roled: ", role.name);
      if (roleName === "Hub Manager") {
        let data = { ...req.body.fields, owner_id: user.id };
        data.hub_id = undefined;
        let hub = await models.Hub.create({
          name: req.body.fields.name,
          description: req.body.fields.description,
          owner_id: user.id,
        });
        console.log("Created successfully", hub);
      } else if (roleName === "Incubatee") {
        let data = { ...req.body.fields, owner_id: user.id };
        let hubId = req.body.hubId;
        data.hub_id = undefined;
        let inc = await models.Incubatee.create({
          hub_id: hubId,
          name: req.body.fields.name,
          description: req.body.fields.description,
          owner_id: user.id,
        });
        await models.Enrollment.create({
          hub_id: hubId,
          incubatee_id: inc.id,
          status: "Requested",
        });
      } else {
        let data = { ...req.body.fields, owner_id: user.id };
        data.hub_id = undefined;
        let service = await models.Service.create({
          name: req.body.fields.name,
          description: req.body.fields.description,
          owner_id: user.id,
        });
        console.log("Created successfully", service);
      }
      let profile = await models.Profile.create(
        {
          role_id: role.id,
          owner_id: user.id,
        },
        { transaction }
      );
      let fieldsArr = req.body.fields;
      delete fieldsArr["name"];
      delete fieldsArr["description"];
      console.log("Fields: ", fieldsArr);
      await models.Field.bulkCreate(
        Object.entries(fieldsArr).map(([key, value]) =>
          createRecord(profile, key, value)
        ),
        { transaction, include: [{ model: models.FieldValue, as: "values" }] }
      );

      res.send({
        status: 0,
        message: "Successfully created profile successfully!",
      });
    });
  } catch (error) {
    console.log("Error? ", error);
    res.status(400).send({
      ...error,
    });
  }
};

exports.unRegisterProfile = async (req, res) => {
  await sequelize.transaction(async (transaction) => {
    let profileId = req.params.profileId;
    let profile = await models.Profile.findOne({
      where: {
        id: profileId || 0,
      },
      include: ["role"],
    });
    if (profile) {
      let pInfo = await profileInfo(profile);
      let owner = await profile.getOwner();
      let fields = await models.Field.findAll({
        where: {
          profile_id: profileId,
        },
      });
      await models.FieldValue.destroy({
        where: {
          field_id: fields.map((f) => f.id),
        },
        transaction,
      });
      console.log(pInfo);
      //1. Delete fields
      await models.Field.destroy({
        where: {
          profile_id: profileId,
        },
        transaction,
      });
      //2. Delete attachments
      await models.ProfileAttachment.destroy({
        where: {
          profile_id: profileId,
        },
        transaction,
      });
      //3. Delete profile
      await models.Profile.destroy({
        where: {
          id: profileId,
        },
        transaction,
      });

      if (pInfo.name === "Incubatee") {
        let inc = await models.Incubatee.findOne({
          where: {
            owner_id: owner.id,
          },
        });

        if (inc) {
          //4.a.1 Delete enrollement
          await models.Enrollment.destroy({
            where: {
              incubatee_id: inc.id,
            },
            transaction,
          });
          //4.a.2 Delete incubatee
          await models.Incubatee.destroy({
            where: {
              owner_id: owner.id,
            },
            transaction,
          });
        }
      } else if (pInfo.name === "Hub Manager") {
        let hub = await models.Hub.findOne({
          where: {
            owner_id: owner.id,
          },
        });
        console.log("Hub? ", hub);
        if (hub) {
          //4.b.1 Delete enrollement
          await models.Enrollment.destroy({
            where: {
              hub_id: hub.id,
            },
            transaction,
          });
          //4.b.2 Delete hub
          await models.Hub.destroy({
            where: {
              owner_id: owner.id,
            },
            transaction,
          });
        }
      } else {
        let service = await models.Service.findOne({
          where: {
            owner_id: owner.id,
          },
        });
        console.log("Service? ", service);
        if (service) {
          //4.b.2 Delete Service
          await models.Service.destroy({
            where: {
              owner_id: owner.id,
            },
            transaction,
          });
        }
      }
    }

    res.send({
      message: "Successfully deleted profile!",
    });
  });
};
