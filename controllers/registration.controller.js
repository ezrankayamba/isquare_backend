const { sequelize } = require("../models");
const bcrypt = require("bcryptjs");
const models = require("../models");
var crypto = require("crypto");

const path = require("path"),
  fs = require("fs");
const { sendEmail } = require("../helpers/mailer");
const { insertOrUpdate } = require("../helpers/db");

const UPLOAD_DIR = path.resolve(__dirname, "..", "..", "uploads");

const sendVerification = async (
  user,
  action = "SIGNUP",
  origin = "http://localhost:3000"
) => {
  await sequelize.transaction(async (transaction) => {
    let seed = crypto.randomBytes(20);
    let hash = crypto
      .createHash("sha256")
      .update(seed + user.email)
      .digest("hex");
    await models.Verification.create({
      hash,
      user_id: user.id,
      action,
    });

    //3. Send verification Link to email
    let message = `
    Congraturations!<br/>
    You have just registered on iSquareTZ. Kindly complete verification by clicking on below link.<br/><br/>
    <a href="${origin}/auth/verify-email/${hash}">Verify Now</a>
    `;

    sendEmail(user.email, "Email Verification", message);
  });
};

const sendForgotPassword = async (user, origin = "http://localhost:3000") => {
  let seed = crypto.randomBytes(20);
  let hash = crypto.createHash("sha256").update(seed).digest("hex");
  await models.Verification.create({
    hash,
    user_id: user.id,
    action: "FORGOTPASSWORD",
  });

  //3. Send verification Link to email
  let message = `
    Dear ${user.first_name},<br/>
    You are doing password reset on iSquareTZ. If is you, kindly complete reset by clicking on below link.<br/><br/>
    <a href="${origin}/auth/passwordreset/${hash}">Reset Now</a>
    `;

  sendEmail(user.email, "Forgot Password", message);
};

const saveBase64File = (data, file) => {
  let base64Data = data.split(";base64,").pop();

  fs.writeFile(
    path.join(UPLOAD_DIR, file),
    base64Data,
    { encoding: "base64" },
    function (err) {
      console.error(err);
    }
  );
};

function createValue(value) {
  let val = null;
  if (!value) {
    return [
      {
        value,
      },
    ];
  }
  if (value.type === "FILE") {
    let fileName = `${Date.now()}_${value.name}`;
    saveBase64File(value.value, fileName);
    val = [
      {
        value: fileName,
      },
    ];
  } else {
    val =
      value && Array.isArray(value)
        ? value.map((v) => {
            return {
              value: v.name,
              extra: v.extra,
            };
          })
        : [
            {
              value,
            },
          ];
  }
  return val;
}

