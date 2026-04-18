## Admin Endpoints
### Authentication Endpoints
#### Send OTP
```http
POST /api/admin/auth/send-otp
Content-Type: application/json
Body:
{
  "mobile": "88888888888"
}
Response:
{
  "success": true,
  "message": "OTP sent successfully",
  "data": {
    "mobile": "8888888888",
    "expiresIn": "5 minutes",
    "otp": "767963"
  }
}

Rate Limit: 3 requests per hour
```

#### Verify OTP
```http
POST /api/admin/auth/verify-otp
Content-Type: application/json

{
  "mobile": "8888888888",
  "otp": "749360"
}

Response:
{
  "success": true,
  "message": "OTP verified. Please complete your profile.",
  "data": {
    "mobile": "8888888888",
    "isNewUser": true,
    "isProfileComplete": false
  }
}

#### Complete Profile
```http
POST /api/admin/auth/complete-profile
Content-Type: application/json

{
  "mobile": "8888888888",
  "name": "Shravya",
  "email": "shravya@example.com",
  "address": "Admin Office"
}

Response:
{
  "success": true,
  "message": "Profile completed successfully",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2OTg5YzE0MGQ2Nzc5ODM0ZjU5OWRjMzUiLCJyb2xlIjoiYWRtaW4iLCJpYXQiOjE3NzA2MzU1ODQsImV4cCI6MTc3MzIyNzU4NH0.SJh8PInLjJ2S-QgHZ5bDJxw2Il2jR4aR2oVO0eAJQ5g",
    "refreshToken": "63eeabbb86b899aba3b098bd8fa83400dab629e3d67206c6c270bfc230b6b8fc8d579a554535632fabc5bf6f86fd1e63c658924ec422a5552a1b66ac9d18a738",
    "user": {
      "id": "6989c140d6779834f599dc35",
      "name": "Shravya",
      "mobile": "8888888888",
      "email": "shravya@example.com",
      "address": "Admin Office",
      "role": "admin",
      "isProfileComplete": true
    }
  }
}
```

#### Refresh Token
```http
POST /api/admin/auth/refresh-token
Content-Type: application/json

{
  "refreshToken": "63eeabbb86b899aba3b098bd8fa83400dab629e3d67206c6c270bfc230b6b8fc8d579a554535632fabc5bf6f86fd1e63c658924ec422a5552a1b66ac9d18a738"
}

Response:
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2OTg5YzE0MGQ2Nzc5ODM0ZjU5OWRjMzUiLCJyb2xlIjoiYWRtaW4iLCJpYXQiOjE3NzA2MzU3MzksImV4cCI6MTc3MzIyNzczOX0.fF7FHSX8aYc-rqwQ0ggSTJ4sU1dEn51uB7ouiOYCStk",
  "refreshToken": "720db55709b3b5d181955344f078127dc807846595774ea03ee6c648cb2ac018f3fe8a3aaac333c107387adef6a14548dcf1e8685780459cd2c0c022ccb07706"
}
```
#### Logout
```http
POST /api/admin/auth/logout
Content-Type: application/json

{
  "refreshToken": "63eeabbb86b899aba3b098bd8fa83400dab629e3d67206c6c270bfc230b6b8fc8d579a554535632fabc5bf6f86fd1e63c658924ec422a5552a1b66ac9d18a738"
}

Response:
{
  "success": true,
  "message": "Logout successful"
}
```

### Dashboard Endpoints
```http
GET /api/admin/dashboard/stats
Authorization: Bearer <token>

Response:
{
  "success": true,
  "data": {
    "totalOrders": 9,
    "totalCustomers": 2,
    "totalProducts": 240,
    "totalRiders": 1,
    "activeRiders": 1,
    "pendingOrders": 0,
    "totalRevenue": 1550.1499999999999,
    "activeOrders": 0,
    "todayOrders": 2,
    "todayRevenue": 0,
    "ordersByStatus": [
      {
        "_id": "delivered",
        "count": 7
      },
      {
        "_id": "assigned",
        "count": 1
      },
      {
        "_id": "waiting_for_rider",
        "count": 1
      }
    ],
    "recentOrders": [
      {
        "_id": "698997572f2252097b6d9870",
        "customerId": {
          "_id": "698582bb2d61b9f324391d5b",
          "name": "Venishetty Ravi",
          "kind": "Customer"
        },
        "items": [
          {
            "product": "69785db22c02e75109f16baa",
            "name": "Egg Grilled Burger",
            "quantity": 1,
            "price": 169,
            "customization": "Regular",
            "_id": "698997572f2252097b6d9871"
          }
        ],
        "total": 227.45,
        "status": "waiting_for_rider",
        "createdAt": "2026-02-09T08:14:15.344Z",
        "orderNumber": "ORD000010"
      },
      {
        "_id": "69898fa6b10e564a9d27c22f",
        "customerId": {
          "_id": "698582bb2d61b9f324391d5b",
          "name": "Venishetty Ravi",
          "kind": "Customer"
        },
        "items": [
          {
            "product": "69785db22c02e75109f16ba4",
            "name": "Panner Grilled Burger",
            "quantity": 1,
            "price": 169,
            "customization": "Regular",
            "_id": "69898fa6b10e564a9d27c230"
          },
          {
            "product": "69785db22c02e75109f16abc",
            "name": "Dark Chocolate Scoop",
            "quantity": 1,
            "price": 99,
            "customization": "",
            "_id": "69898fa6b10e564a9d27c231"
          }
        ],
        "total": 331.4,
        "status": "assigned",
        "createdAt": "2026-02-09T07:41:26.318Z",
        "orderNumber": "ORD000009"
      },
      {
        "_id": "6986d7de4c18616c7b9a0bf2",
        "customerId": {
          "_id": "698582bb2d61b9f324391d5b",
          "name": "Venishetty Ravi",
          "kind": "Customer"
        },
        "items": [
          {
            "product": "69785db22c02e75109f16b94",
            "name": "Biryani Maggi",
            "quantity": 1,
            "price": 189,
            "customization": "",
            "_id": "6986d7de4c18616c7b9a0bf3"
          }
        ],
        "total": 248.45,
        "status": "delivered",
        "createdAt": "2026-02-07T06:12:46.621Z",
        "orderNumber": "ORD000008"
      },
      {
        "_id": "6986c94d589ce6c24c121ce2",
        "customerId": {
          "_id": "698582bb2d61b9f324391d5b",
          "name": "Venishetty Ravi",
          "kind": "Customer"
        },
        "items": [
          {
            "product": "69785db22c02e75109f16b96",
            "name": "Korean Style Maggi",
            "quantity": 1,
            "price": 169,
            "customization": "",
            "_id": "6986c94d589ce6c24c121ce3"
          }
        ],
        "total": 227.45,
        "status": "delivered",
        "createdAt": "2026-02-07T05:10:37.102Z",
        "orderNumber": "ORD000007"
      },
      {
        "_id": "6985cd0f199f7f878d43128b",
        "customerId": {
          "_id": "698582bb2d61b9f324391d5b",
          "name": "Venishetty Ravi",
          "kind": "Customer"
        },
        "items": [
          {
            "product": "69785db22c02e75109f16ba4",
            "name": "Panner Grilled Burger",
            "quantity": 1,
            "price": 169,
            "customization": "Regular",
            "_id": "6985cd0f199f7f878d43128c"
          }
        ],
        "total": 227.45,
        "status": "delivered",
        "createdAt": "2026-02-06T11:14:23.252Z",
        "orderNumber": "ORD000006"
      }
    ],
    "topProducts": [
      {
        "_id": "69785db22c02e75109f16ba1",
        "name": "Veg Grilled Burger",
        "orderCount": 3
      },
      {
        "_id": "69785db22c02e75109f16ba4",
        "name": "Panner Grilled Burger",
        "orderCount": 2
      },
      {
        "_id": "69785db22c02e75109f16b94",
        "name": "Biryani Maggi",
        "orderCount": 1
      },
      {
        "_id": "69785db22c02e75109f16b96",
        "name": "Korean Style Maggi",
        "orderCount": 1
      }
    ]
  }
}
```

#### Recent Orders
```http
GET /api/admin/dashboard/recent-orders
Authorization: Bearer <token>

Response:
{
  "success": true,
  "count": 9,
  "data": [
    {
      "_id": "698997572f2252097b6d9870",
      "customerId": {
        "_id": "698582bb2d61b9f324391d5b",
        "name": "Venishetty Ravi",
        "email": "ravi@gmail.com",
        "kind": "Customer"
      },
      "items": [
        {
          "product": {
            "_id": "69785db22c02e75109f16baa",
            "name": "Egg Grilled Burger",
            "displayPrice": null,
            "id": "69785db22c02e75109f16baa"
          }
        }
      ],
      "total": 227.45,
      "status": "waiting_for_rider",
      "createdAt": "2026-02-09T08:14:15.344Z",
      "orderNumber": "ORD000010"
    },
    {
      "_id": "69898fa6b10e564a9d27c22f",
      "customerId": {
        "_id": "698582bb2d61b9f324391d5b",
        "name": "Venishetty Ravi",
        "email": "ravi@gmail.com",
        "kind": "Customer"
      },
      "items": [
        {
          "product": {
            "_id": "69785db22c02e75109f16ba4",
            "name": "Panner Grilled Burger",
            "displayPrice": null,
            "id": "69785db22c02e75109f16ba4"
          }
        },
        {
          "product": {
            "_id": "69785db22c02e75109f16abc",
            "name": "Dark Chocolate Scoop",
            "price": 99,
            "displayPrice": 99,
            "id": "69785db22c02e75109f16abc"
          }
        }
      ],
      "total": 331.4,
      "status": "assigned",
      "createdAt": "2026-02-09T07:41:26.318Z",
      "orderNumber": "ORD000009"
    },
    {
      "_id": "6986d7de4c18616c7b9a0bf2",
      "customerId": {
        "_id": "698582bb2d61b9f324391d5b",
        "name": "Venishetty Ravi",
        "email": "ravi@gmail.com",
        "kind": "Customer"
      },
      "items": [
        {
          "product": {
            "_id": "69785db22c02e75109f16b94",
            "name": "Biryani Maggi",
            "price": 189,
            "displayPrice": 189,
            "id": "69785db22c02e75109f16b94"
          }
        }
      ],
      "total": 248.45,
      "status": "delivered",
      "createdAt": "2026-02-07T06:12:46.621Z",
      "orderNumber": "ORD000008"
    },
    {
      "_id": "6986c94d589ce6c24c121ce2",
      "customerId": {
        "_id": "698582bb2d61b9f324391d5b",
        "name": "Venishetty Ravi",
        "email": "ravi@gmail.com",
        "kind": "Customer"
      },
      "items": [
        {
          "product": {
            "_id": "69785db22c02e75109f16b96",
            "name": "Korean Style Maggi",
            "price": 169,
            "displayPrice": 169,
            "id": "69785db22c02e75109f16b96"
          }
        }
      ],
      "total": 227.45,
      "status": "delivered",
      "createdAt": "2026-02-07T05:10:37.102Z",
      "orderNumber": "ORD000007"
    },
    {
      "_id": "6985cd0f199f7f878d43128b",
      "customerId": {
        "_id": "698582bb2d61b9f324391d5b",
        "name": "Venishetty Ravi",
        "email": "ravi@gmail.com",
        "kind": "Customer"
      },
      "items": [
        {
          "product": {
            "_id": "69785db22c02e75109f16ba4",
            "name": "Panner Grilled Burger",
            "displayPrice": null,
            "id": "69785db22c02e75109f16ba4"
          }
        }
      ],
      "total": 227.45,
      "status": "delivered",
      "createdAt": "2026-02-06T11:14:23.252Z",
      "orderNumber": "ORD000006"
    },
    {
      "_id": "69859debf846b04cbb6024fe",
      "customerId": {
        "_id": "698582bb2d61b9f324391d5b",
        "name": "Venishetty Ravi",
        "email": "ravi@gmail.com",
        "kind": "Customer"
      },
      "items": [
        {
          "product": {
            "_id": "69785db22c02e75109f16ba1",
            "name": "Veg Grilled Burger",
            "displayPrice": null,
            "id": "69785db22c02e75109f16ba1"
          }
        }
      ],
      "total": 206.45,
      "status": "delivered",
      "createdAt": "2026-02-06T07:53:15.308Z",
      "orderNumber": "ORD000005"
    },
    {
      "_id": "69859c5da244c8366d7330b8",
      "customerId": {
        "_id": "698582bb2d61b9f324391d5b",
        "name": "Venishetty Ravi",
        "email": "ravi@gmail.com",
        "kind": "Customer"
      },
      "items": [
        {
          "product": {
            "_id": "69785db22c02e75109f16ba1",
            "name": "Veg Grilled Burger",
            "displayPrice": null,
            "id": "69785db22c02e75109f16ba1"
          }
        }
      ],
      "total": 206.45,
      "status": "delivered",
      "createdAt": "2026-02-06T07:46:37.172Z",
      "orderNumber": "ORD000004"
    },
    {
      "_id": "698599ba68fb02cfb5a81913",
      "customerId": {
        "_id": "698582bb2d61b9f324391d5b",
        "name": "Venishetty Ravi",
        "email": "ravi@gmail.com",
        "kind": "Customer"
      },
      "items": [
        {
          "product": {
            "_id": "69785db22c02e75109f16ba4",
            "name": "Panner Grilled Burger",
            "displayPrice": null,
            "id": "69785db22c02e75109f16ba4"
          }
        }
      ],
      "total": 227.45,
      "status": "delivered",
      "createdAt": "2026-02-06T07:35:22.151Z",
      "orderNumber": "ORD000003"
    },
    {
      "_id": "698596fb0aafa6508543d506",
      "customerId": {
        "_id": "698582bb2d61b9f324391d5b",
        "name": "Venishetty Ravi",
        "email": "ravi@gmail.com",
        "kind": "Customer"
      },
      "items": [
        {
          "product": {
            "_id": "69785db22c02e75109f16ba1",
            "name": "Veg Grilled Burger",
            "displayPrice": null,
            "id": "69785db22c02e75109f16ba1"
          }
        }
      ],
      "total": 206.45,
      "status": "delivered",
      "createdAt": "2026-02-06T07:23:39.219Z",
      "orderNumber": "ORD000002"
    }
  ]
}
```

#### Total revenue
```http
GET /api/admin/dashboard/revenue
Authorization: Bearer <token>

