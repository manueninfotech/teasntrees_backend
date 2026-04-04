# Teasntrees LittleH - System Documentation

## 1. System Architecture

The **Teasntrees LittleH** platform is a full-stack Food Delivery Application built using a Monorepo structure. It comprises three distinct applications sharing a single backend and database:

1.  **Backend API**: A Node.js/Express server acting as the central nervous system, managing data, authentication, and business logic.
2.  **Admin Panel**: A React-based web dashboard for business owners to manage products, orders, riders, and settings.
3.  **Customer App**: A client-facing application (structure implied) for users to browse menus and place orders.
4.  **Rider App**: A mobile-focused interface (structure implied) for delivery personnel to receive and fulfill orders.

### 1.1 Tech Stack
*   **Backend:** Node.js, Express.js, Socket.io (Real-time), Mongoose (ODM).
*   **Database:** MongoDB (Atlas/Local).
*   **Admin Frontend:** React.js, Vite, TailwindCSS (Styling), HeadlessUI (Components), Recharts (Analytics).
*   **Authentication:** JWT (JSON Web Tokens) with Access/Refresh rotation.
*   **Security:** Helmet, Express-Rate-Limit, BCrypt.js, XSS-Clean.
*   **External Services:** Cloudinary (Media), Twilio (SMS/OTP).

---

## 2. Setup & Installation

### 2.1 Prerequisites
*   Node.js (v18+ recommended)
*   MongoDB (Local running on port 27017 or Atlas URI)
*   Git

### 2.2 Installation
To set up the project locally:

1.  **Clone the Repository:**
    ```bash
    git clone <repository-url>
    cd teasntrees_littleh_backend
    ```

2.  **Install Dependencies:**
    Navigate to each folder and install packages.
    ```bash
    # Backend
    cd backend
    npm install

    # Admin Panel
    cd ../admin-panel
    npm install
    ```

3.  **Environment Configuration:**
    Create a `.env` file in the `backend` directory with the following keys:
    ```env
    PORT=5000
    MONGODB_URI=mongodb://localhost:27017/teasntrees
    JWT_SECRET=your_jwt_secret_key
    JWT_REFRESH_SECRET=your_refresh_secret_key
    CLIENT_URL=http://localhost:5173
    CLOUDINARY_CLOUD_NAME=...
    CLOUDINARY_API_KEY=...
    CLOUDINARY_API_SECRET=...
    TWILIO_ACCOUNT_SID=...
    TWILIO_AUTH_TOKEN=...
    TWILIO_PHONE_NUMBER=...
    ```

### 2.3 Running the Application
*   **Start Backend:** `npm run dev` (Runs on Port 5000)
*   **Start Admin Panel:** `npm run dev` (Runs on Port 5173)
*   **Seed Database:**
    *   `npm run seed:admin` (Create initial admin user)
    *   `npm run seed:categories` (Populate default categories)

---

## 3. Security & Error Handling

### 3.1 Security Measures
*   **Authentication:** All protected routes require a valid Bearer Token.
*   **Role-Based Access:** Middleware restricts endpoints to specific roles (`admin`, `rider`, `customer`).
*   **Data Validation:** `express-validator` and Mongoose Schemas ensure data integrity.
*   **Helmet:** Secure HTTP headers.
*   **Rate Limiting:** Protects against brute-force and DDoS attacks.

### 3.2 Error Handling Standard
The API follows a standardized JSON error response format:

```json
{
  "success": false,
  "message": "Descriptive error message",
  "errors": [
    {
      "field": "email",
      "message": "Invalid email address"
    }
  ]
}
```
*   **400 Bad Request:** Validation errors or missing fields.
*   **401 Unauthorized:** Missing or invalid token.
*   **403 Forbidden:** Valid token but insufficient permissions.
*   **404 Not Found:** Resource does not exist.
*   **500 Internal Server Error:** Unexpected server-side issues.

---

## 4. Admin Panel Frontend Architecture

The Admin Panel is a Single Page Application (SPA) designed for performance and usability.

