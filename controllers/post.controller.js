const { sequelize } = require("../models");
const models = require("../models");
const { createRecord } = require("../helpers/utils");
exports.createPost = async (req, res) => {
  try {
    await sequelize.transaction(async (transaction) => {
      let postData = req.body;
      const { userUuid } = req;
      const { profileId, category } = postData;

      let post = await models.ProfileForm.create(
        {
          name: "POST",
          category: category,
          profile_id: profileId,
        },
        { transaction }
      );

      let fieldsArr = postData.fields;
      await models.Field.destroy(
        {
          where: {
            profile_id: profileId,
            owner_id: post.id,
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
            owner_id: post.id,
            category: "PROFILEFORM",
          };
        }),
        { transaction, include: [{ model: models.FieldValue, as: "values" }] }
      );

      res.send({
        message: "Post created successfully!",
        data: {
          id: post.id,
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
exports.getMyPosts = async (req, res) => {
  try {
    await sequelize.transaction(async () => {
      const { userUuid } = req;
      const { profileId, category } = req.params;
      let posts = await models.ProfileForm.findAll({
        where: {
          name: "POST",
          category: category,
          profile_id: profileId,
        },
        order: [["createdAt", "DESC"]],
      });

      let resData = [];
      for (let post of posts) {
        let fields = await models.Field.findAll({
          where: {
            profile_id: profileId,
            owner_id: post.id,
            category: "PROFILEFORM",
          },
          include: ["values"],
        });
        resData.push({
          ...post.dataValues,
          fields,
        });
      }

      res.send({
        message: "Posts read successfully!",
        data: resData,
      });
    });
  } catch (err) {
    console.error("Error: ", err);
    res.status(400).send({
      message: err,
    });
  }
};

exports.getPost = async (req, res) => {
  try {
    await sequelize.transaction(async () => {
      const { userUuid } = req;
      const { profileId, category } = req.params;

      let post = await models.ProfileForm.findOne({
        where: {
          name: "POST",
          category: category,
          profile_id: profileId,
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
          owner_id: post.id,
          category: "PROFILEFORM",
        },
        include: ["values"],
      });

      res.send({
        message: "Post read successfully!",
        data: {
          ...post.dataValues,
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

exports.deletePost = async (req, res) => {
  try {
    await sequelize.transaction(async () => {
      const { userUuid } = req;
      const { profileId, postId } = req.params;

      await models.ProfileForm.destroy({
        where: {
          id: postId,
        },
      });

      await models.Field.destroy({
        where: {
          profile_id: profileId,
          owner_id: postId,
        },
      });

      res.send({
        message: "Post deleted successfully!",
        data: {
          id: postId,
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
