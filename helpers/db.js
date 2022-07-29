module.exports = {
  insertOrUpdate: async (Model, values, condition) => {
    return await Model.findOne({ where: condition }).then(async function (obj) {
      if (obj) return await obj.update(values);
      return await Model.create(values);
    });
  },
};