### 4.1 Key Directories (`admin-panel/src`)
*   **`/components`**: Reusable UI elements (e.g., `Sidebar`, `Header`, `StatsCard`, `Modal`).
*   **`/pages`**: Route-specific views (e.g., `Dashboard`, `Products`, `Orders`, `Riders`).
*   **`/context`**: Global state management (AuthContext, SocketContext).
*   **`/utils`**: Helper functions and API clients (Axios interceptors).

### 4.2 Key Features
*   **Dashboard:** Real-time metrics using `Recharts` for Orders and Revenue.
*   **Map Integration:** `Leaflet` maps for tracking Active Deliveries and Rider locations.
*   **Real-time Updates:** `Socket.io-client` listens for `order:new` and `rider:update` events to auto-refresh UI.
*   **Image Management:** Drag-and-drop uploads for Product images.

---

## 5. Database Models

The following tables detail the **complete** schema definitions for the MongoDB database, including all fields, types, and default values.

### 1.1 User (Base Model)
**Collection:** `users`
*Base entity for all user types (Admin, Customer, Rider, Manager).*

| Field | Type | Required | Default | Description |
|:---|:---|:---|:---|:---|
| `name` | String | No | `null` | Full name of the user. Trimmed. |
| `email` | String | No | `null` | Email address. Unique, Sparse, Lowercase, Trimmed. |
| `mobile` | String | Yes | - | 10-digit mobile number. Unique, Trimmed. Validated. |
| `address` | String | No | `null` | Basic address field. |
| `location` | Object | No | `null` | Generic location object. |
| `role` | String | Yes | - | Enum: `admin`, `customer`, `rider`, `manager`. |
| `isProfileComplete` | Boolean | No | `false` | Flag for profile completion check. |
| `isActive` | Boolean | No | `true` | Controls execution/login rights. |
| `loginAttempts` | Number | No | `0` | Counter for failed login attempts. |
| `lockUntil` | Date | No | - | Timestamp until account is locked. |
| `isLocked` | Boolean | No | `false` | Account lockout status. |
| `isApproved` | Boolean | No | `null` | `null` for Cust/Admin, Boolean for Rider/Manager. |
| `fcmToken` | String | No | `null` | Firebase Cloud Messaging token. |
| `createdAt` | Date | - | - | Auto-generated timestamp. |
| `updatedAt` | Date | - | - | Auto-generated timestamp. |

### 1.2 Customer (Extends User)
**Discriminator Key:** `kind: 'Customer'`

| Field | Type | Required | Default | Description |
|:---|:---|:---|:---|:---|
| `addresses` | Array | - | `[]` | List of delivery addresses. |
| `addresses.$.label` | String | Yes | - | Tag (e.g., "Home"). Trimmed. |
| `addresses.$.addressLine`| String | Yes | - | Full address text. Trimmed. |
| `addresses.$.location` | Object | - | - | GeoJSON `{ type: 'Point', coordinates: [0,0] }`. |
| `addresses.$.isDefault` | Boolean | No | `false` | Primary address flag. |
| `wishlist` | ObjectId[] | - | `[]` | Array of `Product` IDs. |
| `notificationPreferences`| Object | - | - | Preference flags. |
| `...email` | Boolean | No | `true` | Email alerts. |
| `...sms` | Boolean | No | `true` | SMS alerts. |
| `...push` | Boolean | No | `true` | Push notifications. |
| `...offers` | Boolean | No | `true` | Marketing offers. |

### 1.3 Rider (Extends User)
**Discriminator Key:** `kind: 'Rider'`

