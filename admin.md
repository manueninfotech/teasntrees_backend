# Admin API Documentation

## User Management

### Get User by ID
```http
GET /api/admin/users/:id
Authorization: Bearer <token>
```

#### Response
The response includes detailed customer information if role is `customer`.

```json
{
  "success": true,
  "data": {
    "_id": "60d0fe4f5311236168a109ca",
    "name": "Jane Customer",
    "email": "jane@example.com",
    "role": "customer",
    "mobile": "9876543210",
    "addresses": [
      {
        "label": "Home",
        "addressLine": "123 Main St",
        "isDefault": true
      }
    ],
    "notificationPreferences": {
      "email": true,
      "sms": false,
      "push": true,
      "offers": true
    },
    "wishlist": [
      {
        "_id": "60d0fe4f5311236168a109cb",
        "name": "Classic Burger",
        "price": 150,
        "image": "burger.jpg",
        "isAvailable": true
      }
    ],
    "createdAt": "2023-10-27T10:00:00.000Z",
    "updatedAt": "2023-10-27T10:00:00.000Z"
  }
}
```

## Dashboard Analytics

### Get Dashboard Stats
Returns overview counts, today's metrics, and order status breakdown.
- **URL**: `/api/admin/dashboard/stats`
- **Method**: `GET`
- **Success Response**:  
  **Code**: `200 OK`
  ```json
  {
    "success": true,
    "data": {
      "overview": {
        "totalOrders": 150,
        "totalUsers": 50,
        "totalProducts": 20,
        "totalDeliveries": 10,
        "totalRevenue": 45000,
        "activeOrders": 5
      },
      "today": {
        "orders": 12,
        "revenue": 3500
      },
      "ordersByStatus": [
        { "_id": "delivered", "count": 140 },
        { "_id": "pending", "count": 5 }
      ]
    }
  }
  ```

### Get Revenue Analytics (Charts)
Returns revenue and order counts grouped by date for charts.
- **URL**: `/api/admin/dashboard/revenue`
- **Method**: `GET`
- **Query Params**: `period=week` (default) | `month` | `year`
- **Success Response**:  
  **Code**: `200 OK`
  ```json
  {
    "success": true,
    "data": [
      {
        "_id": "2023-10-25",
        "revenue": 5000,
        "orders": 15
      },
      {
        "_id": "2023-10-26",
        "revenue": 6200,
        "orders": 18
      }
    ]
  }
  ```

### Get Top Selling Products
Returns products sorted by accumulated sales volume.
- **URL**: `/api/admin/dashboard/top-products`
- **Method**: `GET`
- **Query Params**: `limit=10`
- **Success Response**:  
  **Code**: `200 OK`
  ```json
  {
    "success": true,
    "count": 5,
    "data": [
      {
        "_id": "...",
        "name": "Spicy Momos",
        "price": 150,
        "orderCount": 500,
        "averageRating": 4.5,
        "category": { "name": "Momos", "icon": "..." }
      }
    ]
  }
  ```
