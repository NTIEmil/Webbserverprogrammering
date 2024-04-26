const nodemailer = require("nodemailer");

const dotenv = require("dotenv");

// Loads the environment variables
// The environment variables are stored in a .env not saved
// in the repository for security reasons
dotenv.config({path: "../../circleSurvivalSQLDotEnv/.env"});

// Creates the transporter
const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  secure: false,
  auth: {
    user: process.env.EMAIL_ADRESS,
    pass: process.env.EMAIL_PASSWORD,
  },
});

// Sends an email
// This is used by database.ts to send emails to users
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
        reject(error);
      } else {
        resolve("Email sent");
      }
    });
  });
}

// Exports the sendEmail function
module.exports = { sendEmail };
