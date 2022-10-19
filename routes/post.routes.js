const controller = require("../controllers/post.controller");
module.exports = {
  init: function (app) {
    app.use(function (req, res, next) {
      res.header(
        "Access-Control-Allow-Headers",
        "x-access-token, Origin, Content-Type, Accept"
      );
      next();
    });
    app.post("/api/posts/create", controller.createPost);
    app.post("/api/posts/update/:postId", controller.createPost);
    app.post("/api/posts/approval/:postId", controller.postApproval);
    app.get("/api/posts/read/:profileId/:category", controller.getPost);
    app.get("/api/posts/myposts/:profileId/:category", controller.getMyPosts);
    app.post("/api/posts/filtered/:category", controller.getPostsFiltered);
    app.delete("/api/posts/delete/:profileId/:postId", controller.deletePost);
  },
};
