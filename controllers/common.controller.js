const { sequelize } = require("../models");
const models = require("../models");

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
  });

  res.send({
    message: "Successfully fetched setups-hubs!",
    setups: hubs,
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
