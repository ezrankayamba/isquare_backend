const jwt = require("jsonwebtoken");

const verifyToken = (req, res, next) => {
  try {
    const excludes = (process.env.JWT_EXCLUDE_ROUTES || "")
      .split(",")
      .map((i) => i.trim());
    let token = req.cookies[process.env.JWT_AUTH_HEADER];
    if (!token) {
      let found = excludes.find((ex) => req.path.startsWith(ex));
      // console.log("Excl: ", found, req.path, excludes);
      if (found && found.length > 0) {
        next();
      } else {
        return res.status(403).send({
          result: -1,
          message: "No token provided!",
        });
      }
    } else {
      token = token.split(" ")[1]; //remove Bearer
      jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
        if (err) {
          let found = excludes.find((ex) => req.path.startsWith(ex));
          if (found && found.length > 0) {
            next();
          } else {
            return res.status(401).send({
              result: -1,
              message: "Unauthorized!",
            });
          }
        } else {
          req.userUuid = decoded.uuid;
          next();
        }
      });
    }
  } catch (error) {
    console.error("Error happened!", error);
    res.send(500).json({ message: error.message });
  }
};

module.exports = {
  verifyToken,
};
