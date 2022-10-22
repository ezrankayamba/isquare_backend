const { sequelize } = require("../models");
const models = require("../models");
const { createRecord } = require("../helpers/utils");
exports.createPost = async (req, res) => {
  console.log("Create new post!");
  try {
    await sequelize.transaction(async (transaction) => {
      let postData = req.body;
      const { userUuid } = req;
      let user = await models.User.findOne({
        where: {
          uuid: userUuid,
        },
      });
      const { profileId, category, extras, fields } = postData;
      let { approval } = extras;
      console.log("Approval: ", approval);
      let requestTo = null;
      if (approval) {
        let by = approval.by;
        console.log("Request To: ", fields[by]);
      }

      delete fields["approval"];

      const { postId } = req.params;
      let values = {
        name: "POST",
        category: category,
        profile_id: profileId,
        owner_id: user.id,
      };
      let post = await models.ProfileForm.findOne({
        where: {
          id: postId || 0,
        },
      }).then(async function (obj) {
        if (obj) return obj.update(values);
        return await models.ProfileForm.create(values, { transaction });
      });

      let fieldsArr = fields;

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
exports.getPostsFiltered = async (req, res) => {
  try {
    await sequelize.transaction(async () => {
      const { userUuid } = req;
      const { category } = req.params;
      const { searchValue } = req.body;
      let posts = await models.ProfileForm.findAll({
        where: {
          name: "POST",
          category: category,
        },
        include: [
          {
            model: models.Profile,
            as: "profile",
            include: [{ model: models.User, as: "owner" }],
          },
          {
            model: models.Field,
            as: "fields",
            where: {
              category: "PROFILEFORM",
            },
            include: [
              {
                model: models.FieldValue,
                as: "values",
              },
            ],
          },
        ],
        order: [["createdAt", "DESC"]],
      });

      const filterBy = async (p) => {
        if (searchValue && searchValue.field) {
          let field = p.fields.filter(
            (f) => f.name === searchValue.field.name
          )[0];

          let found = field ? field.values[0] : null;

          if (found) {
            let val = found.value;
            console.log(val, searchValue.value);
            if (searchValue.field.optionsKey === "Hubs") {
              let hub = await models.Hub.findOne({
                where: {
                  id: val,
                },
                include: [
                  {
                    model: models.Profile,
                    as: "profile",
                    where: {
                      id: searchValue.value,
                    },
                  },
                ],
              });

              let res = hub !== null;
              return res;
            }
          }

          return false;
        }

        return true;
      };
      let result = await posts.reduce(async (filtered, p) => {
        let res = await filterBy(p);
        if (!res) return filtered;
        return (await filtered).concat(p);
      }, []);
      res.send({
        message: "Posts read successfully!",
        data: result,
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

exports.postApproval = async (req, res) => {
  try {
    await sequelize.transaction(async () => {
      const { userUuid } = req;
      let user = await models.User.findOne({
        where: { uuid: userUuid },
      });
      if (!user) {
        return res.status(401).send({ message: "User Not found." });
      }
      const { postId } = req.params;
      let postData = req.body;
      let profileId = postData.profileId;
      let values = {
        request_to: profileId,
        remark: postData.fields.approval_remarks,
        status: postData.fields.approval_action,
        approval_by: user.id,
      };
      let post = await models.ProfileForm.findOne({
        where: {
          id: postId || 0,
        },
      }).then(async function (obj) {
        if (obj) return obj.update(values);
      });

      console.log("Profile Id: ", profileId);

      res.send({
        message: "Post approval applied successfully!",
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
