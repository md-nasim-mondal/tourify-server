# Local Guide Platform (Server)

Welcome to the server-side of the Local Guide Platform, the backend powering a platform designed to connect travelers with passionate local guides for authentic, personalized experiences.

**GitHub Server Repo:** [Your GitHub Server Repo Link]
**Live Deployment:** [Your Server Live Deployment Link]

---

## Features

-   **User Authentication & Authorization:** Secure registration and login for Tourists, Guides, and Admins using JWT. Implements role-based access control.
-   **User Profile Management (CRUD):** Allows users to create, read, update, and delete their profile information, including role-specific fields (e.g., Guide's expertise, Tourist's travel preferences).
-   **Tour Listing Management (CRUD):** Guides can create, read, update, and delete their tour listings, including details like title, description, location, price, duration, group size, category, languages, meeting point, and images.
-   **Search & Filtering System:** Robust API endpoints for searching and filtering tour listings by various criteria (e.g., search term, price range, category, language).
-   **Booking System:** Manages the entire booking workflow, from a tourist requesting a date/time to a guide accepting or declining, and updating booking statuses.
-   **Review & Rating System:** Allows tourists to submit reviews and ratings for completed tours, which are then associated with the respective listings and guides.
-   **Payment Integration:** Supports secure payment processing for tour bookings, with integration for Stripe and a placeholder for SSLCommerz.
-   **Admin Management APIs:** Endpoints for administrators to manage users (roles, status), listings, and bookings across the platform.
-   **Global Error Handling:** Robust middleware to gracefully catch backend errors and communicate to the frontend.
-   **Not Found Middleware:** Handles requests to undefined routes.

---

## Technology Stack

-   **Backend Framework:** Node.js, Express.js
-   **Database:** PostgreSQL
-   **ORM:** Prisma ORM
-   **Authentication:** JWT (JSON Web Tokens)
-   **Security:** `bcryptjs` for password hashing, `cors`, `express-rate-limit`
-   **Cloud Storage:** Cloudinary for image uploads
-   **Email Service:** Nodemailer for email verification and password resets
-   **Payment Gateway:** Stripe, SSLCommerz (placeholder)
-   **Others:** Any other required npm packages will be listed in `package.json`.

---

## Setup & Usage

### Prerequisites

-   Node.js (v18 or later)
-   PostgreSQL
-   npm or yarn

### 1. Clone the Repository

```bash
git clone <repository-url>
cd tourify-server
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Set Up Environment Variables

Create a `.env` file in the root of the `tourify-server` directory and add the following variables. Replace placeholders with your actual values.

```env
# Node Environment and Port
NODE_ENV=development
PORT=5000

# Database
DATABASE_URL="postgresql://user:password@localhost:5432/tourify_db?schema=public"

# Cloudinary (for image uploads)
CLOUDINARY_CLOUD_NAME=<Your Cloudinary Cloud Name>
CLOUDINARY_API_KEY=<Your Cloudinary API Key>
CLOUDINARY_API_SECRET=<Your Cloudinary API Secret>

# AI Suggestion (e.g., OpenRouter, if used)
OPEN_ROUTER_API_KEY=<Your OpenAI or OpenRouter API Key>

# Stripe Payment Gateway
STRIPE_SECRET_KEY=<Your Stripe Secret Key>
STRIPE_WEBHOOK_SECRET=<Your Stripe Webhook Secret>

# Client URL (for redirects)
CLIENT_URL=<Your Frontend URL, e.g., http://localhost:3000>

# Nodemailer for email sending
EMAIL_SENDER_EMAIL=<Your Email Address>
EMAIL_SENDER_APP_PASS=<Your Email App Password>
SMTP_HOST=smtp.gmail.com # or your SMTP host
SMTP_PORT=465 # or your SMTP port
SMTP_USER=<Your Email Address>
SMTP_PASS=<Your Email App Password>
SMTP_FROM=<Your Email Address>

# JWT Secrets and Expiration
JWT_SECRET=<Your JWT Secret Key>
ACCESS_TOKEN_EXPIRES_IN="1h"
REFRESH_TOKEN_SECRET=<Your Refresh Token Secret Key>
REFRESH_TOKEN_EXPIRES_IN="90d"
RESET_PASS_SECRET=<Your Reset Password Secret Key>
RESET_PASS_TOKEN_EXPIRES_IN="5m"

# Reset password frontend link
RESET_PASS_LINK=<Your Frontend Reset Password Link, e.g., http://localhost:3000/reset-password>

# Bcrypt Salt Rounds
SALT_ROUND=12

# Admin Credentials for Seeding
ADMIN_EMAIL="admin@tourify.com"
ADMIN_PASSWORD="super.secret.password"

# SSLCommerz (if used)
STORE_ID="<Your SSLCommerz Store ID>"
STORE_PASS="<Your SSLCommerz Store Password>"
SSL_PAYMENT_API="https://sandbox.sslcommerz.com/gwprocess/v3/api.php" # Or production URL
SSL_VALIDATION_API="https://sandbox.sslcommerz.com/validator/api/validationserverAPI.php"
IPN_URL="http://localhost:5000/api/v1/payment/validate-payment" # Your server's IPN endpoint

SUCCESS_URL="http://localhost:3000/payment/success"
FAIL_URL="http://localhost:3000/payment/fail"
CANCEL_URL="http://localhost:3000/payment/cancel"
```

### 4. Run Prisma Migrations

Ensure your PostgreSQL database is running and accessible.

```bash
npx prisma migrate dev --name init
```
(If you already have migrations, adjust the command or use `npx prisma migrate deploy` in production.)

### 5. Seed the Database (Optional but Recommended)

To create an initial admin user:

```bash
npm run seed
```

### 6. Run the Development Server

```bash
npm run dev
```

The server will be running at [http://localhost:5000](http://localhost:5000).

---

## API Endpoints

(Add details about your API endpoints here, e.g., `/api/v1/auth/login`, `/api/v1/users`, `/api/v1/listings`, etc.)

---

## Video Explanation

[Your Video Explanation Link]

