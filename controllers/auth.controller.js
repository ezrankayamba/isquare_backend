const models = require("../models");
const bcrypt = require("bcryptjs");
var crypto = require("crypto");
var jwt = require("jsonwebtoken");
const sendVerification = async (user, action = "SIGNUP") => {
  let seed = crypto.randomBytes(20);
  let hash = crypto.createHash("sha256").update(seed).digest("hex");
  await models.Verification.create({
    hash,
    user_id: user.id,
    action,
  });
};
exports.signup = async (req, res) => {
  try {
    let roleName = req.body.role;
    let [role, created] = await models.Role.findOrCreate({
      where: { name: roleName },
      defaults: {
        require_otp: false,
        description: `Role for ${roleName}`,
      },
    });
    console.log("Role: ", roleName, role.name, role.id);
    let user = await models.User.create({
      ...req.body,
      role_id: role.id,
      password: bcrypt.hashSync(req.body.password, 8),
    });

    //Send verification email
    sendVerification(user);

    res.send({
      status: 0,
      message: "Successfully created user!",
    });
  } catch (error) {
    console.log("Error: ", error);
    res.status(400).send({
      message: error,
    });
  }
};
exports.signin = async (req, res) => {
  let { email, password } = req.body;
  console.log("User: ", email);
  try {
    let user = await models.User.findOne({
      where: { email },
    });
    if (!user) {
      return res.status(401).send({ message: "User Not found." });
    }
    var passwordIsValid = bcrypt.compareSync(req.body.password, user.password);
    if (!passwordIsValid) {
      return res.status(401).send({
        accessToken: null,
        message: "Invalid Password!",
      });
    }
    if (!user.isVerified) {
      //Send verification email
      sendVerification(user);

      return res.status(401).send({
        accessToken: null,
        message: "Not verified yet! Verification email sent into your inbox",
      });
    }
    var token = jwt.sign({ uuid: user.uuid }, process.env.JWT_SECRET, {
      expiresIn: 86400, // 24 hours
    });

    return res
      .cookie(process.env.JWT_AUTH_HEADER, `Bearer ${token}`, {
        httpOnly: true,
        secure: true,
        sameSite: "None",
      })
      .status(200)
      .json({ message: "Logged in successfully 😊 👌" });
  } catch (error) {
    console.log("Error: ", error.message);
    return res.status(400).send({ message: error.message });
  }
};

exports.changePassword = async (req, res) => {
  let { new_password, current_password } = req.body;
  const { userUuid } = req;
  try {
    let user = await models.User.findOne({
      where: { uuid: userUuid },
    });
    if (!user) {
      return res.status(401).send({ message: "User Not found." });
    }
    var passwordIsValid = bcrypt.compareSync(current_password, user.password);
    if (!passwordIsValid) {
      return res.status(401).send({
        accessToken: null,
        message: "Invalid Password!",
      });
    }

    //Update password
    await user.update({
      password: bcrypt.hashSync(new_password, 8),
    });

    var token = jwt.sign({ uuid: user.uuid }, process.env.JWT_SECRET, {
      expiresIn: 86400, // 24 hours
    });

    return res
      .cookie(process.env.JWT_AUTH_HEADER, `Bearer ${token}`, {
        httpOnly: true,
        secure: true,
        sameSite: "None",
      })
      .status(200)
      .json({ message: "Logged in successfully 😊 👌" });
  } catch (error) {
    console.log("Error: ", error.message);
    return res.status(400).send({ message: error.message });
  }
};

exports.signout = (req, res) => {
  return res
    .cookie(process.env.JWT_AUTH_HEADER, "", {
      httpOnly: true,
      secure: true,
      sameSite: "None",
    })
    .status(200)
    .json({ message: "Logged out successfully 😊 👌" });
};

exports.me = async (req, res) => {
  const { userUuid } = req;
  let user = await models.User.findOne({
    where: {
      uuid: userUuid,
    },
    include: {
      model: models.Profile,
      as: "profiles",
      include: [
        {
          model: models.Role,
          as: "role",
        },
        {
          model: models.Field,
          as: "fields",
          include: {
            model: models.FieldValue,
            as: "values",
          },
        },
      ],
    },
  });
  res.send(user);
};
