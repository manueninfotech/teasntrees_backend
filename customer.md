# Customer API - Complete Documentation

## Overview
Customer-facing API endpoints for browsing products, managing profile, and placing orders.

Base URL: `/api/customer`

---

## Authentication

### Send OTP
```http
POST /api/customer/auth/send-otp
Content-Type: application/json

{
  "mobile": "9876543210"
}

Response:
{
  "success": true,
  "message": "OTP sent successfully",
  "data": {
    "mobile": "9876543210",
    "expiresIn": "5 minutes",
    "otp": "123456"  // Only in development
  }
}

Rate Limit: 3 requests per hour
```

### Verify OTP
```http
POST /api/customer/auth/verify-otp
Content-Type: application/json

{
  "mobile": "9876543210",
  "otp": "123456"
}

Response:
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "abc123...",
    "user": {
      "id": "userId",
      "mobile": "9876543210",
      "role": "customer"
    }
  }
}
```

### Refresh Token
```http
POST /api/customer/auth/refresh-token
Content-Type: application/json

{
  "refreshToken": "abc123..."
}
```

### Logout
```http
POST /api/customer/auth/logout
Authorization: Bearer {token}

{
  "refreshToken": "abc123..."
}
```

---

## Profile Management

### Get Profile
```http
GET /api/customer/profile
Authorization: Bearer {token}
```

### Update Profile
```http
PUT /api/customer/profile
Authorization: Bearer {token}

{
  "name": "John Doe",
  "email": "john@example.com",
  "address": "123 Main St"
}
```

---

## Products

### Get All Products
**With Pagination, Search & Filters**

```http
GET /api/customer/products?page=1&limit=20&category=categoryId&search=pizza&tags=must-try

Query Parameters:
- page: Page number (default: 1)
- limit: Items per page (default: 20)
- category: Filter by category ID
- search: Search in name/description
- tags: Comma-separated tags (must-try,best-seller,new-intro,egg-contains)

Response:
{
  "success": true,
  "data": {
    "products": [
      {
        "_id": "productId",
        "name": "Margherita Pizza",
        "description": "Classic pizza with...",
        "price": 250,
        "image": "cloudinary_url",
        "category": {
          "name": "Pizzas",
          "description": "Delicious pizzas"
        },
        "tags": ["must-try", "best-seller"],
        "isAvailable": true
      }
    ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 12,
      "totalProducts": 239,
      "limit": 20
    }
  }
}
```

### Get Product by ID
```http
GET /api/customer/products/{productId}
```

### Get Products by Category
```http
GET /api/customer/products/category/{categoryId}?page=1&limit=20
```

---

## Categories

### Get All Categories
```http
GET /api/customer/categories

Response:
{
  "success": true,
  "data": [
    {
      "_id": "categoryId",
      "name": "Pizzas",
      "description": "Delicious pizzas",
      "icon": "🍕",
      "isActive": true
    }
  ]
}
```

### Get Category by ID
```http
GET /api/customer/categories/{categoryId}
```

---

## Orders

### Create Order
```http
POST /api/customer/orders
Authorization: Bearer {token}

{
  "items": [
    {
      "product": "productId",
      "quantity": 2,
      "price": 250,
      "customization": "Extra cheese"
    }
  ],
  "deliveryAddress": "123 Main St, City",
  "deliveryInstructions": "Ring doorbell",
  "paymentMethod": "COD"
}

Response:
{
  "success": true,
  "message": "Order placed successfully",
  "data": {
    "orderNumber": "ORD000001",
    "orderId": "orderId",
    "total": 505,
    "status": "pending"
  }
}
```

### Get My Orders
```http
GET /api/customer/orders/my-orders?page=1&limit=10&status=pending

Query Parameters:
- page: Page number
- limit: Items per page
- status: Filter by status (pending, accepted, preparing, etc.)

Response:
{
  "success": true,
  "data": {
    "orders": [...],
    "pagination": {
      "currentPage": 1,
      "totalPages": 3,
      "totalOrders": 25
    }
  }
}
```

### Get Order Details
```http
GET /api/customer/orders/{orderId}
Authorization: Bearer {token}

Response:
{
  "success": true,
  "data": {
    "orderNumber": "ORD000001",
    "items": [...],
    "total": 505,
    "status": "in_transit",
    "deliveryAddress": {...},
    "riderId": {...},
    "createdAt": "2026-01-12T10:00:00Z"
  }
}
```

### Cancel Order
```http
DELETE /api/customer/orders/{orderId}/cancel
Authorization: Bearer {token}

{
  "reason": "Changed my mind"
}

Note: Only pending/accepted orders can be cancelled
```

---

## Order Status Lifecycle

```
pending → accepted → preparing → ready → assigned → picked_up → in_transit → delivered
                                                               ↓
                                                          cancelled
```

---

## Available Product Tags

- `new-intro` - New menu items
- `must-try` - Recommended items  
- `best-seller` - Popular items
- `egg-contains` - Contains eggs

---

## Security Features

- **Rate Limiting**: OTP (3/hour), Auth (5/15min)
- **Account Lockout**: 5 failed attempts = 30 min lock
- **Refresh Tokens**: 90-day validity with rotation
- **Winston Logging**: All actions logged
- **Socket.io**: Real-time order updates
