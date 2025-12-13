import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.join(process.cwd(), ".env") });

interface EnvConfig {
  NODE_ENV: "development" | "production";
  PORT: string;
  DATABASE_URL: string;
  CLIENT_URL: string;
  OPEN_ROUTER_API_KEY: string;
  STRIPE_SECRET_KEY: string;
  STRIPE_WEBHOOK_SECRET: string;
  RESET_PASS_LINK: string;
  bcrypt: {
    SALT_ROUND: string;
  };
  jwt: {
    JWT_SECRET: string;
    ACCESS_TOKEN_EXPIRES_IN: string;
    REFRESH_TOKEN_SECRET: string;
    REFRESH_TOKEN_EXPIRES_IN: string;
    RESET_PASS_SECRET: string;
    RESET_PASS_TOKEN_EXPIRES_IN: string;
  };
  cloudinary: {
    CLOUDINARY_CLOUD_NAME: string;
    CLOUDINARY_API_KEY: string;
    CLOUDINARY_API_SECRET: string;
  };
  emailSender: {
    EMAIL: string;
    APP_PASS: string;
  };
  ssl: {
    STORE_ID: string;
    STORE_PASS: string;
    SSL_PAYMENT_API: string;
    SSL_VALIDATION_API: string;
    SUCCESS_URL: string;
    CANCEL_URL: string;
    FAIL_URL: string;
  };
  admin: {
    ADMIN_EMAIL: string;
    ADMIN_PASSWORD: string;
  }
}

const loadEnvVariables = (): EnvConfig => {
  const requiredEnvVariables: string[] = [
    "NODE_ENV",
    "DATABASE_URL",
    "CLIENT_URL",
    "OPEN_ROUTER_API_KEY",
    "STRIPE_SECRET_KEY",
    "STRIPE_WEBHOOK_SECRET",
    "RESET_PASS_LINK",
    "SALT_ROUND",
    "JWT_SECRET",
    "ACCESS_TOKEN_EXPIRES_IN",
    "REFRESH_TOKEN_SECRET",
    "REFRESH_TOKEN_EXPIRES_IN",
    "RESET_PASS_SECRET",
    "RESET_PASS_TOKEN_EXPIRES_IN",
    "CLOUDINARY_CLOUD_NAME",
    "CLOUDINARY_API_KEY",
    "CLOUDINARY_API_SECRET",
    "EMAIL_SENDER_EMAIL",
    "EMAIL_SENDER_APP_PASS",
    "STORE_ID",
    "STORE_PASS",
    "SSL_PAYMENT_API",
    "SSL_VALIDATION_API",
    "SUCCESS_URL",
    "CANCEL_URL",
    "FAIL_URL",
    "ADMIN_EMAIL",
    "ADMIN_PASSWORD"
  ];

  requiredEnvVariables.forEach((key) => {
    if (!process.env[key]) {
      throw new Error(`Missing required environment variable: ${key}`);
    }
  });

  return {
    NODE_ENV: process.env.NODE_ENV as "development" | "production",
    PORT: process.env.PORT as string,
    DATABASE_URL: process.env.DATABASE_URL as string,
    CLIENT_URL: process.env.CLIENT_URL as string,
    OPEN_ROUTER_API_KEY: process.env.OPEN_ROUTER_API_KEY as string,
    STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY as string,
    STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET as string,
    RESET_PASS_LINK: process.env.RESET_PASS_LINK as string,
    bcrypt: {
      SALT_ROUND: process.env.SALT_ROUND as string,
    },
    jwt: {
      JWT_SECRET: process.env.JWT_SECRET as string,
      ACCESS_TOKEN_EXPIRES_IN: process.env.ACCESS_TOKEN_EXPIRES_IN as string,
      REFRESH_TOKEN_SECRET: process.env.REFRESH_TOKEN_SECRET as string,
      REFRESH_TOKEN_EXPIRES_IN: process.env.REFRESH_TOKEN_EXPIRES_IN as string,
      RESET_PASS_SECRET: process.env.RESET_PASS_SECRET as string,
      RESET_PASS_TOKEN_EXPIRES_IN: process.env
        .RESET_PASS_TOKEN_EXPIRES_IN as string,
    },
    cloudinary: {
      CLOUDINARY_CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME as string,
      CLOUDINARY_API_KEY: process.env.CLOUDINARY_API_KEY as string,
      CLOUDINARY_API_SECRET: process.env.CLOUDINARY_API_SECRET as string,
    },
    emailSender: {
      EMAIL: process.env.EMAIL_SENDER_EMAIL as string,
      APP_PASS: process.env.EMAIL_SENDER_APP_PASS as string,
    },
    ssl: {
      STORE_ID: process.env.STORE_ID as string,
      STORE_PASS: process.env.STORE_PASS as string,
      SSL_PAYMENT_API: process.env.SSL_PAYMENT_API as string,
      SSL_VALIDATION_API: process.env.SSL_VALIDATION_API as string,
      SUCCESS_URL: process.env.SUCCESS_URL as string,
      CANCEL_URL: process.env.CANCEL_URL as string,
      FAIL_URL: process.env.FAIL_URL as string,
    },
    admin:{
      ADMIN_EMAIL: process.env.ADMIN_EMAIL as string,
      ADMIN_PASSWORD: process.env.ADMIN_PASSWORD as string,
    }
  };
};

const envVars = loadEnvVariables();
export default envVars;