| Field | Type | Required | Default | Description |
|:---|:---|:---|:---|:---|
| `vehicleType` | String | Yes | - | Enum: `bike`, `scooter`, `bicycle`, `electric_scooter`. |
| `vehicleNumber` | String | Yes | - | Registration plate. Trimmed. |
| `vehicleModel` | String | No | - | Model of the vehicle. Trimmed. |
| `licenseNumber` | String | Yes | - | Driving License ID. |
| `licenseExpiryDate` | Date | Yes | - | DL Expiry Date. |
| `licensePhoto` | String | No | - | URL to DL image. |
| `aadharNumber` | String | Yes | - | Identity Proof ID. |
| `aadharPhoto` | String | No | - | URL to Identity Proof image. |
| `panNumber` | String | No | - | PAN Card ID. |
| `panPhoto` | String | No | - | URL to PAN image. |
| `bankAccountNumber` | String | No | - | Payout Bank Account No. |
| `ifscCode` | String | No | - | Bank IFSC. |
| `accountHolderName` | String | No | - | Name on Bank Account. |
| `emergencyContact` | Object | - | - | Emergency contact info. |
| `...name` | String | No | - | Contact Name. |
| `...mobile` | String | No | - | Contact Mobile. |
| `...relation` | String | No | - | Relationship to rider. |
| `isOnline` | Boolean | No | `false` | Availability to work. |
| `isOnDelivery` | Boolean | No | `false` | Busy status. |
| `currentLocation` | Object | - | `Point` | GeoJSON `{ type: 'Point', coordinates: [0,0], lastUpdated }`. |
| `totalDeliveries` | Number | No | `0` | Count of completed orders. |
| `totalEarnings` | Number | No | `0` | Total lifetime earnings. |
| `pendingEarnings` | Number | No | `0` | Earnings not yet paid out. |
| `averageRating` | Number | No | `0` | Aggregate customer rating. |
| `ratingsCount` | Number | No | `0` | Number of ratings received. |
| `preferredZones` | String[] | - | `[]` | List of preferred areas. |
| `maxDeliveriesPerDay` | Number | No | `30` | Cap on daily orders. |

### 1.4 Product
**Collection:** `products`

| Field | Type | Required | Default | Description |
|:---|:---|:---|:---|:---|
| `name` | String | Yes | - | Product Name. Trimmed. |
| `description` | String | Yes | - | Product Description. |
| `category` | ObjectId | Yes | - | Ref to `Category`. |
| `price` | Number | No | `0` | Base Price. Min 0. |
| `image` | String | No | `default...`| Image URL. |
| `isAvailable` | Boolean | No | `true` | Stock availability. |
| `preparationTime` | Number | No | `10` | Prep time in minutes. |
| `ingredients` | String[] | - | `[]` | List of ingredients. |
| `allergens` | String[] | - | `[]` | List of allergens. |
| `inStock` | Boolean | No | `true` | Inventory status. |
| `stockQuantity` | Number | No | - | Count of items in stock. |
| `averageRating` | Number | No | `0` | 0-5 Star rating. |
| `totalRatings` | Number | No | `0` | Count of reviews. |
| `orderCount` | Number | No | `0` | Times ordered. |
| `tags` | String[] | - | `[]` | Enum: `new-intro`, `must-try`, `best-seller`, `egg-contains`. |
| `isSeasonal` | Boolean | No | `false` | Seasonal item flag. |
| `availableMonths` | Number[] | - | `[]` | Months 1-12. Validated. |
| `sizeOptions` | Array | - | `[]` | `{ size: String, price: Number }`. |
| `variants` | Array | - | `[]` | `{ name: String, price: Number }`. |
| `createdBy` | ObjectId | - | - | Ref to Admin `User`. |

### 1.5 Category
**Collection:** `categories`

| Field | Type | Required | Default | Description |
|:---|:---|:---|:---|:---|
| `name` | String | Yes | - | Category Name. Unique. Trimmed. |
| `description` | String | No | - | Description text. |
| `icon` | String | No | - | Icon URL/Identifier. |
| `isActive` | Boolean | No | `true` | Visibility status. |
| `displayOrder` | Number | No | `0` | Sorting order integer. |

### 1.6 Order
**Collection:** `orders`