Response:
{
  "success": true,
  "data": [
    {
      "_id": "2026-02-06",
      "revenue": 1074.25,
      "orders": 5
    },
    {
      "_id": "2026-02-07",
      "revenue": 475.9,
      "orders": 2
    }
  ]
}
```

#### Top Products
```http
GET /api/admin/dashboard/top-products
Authorization: Bearer <token>

Response:
{
  "success": true,
  "count": 4,
  "data": [
    {
      "_id": "69785db22c02e75109f16ba1",
      "name": "Veg Grilled Burger",
      "orderCount": 3,
      "totalRevenue": 447,
      "price": 149,
      "image": "default-image.jpg",
      "category": "69785c05eef576a5fdef0d7f",
      "averageRating": 0
    },
    {
      "_id": "69785db22c02e75109f16ba4",
      "name": "Panner Grilled Burger",
      "orderCount": 2,
      "totalRevenue": 338,
      "price": 169,
      "image": "default-image.jpg",
      "category": "69785c05eef576a5fdef0d7f",
      "averageRating": 0
    },
    {
      "_id": "69785db22c02e75109f16b96",
      "name": "Korean Style Maggi",
      "orderCount": 1,
      "totalRevenue": 169,
      "price": 169,
      "image": "default-image.jpg",
      "category": "69785c05eef576a5fdef0d7e",
      "averageRating": 0
    },
    {
      "_id": "69785db22c02e75109f16b94",
      "name": "Biryani Maggi",
      "orderCount": 1,
      "totalRevenue": 189,
      "price": 189,
      "image": "default-image.jpg",
      "category": "69785c05eef576a5fdef0d7e",
      "averageRating": 0
    }
  ]
}
```

### Users
#### Get All Users
```http
GET /api/admin/users
Authorization: Bearer <token>

