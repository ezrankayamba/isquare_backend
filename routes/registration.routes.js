const controller = require("../controllers/registration.controller");
module.exports = {
  init: function (app) {
    app.use(function (req, res, next) {
      res.header(
        "Access-Control-Allow-Headers",
        "x-access-token, Origin, Content-Type, Accept"
      );
      next();
    });
    app.post("/api/registration/create-account", controller.createAccount);
    app.post("/api/registration/unique-email", controller.checkUniqueEmail);
    app.get("/api/registration/verify/:hash", controller.verify);
    app.post("/api/registration/forgotpassword", controller.forgotPassword);
    app.post("/api/registration/resetpassword/:hash", controller.resetPassword);
    app.get("/api/registration/statistics", controller.getStatistics);
  },
};