| Field | Type | Required | Default | Description |
|:---|:---|:---|:---|:---|
| `orderNumber` | String | Unique | - | Auto-generated (e.g. `ORD000001`). |
| `customerId` | ObjectId | Yes | - | Ref to `User`. |
| `items` | Array | - | - | Order Line Items. |
| `...product` | ObjectId | - | - | Ref to `Product`. |
| `...name` | String | - | - | Snapshot of Product Name. |
| `...quantity` | Number | - | - | Ordered Quantity. |
| `...price` | Number | - | - | Snapshot of Unit Price. |
| `...customization` | String | - | - | Custom notes. |
| `subtotal` | Number | - | - | Total of items. |
| `deliveryCharge` | Number | - | - | Delivery fee. |
| `tax` | Number | - | - | Tax amount. |
| `total` | Number | Yes | - | Grand Total. |
| `deliveryAddress` | Object | - | - | Snapshot of address data. |
| `riderId` | ObjectId | - | - | Ref to `User` (Rider). |
| `riderEarning` | Number | - | - | Amount earned by rider. |
| `status` | String | No | `pending` | Enum: `pending`, `confirmed`, `accepted`, `preparing`, `ready`, `assigned`, `picked_up`, `out-for-delivery`, `in_transit`, `delivered`, `cancelled`. |
| `paymentMethod` | String | Yes | - | `COD` or `Online`. |
| `paymentStatus` | String | No | `pending` | `pending`, `paid`, `refunded`. |
| `foodRating` | Number | - | - | 1-5 Rating. |
| `riderRating` | Number | - | - | 1-5 Rating. |
| `review` | String | - | - | Text review. |
| `specialInstructions`| String | - | - | Customer note. |
| `estimatedDeliveryTime`| Date | - | - | ETA. |
| `confirmedAt` | Date | - | - | Timestamp. |
| `outForDeliveryAt` | Date | - | - | Timestamp. |
| `deliveredAt` | Date | - | - | Timestamp. |
| `cancelReason` | String | - | - | Reason for cancellation. |

### 1.7 Delivery
**Collection:** `deliveries`

| Field | Type | Required | Default | Description |
|:---|:---|:---|:---|:---|
| `deliveryNumber` | String | Unique | - | Auto-generated (e.g. `DEL000001`). |
| `orderId` | ObjectId | Yes | - | Ref to `Order`. |
| `riderId` | ObjectId | Yes | - | Ref to `Rider`. |
| `customerId` | ObjectId | Yes | - | Ref to `User`. |
| `pickupLocation` | Object | - | - | `{ coordinates: [0,0], address }`. |
| `deliveryLocation` | Object | - | - | `{ coordinates: [0,0], address }`. |
| `distance` | Number | Yes | - | Trip distance in km. |
| `estimatedTime` | Number | - | - | Time in minutes. |
| `status` | String | No | `assigned`| Enum: `assigned`, `accepted`, `rejected`, `heading_to_pickup`, `arrived_at_pickup`, `picked_up`, `in_transit`, `arrived`, `delivered`, `cancelled`. |
| `assignedAt` | Date | - | `now` | Timestamp. |
| `acceptedAt` | Date | - | - | Timestamp. |
| `rejectedAt` | Date | - | - | Timestamp. |
| `pickedUpAt` | Date | - | - | Timestamp. |
| `deliveredAt` | Date | - | - | Timestamp. |
| `cancelledAt` | Date | - | - | Timestamp. |
| `pickupOtp` | String | - | - | Verification OTP. |
| `deliveryOtp` | String | - | - | Verification OTP. |
| `baseEarning` | Number | Yes | - | Base fee. |
| `distanceBonus` | Number | No | `0` | Extra for distance. |
| `surgeBonus` | Number | No | `0` | Extra for demand. |
| `tipAmount` | Number | No | `0` | Customer Tip. |
| `totalEarning` | Number | Yes | - | Total pay. |
| `isPaid` | Boolean | No | `false` | Payout status. |
| `paidAt` | Date | - | - | Payout time. |
| `rating` | Number | - | - | 1-5 Rating from customer. |
| `feedback` | String | - | - | Text feedback. |
| `notes` | String | - | - | Rider notes. |
| `cancelReason` | String | - | - | Cancellation reason. |
| `rejectionReason` | String | - | - | Why rider rejected. |
| `deliveryProof` | String | - | - | URL to proof image. |