Response:
{
  "success": true,
  "count": 10,
  "data": [
    {
      "isApproved": null,
      "fcmToken": null,
      "managerId": null,
      "_id": "69620f9101b4f2cca5f6c191",
      "name": "Test User",
      "email": "test@example.com",
      "mobile": "9999999999",
      "address": "Initial Address",
      "location": null,
      "role": "admin",
      "isProfileComplete": true,
      "isActive": true,
      "createdAt": "2026-01-10T08:36:33.660Z",
      "updatedAt": "2026-01-19T08:19:57.684Z",
      "isLocked": false,
      "loginAttempts": 0,
      "lockUntil": null
    },
    {
      "fcmToken": null,
      "managerId": null,
      "_id": "69706bca9fca32ad80bcc1c1",
      "name": "Admin User",
      "email": "admin@example.com",
      "mobile": "7777777777",
      "address": "Admin Office",
      "location": null,
      "role": "admin",
      "isProfileComplete": true,
      "isActive": true,
      "loginAttempts": 0,
      "isLocked": false,
      "isApproved": null,
      "createdAt": "2026-01-21T06:01:46.788Z",
      "updatedAt": "2026-01-21T06:05:49.841Z",
      "lockUntil": null
    },
    {
      "fcmToken": null,
      "managerId": null,
      "_id": "69707779687f41ec6c1afdca",
      "name": "Admin User 1",
      "email": "admin1@example.com",
      "mobile": "6666666666",
      "address": "Admin Office",
      "location": null,
      "role": "admin",
      "isProfileComplete": true,
      "isActive": true,
      "loginAttempts": 0,
      "isLocked": false,
      "isApproved": null,
      "createdAt": "2026-01-21T06:51:37.421Z",
      "updatedAt": "2026-01-21T06:51:37.421Z"
    },
    {
      "fcmToken": null,
      "managerId": null,
      "_id": "69709d4700ebe46bf628a81c",
      "name": "Updated Admin",
      "email": "admin@updated.com",
      "mobile": "9876543211",
      "address": "Admin Office",
      "location": null,
      "role": "admin",
      "isProfileComplete": true,
      "isActive": true,
      "loginAttempts": 0,
      "isLocked": false,
      "isApproved": null,
      "createdAt": "2026-01-21T09:32:55.421Z",
      "updatedAt": "2026-01-21T09:43:38.179Z"
    },
    {
      "_id": "697b09c0b2c673fb2531794d",
      "name": "manisha",
      "email": "manisha@gmail.com",
      "mobile": "7890123456",
      "address": "guntur",
      "location": null,
      "role": "manager",
      "isProfileComplete": true,
      "isActive": true,
      "loginAttempts": 0,
      "isLocked": false,
      "isApproved": true,
      "fcmToken": null,
      "managerId": null,
      "kind": "Manager",
      "assignedBranch": "Main",
      "ordersHandled": 0,
      "ridersManaged": 0,
      "shifts": [],
      "createdAt": "2026-01-29T07:18:24.822Z",
      "updatedAt": "2026-01-29T07:18:41.240Z"
    },
    {
      "_id": "6981892592f70d9a3229d854",
      "name": "Manish Kumar",
      "email": "manishkumar@gmail.com",
      "mobile": "6789012345",
      "address": "1st Lane, Pandaripuram Rd, Lakshmipuram, Ashok Nagar, Guntur, Andhra Pradesh 522007, India.",
      "location": null,
      "role": "manager",
      "isProfileComplete": true,
      "isActive": true,
      "loginAttempts": 0,
      "isLocked": false,
      "isApproved": true,
      "fcmToken": null,
      "managerId": null,
      "kind": "Manager",
      "assignedBranch": "Main",
      "ordersHandled": 0,
      "ridersManaged": 0,
      "shifts": [],
      "createdAt": "2026-02-03T05:35:33.270Z",
      "updatedAt": "2026-02-07T06:09:13.753Z"
    },
    {
      "_id": "69833721e005e64103da9eed",
      "email": "test_sync_user@example.com",
      "address": null,
      "createdAt": "2026-02-04T12:10:08.256Z",
      "fcmToken": null,
      "isActive": true,
      "isApproved": null,
      "isLocked": false,
      "isProfileComplete": false,
      "location": null,
      "loginAttempts": 0,
      "managerId": null,
      "mobile": "1234567890",
      "name": "Test User",
      "updatedAt": "2026-02-04T12:10:08.256Z"
    },
    {
      "notificationPreferences": {
        "email": true,
        "sms": true,
        "push": true,
        "offers": true
      },
      "_id": "698582bb2d61b9f324391d5b",
      "name": "Venishetty Ravi",
      "email": "ravi@gmail.com",
      "mobile": "9966554485",
      "address": "Ashok Nagar, Brodipet, Guntur Municipal Corporation, Guntur, Andhra Pradesh, 522008, India",
      "location": {
        "type": "Point",
        "coordinates": [
          80.43255821060883,
          16.307152006996116
        ]
      },
      "role": "customer",
      "isProfileComplete": true,
      "isActive": true,
      "loginAttempts": 0,
      "isLocked": false,
      "isApproved": null,
      "fcmToken": null,
      "managerId": null,
      "kind": "Customer",
      "wishlist": [
        "69785db22c02e75109f16ba1"
      ],
      "profileImage": "https://res.cloudinary.com/dpguxi28j/image/upload/v1770357446/teasntrees/poms8nwxv1jxlq83wc7l.jpg",
      "addresses": [
        {
          "location": {
            "type": "Point",
            "coordinates": [
              80.43244902879047,
              16.30716550175863
            ]
          },
          "label": "Home",
          "addressLine": "3/7, Opposite of Ravie Campus, Brodipet, Guntur - 522002",
          "flatNo": "3/7",
          "street": "Opposite of Ravie Campus",
          "area": "Brodipet",
          "city": "Guntur",
          "pincode": "522002",
          "isDefault": true,
          "_id": "6985842d2d61b9f324391dfd"
        }
      ],
      "createdAt": "2026-02-06T05:57:15.312Z",
      "updatedAt": "2026-02-06T11:13:05.894Z",
      "lockUntil": null
    },
    {
      "emergencyContact": {
        "name": "Priya",
        "mobile": "9876500000",
        "relation": "Spouse"
      },
      "currentLocation": {
        "type": "Point",
        "coordinates": [
          80.43251984011513,
          16.30719763463845
        ]
      },
      "_id": "69859055b69656891eb075c0",
      "name": "Ramesh",
      "email": "ramesh@gmail.com",
      "mobile": "9876543210",
      "address": "Arundalpet,Guntur,522601",
      "location": {
        "type": "Point",
        "coordinates": [
          80.4377261,
          16.3039416
        ]
      },
      "role": "rider",
      "isProfileComplete": true,
      "isActive": true,
      "loginAttempts": 0,
      "isLocked": false,
      "isApproved": true,
      "fcmToken": null,
      "managerId": null,
      "kind": "Rider",
      "vehicleType": "bike",
      "vehicleNumber": "TN-43-AB-1234",
      "licenseNumber": "DL-20240012345",
      "licenseExpiryDate": "2028-12-31T00:00:00.000Z",
      "aadharNumber": "1234 5678 90",
      "isOnline": true,
      "isOnDelivery": true,
      "totalDeliveries": 7,
      "totalEarnings": 124,
      "pendingEarnings": 0,
      "averageRating": 0,
      "ratingsCount": 1,
      "preferredZones": [],
      "maxDeliveriesPerDay": 30,
      "createdAt": "2026-02-06T06:55:17.382Z",
      "updatedAt": "2026-02-09T07:41:47.112Z",
      "aadharPhoto": "https://res.cloudinary.com/dpguxi28j/image/upload/v1770361111/rider-docs/gy4totmgwhmwvywnoj7i.png",
      "accountHolderName": "Ramesh",
      "bankAccountNumber": "50100123456789",
      "ifscCode": "HDFC0001234",
      "licensePhoto": "https://res.cloudinary.com/dpguxi28j/image/upload/v1770361110/rider-docs/cbvijiaquml9tjeekc7j.png",
      "panNumber": "ABCDE1234F",
      "panPhoto": "https://res.cloudinary.com/dpguxi28j/image/upload/v1770361114/rider-docs/ayvcivodv8h3noluim5d.png",
      "vehicleModel": "Royal Enfield Classic 350"
    },
    {
      "notificationPreferences": {
        "email": true,
        "sms": true,
        "push": true,
        "offers": true
      },
      "_id": "6989bef6d6779834f599db52",
      "name": "Eenadula Bhanprakash",
      "email": "bhanu@gmail.com",
      "mobile": "9515409973",
      "address": "Guntur",
      "location": {
        "type": "Point",
        "coordinates": [
          80.4541588,
          16.2915189
        ]
      },
      "role": "customer",
      "isProfileComplete": true,
      "isActive": true,
      "loginAttempts": 0,
      "isLocked": false,
      "isApproved": null,
      "fcmToken": null,
      "managerId": null,
      "kind": "Customer",
      "wishlist": [],
      "profileImage": null,
      "addresses": [],
      "createdAt": "2026-02-09T11:03:18.530Z",
      "updatedAt": "2026-02-09T11:04:00.638Z",
      "lockUntil": null
    }
  ],
  "pagination": {
    "current": 1,
    "totalPages": 2,
    "limit": 10,
    "totalItems": 11
  }
}
```
#### Get User By id
``` http
GET /api/v1/users/:id
Response:
{
  "success": true,
  "data": {
    "notificationPreferences": {
      "email": true,
      "sms": true,
      "push": true,
      "offers": true
    },
    "_id": "698582bb2d61b9f324391d5b",
    "name": "Venishetty Ravi",
    "email": "ravi@gmail.com",
    "mobile": "9966554485",
    "address": "Ashok Nagar, Brodipet, Guntur Municipal Corporation, Guntur, Andhra Pradesh, 522008, India",
    "location": {
      "type": "Point",
      "coordinates": [
        80.43255821060883,
        16.307152006996116
      ]
    },
    "role": "customer",
    "isProfileComplete": true,
    "isActive": true,
    "loginAttempts": 0,
    "isLocked": false,
    "isApproved": null,
    "fcmToken": null,
    "managerId": null,
    "kind": "Customer",
    "wishlist": [
      {
        "_id": "69785db22c02e75109f16ba1",
        "name": "Veg Grilled Burger",
        "image": "default-image.jpg",
        "isAvailable": true,
        "displayPrice": null,
        "id": "69785db22c02e75109f16ba1"
      }
    ],
    "profileImage": "https://res.cloudinary.com/dpguxi28j/image/upload/v1770357446/teasntrees/poms8nwxv1jxlq83wc7l.jpg",
    "addresses": [
      {
        "location": {
          "type": "Point",
          "coordinates": [
            80.43244902879047,
            16.30716550175863
          ]
        },
        "label": "Home",
        "addressLine": "3/7, Opposite of Ravie Campus, Brodipet, Guntur - 522002",
        "flatNo": "3/7",
        "street": "Opposite of Ravie Campus",
        "area": "Brodipet",
        "city": "Guntur",
        "pincode": "522002",
        "isDefault": true,
        "_id": "6985842d2d61b9f324391dfd"
      }
    ],
    "createdAt": "2026-02-06T05:57:15.312Z",
    "updatedAt": "2026-02-06T11:13:05.894Z",
    "lockUntil": null
  }
}
```

#### User Stats
``` http
GET /api/admin/users/stats
Response:
{
  "success": true,
  "data": {
    "totalUsers": 11,
    "customers": 2,
    "riders": 1,
    "admins": 5,
    "managers": 2,
    "usersToday": 2,
    "completeProfiles": 10
  }
}
```

#### Get Customers
```http
GET /api/admin/users/role/customer
Response:
{
  "success": true,
  "count": 2,
  "data": [
    {
      "notificationPreferences": {
        "email": true,
        "sms": true,
        "push": true,
        "offers": true
      },
      "_id": "6989bef6d6779834f599db52",
      "name": "Eenadula Bhanprakash",
      "email": "bhanu@gmail.com",
      "mobile": "9515409973",
      "address": "Guntur",
      "location": {
        "type": "Point",
        "coordinates": [
          80.4541588,
          16.2915189
        ]
      },
      "role": "customer",
      "isProfileComplete": true,
      "isActive": true,
      "loginAttempts": 0,
      "isLocked": false,
      "isApproved": null,
      "fcmToken": null,
      "managerId": null,
      "kind": "Customer",
      "wishlist": [],
      "profileImage": null,
      "addresses": [],
      "createdAt": "2026-02-09T11:03:18.530Z",
      "updatedAt": "2026-02-09T11:04:00.638Z",
      "lockUntil": null
    },
    {
      "notificationPreferences": {
        "email": true,
        "sms": true,
        "push": true,
        "offers": true
      },
      "_id": "698582bb2d61b9f324391d5b",
      "name": "Venishetty Ravi",
      "email": "ravi@gmail.com",
      "mobile": "9966554485",
      "address": "Ashok Nagar, Brodipet, Guntur Municipal Corporation, Guntur, Andhra Pradesh, 522008, India",
      "location": {
        "type": "Point",
        "coordinates": [
          80.43255821060883,
          16.307152006996116
        ]
      },
      "role": "customer",
      "isProfileComplete": true,
      "isActive": true,
      "loginAttempts": 0,
      "isLocked": false,
      "isApproved": null,
      "fcmToken": null,
      "managerId": null,
      "kind": "Customer",
      "wishlist": [
        "69785db22c02e75109f16ba1"
      ],
      "profileImage": "https://res.cloudinary.com/dpguxi28j/image/upload/v1770357446/teasntrees/poms8nwxv1jxlq83wc7l.jpg",
      "addresses": [
        {
          "location": {
            "type": "Point",
            "coordinates": [
              80.43244902879047,
              16.30716550175863
            ]
          },
          "label": "Home",
          "addressLine": "3/7, Opposite of Ravie Campus, Brodipet, Guntur - 522002",
          "flatNo": "3/7",
          "street": "Opposite of Ravie Campus",
          "area": "Brodipet",
          "city": "Guntur",
          "pincode": "522002",
          "isDefault": true,
          "_id": "6985842d2d61b9f324391dfd"
        }
      ],
      "createdAt": "2026-02-06T05:57:15.312Z",
      "updatedAt": "2026-02-06T11:13:05.894Z",
      "lockUntil": null
    }
  ]
}
```

#### Get Riders
```http
GET /api/admin/users/role/rider
Response:
{
  "success": true,
  "count": 1,
  "data": [
    {
      "emergencyContact": {
        "name": "Priya",
        "mobile": "9876500000",
        "relation": "Spouse"
      },
      "currentLocation": {
        "type": "Point",
        "coordinates": [
          80.43251984011513,
          16.30719763463845
        ]
      },
      "_id": "69859055b69656891eb075c0",
      "name": "Ramesh",
      "email": "ramesh@gmail.com",
      "mobile": "9876543210",
      "address": "Arundalpet,Guntur,522601",
      "location": {
        "type": "Point",
        "coordinates": [
          80.4377261,
          16.3039416
        ]
      },
      "role": "rider",
      "isProfileComplete": true,
      "isActive": true,
      "loginAttempts": 0,
      "isLocked": false,
      "isApproved": true,
      "fcmToken": null,
      "managerId": null,
      "kind": "Rider",
      "vehicleType": "bike",
      "vehicleNumber": "TN-43-AB-1234",
      "licenseNumber": "DL-20240012345",
      "licenseExpiryDate": "2028-12-31T00:00:00.000Z",
      "aadharNumber": "1234 5678 90",
      "isOnline": true,
      "isOnDelivery": true,
      "totalDeliveries": 7,
      "totalEarnings": 124,
      "pendingEarnings": 0,
      "averageRating": 0,
      "ratingsCount": 1,
      "preferredZones": [],
      "maxDeliveriesPerDay": 30,
      "createdAt": "2026-02-06T06:55:17.382Z",
      "updatedAt": "2026-02-09T07:41:47.112Z",
      "aadharPhoto": "https://res.cloudinary.com/dpguxi28j/image/upload/v1770361111/rider-docs/gy4totmgwhmwvywnoj7i.png",
      "accountHolderName": "Ramesh",
      "bankAccountNumber": "50100123456789",
      "ifscCode": "HDFC0001234",
      "licensePhoto": "https://res.cloudinary.com/dpguxi28j/image/upload/v1770361110/rider-docs/cbvijiaquml9tjeekc7j.png",
      "panNumber": "ABCDE1234F",
      "panPhoto": "https://res.cloudinary.com/dpguxi28j/image/upload/v1770361114/rider-docs/ayvcivodv8h3noluim5d.png",
      "vehicleModel": "Royal Enfield Classic 350"
    }
  ]
}
```

#### Update Role
```http
PUT /api/admin/users/:id/role
Body:
{
  "role": "manager"
}
Response:
{
  "success": true,
  "message": "User role updated successfully",
  "data": {
    "notificationPreferences": {
      "email": true,
      "sms": true,
      "push": true,
      "offers": true
    },
    "_id": "69859055b69656891eb075c0",
    "name": "Ramesh",
    "email": "ramesh@gmail.com",
    "mobile": "9876543210",
    "address": "Arundalpet,Guntur,522601",
    "location": {
      "type": "Point",
      "coordinates": [
        80.4377261,
        16.3039416
      ]
    },
    "role": "manager",
    "isProfileComplete": true,
    "isActive": true,
    "loginAttempts": 0,
    "isLocked": false,
    "isApproved": true,
    "fcmToken": null,
    "managerId": null,
    "kind": "Rider",
    "vehicleType": "bike",
    "vehicleNumber": "TN-43-AB-1234",
    "licenseNumber": "DL-20240012345",
    "licenseExpiryDate": "2028-12-31T00:00:00.000Z",
    "aadharNumber": "1234 5678 90",
    "isOnline": true,
    "isOnDelivery": true,
    "totalDeliveries": 7,
    "totalEarnings": 124,
    "pendingEarnings": 0,
    "averageRating": 0,
    "ratingsCount": 1,
    "preferredZones": [],
    "maxDeliveriesPerDay": 30,
    "createdAt": "2026-02-06T06:55:17.382Z",
    "updatedAt": "2026-02-09T07:41:47.112Z",
    "aadharPhoto": "https://res.cloudinary.com/dpguxi28j/image/upload/v1770361111/rider-docs/gy4totmgwhmwvywnoj7i.png",
    "accountHolderName": "Ramesh",
    "bankAccountNumber": "50100123456789",
    "ifscCode": "HDFC0001234",
    "licensePhoto": "https://res.cloudinary.com/dpguxi28j/image/upload/v1770361110/rider-docs/cbvijiaquml9tjeekc7j.png",
    "panNumber": "ABCDE1234F",
    "panPhoto": "https://res.cloudinary.com/dpguxi28j/image/upload/v1770361114/rider-docs/ayvcivodv8h3noluim5d.png",
    "vehicleModel": "Royal Enfield Classic 350"
  }
}
```
#### Activate User
```http
PUT /api/admin/users/:id/activate
Response:
{
  "success": true,
  "message": "User activated successfully",
  "data": {
    "notificationPreferences": {
      "email": true,
      "sms": true,
      "push": true,
      "offers": true
    },
    "_id": "69859055b69656891eb075c0",
    "name": "Ramesh",
    "email": "ramesh@gmail.com",
    "mobile": "9876543210",
    "address": "Arundalpet,Guntur,522601",
    "location": {
      "type": "Point",
      "coordinates": [
        80.4377261,
        16.3039416
      ]
    },
    "role": "manager",
    "isProfileComplete": true,
    "isActive": true,
    "loginAttempts": 0,
    "isLocked": false,
    "isApproved": true,
    "fcmToken": null,
    "managerId": null,
    "kind": "Rider",
    "vehicleType": "bike",
    "vehicleNumber": "TN-43-AB-1234",
    "licenseNumber": "DL-20240012345",
    "licenseExpiryDate": "2028-12-31T00:00:00.000Z",
    "aadharNumber": "1234 5678 90",
    "isOnline": true,
    "isOnDelivery": true,
    "totalDeliveries": 7,
    "totalEarnings": 124,
    "pendingEarnings": 0,
    "averageRating": 0,
    "ratingsCount": 1,
    "preferredZones": [],
    "maxDeliveriesPerDay": 30,
    "createdAt": "2026-02-06T06:55:17.382Z",
    "updatedAt": "2026-02-09T07:41:47.112Z",
    "aadharPhoto": "https://res.cloudinary.com/dpguxi28j/image/upload/v1770361111/rider-docs/gy4totmgwhmwvywnoj7i.png",
    "accountHolderName": "Ramesh",
    "bankAccountNumber": "50100123456789",
    "ifscCode": "HDFC0001234",
    "licensePhoto": "https://res.cloudinary.com/dpguxi28j/image/upload/v1770361110/rider-docs/cbvijiaquml9tjeekc7j.png",
    "panNumber": "ABCDE1234F",
    "panPhoto": "https://res.cloudinary.com/dpguxi28j/image/upload/v1770361114/rider-docs/ayvcivodv8h3noluim5d.png",
    "vehicleModel": "Royal Enfield Classic 350"
  }
}
```
#### Deactivate User
```http
PUT /api/admin/users/:id/deactivate
Response:
{
  "success": true,
  "message": "User deactivated successfully",
  "data": {
    "notificationPreferences": {
      "email": true,
      "sms": true,
      "push": true,
      "offers": true
    },
    "_id": "69859055b69656891eb075c0",
    "name": "Ramesh",
    "email": "ramesh@gmail.com",
    "mobile": "9876543210",
    "address": "Arundalpet,Guntur,522601",
    "location": {
      "type": "Point",
      "coordinates": [
        80.4377261,
        16.3039416
      ]
    },
    "role": "manager",
    "isProfileComplete": true,
    "isActive": false,
    "loginAttempts": 0,
    "isLocked": false,
    "isApproved": true,
    "fcmToken": null,
    "managerId": null,
    "kind": "Rider",
    "vehicleType": "bike",
    "vehicleNumber": "TN-43-AB-1234",
    "licenseNumber": "DL-20240012345",
    "licenseExpiryDate": "2028-12-31T00:00:00.000Z",
    "aadharNumber": "1234 5678 90",
    "isOnline": true,
    "isOnDelivery": true,
    "totalDeliveries": 7,
    "totalEarnings": 124,
    "pendingEarnings": 0,
    "averageRating": 0,
    "ratingsCount": 1,
    "preferredZones": [],
    "maxDeliveriesPerDay": 30,
    "createdAt": "2026-02-06T06:55:17.382Z",
    "updatedAt": "2026-02-09T07:41:47.112Z",
    "aadharPhoto": "https://res.cloudinary.com/dpguxi28j/image/upload/v1770361111/rider-docs/gy4totmgwhmwvywnoj7i.png",
    "accountHolderName": "Ramesh",
    "bankAccountNumber": "50100123456789",
    "ifscCode": "HDFC0001234",
    "licensePhoto": "https://res.cloudinary.com/dpguxi28j/image/upload/v1770361110/rider-docs/cbvijiaquml9tjeekc7j.png",
    "panNumber": "ABCDE1234F",
    "panPhoto": "https://res.cloudinary.com/dpguxi28j/image/upload/v1770361114/rider-docs/ayvcivodv8h3noluim5d.png",
    "vehicleModel": "Royal Enfield Classic 350"
  }
}
```
#### Delete User
```http
DELETE /api/admin/users/:id
Response:
{
  "success": true,
  "message": "User deleted successfully",
  "data": {
    "notificationPreferences": {
      "email": true,
      "sms": true,
      "push": true,
      "offers": true
    },
    "_id": "69859055b69656891eb075c0",
    "name": "Ramesh",
    "email": "ramesh@gmail.com",
    "mobile": "9876543210",
    "address": "Arundalpet,Guntur,522601",
    "location": {
      "type": "Point",
      "coordinates": [
        80.4377261,
        16.3039416
      ]
    },
    "role": "manager",
    "isProfileComplete": true,
    "isActive": false,
    "loginAttempts": 0,
    "isLocked": false,
    "isApproved": true,
    "fcmToken": null,
    "managerId": null,
    "kind": "Rider",
    "vehicleType": "bike",
    "vehicleNumber": "TN-43-AB-1234",
    "licenseNumber": "DL-20240012345",
    "licenseExpiryDate": "2028-12-31T00:00:00.000Z",
    "aadharNumber": "1234 5678 90",
    "isOnline": true,
    "isOnDelivery": true,
    "totalDeliveries": 7,
    "totalEarnings": 124,
    "pendingEarnings": 0,
    "averageRating": 0,
    "ratingsCount": 1,
    "preferredZones": [],
    "maxDeliveriesPerDay": 30,
    "createdAt": "2026-02-06T06:55:17.382Z",
    "updatedAt": "2026-02-09T07:41:47.112Z",
    "aadharPhoto": "https://res.cloudinary.com/dpguxi28j/image/upload/v1770361111/rider-docs/gy4totmgwhmwvywnoj7i.png",
    "accountHolderName": "Ramesh",
    "bankAccountNumber": "50100123456789",
    "ifscCode": "HDFC0001234",
    "licensePhoto": "https://res.cloudinary.com/dpguxi28j/image/upload/v1770361110/rider-docs/cbvijiaquml9tjeekc7j.png",
    "panNumber": "ABCDE1234F",
    "panPhoto": "https://res.cloudinary.com/dpguxi28j/image/upload/v1770361114/rider-docs/ayvcivodv8h3noluim5d.png",
    "vehicleModel": "Royal Enfield Classic 350"
  }
}
```

### Categories
#### Get all categories
```http
GET /api/admin/categories
Response:
{
  "success": true,
  "count": 5,
  "data": [
    {
      "_id": "65c1a...",
      "name": "Beverages",
      "description": "Hot and cold drinks",
      "icon": "coffee-icon",
      "displayOrder": 1,
      "createdAt": "2024-02-09T10:00:00.000Z"
    }
  ],
  "pagination": {
    "current": 1,
    "totalPages": 1,
    "limit": 10,
    "totalItems": 5
  }
}
```
#### Get category by id
```http
GET /api/admin/categories/:id
Response:
{
  "success": true,
  "data": {
    "_id": "69785c05eef576a5fdef0d66",
    "name": "Hot Coffee",
    "description": "Hot coffee varieties.",
    "icon": "☕",
    "isActive": true,
    "displayOrder": 1,
    "__v": 0,
    "createdAt": "2026-01-27T06:32:37.411Z",
    "updatedAt": "2026-01-29T05:37:48.953Z"
  }
}
```
#### Create category
```http
POST /api/admin/categories
Body:
{
  "name": "New Category",
  "description": "Description",
  "icon": "🍵",
  "displayOrder": 1
}
Response:
{
  "success": true,
  "data": {
    "_id": "69785c05eef576a5fdef0d66",
    "name": "Hot Coffee",
    "description": "Hot coffee varieties.",
    "icon": "☕",
    "isActive": true,
    "displayOrder": 1,
    "__v": 0,
    "createdAt": "2026-01-27T06:32:37.411Z",
    "updatedAt": "2026-01-29T05:37:48.953Z"
  }
}
```
#### Update category
```http
PUT /api/admin/categories/:id
Body:
{
  "name": "Snacks",
  "displayOrder": 3
}
Response:
{
  "success": true,
  "message": "Category updated successfully",
  "data": {
    "_id": "65c1a...",
    "name": "Snacks",
    "description": "Hot and cold drinks",
    "icon": "coffee-icon",
    "displayOrder": 3
  }
}
```
#### Delete category
```http
DELETE /api/admin/categories/:id
Response:
{
    success: true,
    message: "Category deleted successfully"
}
```

### Products
#### Get all products
```http
GET /api/admin/products
Response:
{
  "success": true,
  "count": 2,
  "data": [
    {
      "_id": "69785c05eef576a5fdef0d7f",
      "name": "Burger",
      "slug": "burger",
      "image": "https://res.cloudinary.com/dpguxi28j/image/upload/v1770359429/category-images/qj9k5g5x5x5x5x5x5x5x.jpg",
      "description": "Delicious burger made with fresh ingredients",
      "isFeatured": true,
      "isActive": true,
      "createdAt": "2026-01-21T06:00:05.328Z",
      "updatedAt": "2026-01-21T06:00:05.328Z"
    },
    {
      "_id": "69785c05eef576a5fdef0d7e",
      "name": "Maggi",
      "slug": "maggi",
      "image": "https://res.cloudinary.com/dpguxi28j/image/upload/v1770359429/category-images/qj9k5g5x5x5x5x5x5x5x.jpg",
      "description": "Delicious maggi made with fresh ingredients",
      "isFeatured": true,
      "isActive": true,
      "createdAt": "2026-01-21T06:00:05.328Z",
      "updatedAt": "2026-01-21T06:00:05.328Z"
    }
  ],
  "pagination": {
    "current": 1,
    "totalPages": 1,
    "limit": 10,
    "totalItems": 2,
  }
}
```
#### Get product by id
```http
GET /api/admin/products/:id
Body:

