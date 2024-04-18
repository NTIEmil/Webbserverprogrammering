const nodemailer = require("nodemailer");

const dotenv = require("dotenv");

dotenv.config({ path: "./.env" });

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  secure: false,
  auth: {
    user: process.env.EMAIL_ADRESS,
    pass: process.env.EMAIL_PASSWORD,
  },
});

async function sendEmail(email, subject, html) {
  new Promise((resolve, reject) => {
    let mailOptions = {
      from: process.env.EMAIL_ADRESS,
      to: email,
      subject: subject,
      html: html,
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