### 1.8 Settings
**Collection:** `settings`

| Field | Type | Required | Default | Description |
|:---|:---|:---|:---|:---|
| `deliveryCharge` | Number | No | `20` | Base shipping cost. |
| `maxDeliveryDistance`| Number | No | `10` | Max radius in km. |
| `minimumOrderValue` | Number | No | `100` | Min cart total. |
| `taxPercentage` | Number | No | `5` | Tax rate %. |
| `operatingHours` | Object | - | - | Schedule by day (Mon-Sun). |
| `...open` | String | - | `09:00` | Opening time. |
| `...close` | String | - | `22:00` | Closing time. |
| `...isOpen` | Boolean | - | `true` | Is shop open. |
| `serviceAreas` | Array | - | `[]` | `{ name, coordinates, deliveryCharge }`. |
| `riderBaseEarning` | Number | No | `15` | Flat fee per order. |
| `distanceBonusPerKm` | Number | No | `5` | Variable fee per km. |
| `contactPhone` | String | - | - | Support phone. |
| `contactEmail` | String | - | - | Support email. |
| `address` | String | - | - | Cafe address. |
| `socialMedia` | Object | - | - | FB/Insta/Twitter links. |
| `updatedBy` | ObjectId | - | - | Ref to Admin `User`. |

### 1.9 Cart
**Collection:** `carts`

| Field | Type | Required | Default | Description |
|:---|:---|:---|:---|:---|
| `userId` | ObjectId | Yes | - | Unique Customer Ref. |
| `items` | Array | - | `[]` | Cart Items. |
| `...product` | ObjectId | Yes | - | Ref to `Product`. |
| `...name` | String | - | - | Product Name. |
| `...quantity` | Number | Yes | `1` | Count. Min 1. |
| `...price` | Number | Yes | - | Unit Price. |
| `...customization` | String | No | `''` | Custom notes. |
| `subtotal` | Number | - | `0` | Calculated total. |

### 1.10 Review
**Collection:** `reviews`

| Field | Type | Required | Default | Description |
|:---|:---|:---|:---|:---|
| `orderId` | ObjectId | Yes | - | Order Ref. Unique per order. |
| `customerId` | ObjectId | Yes | - | Customer Ref. |
| `productId` | ObjectId | Yes | - | Product Ref. |
| `riderId` | ObjectId | Yes | - | Rider Ref. |
| `foodRating` | Number | - | - | 1-5 Stars. |
| `riderRating` | Number | - | - | 1-5 Stars. |
| `productRating` | Number | - | - | 1-5 Stars. |
| `review` | String | - | - | Text (Max 500 chars). |
| `images` | String[] | - | `[]` | Review photos. |
| `isVerifiedPurchase`| Boolean | No | `true` | Verified badge. |
| `isApproved` | Boolean | No | `true` | Moderation status. |

### 1.11 OTP
**Collection:** `otps`

| Field | Type | Required | Default | Description |
|:---|:---|:---|:---|:---|
| `mobile` | String | Yes | - | 10-digit number. Unique. |
| `otp` | String | Yes | - | The code. |
| `expiresAt` | Date | Yes | `now+5m`| Expiry time. TTL Index. |
| `verified` | Boolean | No | `false` | Verification status. |
| `attempts` | Number | No | `0` | Retry count. |

### 1.12 ActivityLog
**Collection:** `activitylogs`

| Field | Type | Required | Default | Description |
|:---|:---|:---|:---|:---|
| `admin` | ObjectId | Yes | - | Admin `User` Ref. |
| `action` | String | Yes | - | Enum: `create`, `update`, `delete`, `activate`, `deactivate`, `login`, `logout`, `assign`, `cancel`. |
| `resource` | String | Yes | - | Enum: `user`, `product`, `category`, `order`, `delivery`, `settings`, `auth`. |
| `resourceId` | ObjectId | No | - | Affected Document ID. |
| `details` | Object | No | `{}` | Context data. |
| `ipAddress` | String | - | - | Requester IP. |
| `userAgent` | String | - | - | Browser info. |
| `success` | Boolean | No | `true` | Outcome. |
| `errorMessage` | String | - | - | Failure reason. |


