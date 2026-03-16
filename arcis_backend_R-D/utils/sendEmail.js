const nodemailer = require("nodemailer");
const axios = require("axios");
const mime = require("mime-types");
require('dotenv').config({ path: './config/config.env' });

const sendMailattachment = async (mailOptionsExtended) => { // Modified to accept object with analyticsImage and recipientEmail
    try {
        const { analyticsImage, recipientEmail } = mailOptionsExtended;

        if (!analyticsImage) {
            console.log("No analytics image to send in email.");
            return;
        }

        let emailBody = `Hello,

We wanted to inform you about an important analytics update.

**Details:**\n`;


        const attachments = [];


        emailBody += `- **Camera ID**: ${analyticsImage.cameradid}\n`;
        emailBody += `- **Message**: ${analyticsImage.msg}\n`;
        emailBody += `- **Time**: ${analyticsImage.sendtime}\n\n`;

        if (analyticsImage.imgurl) {
            try {
                const response = await axios.get(analyticsImage.imgurl, { responseType: 'arraybuffer' });
                const filename = analyticsImage.imgurl.split('/').pop();
                const contentType = mime.lookup(filename) || "application/octet-stream";
                attachments.push({
                    filename: `${analyticsImage.cameradid}_${analyticsImage.an_id}_${filename}`, // Unique filename
                    content: Buffer.from(response.data, "binary"),
                    contentType: contentType,
                });
            } catch (imageError) {
                console.error(`Failed to download image for camera ${analyticsImage.cameradid}:`, imageError.message);
                emailBody += `- **Image Download Failed**: ${analyticsImage.imgurl} (Error: ${imageError.message})\n\n`;
                // Continue processing other notifications even if one image fails
            }
        }


        emailBody += `
This update is crucial for your ongoing analytics. Please review it at your earliest convenience.

Best regards,
The AI Team`;


        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS,
            },
        });

        const mailOptions = {
            from: process.env.SMPT_MAIL,
            to: recipientEmail || process.env.EMAIL_TO, // Fallback to EMAIL_TO if recipientEmail not provided
            subject: `Analytics Information Update: ${analyticsImage.msg}`, // Subject now includes message type
            text: emailBody,
            attachments: attachments.length > 0 ? attachments : undefined, // Attachments only if available
        };


        await transporter.sendMail(mailOptions);
        console.log(`Email sent successfully with ${attachments.length} attachments!`);
    } catch (error) {
        console.error("Error sending email with attachments:", error.message);
        throw error;
    }
};


const sendEmail = async (options) => { // No changes needed here as per requirement
    try {
        // Configure Nodemailer
        const transporter = nodemailer.createTransport({ // <---- CORRECTED: nodemailer (lowercase 'n')
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

// Export the function so it can be used in other files
module.exports = { sendMailattachment, sendEmail };