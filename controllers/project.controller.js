const { sequelize } = require("../models");
const bcrypt = require("bcryptjs");
const models = require("../models");
const { createRecord } = require("../helpers/utils");
const getUser = async (userUuid, profileId) => {
  let user = await models.User.findOne({
    where: {
      uuid: userUuid,
    },
    include: {
      model: models.Profile,
      as: "profiles",
      required: true,
      where: {
        id: profileId,
      },
      include: [
        {
          model: models.Role,
          as: "role",
        },
      ],
    },
  });
  return user;
};
exports.createProject = async (req, res) => {
  try {
    await sequelize.transaction(async (transaction) => {
      let postData = req.body;
      const { userUuid } = req;
      const { profileId } = postData;
      console.log("Post Data: ", postData, profileId);
      let user = await getUser(userUuid, profileId);

      let proj = await models.ProfileForm.create(
        {
          name: "PROJECT",
          category: "INCUBATEE",
          profile_id: profileId,
        },
        { transaction }
      );

      let fieldsArr = postData.fields;
      await models.Field.destroy(
        {
          where: {
            profile_id: profileId,
            owner_id: proj.id,
            category: "PROFILEFORM",
          },
        },
        { transaction }
      );
      await models.Field.bulkCreate(
        Object.entries(fieldsArr).map(([key, value]) => {
          let rec = createRecord(profileId, key, value);
          return {
            ...rec,
            profile_id: profileId,
            owner_id: proj.id,
            category: "PROFILEFORM",
          };
        }),
        { transaction, include: [{ model: models.FieldValue, as: "values" }] }
      );

      res.send({
        message: "Project created successfully!",
        data: proj,
      });
    });
  } catch (err) {
    console.error("Error: ", err);
    res.status(400).send({
      message: err,
    });
  }
};
exports.getProject = async (req, res) => {
  try {
    await sequelize.transaction(async (transaction) => {
      const { userUuid } = req;
      const { profileId } = req.params;
      let user = await getUser(userUuid, profileId);

      let proj = await models.ProfileForm.findOne({
        where: {
          name: "PROJECT",
          category: "INCUBATEE",
          profile_id: profileId,
          status: "PENDING",
        },
      });

      console.log("Project: ", proj);

      if (!proj) {
        res.status(200).send({
          result: -1,
          message: "Project not found",
        });
        return;
      }

      let fields = await models.Field.findAll({
        where: {
          profile_id: profileId,
          owner_id: proj.id,
          category: "PROFILEFORM",
        },
        include: ["values"],
      });

      console.log("Project: ", proj);

      res.send({
        message: "Project created successfully!",
        data: {
          ...proj.dataValues,
          fields,
        },
      });
    });
  } catch (err) {
    console.error("Error: ", err);
    res.status(400).send({
      message: err,
    });
  }
};
