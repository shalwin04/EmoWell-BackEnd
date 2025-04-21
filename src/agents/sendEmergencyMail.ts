import nodemailer from "nodemailer";
import dotenv from "dotenv";

dotenv.config();

interface MailOptions {
  to: string;
  subject: string;
  text: string;
}

/**
 * Sends an email to the specified recipient.
 * @param {MailOptions} options - The email details including recipient, subject, and message text.
 * @returns {Promise<void>} A promise that resolves when the email is sent.
 */
export async function sendMail(options: MailOptions): Promise<void> {
  try {
    const transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 465,
      secure: true,
      auth: {
        user: process.env.EMAIL_SENDER,
        pass: process.env.EMAIL_PASSWORD,
      },
    });

    const mailOptions = {
      from: process.env.EMAIL_SENDER,
      to: options.to,
      subject: options.subject,
      text: options.text,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log("✅ Email sent successfully:", info.response);
  } catch (error) {
    console.error("❌ Failed to send email:", error);
    throw error;
  }
}
