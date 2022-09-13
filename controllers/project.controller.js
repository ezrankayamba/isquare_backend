const { sequelize } = require("../models");
const bcrypt = require("bcryptjs");
const models = require("../models");
const { createRecord } = require("../helpers/utils");
const { sendEmail } = require("../helpers/mailer");
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

      // console.log("Fields Arr: ", fieldsArr);
      let members = fieldsArr["project_members"];
      let projectName = fieldsArr["project_name"];
      console.log("Members: ", members);

      members.value.forEach(async (m) => {
        await sendEmail(
          m,
          "Member of Project",
          `Dear ${m},<br/> You are added into new project "${projectName}" by your colleague ${user.email}.`
        );
      });

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