Response:
{
  "success": true,
  "data": {
    "_id": "69785db22c02e75109f16a73",
    "name": "Lemon Corriander Soup",
    "description": "A tangy and refreshing soup with fresh coriander and lemon flavor.",
    "category": {
      "_id": "69785c05eef576a5fdef0d73",
      "name": "Soups",
      "description": "Hot soups",
      "icon": "🍲"
    },
    "price": 149,
    "image": "default-image.jpg",
    "isAvailable": true,
    "preparationTime": 10,
    "ingredients": [],
    "allergens": [],
    "inStock": true,
    "averageRating": 0,
    "totalRatings": 0,
    "orderCount": 0,
    "tags": [
      "must-try"
    ],
    "isSeasonal": false,
    "availableMonths": [],
    "sizeOptions": [],
    "variants": [],
    "__v": 0,
    "createdAt": "2026-01-27T06:39:46.886Z",
    "updatedAt": "2026-01-29T11:48:00.159Z",
    "displayPrice": 149,
    "id": "69785db22c02e75109f16a73"
  }
}
```
#### Get Products by category
```http
GET /api/admin/products/category/:categoryId
Response:
{
  "success": true,
  "count": 7,
  "data": [
    {
      "_id": "69785db22c02e75109f16a78",
      "name": "Broccoli Almond Soup",
      "description": "A nutritious soup with broccoli and almonds.",
      "category": {
        "_id": "69785c05eef576a5fdef0d73",
        "name": "Soups",
        "icon": "🍲"
      },
      "price": 169,
      "image": "default-image.jpg",
      "isAvailable": true,
      "preparationTime": 10,
      "ingredients": [],
      "allergens": [],
      "inStock": true,
      "averageRating": 0,
      "totalRatings": 0,
      "orderCount": 0,
      "tags": [
        "new-intro"
      ],
      "isSeasonal": false,
      "availableMonths": [],
      "sizeOptions": [],
      "variants": [],
      "__v": 0,
      "createdAt": "2026-01-27T06:39:46.888Z",
      "updatedAt": "2026-01-27T06:39:46.888Z",
      "displayPrice": 169,
      "id": "69785db22c02e75109f16a78"
    },
    {
      "_id": "69785db22c02e75109f16a76",
      "name": "Carrot Pumpkin Soup",
      "description": "A healthy and hearty soup made with carrots and pumpkin.",
      "category": {
        "_id": "69785c05eef576a5fdef0d73",
        "name": "Soups",
        "icon": "🍲"
      },
      "price": 159,
      "image": "default-image.jpg",
      "isAvailable": true,
      "preparationTime": 10,
      "ingredients": [],
      "allergens": [],
      "inStock": true,
      "averageRating": 0,
      "totalRatings": 0,
      "orderCount": 0,
      "tags": [],
      "isSeasonal": false,
      "availableMonths": [],
      "sizeOptions": [],
      "variants": [],
      "__v": 0,
      "createdAt": "2026-01-27T06:39:46.888Z",
      "updatedAt": "2026-01-27T06:39:46.888Z",
      "displayPrice": 159,
      "id": "69785db22c02e75109f16a76"
    },
    {
      "_id": "69785db22c02e75109f16a77",
      "name": "Creamy Mushroom Soup",
      "description": "A rich and velvety mushroom soup with cream.",
      "category": {
        "_id": "69785c05eef576a5fdef0d73",
        "name": "Soups",
        "icon": "🍲"
      },
      "price": 169,
      "image": "https://res.cloudinary.com/dpguxi28j/image/upload/v1769496151/products/nkm807o3k40wluny53b1.jpg",
      "isAvailable": true,
      "preparationTime": 10,
      "ingredients": [],
      "allergens": [],
      "inStock": true,
      "averageRating": 0,
      "totalRatings": 0,
      "orderCount": 0,
      "tags": [
        "new-intro"
      ],
      "isSeasonal": false,
      "availableMonths": [],
      "sizeOptions": [],
      "variants": [],
      "__v": 0,
      "createdAt": "2026-01-27T06:39:46.888Z",
      "updatedAt": "2026-01-27T06:42:30.027Z",
      "displayPrice": 169,
      "id": "69785db22c02e75109f16a77"
    },
    {
      "_id": "69785db22c02e75109f16a75",
      "name": "Creamy Roasted Tomato Basil Soup",
      "description": "A smooth and creamy soup with roasted tomatoes and fresh basil.",
      "category": {
        "_id": "69785c05eef576a5fdef0d73",
        "name": "Soups",
        "icon": "🍲"
      },
      "price": 159,
      "image": "https://res.cloudinary.com/dpguxi28j/image/upload/v1769496171/products/jbhdahibsh8dsoohxg9j.jpg",
      "isAvailable": true,
      "preparationTime": 10,
      "ingredients": [],
      "allergens": [],
      "inStock": true,
      "averageRating": 0,
      "totalRatings": 0,
      "orderCount": 0,
      "tags": [
        "new-intro"
      ],
      "isSeasonal": false,
      "availableMonths": [],
      "sizeOptions": [],
      "variants": [],
      "__v": 0,
      "createdAt": "2026-01-27T06:39:46.888Z",
      "updatedAt": "2026-01-27T06:42:49.511Z",
      "displayPrice": 159,
      "id": "69785db22c02e75109f16a75"
    },
    {
      "_id": "69785db22c02e75109f16a74",
      "name": "Hot and Sour Soup",
      "description": "A spicy and tangy Indo-Chinese soup with vegetables.",
      "category": {
        "_id": "69785c05eef576a5fdef0d73",
        "name": "Soups",
        "icon": "🍲"
      },
      "price": 149,
      "image": "default-image.jpg",
      "isAvailable": true,
      "preparationTime": 10,
      "ingredients": [],
      "allergens": [],
      "inStock": true,
      "averageRating": 0,
      "totalRatings": 0,
      "orderCount": 0,
      "tags": [
        "best-seller"
      ],
      "isSeasonal": false,
      "availableMonths": [],
      "sizeOptions": [],
      "variants": [],
      "__v": 0,
      "createdAt": "2026-01-27T06:39:46.888Z",
      "updatedAt": "2026-01-27T06:39:46.888Z",
      "displayPrice": 149,
      "id": "69785db22c02e75109f16a74"
    },
    {
      "_id": "69785db22c02e75109f16a73",
      "name": "Lemon Corriander Soup",
      "description": "A tangy and refreshing soup with fresh coriander and lemon flavor.",
      "category": {
        "_id": "69785c05eef576a5fdef0d73",
        "name": "Soups",
        "icon": "🍲"
      },
      "price": 149,
      "image": "default-image.jpg",
      "isAvailable": true,
      "preparationTime": 10,
      "ingredients": [],
      "allergens": [],
      "inStock": true,
      "averageRating": 0,
      "totalRatings": 0,
      "orderCount": 0,
      "tags": [
        "must-try"
      ],
      "isSeasonal": false,
      "availableMonths": [],
      "sizeOptions": [],
      "variants": [],
      "__v": 0,
      "createdAt": "2026-01-27T06:39:46.886Z",
      "updatedAt": "2026-01-29T11:48:00.159Z",
      "displayPrice": 149,
      "id": "69785db22c02e75109f16a73"
    },
    {
      "_id": "69785db22c02e75109f16a79",
      "name": "Manchow Soup",
      "description": "A thick and flavorful Indo-Chinese soup with crispy noodles on top.",
      "category": {
        "_id": "69785c05eef576a5fdef0d73",
        "name": "Soups",
        "icon": "🍲"
      },
      "price": 169,
      "image": "default-image.jpg",
      "isAvailable": true,
      "preparationTime": 10,
      "ingredients": [],
      "allergens": [],
      "inStock": true,
      "averageRating": 0,
      "totalRatings": 0,
      "orderCount": 0,
      "tags": [],
      "isSeasonal": false,
      "availableMonths": [],
      "sizeOptions": [],
      "variants": [],
      "__v": 0,
      "createdAt": "2026-01-27T06:39:46.888Z",
      "updatedAt": "2026-01-27T06:39:46.888Z",
      "displayPrice": 169,
      "id": "69785db22c02e75109f16a79"
    }
  ]
}
```
#### create products
```http
POST /api/admin/products
Response:
{
  "name": "Test Product",
  "description": "Description",
  "category": "CATEGORY_ID",
  "price": 299,
  "isAvailable": true,
  "ingredients": [
    "Tea Leaves"
  ],
  "allergens": [
    "None"
  ]
}
```
#### Create Product
```http
POST /api/admin/products
Body:
{
  "name": "Test Product",
  "description": "Description",
  "category": "CATEGORY_ID",
  "price": 299,
  "isAvailable": true,
  "ingredients": [
    "Tea Leaves"
  ],
  "allergens": [
    "None"
  ]
}
Response:
{
  "success": true,
  "data": {
    "_id": "69785db22c02e75109f16a73",
    "name": "Test Product",
    "description": "A tangy and refreshing soup with fresh coriander and lemon flavor.",
    "category": {
      "_id": "69785c05eef576a5fdef0d73",
      "name": "Soups",
      "description": "Hot soups",
      "icon": "🍲"
    },
    "price": 149,
    "image": "default-image.jpg",
    "isAvailable": true,
    "preparationTime": 10,
    "ingredients": [],
    "allergens": [],
    "inStock": true,
    "averageRating": 0,
    "totalRatings": 0,
    "orderCount": 0,
    "tags": [
      "must-try"
    ],
    "isSeasonal": false,
    "availableMonths": [],
    "sizeOptions": [],
    "variants": [],
    "__v": 0,
    "createdAt": "2026-01-27T06:39:46.886Z",
    "updatedAt": "2026-01-29T11:48:00.159Z",
    "displayPrice": 149,
    "id": "69785db22c02e75109f16a73"
  }
}
```
#### Update Product
```http
PUT /api/admin/products/:id
Body:
{
  "name": "Updated Product",
  "price": 399
}
Response:
{
  "success": true,
  "data": {
    "_id": "69785db22c02e75109f16a73",
    "name": "Test Product",
    "description": "A tangy and refreshing soup with fresh coriander and lemon flavor.",
    "category": {
      "_id": "69785c05eef576a5fdef0d73",
      "name": "Soups",
      "description": "Hot soups",
      "icon": "🍲"
    },
    "price": 149,
    "image": "default-image.jpg",
    "isAvailable": true,
    "preparationTime": 10,
    "ingredients": [],
    "allergens": [],
    "inStock": true,
    "averageRating": 0,
    "totalRatings": 0,
    "orderCount": 0,
    "tags": [
      "must-try"
    ],
    "isSeasonal": false,
    "availableMonths": [],
    "sizeOptions": [],
    "variants": [],
    "__v": 0,
    "createdAt": "2026-01-27T06:39:46.886Z",
    "updatedAt": "2026-01-29T11:48:00.159Z",
    "displayPrice": 149,
    "id": "69785db22c02e75109f16a73"
  }
}
```
#### Toggle availability
```http
PUT /api/admin/products/:id/availability
Body:
{
  "isAvailable": false
}
Response:
{
  "success": true,
  "data": {
    "_id": "69785db22c02e75109f16a73",
    "name": "Test Product",
    "description": "A tangy and refreshing soup with fresh coriander and lemon flavor.",
    "category": {
      "_id": "69785c05eef576a5fdef0d73",
      "name": "Soups",
      "description": "Hot soups",
      "icon": "🍲"
    },
    "price": 149,
    "image": "default-image.jpg",
    "isAvailable": false,
    "preparationTime": 10,
    "ingredients": [],
    "allergens": [],
    "inStock": true,
    "averageRating": 0,
    "totalRatings": 0,
    "orderCount": 0,
    "tags": [
      "must-try"
    ],
    "isSeasonal": false,
    "availableMonths": [],
    "sizeOptions": [],
    "variants": [],
    "__v": 0,
    "createdAt": "2026-01-27T06:39:46.886Z",
    "updatedAt": "2026-01-29T11:48:00.159Z",
    "displayPrice": 149,
    "id": "69785db22c02e75109f16a73"
  }
}
```
#### Bulk Update
```http
PUT /api/admin/products/bulk-update
Body:
{
  "productIds": [
    "695f9dd40680745ae36c938a",
    "695f9dd40680745ae36c938b"
  ],
  "updates": {
    "isAvailable": true
  }
}
Response:
{
  "success": true,
  "message": "Successfully updated 0 products",
  "data": {
    "matched": 0,
    "modified": 0
  }
}
```
#### Delete Product
```http
DELETE /api/admin/products/:id
Response:
{
  "success": true,
  "message": "Product deleted successfully"
}
```
#### Product stats
```http
GET /api/admin/products/stats
Response:
{
  "success": true,
  "data": {
    "totalProducts": 102,       
    "hiddenProducts": 5,        
    "newIntroProducts": 12,     
    "categoriesCount": 8        
  }
}
```
#### Seasonal products
```http
GET /api/admin/products/seasonal/all
Response:
{
  "success": true,
  "count": 2, // Total number of seasonal products found
  "data": [
    {
      "_id": "65c2f...",
      "name": "Winter Special Tea",
      "isSeasonal": true,
      "availableMonths": ["December", "January", "February"],
      "isAvailable": true,
      "price": 250,
      "image": "https://cloudinary.com/...",
      "category": {
        "_id": "65c1a...",
        "name": "Beverages",
        "icon": "coffee-icon"
      }
    },
    {
      "_id": "65c2g...",
      "name": "Summer Cooler",
      "isSeasonal": true,
      "availableMonths": ["May", "June", "July"],
      "isAvailable": false,
      "price": 180,
      "image": "https://cloudinary.com/...",
      "category": {
        "_id": "65c1a...",
        "name": "Beverages",
        "icon": "coffee-icon"
      }
    }
  ]
}
```
#### Out of season products
```http
GET /api/admin/products/seasonal/out-of-season
Response:
{
  "success": true,
  "data": [
    {
      "_id": "65c2g...",
      "name": "Summer Mango Shake",
      "isSeasonal": true,
      "availableMonths": ["April", "May", "June"],
      "isAvailable": true,
      "price": 150,
      "image": "https://cloudinary.com/...",
      "category": {
        "_id": "65c1a...",
        "name": "Beverages",
        "icon": "drink-icon"
      }
    }
  ],
  "count": 1,
  "currentMonth": "February" // The server's detected current month
}
```
#### Update product season
```http
PUT /api/admin/products/:id/season
Body:
{
  "isSeasonal": true,
  "availableMonths": ["January", "February", "March"]
}
Response:
{
  "success": true,
  "message": "Product seasonal settings updated successfully",
  "data": {
    "_id": "65c2f...",
    "name": "Iced Summer Tea",
    "isSeasonal": true,
    "availableMonths": ["June", "July", "August"],
    "isAvailable": true,
    "price": 200,
    "category": {
      "_id": "65c1a...",
      "name": "Beverages",
      "icon": "tea-icon"
    }
    // ... other product fields
  }
}
```

### Activity Log
#### Get all activity log
```http
GET /api/admin/activity-logs
Response:
{
  "success": true,
  "count": 50,
  "data": [
    {
      "_id": "65c3h...",
      "admin": {
        "_id": "65c1a...",
        "name": "Admin User",
        "email": "admin@example.com",
        "role": "admin"
      },
      "action": "update",
      "resource": "product",
      "resourceId": "65c2f...",
      "details": { "name": "Iced Summer Tea" },
      "ip": "127.0.0.1",
      "userAgent": "Mozilla/5.0...",
      "createdAt": "2024-02-09T10:00:00.000Z"
    }
  ],
  "pagination": {
    "current": 1,
    "totalPages": 5,
    "limit": 50,
    "totalItems": 245
  }
}
```
#### Get activity statistics
```http
GET /api/admin/activity-logs/stats
Response:
{
  "success": true,
  "data": {
    "totalLogs": 1540,
    "todayLogs": 25,
    "actionBreakdown": [
      { "_id": "update", "count": 850 },
      { "_id": "create", "count": 420 }
    ],
    "resourceBreakdown": [
      { "_id": "product", "count": 1100 },
      { "_id": "order", "count": 300 }
    ],
    "topAdmins": [
      {
        "admin": { "name": "John Doe", "email": "john@example.com", "role": "admin" },
        "activityCount": 150
      }
    ]
  }
}
```
#### Export logs
```http
GET /api/admin/activity-logs/export
Response:
{
  "success": true,
  "count": 150,
  "data": [...], // Array of activity log objects
  "exportDate": "2024-02-09T19:02:44.000Z"
}
```
#### Get logs by specific admin
```http
GET /api/admin/activity-logs/admin/:adminId
Response:
{
  "success": true,
  "count": 10,
  "data": [...],
  "pagination": { "current": 1, "totalPages": 1, "totalItems": 10 }
}
```
#### Get single activity log by id
```http
GET /api/admin/activity-logs/:id
Response:
{
  "success": true,
  "data": {
    "_id": "65c3h...",
    "admin": { "name": "Admin User", ... },
    "action": "delete",
    "resource": "category",
    ...
  }
}
```

### Cart analytics
#### Get cart analytics
```http
GET /api/admin/cart-analytics
Response:
{
  "success": true,
  "data": {
    "totalActiveCarts": 15,          
    "totalAbandonedCarts": 8,       
    "emptyCartsCount": 20,          
    "averageCartValue": 450.75,     
    "totalItemsInCarts": 54,        
    "popularCartItems": [           
      {
        "productId": "65c2f...",
        "name": "Classic Assam Tea",
        "inCartsCount": 12,         
        "totalQuantity": 18         
      }
    ],
    "lastUpdated": "2024-02-09T19:12:38.000Z"
  }
}
```
#### Get abandoned carts
```http
GET /api/admin/cart-analytics/abandoned
Response:
{
  "success": true,
  "data": {
    "abandonedCarts": [
      {
        "userId": "65c1a...",
        "userName": "John Doe",
        "userMobile": "9876543210",
        "items": [
          {
            "product": "65c2f...",
            "name": "Green Tea",
            "quantity": 2,
            "price": 200
          }
        ],
        "subtotal": 400,
        "itemCount": 1,
        "lastUpdated": "2024-02-01T10:00:00.000Z",
        "daysAbandoned": 8
      }
    ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 3,
      "totalAbandoned": 25,
      "limit": 10
    }
  }
}
```

### Contact 
#### Get all contact messages
```http
GET /api/admin/contact
Response:
{
  "success": true,
  "count": 2,
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 2,
    "pages": 1
  },
  "data": [
    {
      "_id": "65c4m...",
      "name": "Jane Smith",
      "email": "jane@example.com",
      "mobile": "9876543210",
      "subject": "Inquiry about catering",
      "message": "Do you provide catering for corporate events?",
      "status": "new",
      "createdAt": "2024-02-09T12:00:00.000Z"
    }
  ]
}
```
#### update message status
```http
PUT /api/admin/contact/:id/status
Body:
{
  "status": "read"
}
Response:
{
  "success": true,
  "data": {
    "_id": "65c4m...",
    "name": "Jane Smith",
    "status": "read",
    ...
  }
}
```
#### Delete contact message
```http
DELETE /api/admin/contact/:id
Response:
{
  "success": true,
  "data":{}
}
```

### Customers
#### Get customer statistics 
```http
GET /api/admin/customers/stats
Response:
{
  "success": true,
  "data": {
    "totalCustomers": 150,
    "activeCustomers": 142,
    "inactiveCustomers": 8,
    "newCustomersToday": 5,
    "customersWithOrders": 98
  }
}
```
#### Get all customers
```http
GET /api/admin/customers
Response:
{
  "success": true,
  "count": 20,
  "data": [
    {
      "_id": "65c3p...",
      "name": "John Doe",
      "email": "john@example.com",
      "mobile": "9876543210",
      "isActive": true,
      "orderCount": 5,
      "totalSpent": 1250.50,
      "createdAt": "2024-01-15T10:00:00.000Z"
    }
  ],
  "pagination": {
    "current": 1,
    "totalPages": 8,
    "limit": 20,
    "totalItems": 150
  }
}
```
#### Get single customer by id
```http
GET /api/admin/customers/:id
Response:
{
  "success": true,
  "data": {
    "_id": "65c3p...",
    "name": "John Doe",
    "email": "john@example.com",
    "mobile": "9876543210",
    "role": "customer",
    "isActive": true,
    "wishlist": [...],
    "stats": {
      "orderCount": 5,
      "totalSpent": 1250.50,
      "pendingOrders": 1,
      "completedOrders": 4,
      "cancelledOrders": 0
    }
  }
}
```
#### Get customer order history
```http
GET /api/admin/customers/:id/orders
Response:
{
  "success": true,
  "count": 5,
  "data": [...], // Array of full order objects
  "pagination": { ... }
}
```
#### Toggle customer status
```http
PUT /api/admin/customers/:id/status
Body:
{
  "isActive": false
}
Response:
{
  "success": true,
  "message": "Customer deactivated successfully",
  "data": { "isActive": false, ... }
}
```
#### Delete customer
```http
DELETE /api/admin/customers/:id
Response:
{
  "success": true,
  "message": "Customer deleted successfully"
}
```

### Deliveries
#### Get delivery statistics
```http
GET /api/admin/deliveries/stats
Response:
{
  "success": true,
  "data": {
    "totalDeliveries": 120,
    "activeDeliveries": 15,          
    "completedDeliveries": 95,       
    "cancelledDeliveries": 10,       
    "totalEarnings": 4500.50         
  }
}
```
#### Get deliveries with filters
```http
GET /api/admin/deliveries
Response:
{
  "success": true,
  "data": [
    {
      "_id": "65c3q...",
      "orderId": {
        "_id": "65c2p...",
        "orderNumber": "ORD-1234",
        "total": 500,
        "status": "delivered"
      },
      "riderId": {
        "_id": "65c1r...",
        "name": "Rider One",
        "mobile": "9998887776"
      },
      "customerId": {
        "_id": "65c3p...",
        "name": "John Doe",
        "mobile": "9876543210"
      },
      "status": "delivered",
      "totalEarning": 50.00,
      "createdAt": "2024-02-09T10:00:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "totalPages": 12,
    "totalItems": 120
  }
}
```
#### Get single delivery by id
```http
GET /api/admin/deliveries/:id
Response:
{
  "success": true,
  "data": {
    "_id": "65c3q...",
    "orderId": { ... }, // Full order object
    "riderId": { "name": "Rider One", "mobile": "9998887776" },
    "customerId": { "name": "John Doe", "mobile": "9876543210" },
    "distance": 4.5,
    "status": "delivered",
    "deliveryTime": "2024-02-09T10:30:00.000Z",
    ...
  }
}
```

### Managers
#### Get all managers
```http
GET /api/admin/managers
Response:
{
  "success": true,
  "data": {
    "managers": [
      {
        "_id": "65c3r...",
        "name": "Manager Name",
        "email": "manager@example.com",
        "mobile": "9998887776",
        "isApproved": true,
        "isActive": true,
        "createdAt": "2024-02-09T10:00:00.000Z"
      }
    ],
    "pagination": {
      "current": 1,
      "totalPages": 1,
      "totalItems": 1,
      "limit": 10
    }
  }
}
```
#### Get pending managers
```http
GET /api/admin/managers/pending
Response:
{
  "success": true,
  "data": [
    {
      "_id": "65c3s...",
      "name": "Applicant Name",
      "email": "applicant@example.com",
      "isApproved": null,
      ...
    }
  ],
  "count": 1
}
```
#### Approve manager
```http
PUT /api/admin/managers/:id/approve
Response:
{
  "success": true,
  "message": "Manager approved successfully",
  "data": { "isApproved": true, "isActive": true, ... }
}
```
#### Reject manager
```http
PUT /api/admin/managers/:id/reject
Body:
{
  "reason": "Insufficient credentials" 
}
Response:
{
  "success": true,
  "message": "Manager rejected successfully",
  "data": { "isApproved": false, "isActive": false, ... }
}
```
#### Toggle manager status
```http
PUT /api/admin/managers/:id/status
Body:
{
  "isActive": false
}
Response:
{
  "success": true,
  "message": "Manager deactivated successfully",
  "data": { "isActive": false, ... }
}
```
#### Delete manager
```http
DELETE /api/admin/managers/:id
Response:
{
  "success": true,
  "message": "Manager deleted successfully"
}
```

### Orders
#### Get order statistics
```http
GET /api/admin/orders/stats
Response:
{
  "success": true,
  "data": {
    "totalOrders": 245,
    "pendingOrders": 12,
    "deliveredOrders": 180,
    "cancelledOrders": 15,
    "inProgressOrders": 38,
    "todayRevenue": 15450.75
  }
}
```
#### Get all orders
```http
GET /api/admin/orders
Response:
{
  "success": true,
  "data": [
    {
      "_id": "65c2p...",
      "orderNumber": "ORD-1234",
      "customerId": { "name": "John Doe", ... },
      "total": 500,
      "status": "confirmed",
      ...
    }
  ],
  "pagination": { "page": 1, "totalPages": 25, "totalItems": 245 }
}
```
#### Get single order by id
```http
GET /api/admin/orders/:id
Response:
{
  "success": true,
  "data": {
    "_id": "65c3q...",
    "orderNumber": "ORD-1234",
    "customer": { "name": "John Doe", "mobile": "9876543210" },
    "rider": { "name": "Rider One", "mobile": "9998887776" },
    "items": [...],
    "total": 500,
    "status": "delivered",
    "paymentStatus": "paid",
    "createdAt": "2024-02-09T10:00:00.000Z"
  }
}
```
#### Update order status
```http
PUT /api/admin/orders/:id/status
Body:
{
  "status": "confirmed",
  "cancelReason": "Optional reason if status is cancelled"
}
Response:
{
  "success": true,
  "message": "Order status updated successfully",
  "data": { "status": "confirmed", ... }
}
```
#### Update payment status
```http
PUT /api/admin/orders/:id/payment
Body:
{
  "paymentStatus": "paid"
}
Response:
{
  "success": true,
  "message": "Payment status updated successfully",
  "data": { "paymentStatus": "paid", ... }
}
```
#### Assign delivery rider
```http
PUT /api/admin/orders/:id/assign-rider
Body:
{
  "riderId": "65c3r..."
}
Response:
{
  "success": true,
  "message": "Rider assigned successfully",
  "data": { "riderId": "65c3r...", ... }
}
```
#### Cancel order
```http
PUT /api/admin/orders/:id/cancel
Body:
{
  "cancelReason": "Optional reason if status is cancelled"
}
Response:
{
  "success": true,
  "message": "Order cancelled successfully",
  "data": { "status": "cancelled", ... }
}
```
#### Get single order by id
```http
GET /api/admin/orders/:id
Response:
{
  "success": true,
  "data": {
    "_id": "65c3q...",
    "orderNumber": "ORD-1234",
    "customer": { "name": "John Doe", "mobile": "9876543210" },
    "rider": { "name": "Rider One", "mobile": "9998887776" },
    "items": [...],
    "total": 500,
    "status": "delivered",
    "paymentStatus": "paid",
    "createdAt": "2024-02-09T10:00:00.000Z"
  }
}
```

### Payouts
#### Get payout statistics
```http
GET /api/admin/payouts/stats
Response:
{
  "success": true,
  "data": [
    {
      "riderId": "65c1r...",
      "riderName": "Rider One",
      "riderMobile": "9998887776",
      "totalAmount": 1250,        
      "count": 25,              
      "lastDeliveryDate": "2024-02-09T15:00:00.000Z"
    }
  ]
}
```
#### Process payout
```http
POST /api/admin/payouts/process
Body:
{
  "riderId": "65c1r...",
  "payoutReference": "TRANS-998877" 
}
Response:
{
  "success": true,
  "message": "Successfully processed payout for 25 deliveries",
  "data": {
    "deliveriesUpdated": 25
  }
}
```

### Profile
#### Get current admin profile
```http
GET /api/admin/profile
Response:
{
  "success": true,
  "data": {
    "user": {
      "id": "65c1a...",
      "name": "Admin Name",
      "mobile": "9876543210",
      "email": "admin@example.com",
      "address": "Outlet Location, Guntur",
      "location": { "type": "Point", "coordinates": [80.43, 16.30] },
      "role": "admin",
      "isProfileComplete": true,
      "isActive": true,
      "createdAt": "2024-01-01T10:00:00.000Z",
      "updatedAt": "2024-02-09T19:43:00.000Z"
    }
  }
}
```
#### Update admin profile
```http
PUT /api/admin/profile
Body:
{
  "name": "Updated Admin Name",
  "email": "newadmin@example.com",
  "address": "New Office Address, Guntur"
}
Response:
{
  "success": true,
  "message": "Profile updated successfully",
  "data": {
    "user": {
      "id": "65c1a...",
      "name": "Updated Admin Name",
      "mobile": "9876543210",
      "email": "newadmin@example.com",
      "address": "New Office Address, Guntur",
      "isProfileComplete": true,
      "updatedAt": "2024-02-09T19:43:34.000Z"
      ...
    }
  }
}
```

### Reviews
#### Get review statistics
```http
GET /api/admin/reviews/stats
Response:
{
  "success": true,
  "data": {
    "totalReviews": 150,
    "approvedReviews": 120,
    "pendingReviews": 30,
    "averageFoodRating": "4.5",
    "averageRiderRating": "4.8",
    "averageProductRating": "4.4",
    "averageSiteRating": "4.2",
    "totalSiteReviews": 10
  }
}
```
#### Get all reviews with filters
```http
GET /api/admin/reviews
Response:
{
  "success": true,
  "data": {
    "reviews": [
      {
        "_id": "65c3v...",
        "customerId": { "name": "John Doe", "mobile": "9876543210" },
        "orderId": { "orderNumber": "ORD-1234" },
        "foodRating": 5,
        "comment": "Tastes great!",
        "isApproved": true,
        "createdAt": "2024-02-09T10:00:00.000Z"
      }
    ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 8,
      "total": 150,
      "limit": 20
    }
  }
}
```
#### Get rider reviews
```http
GET /api/admin/reviews/rider/:riderId
Response:
{
  "success": true,
  "data": {
    "reviews": [...],
    "averageRating": 4.8,
    "totalReviews": 45,
    "pagination": { ... }
  }
}
```
#### Get single review by id
```http
GET /api/admin/reviews/:reviewId
Response:
{
  "success": true,
  "data": {
    "_id": "65c3v...",
    "customerId": { "name": "John Doe", "mobile": "9876543210" },
    "orderId": { "orderNumber": "ORD-1234" },
    "foodRating": 5,
    "comment": "Tastes great!",
    "isApproved": true,
    "createdAt": "2024-02-09T10:00:00.000Z"
  }
}
```
#### approve review
```http
PUT /api/admin/reviews/:reviewId/approve
Response:
{
  "success": true,
  "message": "Review approved successfully",
  "data": { "isApproved": true, ... }
}
```
#### reject review
```http
PUT /api/admin/reviews/:reviewId/reject
Response:
{
  "success": true,
  "message": "Review rejected successfully",
  "data": { "isApproved": false, ... }
}
```
#### delete review
```http
DELETE /api/admin/reviews/:reviewId
Response:
{
  "success": true,
  "message": "Review deleted successfully"
}
```

### Riders
#### Get all riders
```http
GET /api/admin/riders
Response:
{
  "success": true,
  "data": {
    "riders": [
      {
        "_id": "65c3t...",
        "name": "Rider Name",
        "email": "rider@example.com",
        "mobile": "9998887777",
        "isApproved": true,
        "isActive": true,
        "totalEarnings": 1500,        
        "pendingEarnings": 250,      
        "createdAt": "2024-02-09T10:00:00.000Z"
        ...
      }
    ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 2,
      "totalRiders": 15,
      "limit": 10
    }
  }
}
```
#### Get pending riders
```http
GET /api/admin/riders/pending
Response:
{
  "success": true,
  "data": [
    {
      "_id": "65c3u...",
      "name": "Applicant Rider",
      "isApproved": false,
      ...
    }
  ],
  "count": 1
}
```
#### Get rider by id
```http
GET /api/admin/riders/:id
Response:
{
  "success": true,
  "data": {
    "_id": "65c3t...",
    "name": "Rider Name",
    "totalEarnings": 1500,
    "pendingEarnings": 250,
    ...
  }
}
```
#### Approve rider
```http
PUT /api/admin/riders/:id/approve
Response:
{
  "success": true,
  "message": "Rider approved successfully",
  "data": { "isApproved": true, ... }
}
```
#### Reject rider
```http
PUT /api/admin/riders/:id/reject
Body:
{
  "rejectionReason": "Invalid documentation" 
}
Response:
{
  "success": true,
  "message": "Rider approval revoked",
  "data": { "isApproved": false, "rejectionReason": "Invalid documentation", ... }
}
```
#### Toggle rider status
```http
PUT /api/admin/riders/:id/status
Body:
{
  "isActive": false
}
Response:
{
  "success": true,
  "message": "Rider deactivated successfully",
  "data": { "isActive": false, ... }
}
```
#### Delete rider
```http
DELETE /api/admin/riders/:id
Response:
{
  "success": true,
  "message": "Rider deleted successfully"
}
```

### Settings
#### Get application settings
```http
GET /api/admin/settings
Response:
{
  "success": true,
  "data": {
    "_id": "65c1a...",
    "deliveryCharge": 20,
    "maxDeliveryDistance": 10,
    "gstRate": 5,
    "minOrderAmount": 100,
    "riderBaseEarning": 20,
    "distanceBonusPerKm": 5,
    "contactPhone": "9876543210",
    "contactEmail": "support@example.com",
    "address": "Outlet Address, Guntur",
    "operatingHours": "9:00 AM - 10:00 PM",
    "socialMedia": { "facebook": "...", "instagram": "..." },
    "serviceAreas": [...] // Array of delivery zones
  }
}
```
#### Update application settings
```http
PUT /api/admin/settings
Body:
{
  "deliveryCharge": 25,
  "maxDeliveryDistance": 15,
  "gstRate": 7,
  "minOrderAmount": 150,
  "riderBaseEarning": 25,
  "distanceBonusPerKm": 7,
  "contactPhone": "9876543210",
  "contactEmail": "support@example.com",
  "address": "Outlet Address, Guntur",
  "operatingHours": "9:00 AM - 10:00 PM",
  "socialMedia": { "facebook": "...", "instagram": "..." },
  "serviceAreas": [...]
}
Response:
{
  "success": true,
  "message": "Settings updated successfully",
  "data": { ... }
}
```
#### Get delivery zones
```http
GET /api/admin/settings/delivery-zones
Response:
{
  "success": true,
  "data": [
    {
      "name": "Zone A",
      "radius": 5,
      "center": { "lat": 16.30, "lng": 80.43 },
      "isActive": true
    }
  ]
}
```
#### Update delivery zones
```http
PUT /api/admin/settings/delivery-zones
Body:
{
  "serviceAreas": [
    { "name": "Zone A", "radius": 5, ... },
    { "name": "Zone B", "radius": 10, ... }
  ]
}
Response:
{
  "success": true,
  "message": "Delivery zones updated successfully",
  "data": { ... }
}
```
### Images
#### Upload single image
```http
POST /api/admin/uploads/image
Response:
{
  "success": true,
  "message": "Image uploaded successfully",
  "data": {
    "url": "https://res.cloudinary.com/...",
    "publicId": "teasntrees/abc123",
    "width": 800,
    "height": 600,
    "format": "jpg"
  }
}
```
#### Upload multiple images
```http
POST /api/admin/uploads/images
Response:
{
  "success": true,
  "message": "Images uploaded successfully",
  "data": [
    {
      "url": "https://res.cloudinary.com/...",
      "publicId": "teasntrees/abc123",
      "width": 800,
      "height": 600,
      "format": "jpg"
    },
    {
      "url": "https://res.cloudinary.com/...",
      "publicId": "teasntrees/def456",
      "width": 800,
      "height": 600,
      "format": "jpg"
    }
  ]
}
```
#### Delete image
```http
DELETE /api/admin/uploads/image
Body:
{
  "publicId": "teasntrees/abc123"
}
Response:
{
  "success": true,
  "message": "Image deleted successfully"
}
```

## Customers
### Address
#### Reverse geocode
```http
GET /api/customer/address/reverse-geocode
Response:
{
  "success": true,
  "data": {
    "addressLine": "123, Tea Street, Guntur, AP",
    "city": "Guntur",
    "pincode": "522001",
    ...
  }
}
```
#### Get all addresses
```http
GET /api/customer/address
Response:
{
  "success": true,
  "data": [
    {
      "_id": "65c3w...",
      "label": "Home",
      "addressLine": "123 Tea Street, Guntur",
      "isDefault": true,
      "location": { "type": "Point", "coordinates": [80.43, 16.30] }
    }
  ]
}
```
#### Add new address
```http
POST /api/customer/address
Body:
{
  "label": "Office",          
  "addressLine": "456 Tree Ave", 
  "flatNo": "2B",
  "street": "Tree Ave",
  "area": "Guntur East",
  "city": "Guntur",
  "pincode": "522002",
  "location": { "type": "Point", "coordinates": [80.45, 16.32] },
  "isDefault": false
}
Response:
{
  "success": true,
  "message": "Address added successfully",
  "data": { ... }
}
```
#### Update address
```http
PUT /api/customer/address/:addressId
Body:
{
  "label": "Office",          
  "addressLine": "456 Tree Ave", 
  "flatNo": "2B",
  "street": "Tree Ave",
  "area": "Guntur East",
  "city": "Guntur",
  "pincode": "522002",
  "location": { "type": "Point", "coordinates": [80.45, 16.32] },
  "isDefault": false
}
Response:
{
  "success": true,
  "message": "Address updated successfully",
  "data": { ... }
}
```
#### set default address
```http
PUT /api/customer/address/:addressId/default
Response:
{
  "success": true,
  "message": "Default address set successfully",
  "data": { ... }
}
```
#### Delete address
```http
DELETE /api/customer/address/:addressId
Response:
{
  "success": true,
  "message": "Address deleted successfully"
}
```

### Authentication
#### Send OTP
```http
POST /api/customer/auth/send-otp
Body:
{
  "mobile": "9876543210"
}
Response:
{
  "success": true,
  "message": "OTP sent successfully",
  "data": {
    "mobile": "9876543210",
    "expiresIn": "10 minutes",
    "otp": "123456" 
  }
}
```
#### Verify OTP
```http
POST /api/customer/auth/verify-otp
Body:
{
  "mobile": "9876543210",
  "otp": "123456"
}
Response:
{
  "success": true,
  "message": "Login successful",
  "data": {
    "token": "access_token_here",
    "refreshToken": "refresh_token_here",
    "user": { "id": "...", "name": "...", "mobile": "...", "isProfileComplete": true }
  }
}
```
#### Another case
Response:
```http
{
  "success": true,
  "message": "OTP verified. Please complete your profile.",
  "data": { "mobile": "9876543210", "isNewUser": true, "isProfileComplete": false }
}
```
#### Complete profile
```http
POST /api/customer/auth/complete-profile
Body:
{
  "mobile": "9876543210", 
  "name": "Jane Doe",
  "email": "jane@example.com",
  "address": "Guntur East, AP",
  "location": { "type": "Point", "coordinates": [80.43, 16.30] }
}
Response:
{
  "success": true,
  "message": "Profile completed successfully",
  "data": {
    "token": "...",
    "refreshToken": "...",
    "user": { ... }
  }
}
```
#### Refresh token
```http
POST /api/customer/auth/refresh-token
Body:
{
  "refreshToken": "refresh_token_here"
}
Response:
{
  "success": true,
  "message": "Token refreshed successfully",
  "data": {
    "token": "access_token_here",
    "refreshToken": "refresh_token_here"
  }
}
```
#### Logout
```http
POST /api/customer/auth/logout
Body:
{
  "refreshToken": "refresh_token_here"
}
Response:
{
  "success": true,
  "message": "Logout successful"
}
```

### Cart
#### Get cart
```http
GET /api/customer/cart
Response:
{
  "success": true,
  "data": {
    "items": [
      {
        "_id": "65c3y...",
        "product": { "name": "Assam Tea", "price": 150, "image": "...", "isAvailable": true },
        "quantity": 2,
        "price": 150,
        "customization": "500g"
      }
    ],
    "subtotal": 300,
    "itemCount": 1
  }
}
```
#### Add to cart
```http
POST /api/customer/cart/add
Body:
{
  "productId": "65c1p...",    
  "quantity": 1,              
  "customization": "500g"     
}
Response:
{
  "success": true,
  "message": "Product added to cart",
  "data": { ... }
}
```
#### Update cart item
```http
PUT /api/customer/cart/item/:productId
Body:
{
  "quantity": 3
}
Response:
{
  "success": true,
  "message": "Cart item updated successfully",
  "data": { ... }
}
```
#### Remove from cart
```http
DELETE /api/customer/cart/item/:itemId
Response:
{
  "success": true,
  "message": "Product removed from cart"
}
```
#### Clear cart
```http
DELETE /api/customer/cart/clear
Response:
{
  "success": true,
  "message": "Cart cleared successfully"
}
```
#### Checkout
```http
POST /api/customer/cart/checkout
Body:
{
  "deliveryAddress": {
    "address": "123 Tea Street, Guntur",
    "location": { "type": "Point", "coordinates": [80.43, 16.30] } 
  },
  "deliveryInstructions": "Leave at front gate", 
  "paymentMethod": "COD"                        
}
Response:
{
  "success": true,
  "message": "Order placed successfully",
  "data": {
    "orderNumber": "ORD-123456",
    "orderId": "65c4z...",
    "total": 357.5, 
    "status": "pending"
  }
}
```

### Categories
#### Get all categories
```http
GET /api/customer/categories
Response:
{
  "success": true,
  "data": [
    {
      "_id": "65c1c...",
      "name": "Tea",
      "slug": "tea",
      "image": "https://...",
      "description": "Premium tea collection",
      "isActive": true,
      "createdAt": "2024-01-01...",
      "updatedAt": "2024-02-09..."
    },
    ...
  ]
}
```
#### Get category by id
```http
GET /api/customer/categories/:id
Response:
{
  "success": true,
  "data": {
    "_id": "65c1c...",
    "name": "Tea",
    ...
  }
}
```
### Deliveries
#### Get my deliveries
```http
GET /api/customer/deliveries
Response:
{
  "success": true,
  "data": [
    {
      "deliveryId": "65c3a...",
      "deliveryNumber": "DEL-1234",
      "status": "picked_up",
      "rider": {
        "name": "Rider Name",
        "mobile": "9988776655",
        "location": { "type": "Point", "coordinates": [80.43, 16.30] }
      },
      "estimatedArrival": 12, 
      "order": { "orderNumber": "ORD-5678", "total": 450 },
      "statusHistory": [
        { "status": "waiting_for_rider", "timestamp": "..." },
        { "status": "assigned", "timestamp": "..." },
        { "status": "picked_up", "timestamp": "..." }
      ],
      "deliveryOtp": "4321" 
    }
  ]
}
```
#### Track specific delivery
```http
GET /api/customer/deliveries/:deliveryId/track
Response:
{
  "success": true,
  "data": {
    "deliveryId": "65c3a...",
    "deliveryNumber": "DEL-1234",
    "status": "picked_up",
    "rider": {
      "name": "Rider Name",
      "mobile": "9988776655",
      "location": { "type": "Point", "coordinates": [80.43, 16.30] }
    },
    "estimatedArrival": 12, 
    "order": { "orderNumber": "ORD-5678", "total": 450 },
    "statusHistory": [
      { "status": "waiting_for_rider", "timestamp": "..." },
      { "status": "assigned", "timestamp": "..." },
      { "status": "picked_up", "timestamp": "..." }
    ],
    "deliveryOtp": "4321" 
  }
}
```
#### Get deivery by order id
```http
GET /api/customer/deliveries/order/:orderId
Response:
{
  "success": true,
  "data": {
    "deliveryId": "65c3a...",
    "deliveryNumber": "DEL-1234",
    "status": "picked_up",
    "rider": {
      "name": "Rider Name",
      "mobile": "9988776655",
      "location": { "type": "Point", "coordinates": [80.43, 16.30] }
    },
    "estimatedArrival": 12, 
    "order": { "orderNumber": "ORD-5678", "total": 450 },
    "statusHistory": [
      { "status": "waiting_for_rider", "timestamp": "..." },
      { "status": "assigned", "timestamp": "..." },
      { "status": "picked_up", "timestamp": "..." }
    ],
    "deliveryOtp": "4321" 
  }
}
```

### Orders
#### Create Order
```http
POST /api/customer/orders
Body:
{
  "items": [
    { "product": "65c1p...", "quantity": 1, "customization": "Medium" }
  ],
  "deliveryAddress": "123 Tea St, Guntur",
  "deliveryInstructions": "Ring the bell",
  "paymentMethod": "COD"
}
Response:
{
  "success": true,
  "message": "Order placed successfully",
  "data": {
    "orderNumber": "ORD-123456",
    "orderId": "65c4z...",
    "total": 357.5, 
    "status": "pending"
  }
}
```
#### Get my orders
```http
GET /api/customer/orders/my-orders
Response:
{
  "success": true,
  "data": {
    "orders": [
      {
        "_id": "65c4z...",
        "orderNumber": "ORD-123456",
        "status": "pending",
        "items": [...],
        "total": 357.5,
        "createdAt": "2024-02-09T..."
      }
    ],
    "pagination": { "page": 1, "totalPages": 5, "total": 45 }
  }
}
```
#### Reorder
```http
POST /api/customer/orders/:orderId/reorder
Body:
{
  "items": [
    {
      "product": "65c1p...",    
      "quantity": 2,            
      "price": 150,             
      "customization": "Medium" 
    }
  ],
  "deliveryAddress": "123 Tea St, Guntur", 
  "deliveryInstructions": "Ring the bell",  
  "paymentMethod": "COD"                   
}
Response:
{
  "success": true,
  "data": {
    "orderId": "65c4z...",
    "orderNumber": "ORD-123456",
    "status": "pending",
    "total": 357.5
  }
}
```
#### Download invoice
```http
GET /api/customer/orders/:orderId/invoice
Response:
{
  "success": true,
  "data": {
    "invoice": "https://..."
  }
}
```
#### Get order by id
```http
GET /api/customer/orders/:orderId
Response:
{
  "success": true,
  "data": {
    "_id": "65c4z...",
    "orderNumber": "ORD-123456",
    "status": "pending",
    "items": [...],
    "subtotal": 300,
    "deliveryCharge": 50,
    "tax": 7.5,
    "total": 357.5,
    "delivery": { // (Included if rider is assigned)
      "status": "assigned",
      "deliveryNumber": "DEL-123",
      "rider": { "name": "...", "mobile": "..." },
      "deliveryOtp": null // Only revealed when status is 'in_transit'
    }
  }
}
```
#### Cancel order
```http
DELETE /api/customer/orders/:orderId/cancel
Body:
{
  "reason": "Ordered by mistake" 
}
Response:
{
  "success": true,
  "message": "Order cancelled",
  "data": { "orderNumber": "ORD-123456" }
}
```
#### Download invoice
```http
GET /api/customer/orders/:orderId/invoice
Response:
{
  "success": true,
  "data": {
    "invoice": "https://..."
  }
}
```

### Products
#### Get all products
```http
GET /api/customer/products
Response:
{
  "success": true,
  "data": {
    "products": [
      {
        "_id": "651a...",
        "name": "Classic Assam Tea",
        "description": "Bold and malty...",
        "price": 150,
        "image": "https://...",
        "category": { "name": "Tea", "description": "...", "icon": "..." },
        "tags": ["new-intro"],
        "isAvailable": true
      }
    ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 5,
      "totalProducts": 98,
      "limit": 20
    }
  }
}
```
#### Get product by category
```http
GET /api/customer/products/category/:categoryId
Response:
{
  "success": true,
  "data": {
    "products": [...],
    "pagination": {
      "currentPage": 1,
      "totalPages": 2,
      "totalProducts": 15
    }
  }
}
```
#### Get product by id
```http
GET /api/customer/products/:id
Response:
{
  "success": true,
  "data": {
    "_id": "651a...",
    "name": "Classic Assam Tea",
    "price": 150,
    "sizeOptions": [
      { "size": "250g", "price": 150 },
      { "size": "500g", "price": 280 }
    ],
    "category": { "name": "Tea", ... },
    "isAvailable": true,
    "availabilitySeason": ["January", "February", "..."]
  }
}
```

### Profile
#### Get profile
```http
GET /api/customer/profile
Response:
{
  "success": true,
  "data": {
    "user": {
      "id": "651a...",
      "name": "Jane Doe",
      "mobile": "9876543210",
      "email": "jane@example.com",
      "address": "123 Tea Lane, Guntur",
      "location": { "type": "Point", "coordinates": [80.43, 16.30] },
      "profileImage": "https://...",
      "notificationPreferences": { "email": true, "sms": false, "push": true },
      "role": "customer",
      "isProfileComplete": true,
      "isActive": true,
      "createdAt": "2024-01-01...",
      "updatedAt": "2024-02-09..."
    }
  }
}
```
#### Update profile
```http
PUT /api/customer/profile
Body:
{
  "name": "Jane Updated",
  "email": "jane.new@example.com",
  "address": "456 New St, Guntur East",
  "profileImage": "https://...",
  "notificationPreferences": {
    "push": false
  }
}
Response:
{
  "success": true,
  "message": "Profile updated successfully",
  "data": { "user": { ... } }
}
```

### Reviews
#### Create review
```http
POST /api/customer/reviews
Body:
{
  "orderId": "65c4z...",     
  "foodRating": 5,           
  "riderRating": 4,          
  "review": "Great food!",   
  "images": ["url1", "url2"] 
}
Response:
{
  "success": true,
  "message": "Review added successfully",
  "data": { "review": { ... } }
}
```
#### Get reviews by site
```http
GET /api/customer/reviews/
Body:
{
  "rating": 5,               
  "comment": "Easy to use!",  
  "images": []
}
Response:
{
  "success": true,
  "data": {
    "reviews": [...]
  }
}
```
#### Rate specific product
```http
POST /api/customer/reviews/product
Body:
{
  "productId": "65c1p...",    
  "orderId": "65c4z...",      
  "rating": 5,               
  "review": "Taste is amazing"
}
Response:
{
  "success": true,
  "message": "Review added successfully",
  "data": { "review": { ... } }
}
```
#### Get my reviews
```http
GET /api/customer/reviews/my-reviews
Response:
{
  "success": true,
  "data": {
    "reviews": [
      {
        "_id": "...",
        "type": "order",
        "foodRating": 5,
        "review": "Excellent",
        "orderId": { "orderNumber": "ORD-123", "total": 450 },
        "productId": { "name": "Assam Tea", "image": "..." }
      }
    ],
    "pagination": { "currentPage": 1, "totalPages": 1, "total": 8 }
  }
}
```

### Settings
#### Get public settings
```http
GET /api/customer/settings
Response:
{
  "success": true,
  "data": {
    "deliveryCharge": 20,
    "minOrderAmount": 100,
    "taxRate": 5,
    "operatingHours": { "open": "09:00", "close": "22:00" },
    "contactPhone": "+91 9876543210",
    "contactEmail": "support@teasntrees.com",
    "address": "Guntur East, Andhra Pradesh",
    "socialMedia": { "instagram": "@teasntrees", "facebook": "..." },
    "maxDeliveryDistance": 10
  }
}
```

### Images
#### Upload single image
```http
POST /api/customer/upload/image
Body:
{
  "image": "data:image/jpeg;base64,..." 
}
Response:
{
  "success": true,
  "message": "Image uploaded successfully",
  "data": {
    "url": "https://cloudinary.com/...",
    "publicId": "teasntrees/...",
    "width": 800,
    "height": 600,
    "format": "jpg"
  }
}
```
#### Upload multiple images
```http
POST /api/customer/upload/images
Body:
{
  "images": ["data:image/jpeg;base64,...", "data:image/jpeg;base64,..."] 
}
Response:
{
  "success": true,
  "message": "3 Images uploaded successfully",
  "data": [
    { "url": "...", "publicId": "...", ... },
    { "url": "...", "publicId": "...", ... },
    ...
  ]
}
```
#### Delete image
```http
DELETE /api/customer/upload/image
Body:
{
  "publicId": "teasntrees/..." 
}
Response:
{
  "success": true,
  "message": "Image deleted successfully"
}
```

### Wishlist
#### Get wishlist
```http
GET /api/customer/wishlist
Response:
{
  "success": true,
  "data": [
    {
      "_id": "65c1p...",
      "name": "Assam Black Tea",
      "price": 150,
      "image": "https://...",
      "isAvailable": true
    },
    ...
  ]
}
```
#### Add to wishlist
```http
POST /api/customer/wishlist/add
Body:
{
  "productId": "65c1p..." 
}
Response:
{
  "success": true,
  "message": "Product added to wishlist",
  "data": [ /* updated wishlist array */ ]
}
```
#### Remove from wishlist
```http
DELETE /api/customer/wishlist/remove/:productId
Response:
{
  "success": true,
  "message": "Product removed from wishlist",
  "data": [ /* updated wishlist array */ ]
}
```

## Managers
### Authentication
#### Send OTP
```http
POST /api/manager/auth/send-otp
Body:
{
  "mobile": "9876543210"
}
Response:
{
  "success": true,
  "message": "OTP sent successfully",
  "data": {
    "mobile": "9876543210",
    "expiresIn": "10 minutes",
    "otp": "123456" // Only returned in development mode
  }
}
```
#### Verify OTP
```http
POST /api/manager/auth/verify-otp
Body:
{
  "mobile": "9876543210",
  "otp": "123456"
}
Response:
{
  "success": true,
  "message": "Login successful",
  "data": {
    "token": "...",
    "refreshToken": "...",
    "user": { "id": "...", "name": "...", "role": "manager", "isProfileComplete": true }
  }
}
```
#### Complete profile
```http
POST /api/manager/auth/complete-profile
Body:
{
  "mobile": "9876543210",
  "name": "Manager Name",
  "email": "manager@example.com",
  "address": "Manager Office Block"
}
Response:
{
  "success": true,
  "message": "Profile completed. Please wait for Admin approval to log in.",
  "data": { 
    "user": { "id": "...", "role": "manager", "isApproved": false, "isProfileComplete": true } 
  }
}
```
#### Refresh access token
```http
POST /api/manager/auth/refresh-token
Body:
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
Response:
{
  "success": true,
  "message": "Access token refreshed successfully",
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```
#### Logout
```http
POST /api/manager/auth/logout
Response:
{
  "success": true,
  "message": "Logout successful"
}
```

### Customers
#### Get all customers
```http
GET /api/manager/customers
Response:
{
  "success": true,
  "data": {
    "customers": [
      {
        "_id": "651a...",
        "name": "Jane Doe",
        "email": "jane@example.com",
        "mobile": "9876543210",
        "role": "customer",
        "isActive": true,
        "isProfileComplete": true,
        "createdAt": "2024-01-01..."
      }
    ],
    "pagination": {
      "current": 1,
      "totalPages": 5,
      "totalItems": 45,
      "limit": 10
    }
  }
}
```
#### Get customer orders
```http
GET /api/manager/customers/:id/orders
Response:
{
  "success": true,
  "data": [
    {
      "_id": "65c4z...",
      "orderNumber": "ORD-123456",
      "status": "delivered",
      "total": 450,
      "items": [...],
      "riderId": { "_id": "...", "name": "Rider Name" },
      "createdAt": "2024-02-01..."
    }
  ]
}
```

### Dshaboard
#### Get dashboard stats
```http
GET /api/manager/dashboard/stats
Response:
{
  "success": true,
  "data": {
    "overview": {
      "ordersToday": 12,
      "salesToday": 4500.50,
      "pendingOrders": 3,
      "delayedOrders": 1
    },
    "riders": {
      "active": 8,
      "online": 5,
      "list": [{ "name": "...", "isOnline": true }, ...]
    },
    "inventory": { "lowStock": 2 },
    "recentOrders": [ /* last 5 orders */ ]
  }
}
```

### Deliveries
#### Get active deliveries
```http
GET /api/manager/deliveris/active
Response:
{
  "success": true,
  "data": [
    {
      "deliveryNumber": "DEL-123",
      "status": "in_transit",
      "riderId": { "name": "Rider X", "currentLocation": { "coordinates": [80.12, 16.34] } },
      "orderId": { "orderNumber": "ORD-456", "total": 350 },
      "estimatedTime": 15
    }
  ]
}
```

### Orders
#### Get all orders
```http
GET /api/manager/orders
Response:
{
  "success": true,
  "data": [
    {
      "_id": "65c4z...",
      "orderNumber": "ORD-123456",
      "status": "pending",
      "total": 450,
      "customerId": { "name": "Jane Doe", "mobile": "9876543210" },
      "riderId": null,
      "createdAt": "2024-02-09T..."
    }
  ],
  "pagination": { "page": 1, "totalPages": 5, "total": 45 }
}
```
#### Get order details
```http
GET /api/manager/orders/:orderId
Response:
{
  "success": true,
  "data": {
    "_id": "65c4z...",
    "orderNumber": "ORD-123456",
    "status": "preparing",
    "items": [...],
    "subtotal": 400,
    "deliveryCharge": 50,
    "total": 450,
    "customerId": { "name": "...", "mobile": "...", "email": "..." },
    "riderId": { "name": "...", "mobile": "..." },
    "deliveryAddress": { ... },
    "timeline": [ { "status": "pending", "timestamp": "...", "description": "..." }, ... ]
  }
}
```
#### Update order status
```http
PUT /api/manager/orders/:orderId/status
Body:
{
  "status": "preparing" 
}
Response:
{
  "success": true,
  "message": "Order status updated successfully",
  "data": { "_id": "...", "orderNumber": "...", "status": "preparing", "updatedAt": "..." }
}
```
#### Assign rider to order
```http
PUT /api/manager/orders/:orderId/assign-rider
Body:
{
  "riderId": "65c4z..." 
}
Response:
{
  "success": true,
  "message": "Rider assigned successfully",
  "data": { "_id": "...", "orderNumber": "...", "riderId": "...", "updatedAt": "..." }
}
```

### Products
#### Get all products
```http
GET /api/manager/products
Response:
{
  "success": true,
  "data": [
    {
      "_id": "651a...",
      "name": "Classic Assam Tea",
      "price": 150,
      "category": { "_id": "...", "name": "Tea" },
      "isAvailable": true,
      "image": "..."
    }
  ],
  "pagination": {
    "current": 1,
    "totalPages": 5,
    "totalItems": 98
  }
}
```
#### Toggle product availability
```http
PATCH /api/manager/products/:id/availability
Body:
{
  "isAvailable": false
}
Response:
{
  "success": true,
  "message": "Product availability toggled successfully",
  "data": { "_id": "...", "name": "...", "isAvailable": false, "updatedAt": "..." }
}
```
#### Update product
```http
PUT /api/manager/products/:id
Body:
{
  "price": 160,
  "description": "Premium tea from Assam",
  "sizeOptions": [
    { "size": "250g", "price": 160 }
  ]
}
Response:
{
  "success": true,
  "message": "Product updated",
  "data": { ... }
}
```

### Profile
#### Get profile
```http
GET /api/manager/profile
Response:
{
  "success": true,
  "data": {
    "_id": "651a...",
    "name": "Manager Name",
    "mobile": "9876543210",
    "email": "manager@example.com",
    "address": "Manager Office Block",
    "role": "manager",
    "isApproved": true,
    "isProfileComplete": true,
    "isActive": true,
    "createdAt": "2024-01-01...",
    "updatedAt": "2024-02-09..."
  }
}
```
#### Update profile
```http
PUT /api/manager/profile
Body:
{
  "name": "Manager Updated",
  "email": "manager.new@example.com",
  "address": "New Office Block, Guntur"
}
Response:
{
  "success": true,
  "message": "Profile updated successfully",
  "data": { 
    "_id": "651a...",
    "name": "Manager Updated",
    "email": "manager.new@example.com",
    "address": "New Office Block, Guntur",
    ...
  }
}
```

### Riders
#### Get all riders
```http
GET /api/manager/riders
Response:
{
  "success": true,
  "data": [
    {
      "_id": "651a...",
      "name": "Rider John",
      "mobile": "9876543210",
      "vehicleType": "bike",
      "isApproved": true,
      "isActive": true,
      "isOnline": true,
      "isBusy": true, 
      "averageRating": 4.5
    }
  ]
}
```
#### Approve rider
```http
PUT /api/manager/riders/:id/approve
Response:
{
  "success": true,
  "message": "Rider approved and assigned",
  "data": { ... approved rider object ... }
}
```
#### Suspend rider
```http
PUT /api/manager/riders/:id/suspend
Body:
{
  "reason": "Repeated delivery delays" 
}
Response:
{
  "success": true,
  "message": "Rider suspended"
}
```
#### Reject rider
```http
DELETE /api/manager/riders/:id/reject
Response:
{
  "success": true,
  "message": "Rider application rejected"
}
```