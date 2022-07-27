const controller = require("../controllers/common.controller");
module.exports = {
  init: function (app) {
    app.use(function (req, res, next) {
      res.header(
        "Access-Control-Allow-Headers",
        "x-access-token, Origin, Content-Type, Accept"
      );
      next();
    });
    app.get("/api/setups", controller.allSetups);
    app.get("/api/setups/hubs", controller.hubs);
    app.get("/api/setups/hubs/:hubId", controller.hubs);
    app.get("/api/setups/:category", controller.setupsByCategory);
    app.post("/api/setups/create", controller.createSetup);
    app.put("/api/setups/:id", controller.updateSetup);
    app.delete("/api/setups/:id", controller.deleteSetup);
  },
};