### 1.13 RefreshToken
**Collection:** `refreshtokens`

| Field | Type | Required | Default | Description |
|:---|:---|:---|:---|:---|
| `token` | String | Yes | - | Unique Token String. |
| `user` | ObjectId | Yes | - | User Ref. |
| `expiresAt` | Date | Yes | - | Expiry. TTL Index. |
| `isRevoked` | Boolean | No | `false` | Revocation status. |
| `revokedAt` | Date | - | - | Timestamp. |
| `replacedBy` | String | - | - | Token rotation link. |
| `ipAddress` | String | - | - | Creator IP. |
| `userAgent` | String | - | - | Creator User Agent. |

---

## 2. API Endpoints

### 2.1 Admin API
**Base Path:** `/api/admin`
**Auth:** Requires `Authorization: Bearer <token>` and Admin role.

| Method | Endpoint | Description |
|:---|:---|:---|
| **Auth** | | |
| `POST` | `/auth/send-otp` | Send login OTP. |
| `POST` | `/auth/verify-otp` | Verify OTP and issue Token. |
| `POST` | `/auth/complete-profile` | Set name/email for admin. |
| `POST` | `/auth/refresh-token` | Refresh expired access tokens. |
| `POST` | `/auth/logout` | End session. |
| **Dashboard** | | |
| `GET` | `/dashboard/stats` | High-level counts (Orders, Revenue). |
| `GET` | `/dashboard/revenue` | Revenue series for charts. |
| `GET` | `/dashboard/top-products` | Best-selling products. |
| `GET` | `/dashboard/recent-orders` | Latest 5-10 orders. |
| **Products** | | |
| `GET` | `/products` | List all products. |
| `GET` | `/products/seasonal/all` | List all seasonal items. |
| `GET` | `/products/seasonal/out-of-season`| List unavailable seasonal items. |
| `GET` | `/products/category/:categoryId`| Get products by category ID. |
| `POST` | `/products` | Create new product. |
| `PUT` | `/products/bulk-update` | Update multiple products. |
| `GET` | `/products/:id` | Get single product. |
| `PUT` | `/products/:id` | Update product. |
| `DELETE` | `/products/:id` | Delete product. |
| `PUT` | `/products/:id/availability` | Toggle in/out of stock. |
| `PUT` | `/products/:id/season` | Update seasonal availability. |
| **Categories** | | |
| `GET` | `/categories` | List all categories. |
| `POST` | `/categories` | Create category. |
| `GET` | `/categories/:id` | Get category details. |
| `PUT` | `/categories/:id` | Update category. |
| `DELETE` | `/categories/:id` | Delete category. |
| **Orders** | | |
| `GET` | `/orders` | List orders. |
| `GET` | `/orders/stats` | Order count summaries. |
| `GET` | `/orders/:id` | Get full order details. |
| `PUT` | `/orders/:id/status` | Update order workflow status. |
| `PUT` | `/orders/:id/payment-status` | Manually update payment. |
| `PUT` | `/orders/:id/assign-rider` | Manual rider assignment. |
| `PUT` | `/orders/:id/cancel` | Cancel order. |
| **Deliveries** | | |
| `GET` | `/deliveries` | List active/past deliveries. |
| `GET` | `/deliveries/stats` | Delivery metrics. |
| `GET` | `/deliveries/:id` | Get delivery tracking info. |
| `PUT` | `/deliveries/:id/status` | Manual status update. |
| `PUT` | `/deliveries/:id/location` | Manual location update. |
| `PUT` | `/deliveries/:id/complete` | Force complete delivery. |
| **Users** | | |
| `GET` | `/users` | List all users. |
| `GET` | `/users/stats` | User growth stats. |
| `GET` | `/users/role/:role` | Filter users by role. |
| `GET` | `/users/:id` | Get user profile. |
| `PUT` | `/users/:id/role` | Change user role. |
| `PUT` | `/users/:id/activate` | Unblock user. |
| `PUT` | `/users/:id/deactivate` | Block user. |
| `DELETE` | `/users/:id` | Delete user permanently. |
| **Riders** | | |
| `GET` | `/riders` | List all riders. |
| `GET` | `/riders/pending` | List pending approvals. |
| `GET` | `/riders/:id` | Get rider docs/details. |
| `PUT` | `/riders/:id/approve` | Approve rider for work. |
| `PUT` | `/riders/:id/reject` | Reject/Revoke approval. |
| `PUT` | `/riders/:id/status` | Toggle active status. |
| `DELETE` | `/riders/:id` | Delete rider account. |
| **Customers** | | |
| `GET` | `/customers` | List all customers. |
| `GET` | `/customers/stats` | Customer statistics. |
| `GET` | `/customers/:id` | Get customer profile. |
| `GET` | `/customers/:id/orders` | Get customer order history. |
| `PUT` | `/customers/:id/status` | Block/Unblock customer. |
| `DELETE` | `/customers/:id` | Delete customer account. |
| **Activity Logs** | | |
| `GET` | `/activity-logs` | View all audit logs. |
| `GET` | `/activity-logs/stats` | Audit statistics. |
| `GET` | `/activity-logs/export` | Download logs. |
| `GET` | `/activity-logs/admin/:adminId` | Filter logs by Admin ID. |
| `GET` | `/activity-logs/:id` | View detailed log. |
| **Cart Analytics** | | |
| `GET` | `/cart-analytics` | Abandonment statistics. |
| `GET` | `/cart-analytics/abandoned` | List active abandoned carts. |
| **Payouts** | | |
| `GET` | `/payouts/stats` | Payout summary stats. |
| `POST` | `/payouts/process` | Mark rider earnings as paid. |
| **Uploads** | | |
| `POST` | `/upload/image` | Upload single image. |
| `POST` | `/upload/images` | Upload multiple images. |
| `DELETE` | `/upload/image` | Delete image. |
| **Reviews** | | |
| `GET` | `/reviews` | List all reviews. |
| `GET` | `/reviews/stats` | Average rating metrics. |
| `GET` | `/reviews/rider/:riderId` | Reviews for specific rider. |
| `GET` | `/reviews/:reviewId` | Get single review. |
| `PATCH` | `/reviews/:reviewId/approve` | Publicly approve review. |
| `PATCH` | `/reviews/:reviewId/reject` | Hide review. |
| `DELETE` | `/reviews/:reviewId` | Delete review. |
| **Settings** | | |
| `GET` | `/settings` | Get global config. |
| `PUT` | `/settings` | Update global config. |
| `GET` | `/settings/delivery-zones` | Get delivery areas. |
| `PUT` | `/settings/delivery-zones` | Update delivery areas. |

