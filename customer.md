# Customer API Documentation

Complete API reference for customer-facing endpoints.

## Table of Contents
1. [Authentication](#authentication)
2. [Profile Management](#profile-management)
3. [Product Browsing](#product-browsing)
4. [Category Browsing](#category-browsing)
5. [Shopping Cart](#shopping-cart)
6. [Order Management](#order-management)
7. [Delivery Tracking](#delivery-tracking)
8. [Reviews & Ratings](#reviews--ratings)
9. [Address Book](#address-book)
URL: `/api/customer`

---

## 1. Authentication

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

## 2. Profile Management

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

## 3. Product Browsing

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

## 4. Category Browsing

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

## 6. Order Management

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

## 5. Shopping Cart

### Get Cart
```http
GET /api/customer/cart
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "_id": "itemId",
        "product": {
          "_id": "productId",
          "name": "Margherita Pizza",
          "price": 250,
          "image": "url",
          "isAvailable": true
        },
        "quantity": 2,
        "price": 250,
        "customization": "Extra cheese"
      }
    ],
    "subtotal": 500,
    "itemCount": 1
  }
}
```

### Add to Cart
```http
POST /api/customer/cart/add
Authorization: Bearer <token>
Content-Type: application/json

{
  "productId": "productId",
  "quantity": 2,
  "customization": "Extra cheese"
}
```

### Update Cart Item
```http
PUT /api/customer/cart/item/:itemId
Authorization: Bearer <token>
Content-Type: application/json

{
  "quantity": 3
}
```

### Remove from Cart
```http
DELETE /api/customer/cart/item/:itemId
Authorization: Bearer <token>
```

### Clear Cart
```http
DELETE /api/customer/cart/clear
Authorization: Bearer <token>
```

### Checkout (Cart to Order)
```http
POST /api/customer/cart/checkout
Authorization: Bearer <token>
Content-Type: application/json

{
  "deliveryAddress": "123 Main St, City",
  "deliveryInstructions": "Ring doorbell",
  "paymentMethod": "COD"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Order placed successfully",
  "data": {
    "orderNumber": "ORD000001",
    "orderId": "orderId",
    "total": 575.50,
    "status": "pending"
  }
}
```

---

## 7. Delivery Tracking

### Get My Deliveries
```http
GET /api/customer/deliveries
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "_id": "deliveryId",
      "deliveryNumber": "DEL000001",
      "status": "in_transit",
      "riderId": {
        "name": "John Rider",
        "mobile": "9876543210"
      },
      "distance": 5.2,
      "estimatedTime": 30
    }
  ]
}
```

### Track Delivery (Real-time)
```http
GET /api/customer/deliveries/:deliveryId/track
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "deliveryNumber": "DEL000001",
    "status": "in_transit",
    "rider": {
      "name": "John Rider",
      "mobile": "9876543210"
    },
    "currentLocation": {
      "type": "Point",
      "coordinates": [77.5946, 12.9716],
      "address": "Current location"
    },
    "deliveryLocation": {
      "coordinates": [77.6033, 12.9698],
      "address": "Delivery address"
    },
    "distance": 5.2,
    "estimatedTime": 30,
    "estimatedArrival": 15,
    "assignedAt": "2024-01-13T10:00:00Z",
    "pickedUpAt": "2024-01-13T10:15:00Z"
  }
}
```

### Get Delivery by Order
```http
GET /api/customer/deliveries/order/:orderId
Authorization: Bearer <token>
```

---

## 8. Reviews & Ratings

### Submit Order Review
```http
POST /api/customer/reviews
Authorization: Bearer <token>
Content-Type: application/json

{
  "orderId": "orderId",
  "foodRating": 5,
  "riderRating": 4,
  "review": "Great food and quick delivery!",
  "images": ["url1", "url2"]
}
```

**Response:**
```json
{
  "success": true,
  "message": "Review submitted successfully",
  "data": {
    "_id": "reviewId",
    "orderId": "orderId",
    "foodRating": 5,
    "riderRating": 4,
    "review": "Great food and quick delivery!"
  }
}
```

### Rate Specific Product
```http
POST /api/customer/reviews/product
Authorization: Bearer <token>
Content-Type: application/json

{
  "productId": "productId",
  "orderId": "orderId",
  "rating": 5,
  "review": "Best pizza ever!"
}
```

### Get Product Reviews (Public)
```http
GET /api/customer/reviews/product/:productId?page=1&limit=10&rating=5
```

**Response:**
```json
{
  "success": true,
  "data": {
    "reviews": [
      {
        "_id": "reviewId",
        "customerId": {
          "name": "John Doe"
        },
        "productRating": 5,
        "review": "Excellent product!",
        "createdAt": "2024-01-13T10:00:00Z"
      }
    ],
    "averageRating": 4.5,
    "totalReviews": 45,
    "pagination": {
      "currentPage": 1,
      "totalPages": 5,
      "total": 45,
      "limit": 10
    }
  }
}
```

### Get My Reviews
```http
GET /api/customer/reviews/my-reviews?page=1&limit=10
Authorization: Bearer <token>
```

---

## Real-Time Features (Socket.io)

### Events Customers Receive:

**Order Updates:**
- `order:created` - Order placed successfully
- `order:status-updated` - Order status changed
- `order:rider-assigned` - Rider assigned to order
- `order:cancelled` - Order cancelled

**Delivery Updates:**
- `rider:location-update` - Real-time rider location
- `delivery:status-updated` - Delivery status changed

**Product Updates:**
- `product:created` - New product available
- `product:updated` - Product availability/price changed
- `product:deleted` - Product removed

**Category Updates:**
- `category:created` - New category added
- `category:updated` - Category updated
- `category:deleted` - Category removed

---

## Order Status Lifecycle

```
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

---

## 9. Address Book

### Get All Addresses
```http
GET /api/customer/address
Authorization: Bearer {token}

Response:
{
  "success": true,
  "data": [
    {
      "_id": "addressId",
      "label": "Home",
      "addressLine": "123 Main St, City",
      "isDefault": true,
      "location": { "type": "Point", "coordinates": [0,0] }
    }
  ]
}
```

### Add New Address
```http
POST /api/customer/address
Authorization: Bearer {token}
Content-Type: application/json

{
  "label": "Work",
  "addressLine": "Office 4B, Tech Park",
  "isDefault": false
}
```

### Update Address
```http
PUT /api/customer/address/{addressId}
Authorization: Bearer {token}

{
  "label": "Home",
  "addressLine": "New Address Line"
}
```

### Set Default Address
```http
PUT /api/customer/address/{addressId}/default
Authorization: Bearer {token}
```

### Delete Address
```http
DELETE /api/customer/address/{addressId}
Authorization: Bearer {token}
```
