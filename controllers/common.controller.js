const { sequelize } = require("../models");
const models = require("../models");
let formidable = require("formidable");
const path = require("path"),
  fs = require("fs");

const UPLOAD_DIR = path.resolve(__dirname, "..", "..", "uploads");

exports.allSetups = async (req, res) => {
  let all = await models.Setup.findAll();

  res.send({
    message: "Fetched successfully!",
    setups: all,
  });
};
exports.setupsByCategory = async (req, res) => {
  let category = req.params.category;
  let all = await models.Setup.findAll({
    where: {
      category,
    },
  });

  res.send({
    message: "Fetched successfully!",
    setups: all,
  });
};
exports.hubs = async (req, res) => {
  const { hubId } = req.params;
  let where = {};
  if (hubId) {
    where.id = hubId;
  }
  let hubs = await models.Hub.findAll({
    where,
    include: "profile",
  });

  res.send({
    message: "Successfully fetched setups-hubs!",
    setups: hubs,
  });
};
exports.incubatees = async (req, res) => {
  let postData = req.body;
  const { userUuid } = req;
  let user = await models.User.findOne({
    where: {
      uuid: userUuid,
    },
  });

  let where = {};
  let incubatees = await models.Incubatee.findAll({
    where,
    include: [
      {
        model: models.ProfileForm,
        as: "forms",
        // where: { status: "APPROVED", approval_by: user.id },
        where: { status: "APPROVED" },
        include: [
          {
            model: models.Profile,
            as: "profile",
          },
        ],
      },
    ],
  });

  res.send({
    message: "Successfully fetched setups-Incubatee!",
    setups: incubatees,
  });
};
exports.createSetup = async (req, res) => {
  let params = req.body;
  let s = await models.Setup.create(params);

  res.send({
    message: "Created successfully!",
    setup: s,
  });
};
exports.updateSetup = async (req, res) => {
  let id = req.params.id;
  let params = req.body;
  let s = await models.Setup.findOne({
    where: {
      id,
    },
  });
  s.set({ ...params });
  s.save();

  res.send({
    message: "Updated successfully!",
    setup: s,
  });
};
exports.deleteSetup = async (req, res) => {
  let id = req.params.id;
  let s = await models.Setup.findOne({ where: { id } });
  await s.destroy();
  res.send({
    message: "Deleted successfully!",
  });
};

exports.attachments = async (req, res) => {
  let form = new formidable.IncomingForm();
  form.parse(req, function (error, fields, file) {
    let filepath = file.fileupload.filepath;

    let newpath = path.join(UPLOAD_DIR, file.fileupload.originalFilename);

    const origin = req.headers.origin;
    let fileLink = `${origin}/api/common/attachments/${file.fileupload.originalFilename}`;

    //Copy the uploaded file to a custom folder
    fs.rename(filepath, newpath, function () {
      //Send a NodeJS file upload confirmation message
      res.write(
        JSON.stringify({
          result: 0,
          message: "Successfully uploaded a file",
          link: fileLink,
        })
      );
      res.end();
    });
  });
};

exports.download = async (req, res) => {
  let { file } = req.params;
  let newpath = path.join(UPLOAD_DIR, file);
  res.download(newpath);
};
