const nodeMailer = require("nodemailer");

const sendEmail = async (options) => {
  try {
    // Configure Nodemailer
    const transporter = nodeMailer.createTransport({
      service: 'Gmail',
      auth: {
        user: 'do-not-reply@adiance.com',
        pass: 'typegzmmudbzihvp',
      },
    });
    // user: 'activation@ambicam.com',
    // pass: 'paltwgecemunjpkn',
    const mailOptions = {
      from: process.env.SMPT_MAIL,
      to: options.email,
      subject: options.subject,
      html: options.message,
    };


    await transporter.sendMail(mailOptions);

    // Email sent successfully
    return true;
  } catch (error) {
    // Error occurred while sending email
    throw new Error(error.message);
  }
};

module.exports = sendEmail;

