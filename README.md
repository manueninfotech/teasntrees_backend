# Teas N Trees - Backend API

A Node.js backend for Teas N Trees food delivery application with OTP-based authentication and comprehensive menu management.

## What I Have Built

### Authentication System (OTP-Based Login)
- **Mobile-based login** - Users log in using their mobile number (no passwords)
- **OTP verification** - 6-digit OTP sent for verification
- **JWT tokens** - Secure authentication using JSON Web Tokens
- **Role-based access** - Support for Admin, Customer, Rider, and Manager roles
- **Profile completion** - After OTP verification, users can complete their profile

### Database Models

1. **User Model** - Stores user information
   - Name, email, mobile number, address
   - Role (admin/customer/rider/manager)
   - Profile completion status

2. **OTP Model** - Handles OTP verification
   - Stores temporary OTP codes
   - Auto-expires after 10 minutes
   - Prevents brute force attacks
   - **Why separate?** New users don't exist during registration, so we can't store OTP in User model before account creation

3. **Category Model** - Menu categories (33 categories)
   - Soups, Salads, Coffee, Tea, Shakes, Pizza, Pasta, etc.
   - Display order and icons

4. **Product Model** - Menu items (239 products)
   - Name, description, price
   - Category reference
   - Tags: new-intro, must-try, best-seller, egg-contains
   - Size options (for pizzas, shakes, burgers, sandwiches)
   - Availability status

5. **Order Model** - Customer orders
   - Items, quantities, prices
   - Order status tracking
   - Delivery address
   - Auto-generated order numbers

6. **Delivery Model** - Delivery tracking
   - Assigned rider
   - GPS location tracking
   - Delivery status
   - Earnings calculation

7. **Settings Model** - App configuration
   - Delivery charges
   - Maximum delivery distance
   - Tax rates

### API Endpoints

#### Authentication APIs
- `POST /api/auth/send-otp` - Send OTP to mobile number
- `POST /api/auth/verify-otp` - Verify OTP and login/register
- `POST /api/auth/complete-profile` - Complete user profile after OTP verification

#### User APIs
- `GET /api/user/profile` - Get logged-in user profile
- `PUT /api/user/profile` - Update user profile

### Database Seeders
- **Category Seeder** - Seeds 33 menu categories
- **Product Seeder** - Seeds 239 menu items with:
  - Accurate prices from actual menu
  - Proper categorization
  - Symbol tags (new-intro, must-try, best-seller, egg-contains)
  - Size options for items like pizzas, shakes, burgers

### Security Features
- **JWT Authentication** - Secure token-based auth
- **Role-based Access Control** - Different permissions for different roles
- **OTP Expiration** - OTPs auto-expire after 10 minutes
- **Password-less** - No password storage, more secure

---

## Project Structure

```
backend/
├── src/
│   ├── models/              # Database models
│   │   ├── User.js
│   │   ├── OTP.js
│   │   ├── Category.js
│   │   ├── Product.js
│   │   ├── Order.js
│   │   ├── Delivery.js
│   │   └── Settings.js
│   ├── controllers/         # Business logic
│   │   ├── authController.js
│   │   └── userController.js
│   ├── routes/              # API routes
│   │   ├── authRoutes.js
│   │   └── userRoutes.js
│   ├── middlewares/         # Custom middleware
│   │   ├── auth.js          # JWT verification
│   │   ├── roleCheck.js     # Role-based access
│   │   └── errorHandler.js  # Error handling
│   ├── utils/               # Helper functions
│   │   ├── jwtHelper.js     # JWT functions
│   │   ├── generateOTP.js   # OTP generation
│   │   └── validators.js    # Input validation
│   ├── config/              # Configuration
│   │   ├── db.js            # MongoDB connection
│   │   ├── jwt.js           # JWT config
│   │   └── otp.js           # OTP config
│   ├── seeders/             # Database seeders
│   │   ├── categorySeeder.js
│   │   ├── productSeeder.js
│   │   └── clearProducts.js
│   └── server.js            # Main server file
├── .env                     # Environment variables
└── package.json             # Dependencies
```

---

## Technologies Used

- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **MongoDB** - Database
- **Mongoose** - MongoDB ODM
- **JWT** - Authentication tokens
- **ES6 Modules** - Modern JavaScript syntax

---

## Setup Instructions

### 1. Install Dependencies
```bash
cd backend
npm install
```

### 2. Environment Variables
Create `.env` file in `backend` folder:
```env
PORT=5000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_secret_key
JWT_EXPIRE=30d
OTP_LENGTH=5
OTP_EXPIRE_MINUTES=5
```

### 3. Seed Database
```bash
# Seed categories (33 categories)
npm run seed:categories

# Seed products (239 menu items)
npm run seed:products
```

### 4. Run Server
```bash
# Development mode
npm run dev

# Production mode
npm start
```

Server will run on `http://localhost:5000`

---

## API Usage Examples

### Send OTP
```bash
POST /api/auth/send-otp
Content-Type: application/json

{
  "mobile": "9876543210"
}
```

### Verify OTP
```bash
POST /api/auth/verify-otp
Content-Type: application/json

{
  "mobile": "9876543210",
  "otp": "123456"
}
```

### Get User Profile (Protected Route)
```bash
GET /api/user/profile
Authorization: Bearer <your_jwt_token>
```

---

## Authentication Flow

1. User enters mobile number
2. Backend generates 6-digit OTP and stores in OTP model
3. OTP sent to user (console log for now, SMS integration pending)
4. User enters OTP
5. Backend verifies OTP from OTP model
6. If valid:
   - New user: Creates account and returns JWT token
   - Existing user: Returns JWT token
7. User can access protected routes with JWT token

---

## Database Summary

- **239 Products** across 33 categories
- **7 Database Models** for complete functionality
- **Auto-expiring OTPs** using MongoDB TTL indexes
- **Role-based users** (Admin, Customer, Rider, Manager)


### ES6 Modules
The project uses ES6 modules (`import/export`) instead of CommonJS (`require/module.exports`) for modern JavaScript practices.

---

## 📧 Contact

For any questions or issues, contact the development team.
