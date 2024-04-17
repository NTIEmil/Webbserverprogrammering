const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  service: process.env.EMAIL_SERVICE,
  auth: {
    user: process.env.EMAIL_ADRESS,
    pass: process.env.EMAIL_PASSWORD,
  },
});

async function sendEmail(email, subject, text) {
  console.log("object");
  new Promise((resolve, reject) => {
    let mailOptions = {
      from: process.env.EMAIL_ADRESS,
      to: email,
      subject: subject,
      text: text,
    };

    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.log(error);
        reject(error);
      } else {
        console.log("Email sent: " + info.response);
        resolve("User created");
      }
    });
  });
}

module.exports = { sendEmail };