### 2.2 Customer API
**Base Path:** `/api/customer`
**Auth:** Most routes require `Authorization: Bearer <token>`.

| Method | Endpoint | Description | Auth Required |
|:---|:---|:---|:---|
| **Auth** | | | |
| `POST` | `/auth/send-otp` | Trigger login OTP. | No |
| `POST` | `/auth/verify-otp` | Exchange OTP for Token. | No |
| `POST` | `/auth/refresh-token` | Refresh expired token. | No |
| `POST` | `/auth/complete-profile` | Initial profile setup. | Yes |
| `POST` | `/auth/logout` | End session. | Yes |
| **Catalog** | | | |
| `GET` | `/products` | List menu items. | No |
| `GET` | `/products/:id` | Get item details. | No |
| `GET` | `/products/category/:categoryId`| Filter items by category. | No |
| `GET` | `/categories` | List categories. | No |
| `GET` | `/categories/:id` | Get category details. | No |
| **Account** | | | |
| `GET` | `/profile` | Get my profile. | Yes |
| `PUT` | `/profile` | Update my profile. | Yes |
| **Address** | | | |
| `POST` | `/address` | Add new address. | Yes |
| `GET` | `/address` | Get all saved addresses. | Yes |
| `PUT` | `/address/:addressId` | Update specific address. | Yes |
| `DELETE` | `/address/:addressId` | Delete specific address. | Yes |
| `PUT` | `/address/:addressId/default` | Set address as default. | Yes |
| **Wishlist** | | | |
| `GET` | `/wishlist` | View wishlist. | Yes |
| `POST` | `/wishlist/add` | Add item to wishlist. | Yes |
| `DELETE` | `/wishlist/remove/:productId`| Remove item from wishlist. | Yes |
| **Cart** | | | |
| `GET` | `/cart` | View current cart. | Yes |
| `POST` | `/cart/add` | Add item/Update qty. | Yes |
| `PUT` | `/cart/item/:itemId` | Update specific item qty. | Yes |
| `DELETE` | `/cart/item/:itemId` | Remove item. | Yes |
| `DELETE` | `/cart/clear` | Empty cart. | Yes |
| `POST` | `/cart/checkout` | Convert cart to order. | Yes |
| **Orders** | | | |
| `POST` | `/orders` | Create new order. | Yes |
| `GET` | `/orders/my-orders` | Get order history. | Yes |
| `POST` | `/orders/:orderId/reorder` | Duplicate previous order. | Yes |
| `GET` | `/orders/:orderId/invoice` | Download invoice PDF. | Yes |
| `GET` | `/orders/:orderId` | Get single order details. | Yes |
| `DELETE` | `/orders/:orderId/cancel` | Cancel active order. | Yes |
| **Delivery** | | | |
| `GET` | `/deliveries` | Get customer's deliveries. | Yes |
| `GET` | `/deliveries/:deliveryId/track` | Track live delivery. | Yes |
| `GET` | `/deliveries/order/:orderId` | Get delivery by order ID. | Yes |
| **Reviews** | | | |
| `GET` | `/reviews/product/:productId` | View product reviews. | No |
| `POST` | `/reviews` | Submit a review. | Yes |
| `POST` | `/reviews/product` | Submit product rating. | Yes |
| `GET` | `/reviews/my-reviews` | View my past reviews. | Yes |

