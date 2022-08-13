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
const projectRoutes = require("./routes/project.routes");

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
projectRoutes.init(app);

app.get("/", async (req, res) => {
  console.log("Ping");
  res.send({ message: "Ping processed successfully" });
});
app.listen({ port: parseInt(PORT) }, async () => {
  console.log(`Server started at: http://localhost:${PORT}`);
  await sequelize.authenticate();
  console.log("DB connected successfully!");
});
