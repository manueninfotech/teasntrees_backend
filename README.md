# Teas N Trees - Backend API

A complete Node.js backend for Teas N Trees food delivery application with OTP-based authentication, comprehensive menu management, and full admin panel APIs.

## Project Status: **Ongoing**

Complete backend with **42 API endpoints**, 7 database models, admin panel, **input validation**, **pagination**, and **image upload**.

---

## Features Completed

### Authentication System (OTP-Based)
- **Mobile-based login** - Password-less authentication using mobile numbers
- **OTP verification** - 6-digit OTP with auto-expiration (10 minutes)
- **JWT tokens** - Secure session management
- **Role-based access** - Admin, Customer, Rider, Manager roles
- **Profile completion** - Multi-step registration process

### User Management
- User profile CRUD operations
- Role-based authorization
- Profile completion tracking
- Customer, Admin, Rider, Manager support

### Admin Panel APIs (35+ Endpoints)

#### Category Management (5 endpoints)
- View all categories
- View category by ID
- Create new category
- Update category
- Delete category

#### Product Management (8 endpoints)
- View all products with filters
- Search products
- Filter by category, availability, tags
- Create/Update/Delete products
- Toggle product availability
- Bulk update products

#### Order Management (6 endpoints)
- View all orders with filters
- View order details
- Update order status
- Assign delivery rider
- Cancel orders
- Order statistics

#### Delivery Management (6 endpoints)
- View all deliveries
- Track delivery status
- Update rider location (GPS)
- Complete deliveries
- Delivery statistics
- Filter by rider/status

#### User Management (6 endpoints)
- View all users
- Search users
- Update user roles
- Delete users
- Filter by role
- User statistics

#### Settings Management (4 endpoints)
- Get app settings
- Update settings
- Manage delivery zones
- Configure charges & limits

#### Dashboard Analytics (4 endpoints)
- Overall statistics
- Revenue analytics
- Top selling products
- Recent orders report

#### Image Upload (3 endpoints)
- Upload single image to Cloudinary
- Upload multiple images (max 10)
- Delete image from Cloudinary

### Recent Enhancements

#### Input Validation
- **All endpoints validated** - express-validator integration
- **Data type checking** - Ensures correct data formats
- **Clear error messages** - 400 status with detailed validation errors
- **MongoDB ID validation** - Validates all ID parameters
- **Custom validators** - For tags, status enums, and complex fields

#### Pagination Support
- **All list endpoints** - Support page, limit, sort parameters
- **Query parameters:**
  - `page` - Page number (default: 1)
  - `limit` - Items per page (default: 10, max: 100)
  - `sortBy` - Field to sort by (default: createdAt)
  - `order` - Sort order: asc or desc (default: desc)
- **Pagination metadata** - Returns current page, total pages, total items
- **Example:** `GET /api/admin/products?page=2&limit=20&sortBy=name&order=asc`

#### Image Upload with Cloudinary
- **Single upload** - Upload one image at a time
- **Multiple upload** - Upload up to 10 images simultaneously
- **Auto-optimization** - Images optimized for web (max 1000x1000px)
- **Validation** - File type (JPEG, PNG, WEBP) and size (max 5MB)
- **Cloud storage** - All images stored on Cloudinary CDN
- **Product images** - Integrated with product controller for seamless image management

#### Real-Time Features with Socket.io ⚡ **NEW**
- **Instant notifications** - Real-time updates across all roles
- **JWT authentication** - Secure Socket.io connections
- **Room-based messaging** - User-specific, role-based, and order-specific rooms
- **Live tracking** - Real-time rider location updates
- **Event coverage:**
  - **Categories & Products** - Create, update, delete events
  - **Orders** - Status updates, rider assignment, cancellation
  - **Deliveries** - Status changes, live location tracking
  - **Users** - Role updates, account changes
  - **Settings** - Configuration updates, delivery zones
- **Multi-role support** - Separate events for customers, riders, managers, admins
- **Test page included** - `socket-test.html` for testing real-time events

### Recent Updates (January 2026)

#### Admin Authentication Fixes
- Fixed **404 errors** on profile and logout routes
- Corrected user ID handling (`req.user.userId` vs `req.user._id`)
- Deprecated generic `completeProfile` function
- Cleaned up verbose logging middleware
- All admin auth routes now working correctly

#### Cloudinary Product Integration
- **Automatic image upload** on product creation
- **Image replacement** on product update with old image deletion
- **Cloudinary cleanup** on product deletion
- **Backward compatibility** maintained for string URLs
- **Multer middleware** integrated with product routes

---

## Database Models (7 Models)

