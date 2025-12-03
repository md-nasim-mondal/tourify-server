import nodemailer from "nodemailer";
import { config } from "../../config";

const emailSender = async (email: string, html: string) => {
  const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 465,
    secure: true, // Use `true` for port 465, `false` for all other ports (like 587)
    auth: {
      user: config.emailSender.EMAIL,
      pass: config.emailSender.APP_PASS, // app password
    },
    tls: {
      rejectUnauthorized: false,
    },
  });

  await transporter.sendMail({
    from: '"Tourify Support" <support@tourify.com>', // sender address
    to: email, // list of receivers
    subject: "Tourify - Account Security & Verification", // Subject line
    //text: "Hello world?", // plain text body
    html, // html body
  });
};

export default emailSender;
