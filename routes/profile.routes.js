const controller = require("../controllers/profile.controller");
module.exports = {
  init: function (app) {
    app.use(function (req, res, next) {
      res.header(
        "Access-Control-Allow-Headers",
        "x-access-token, Origin, Content-Type, Accept"
      );
      next();
    });
    app.post("/api/profile/register", controller.registerProfile);
    app.get("/api/profile/hubs", controller.hubs);
    app.post("/api/profile/profiles", controller.profiles);
    app.delete("/api/profile/:profileId", controller.unRegisterProfile);
    app.get("/api/profile/myprofiles", controller.getMyProfiles);
    app.get("/api/profile/myprofiles/:roleId", controller.getMyProfiles);
  },
};