1. **User** - User accounts and authentication
2. **OTP** - Temporary OTP storage with TTL
3. **Category** - 33 menu categories
4. **Product** - 239 menu items
5. **Order** - Customer orders
6. **Delivery** - Delivery tracking
7. **Settings** - App configuration

---

## Project Structure

```
backend/
├── src/
│   ├── models/                    # Database schemas
│   │   ├── User.js
│   │   ├── OTP.js
│   │   ├── Category.js
│   │   ├── Product.js
│   │   ├── Order.js
│   │   ├── Delivery.js
│   │   └── Settings.js
│   ├── controllers/               # Business logic
│   │   ├── authController.js      # Authentication
│   │   ├── userController.js      # User profiles
│   │   └── admin/                 # Admin controllers
│   │       ├── categoryController.js
│   │       ├── productController.js
│   │       ├── orderController.js
│   │       ├── deliveryController.js
│   │       ├── userManagementController.js
│   │       ├── settingsController.js
│   │       ├── dashboardController.js
│   │       └── uploadController.js    # NEW: Image upload
│   ├── routes/                    # API routes
│   │   ├── authRoutes.js
│   │   ├── userRoutes.js
│   │   └── admin/                 # Admin routes
│   │       ├── index.js           # Main admin router
│   │       ├── categoryRoutes.js
│   │       ├── productRoutes.js
│   │       ├── orderRoutes.js
│   │       ├── deliveryRoutes.js
│   │       ├── userRoutes.js
│   │       ├── settingsRoutes.js
│   │       ├── dashboardRoutes.js
│   │       └── uploadRoutes.js    # NEW: Upload routes
│   ├── middlewares/               # Custom middleware
│   │   ├── auth.js                # JWT verification
│   │   ├── roleCheck.js           # Role authorization
│   │   ├── errorHandler.js        # Error handling
│   │   ├── upload.js              # Multer config
│   │   ├── socketAuth.js          # NEW: Socket.io auth middleware
│   │   └── validators/            # Input validators
│   │       ├── categoryValidator.js
│   │       ├── productValidator.js
│   │       ├── orderValidator.js
│   │       └── userValidator.js
│   ├── sockets/                   # NEW: Socket.io configuration
│   │   ├── socketEvents.js        # Event definitions
│   │   └── socketHandlers.js      # Event handlers
│   ├── services/                  # NEW: Business services
│   │   └── socketService.js       # Socket.io helper service
│   ├── utils/                     # Helper functions
│   │   ├── jwtHelper.js
│   │   ├── generateOTP.js
│   │   ├── validators.js
│   │   └── imageUpload.js         # Cloudinary utils
│   ├── config/                    # Configuration
│   │   ├── db.js                  # MongoDB connection
│   │   ├── jwt.js                 # JWT config
│   │   ├── otp.js                 # OTP config
│   │   └── cloudinary.js          # Cloudinary config
│   ├── seeders/                   # Database seeders
│   │   ├── categorySeeder.js      # 33 categories
│   │   ├── productSeeder.js       # 239 products
│   │   └── clearProducts.js
│   └── server.js                  # Main server with Socket.io
├── test-api.html                  # User API tester
├── test-admin-apis.html           # Admin API tester
├── socket-test.html               # NEW: Socket.io event tester
├── .env                           # Environment variables
└── package.json                   # Dependencies
```

---

## Quick Start

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
JWT_SECRET=your_secret_key_here
JWT_EXPIRE=30d
OTP_LENGTH=6
OTP_EXPIRE_MINUTES=10

# Cloudinary Configuration (for image uploads)
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
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
# Development mode (with nodemon)
npm run dev

# Production mode
npm start
```

Server runs on `http://localhost:5000`

---

## API Testing

### Option 1: HTML Test Pages
Open in browser:
- **User APIs:** `backend/test-api.html`
- **Admin APIs:** `backend/test-admin-apis.html`

### Option 2: Thunder Client / Postman
Import the following base URL: `http://localhost:5000`

---

## API Documentation

### Authentication Endpoints

#### Send OTP
```http
POST /api/auth/send-otp
Content-Type: application/json

{
  "mobile": "9876543210"
}
```

#### Verify OTP
```http
POST /api/auth/verify-otp
Content-Type: application/json

{
  "mobile": "9876543210",
  "otp": "123456"
}

Response:
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": { ... }
}
```

### Admin Endpoints (Protected)

All admin routes require:
- **Authentication:** `Authorization: Bearer <token>`
- **Role:** Admin

#### Get All Categories
```http
GET /api/admin/categories
Authorization: Bearer <your_token>
```

#### Get All Products
```http
GET /api/admin/products
Authorization: Bearer <your_token>

# With filters
GET /api/admin/products?category=<id>&search=pizza&isAvailable=true
```

