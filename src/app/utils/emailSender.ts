import nodemailer from "nodemailer";
import envVars from "../../config/env";

const emailSender = async (email: string, html: string) => {
  const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 587,
    secure: false, // Use TLS
    auth: {
      user: envVars.emailSender.EMAIL,
      pass: envVars.emailSender.APP_PASS,
    },
    tls: {
      rejectUnauthorized: false,
    },
    // Timeout settings to prevent hanging
    connectionTimeout: 20000, // 20 seconds
    greetingTimeout: 20000,   // 20 seconds
    socketTimeout: 30000,     // 30 seconds
    logger: true,             // Logs to console
    debug: true,              // Logs SMTP traffic
  });

  try {
    const info = await transporter.sendMail({
      from: '"Tourify Support" <support@tourify.com>',
      to: email,
      subject: "Tourify - Account Security & Verification",
      html,
    });
    console.log("Email sent successfully. Message ID:", info.messageId);
  } catch (error) {
    console.error("Email sending failed details:", JSON.stringify(error, null, 2));
    throw error;
  }
};

export default emailSender;