### 2.3 Rider API
**Base Path:** `/api/rider`
**Auth:** Requires `Authorization: Bearer <token>` and Rider role.

| Method | Endpoint | Description |
|:---|:---|:---|
| **Auth** | | |
| `POST` | `/auth/register` | Sign up with vehicle/documents. |
| `POST` | `/auth/send-otp` | Login OTP. |
| `POST` | `/auth/verify-otp` | Verify login. |
| `POST` | `/auth/availability` | Toggle Online/Offline. |
| `GET` | `/auth/profile` | Get rider stats/profile. |
| **Delivery** | | |
| `GET` | `/deliveries/active` | Check for active assignment. |
| `POST` | `/deliveries/:id/accept` | Accept new order. |
| `POST` | `/deliveries/:id/reject` | Decline new order. |
| `PUT` | `/deliveries/:id/status` | Update status (Picked Up, Delivered). |
| `POST` | `/deliveries/:id/proof` | Upload proof of delivery photo. |
| `PUT` | `/deliveries/location` | Update live GPS coords. |
| `GET` | `/deliveries/earnings` | View earnings report. |

### 2.4 Real-time Events (Socket.io)
**Protocol:** WebSocket (ws://)
**Auth:** JWT Token handling in connection handshake.

| Event Name | Direction | Description |
|:---|:---|:---|
| `connection` | Client -> Server | Handshake and Room joining (`user:{id}`, `role:{role}`). |
| `rider:location-update` | Client -> Server | Rider emits GPS coords. |
| `rider:availability-changed` | Client -> Server | Rider toggles online status. |
| `order:new` | Server -> Client | Notifies Riders/Managers of new order. |
| `rider:online` | Server -> Client | Notifies Managers a rider came online. |
| `rider:offline` | Server -> Client | Notifies Managers a rider went offline. |
| `rider:location-update` | Server -> Client | Broadcasts rider location to Customer/Manager. |

---