#### Get Dashboard Stats
```http
GET /api/admin/dashboard/stats
Authorization: Bearer <your_token>
```

#### Update Order Status
```http
PATCH /api/admin/orders/:id/status
Authorization: Bearer <your_token>
Content-Type: application/json

{
  "status": "confirmed"
}
```

#### Upload Single Image
```http
POST /api/admin/upload/image
Authorization: Bearer <your_token>
Content-Type: multipart/form-data

Body (form-data):
- image: [image file]
- folder: "products" (optional, defaults to "teasntrees")

Response:
{
  "success": true,
  "message": "Image uploaded successfully",
  "data": {
    "url": "https://res.cloudinary.com/.../image.jpg",
    "publicId": "teasntrees/abc123",
    "width": 800,
    "height": 600,
    "format": "jpg"
  }
}
```

#### Upload Multiple Images
```http
POST /api/admin/upload/images?folder=products
Authorization: Bearer <your_token>
Content-Type: multipart/form-data

Body (form-data):
- images: [multiple image files, max 10]
```

#### Delete Image
```http
DELETE /api/admin/upload/image
Authorization: Bearer <your_token>
Content-Type: application/json

{
  "publicId": "teasntrees/abc123"
}
// OR
{
  "url": "https://res.cloudinary.com/.../image.jpg"
}
```

#### Pagination Examples
```http
# Get products with pagination
GET /api/admin/products?page=2&limit=20&sortBy=name&order=asc

# Get orders from specific page
GET /api/admin/orders?page=1&limit=50&status=pending

# Sort users by creation date
GET /api/admin/users?page=1&sortBy=createdAt&order=desc
```

---

## Security Features

- **JWT-based authentication** - Secure token-based auth
- **Role-based authorization** - Admin, Customer, Rider, Manager roles
- **Input validation** - express-validator on all endpoints
- **OTP expiration** - 10-minute TTL indexes
- **Protected admin routes** - Authentication + role check
- **Password-less** - No password storage
- **File upload validation** - Type and size restrictions
- **Environment variable protection** - Sensitive data in .env

---

## Database Summary

- **239 Products** across 33 categories
- **All products** include proper categorization, pricing, and tags
- **Menu symbols:** new-intro, must-try, best-seller, egg-contains
- **Size options** for pizzas, shakes, burgers, sandwiches
- **Auto-expiring OTPs** using MongoDB TTL indexes

---

## Technologies

- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **MongoDB** - NoSQL database
- **Mongoose** - MongoDB ODM
- **JWT** - Token-based authentication
- **Socket.io** - Real-time bidirectional communication ⚡
- **express-validator** - Input validation
- **Multer** - File upload handling
- **Cloudinary** - Cloud image storage & CDN
- **ES6 Modules** - Modern JavaScript

---

## Order Status Flow

1. `pending` - Order placed
2. `confirmed` - Order confirmed by admin
3. `preparing` - Kitchen preparing order
4. `ready` - Order ready for pickup
5. `out-for-delivery` - Rider on the way
6. `delivered` - Order delivered
7. `cancelled` - Order cancelled

---

## User Roles

- **Admin** - Full access to all admin APIs
- **Customer** - Place orders, view profile
- **Rider** - View assigned deliveries, update location
- **Manager** - Oversee operations

---

## Authentication Flow

1. User enters mobile number
2. Backend generates 6-digit OTP
3. OTP stored in database with 10-minute expiry
4. OTP sent to user (console log - SMS integration pending)
5. User verifies OTP
6. Backend checks OTP validity
7. **New User:** Creates account → Returns JWT token
8. **Existing User:** Returns JWT token immediately
9. User accesses protected routes with token

---

## Available Scripts

```bash
npm start              # Start production server
npm run dev            # Start development server with nodemon
npm run seed:categories # Seed categories to database
npm run seed:products  # Seed products to database
```

---

## Highlights

- **42 API Endpoints** ready for production
- **Real-Time Features** with Socket.io - instant notifications across all roles ⚡
- **Complete Admin Panel Backend** with full CRUD operations
- **Input Validation** on all mutation endpoints
- **Pagination Support** for efficient data handling
- **Image Upload** with Cloudinary CDN integration
- **Product Image Management** - automated upload/delete on product operations
- **Live Delivery Tracking** - real-time rider location updates
- **239 Menu Items** accurately seeded from actual menu
- **Role-based Access Control** for security
- **JWT Authentication** for both HTTP and WebSocket connections
- **ES6 Modules** for modern code structure
- **Test Pages Included** for easy API and Socket.io testing

---

## Support

For questions or issues, contact the development team.