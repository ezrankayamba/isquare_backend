var nodemailer = require("nodemailer");

var transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: "nezatech.notification@gmail.com",
    pass: "ytonvctpajqubtqg",
  },
});

module.exports = {
  sendEmail: async (to, subject, text) => {
    var mailOptions = {
      from: "nezatech.notification@gmail.com",
      to,
      subject,
      html: text,
    };
    transporter.sendMail(mailOptions, function (error, info) {
      if (error) {
        console.log(error);
      } else {
        console.log("Email: " + text);
        console.log("Email sent: " + info.response);
      }
    });
  },
};