function createRecord(profile, key, value) {
  let obj = {
    profile_id: profile.id,
    name: key,
    type: value && Array.isArray(value) ? "MULTISELECT" : "SINGLE",
    values: createValue(value),
  };
  return obj;
}
let passwordHash = (pwd) => bcrypt.hashSync(pwd, 8);
exports.createAccount = async (req, res) => {
  try {
    await sequelize.transaction(async (transaction) => {
      let postData = req.body;
      let newUser = false;
      //1. Create User
      let roleName = postData.role;
      let role = await models.Role.findOne({
        where: { name: roleName },
      });
      if (!role) {
        role = await models.Role.create(
          {
            name: roleName,
            require_otp: false,
            description: `Role for ${roleName}`,
          },
          { transaction }
        );
      }

      let userFields = [
        "first_name",
        "last_name",
        "password",
        "password_confirm",
        "email",
      ];
      delete postData.fields["password_confirm"];
      let userData = { role_id: role.id };
      userFields.forEach((f) => {
        let value = postData.fields[f];
        userData[f] = f === "password" ? passwordHash(value || "") : value;
        delete postData.fields[f];
      });
      let user = await models.User.findOne({
        where: {
          uuid: req.userUuid || "None",
        },
      });
      if (!user) {
        //Create new one
        user = await models.User.create(
          {
            ...userData,
          },
          { transaction }
        );
        newUser = false;
      }
      let profile = await models.Profile.findOne({
        where: {
          role_id: role.id,
          owner_id: user.id,
        },
      });
      if (!profile) {
        profile = await models.Profile.create(
          {
            role_id: role.id,
            owner_id: user.id,
          },
          { transaction }
        );
      }

      //2. Register profile
      if (roleName === "Hub Manager") {
        let data = { ...postData.fields, owner_id: user.id };
        data.hub_id = undefined;
        let hub = await models.Hub.create(
          {
            name: postData.fields.name,
            description: postData.fields.description,
            owner_id: user.id,
          },
          { transaction }
        );
      } else if (roleName === "Incubatee") {
        let data = { ...postData.fields, owner_id: user.id };
        let hubId = postData.fields.hubId;
        data.hub_id = undefined;
        let inc = await models.Incubatee.create(
          {
            hub_id: hubId,
            name: postData.fields.name || null,
            description: postData.fields.description,
            owner_id: user.id,
          },
          { transaction }
        );
        await models.Enrollment.create(
          {
            hub_id: hubId,
            incubatee_id: inc.id,
            status: "Requested",
          },
          { transaction }
        );
      } else {
        //Other profiles
        let data = { ...postData.fields, owner_id: user.id };
        data.hub_id = undefined;
        let service = await models.Service.create(
          {
            name: postData.fields.name,
            description: postData.fields.description,
            owner_id: user.id,
          },
          { transaction }
        );
        profile.update({
          approval: "APPROVED",
        });
      }

      let fieldsArr = postData.fields;
      delete fieldsArr["name"];
      delete fieldsArr["description"];
      await models.Field.bulkCreate(
        Object.entries(fieldsArr).map(([key, value]) =>
          createRecord(profile, key, value)
        ),
        { transaction, include: [{ model: models.FieldValue, as: "values" }] }
      );

      //3. Send verification email
      const origin = req.headers.origin;
      if (newUser) sendVerification(user, "SIGNUP", origin);
      res.send({
        message: "Account created successfully!",
        email: user.email,
      });
    });
  } catch (err) {
    console.error("Error: ", err);
    // console.dir(err.message);
    res.status(400).send({
      message: err,
    });
  }
};

exports.updateProfile = async (req, res) => {
  //Update Profile
  try {
    let profileId = req.params.profileId;

    await sequelize.transaction(async (transaction) => {
      let postData = req.body;
      const { userUuid } = req;
      let user = await models.User.findOne({
        where: {
          uuid: userUuid,
        },
        include: {
          model: models.Profile,
          as: "profiles",
          required: true,
          where: {
            id: profileId,
          },
          include: [
            {
              model: models.Role,
              as: "role",
            },
          ],
        },
      });

      if (!user) {
        throw "You must have logged in and update only your profile";
      }

      let userFields = [
        "first_name",
        "last_name",
        "password",
        "password_confirm",
        "email",
      ];
      delete postData.fields["password_confirm"];
      // let userData = { role_id: role.id };
      // userFields.forEach((f) => {
      //   let value = postData.fields[f];
      //   userData[f] = f === "password" ? passwordHash(value || "") : value;
      //   delete postData.fields[f];
      // });

      let profile = user.profiles[0];
      let roleName = profile.role.name;

      //2. Register profile
      if (roleName === "Hub Manager") {
        let hub = await models.Hub.findOne({
          where: {
            owner_id: user.id,
          },
        });
        await hub.update({
          name: postData.fields.name,
          description: postData.fields.description,
        });
      } else if (roleName === "Incubatee") {
        let inc = await models.Hub.findOne({
          where: {
            owner_id: user.id,
          },
        });
        let hubId = postData.fields.hubId;
        await inc.update({
          hub_id: hubId,
          name: postData.fields.name || null,
          description: postData.fields.description,
          owner_id: user.id,
        });
        await models.Enrollment.create(
          {
            hub_id: hubId,
            incubatee_id: inc.id,
            status: "Requested",
          },
          { transaction }
        );
      } else {
        //Other profiles
        let service = await insertOrUpdate(
          models.Service,
          {
            name: postData.fields.name,
            description: postData.fields.description,
            owner_id: user.id,
            profile_id: profileId,
          },
          {
            owner_id: user.id,
            profile_id: profileId,
          }
        );
      }

      let fieldsArr = postData.fields;
      delete fieldsArr["name"];
      delete fieldsArr["description"];
      await models.Field.destroy({
        where: {
          profile_id: profileId,
        },
      });
      await models.Field.bulkCreate(
        Object.entries(fieldsArr).map(([key, value]) =>
          createRecord(profile, key, value)
        ),
        { transaction, include: [{ model: models.FieldValue, as: "values" }] }
      );

      res.send({
        message: "Account created successfully!",
        email: user.email,
      });
    });
  } catch (err) {
    console.error("Error: ", err);
    // console.dir(err.message);
    res.status(400).send({
      message: err,
    });
  }
};
exports.verify = async (req, res) => {
  let { hash } = req.params;
  try {
    let ver = await models.Verification.findOne({
      where: { hash: hash, action: "SIGNUP" },
      include: "user",
    });

    if (!ver) {
      return res.status(404).send({
        message: "Verification token not found!",
      });
    }
    let user = ver.user;

    user.isVerified = true;
    user.save();
    ver.destroy();
    console.log("Verified successfully");
    res.send({
      status: 0,
      message: "Successfully verified user!",
    });
  } catch (error) {
    console.log("Error: ", error);
    res.send({
      status: -1,
      message: error,
    });
  }
};

