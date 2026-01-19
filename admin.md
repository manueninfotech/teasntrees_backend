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
