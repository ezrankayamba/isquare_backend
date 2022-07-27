require("dotenv").config();
const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const { sequelize, User, Post } = require("./models");
const { verifyToken } = require("./middlewares/jwtauth");
const db = require("./database/db");

const PORT = process.env.SERVER_PORT || 5000;
console.log("Port: ", PORT);
const authRoutes = require("./routes/auth.routes");
const profileRoutes = require("./routes/profile.routes");
const commonRoutes = require("./routes/common.routes");
const registrationRoutes = require("./routes/registration.routes");

const app = express();
app.use(express.json());
app.use(cookieParser());
app.use(express.urlencoded({ extended: true }));
const allowedOrigins = [
  "http://localhost:3000",
  "http://localhost:3001",
  "https://isquaretz.herokuapp.com",
  "https://isquaretz.nezatech.co.tz",
];
app.use(function (req, res, next) {
  const origin = req.headers.origin;
  if (allowedOrigins.includes(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader("Access-Control-Allow-Credentials", "true");
  }
  res.header(
    "Access-Control-Allow-Headers",
    "x-access-token, Origin, Content-Type, Accept"
  );
  next();
});
app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
  })
);
app.use(verifyToken);
app.use(function (err, req, res, next) {
  if (err.name === "UnauthorizedError") {
    res.status(401).send({
      result: -1,
      message: err.message,
    });
  }
});

authRoutes.init(app);
profileRoutes.init(app);
commonRoutes.init(app);
registrationRoutes.init(app);

app.get("/", async (req, res) => {
  console.log("Ping");
  res.send({ message: "Ping processed successfully" });
});
app.get("/users", async (req, res) => {
  try {
    const users = await User.findAll({ include: "role" });
    return res.json(users);
  } catch (err) {
    console.error(err);
    return res.status(500).json(err);
  }
});
app.get("/users/:uuid", async (req, res) => {
  const uuid = req.params.uuid;
  try {
    const user = await User.findOne({
      where: {
        uuid,
      },
    });
    return res.json(user);
  } catch (err) {
    console.error(err);
    return res.status(500).json(err);
  }
});
app.post("/users", async (req, res) => {
  const { name, email, role } = req.body;
  try {
    const user = await User.create({ name, email, role });
    return res.json(user);
  } catch (err) {
    console.error(err);
    return res.status(500).json(err);
  }
});
app.post("/posts", async (req, res) => {
  const { userUuid, body } = req.body;
  try {
    const user = await User.findOne({
      where: {
        uuid: userUuid,
      },
    });
    const post = await Post.create({ body, userId: user.id });
    return res.json(post);
  } catch (err) {
    console.error(err);
    return res.status(500).json(err);
  }
});
app.get("/testdb", async (req, res) => {
  try {
    const users = await db.dbSelect("SELECT * FROM users");
    console.log("Users", users);
    return res.json(users);
  } catch (err) {
    console.error(err);
    return res.status(500).json(err);
  }
});
app.listen({ port: parseInt(PORT) }, async () => {
  console.log(`Server started at: http://localhost:${PORT}`);
  await sequelize.authenticate();
  console.log("DB connected successfully!");
});