exports.checkUniqueEmail = async (req, res) => {
  try {
    let email = req.body.email;
    let user = await models.User.findOne({
      where: {
        email: email,
      },
    });

    res.send({
      isUnique: !user,
      message: "Email uniqueness checked successfully!",
    });
  } catch (error) {
    res.send({
      isUnique: false,
      message: `Email uniqueness checked with error! ${error}`,
    });
  }
};

exports.forgotPassword = async (req, res) => {
  console.log("Forgot password");
  try {
    let email = req.body.email;
    let user = await models.User.findOne({
      where: {
        email: email,
      },
    });
    if (user) {
      const origin = req.headers.origin;
      sendForgotPassword(user, origin);
      res.send({
        message:
          "Forgot password email sent successfully. Check your inbox to complete password reset",
      });
    } else {
      res.status(400).send({
        message: `Forgot password processing failed, check that you entered registered email`,
      });
    }
  } catch (error) {
    console.error("Error: ", error);
    res.status(400).send({
      message: `Forgot password processing failed, check that you entered registered email`,
    });
  }
};

exports.resetPassword = async (req, res) => {
  console.log("Reset password");
  let { hash } = req.params;
  let { password } = req.body;
  console.log(hash, password);
  try {
    let ver = await models.Verification.findOne({
      where: { hash: hash, action: "FORGOTPASSWORD" },
      include: "user",
    });

    if (!ver) {
      return res.status(404).send({
        message: "Verification token not found!",
      });
    }
    let user = ver.user;

    user.isVerified = true;
    user.password = passwordHash(password);
    user.save();
    ver.destroy();
    console.log("Password reset successfully");
    res.send({
      status: 0,
      message: "Successfully reset password!",
    });
  } catch (error) {
    console.log("Error: ", error);
    res.status(400).send({
      status: -1,
      message: error,
    });
  }
};

exports.getStatistics = async (req, res) => {
  try {
    const [results, metadata] = await sequelize.query(
      "select r.name, count(*) as count from profiles p left join roles r on p.role_id=r.id group by r.name;"
    );
    res.send({
      status: 0,
      message: "Successfully fetched statistics!",
      data: results,
    });
  } catch (error) {
    console.log("Error: ", error);
    res.status(400).send({
      status: -1,
      message: error,
    });
  }
};
