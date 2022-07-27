const controller = require("../controllers/auth.controller");
module.exports = {
  init: function (app) {
    app.post("/api/auth/signup", controller.signup);
    app.post("/api/auth/signin", controller.signin);
    app.get("/api/auth/me", controller.me);
    app.post("/api/auth/signout", controller.signout);
    // app.get("/api/auth/verify/:hash", controller.verify);
  },
};
