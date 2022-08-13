const controller = require("../controllers/project.controller");
module.exports = {
  init: function (app) {
    app.use(function (req, res, next) {
      res.header(
        "Access-Control-Allow-Headers",
        "x-access-token, Origin, Content-Type, Accept"
      );
      next();
    });
    app.post("/api/projects/create-project", controller.createProject);
    app.get("/api/projects/:profileId", controller.getProject);
  },
};
