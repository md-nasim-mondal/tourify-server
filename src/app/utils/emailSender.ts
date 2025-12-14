// import nodemailer from "nodemailer";
// import envVars from "../../config/env";

// const emailSender = async (email: string, html: string) => {
//   const useSmtp =
//     !!envVars.smtp?.HOST && !!envVars.smtp?.USER && !!envVars.smtp?.PASS;

//   const host = useSmtp ? (envVars.smtp?.HOST as string) : "smtp.gmail.com";
//   const port = useSmtp ? Number(envVars.smtp?.PORT || 465) : 465;
//   const secure = useSmtp
//     ? envVars.smtp?.SECURE
//       ? envVars.smtp?.SECURE === "true"
//       : port === 465
//     : true;
//   const user = useSmtp
//     ? (envVars.smtp?.USER as string)
//     : envVars.emailSender.EMAIL;
//   const pass = useSmtp
//     ? (envVars.smtp?.PASS as string)
//     : envVars.emailSender.APP_PASS;

//   const transporter = nodemailer.createTransport({
//     host,
//     port,
//     secure,
//     requireTLS: !secure,
//     auth: {
//       user,
//       pass,
//     },
//     pool: true,
//     maxConnections: 1,
//     connectionTimeout: 30000,
//     greetingTimeout: 30000,
//     socketTimeout: 30000,
//   });

//   let attempt = 0;
//   let lastError: unknown;
//   while (attempt < 3) {
//     try {
//       await transporter.sendMail({
//         from: (envVars.smtp?.FROM as string) || user,
//         to: email,
//         subject: "Tourify - Account Security & Verification",
//         html,
//       });
//       return;
//     } catch (err) {
//       lastError = err;
//       attempt += 1;
//       const delay = 1000 * Math.pow(2, attempt - 1);
//       await new Promise((res) => setTimeout(res, delay));
//     }
//   }
//   throw lastError;
// };

// export default emailSender;

// import { Resend } from "resend";
// import envVars from "@/config/env";

// const resend = new Resend(envVars.RESEND_API_KEY);

// export const emailSender = async (email: string, html: string) => {
//   try {
//     const result = await resend.emails.send({
//       from: "Tourify <onboarding@resend.dev>",
//       to: email,
//       subject: "Tourify - Account Security & Verification",
//       html,
//     });

//     return result;
//   } catch (error) {
//     console.error("Resend email send error:", error);
//     throw error;
//   }
// };


import axios from "axios";
import envVars from "../../config/env";

const emailSender = async (email: string, html: string) => {
  try {
    console.log("Brevo Config Check:", {
      emailFrom: envVars.brevo.FROM,
      apiKeyLoaded: !!envVars.brevo.API_KEY,
      apiKeyStart: envVars.brevo.API_KEY ? envVars.brevo.API_KEY.substring(0, 10) + "..." : "MISSING"
    });

    const response = await axios.post(
      "https://api.brevo.com/v3/smtp/email",
      {
        sender: {
          name: "Tourify Support",
          email: envVars.brevo.FROM,
        },
        to: [
          {
            email: email,
          },
        ],
        subject: "Tourify - Account Security & Verification",
        htmlContent: html,
      },
      {
        headers: {
          "api-key": envVars.brevo.API_KEY,
          "content-type": "application/json",
          accept: "application/json",
        },
      }
    );

    console.log("Email sent successfully via Brevo API. Message ID:", response.data.messageId);
    return true;
  } catch (error: any) {
    console.error("Brevo API Error:", error.response?.data || error.message);
    throw new Error(`Email sending failed: ${JSON.stringify(error.response?.data || error.message)}`);
  }
};

export default emailSender;


