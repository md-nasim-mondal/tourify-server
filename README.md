# Tourify Server - Express.js Backend

Production-ready Node.js/Express backend for the Tourify platform. Provides RESTful APIs for tour management, bookings, payments, and user management.

**Live API**: [Your Render/Railway URL]  
**API Documentation**: See below

---

## 🎯 Core Features

✅ **User Authentication & Authorization**

- Secure registration and login (Tourist/Guide/Admin)
- JWT-based authentication
- Email verification before login
- Password reset via email
- Role-based access control

✅ **User Profile Management (CRUD)**

- Create, read, update, delete profiles
- Role-specific fields (expertise, languages, daily rates)
- Profile picture uploads via Cloudinary
- Bio and contact information

✅ **Tour Listing Management (CRUD)**

- Guides can create/edit/delete tour listings
- Rich descriptions and itineraries
- Image upload support (multiple photos)
- Pricing and availability settings
- Meeting point and group size configuration

✅ **Search & Filtering System**

- Filter by destination/city
- Filter by category (Food, History, Adventure, Art, Nightlife, Shopping)
- Filter by language, price range
- Pagination support
- Sort by date, rating, price

✅ **Booking System**

- Request-based booking flow
- Date/time selection
- Real-time booking status updates (Pending, Confirmed, Completed, Cancelled)
- Booking history tracking

✅ **Review & Rating System**

- Post-tour reviews and ratings (1-5 stars)
- Photo reviews support
- Guide rating calculations
- Helpful review sorting

✅ **Payment Integration**

- Stripe integration (credit/debit cards)
- SSLCommerz integration (local payments)
- Secure payment processing
- Webhook verification
- Payment history tracking

✅ **Admin Management APIs**

- User management (view, edit, deactivate)
- Listing moderation and oversight
- Booking management
- Payment analytics and tracking
- Platform statistics

✅ **Global Error Handling**

- Centralized error handling middleware
- Graceful error responses
- Request logging for debugging
- No stack traces in production

---

## 🛠️ Technology Stack

- **Backend Framework:** Node.js, Express.js 5
- **Database:** PostgreSQL with Prisma ORM
- **Authentication:** JWT (jsonwebtoken)
- **Password Hashing:** bcryptjs
- **Validation:** Zod
- **Email:** Nodemailer
- **File Storage:** Cloudinary
- **Payments:** Stripe, SSLCommerz
- **Rate Limiting:** express-rate-limit
- **CORS:** Enabled
- **Environment:** dotenv
- **Security:** `bcryptjs` for password hashing, `cors`, `express-rate-limit`
- **Cloud Storage:** Cloudinary for image uploads
- **Email Service:** Nodemailer for email verification and password resets
- **Payment Gateway:** Stripe, SSLCommerz (placeholder)
- **Others:** Any other required npm packages will be listed in `package.json`.

---

## Setup & Usage

### Prerequisites

- Node.js (v18 or later)
- PostgreSQL
- npm or yarn

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
DIRECT_URL="postgresql://user:password@localhost:5432/tourify_db?schema=public" # Required for Supabase/Prisma migrations

# Cloudinary (for image uploads)
CLOUDINARY_CLOUD_NAME=<Your Cloudinary Cloud Name>
CLOUDINARY_API_KEY=<Your Cloudinary API Key>
CLOUDINARY_API_SECRET=<Your Cloudinary API Secret>

# AI Suggestion (e.g., OpenRouter, if used)
OPEN_ROUTER_API_KEY=<Your OpenAI or OpenRouter API Key>

# Stripe Payment Gateway
STRIPE_SECRET_KEY=<Your Stripe Secret Key>
STRIPE_WEBHOOK_SECRET=<Your Stripe Webhook Secret>

# URLs
CLIENT_URL=<Your Frontend URL, e.g., http://localhost:3000 or https://tourify-client.vercel.app>
SERVER_URL=<Your Backend URL, e.g., http://localhost:5000 or https://tourify-server.onrender.com>

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

## 🚀 Deployment Guide (Render + Supabase)

### 1. Database Setup (Supabase)
1.  Create a project on Supabase.
2.  Go to **Project Settings** -> **Database** -> **Connection String** -> **Poolers**.
3.  Copy the **Transaction URL** (Port 6543) -> Use this as `DATABASE_URL`.
4.  Copy the **Session URL** (Port 5432) -> Use this as `DIRECT_URL`.

### 2. Backend Setup (Render)
1.  Create a **Web Service** on Render connected to your repo.
2.  **Build Command:** `bash render-build.sh`
3.  **Start Command:** `npm run start`
4.  **Environment Variables:** Add all variables from `.env.example`.
    *   **CRITICAL:** Set `SERVER_URL` to your Render service URL (e.g., `https://tourify-server.onrender.com`).
    *   Set `NODE_ENV` to `production`.

### 3. Self-Ping Mechanism
This server includes a self-ping mechanism to prevent Render from sleeping and to keep the Supabase connection active.
*   It pings `${SERVER_URL}/api/v1/listings?limit=1` every 9 minutes.
*   Ensure `SERVER_URL` is set correctly in Render environment variables.

---

## API Endpoints

(Add details about your API endpoints here, e.g., `/api/v1/auth/login`, `/api/v1/users`, `/api/v1/listings`, etc.)

---

## Video Explanation

[Your Video Explanation Link]
