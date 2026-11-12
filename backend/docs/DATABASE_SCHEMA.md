# GROVE Multi-Brand E-Commerce Platform – Database Schema Documentation

> **Database Engine:** MongoDB Atlas  
> **ODM:** Mongoose 8.9+  
> **Data Modeling Pattern:** Hybrid References + Embedded Snapshots  

---

## 1. Entity Relationship Overview

```
                      +-------------------+
                      |       User        |
                      +-------------------+
                       /        |        \
                      /         |         \
           (Role: DEALER)       |       (Role: USER)
                    /           |           \
                   v            v            v
             +----------+  +---------+  +---------+
             |  Dealer  |  | Address |  |  Cart   |
             +----------+  +---------+  +---------+
              /    |    \                    |
             /     |     \                   v
            v      v      v             +----------+
      +-------+ +----+ +--------------+ | Wishlist |
      |Product| |Hub | | Settlement   | +----------+
      +-------+ +----+ +--------------+      |
         |                                   |
         v                                   v
   +-----------+                       +-----------+
   | Inventory |                       |   Order   | (Master Order)
   +-----------+                       +-----------+
         |                                   |
         v                                   v
+--------------------+                 +-------------+
|InventoryTransaction|                 | DealerOrder | (Suborders)
+--------------------+                 +-------------+
                                             |
                                             v
                                       +-----------+
                                       |  Payment  |
                                       +-----------+
```

---

## 2. Collections & Field Specifications

### 2.1 `users` Collection
- `_id`: ObjectId
- `name`: String, required, trim
- `email`: String, required, unique, lowercase, indexed
- `password`: String, select: false (bcrypt hashed)
- `role`: Enum `['SUPER_ADMIN', 'DEALER', 'USER']`, indexed
- `phone`: String
- `avatar`: String
- `status`: Enum `['ACTIVE', 'INACTIVE', 'SUSPENDED']`, indexed
- `isEmailVerified`: Boolean, default: false
- `mustChangePassword`: Boolean, default: false
- `lastLogin`: Date
- `createdAt`, `updatedAt`: Timestamps

---

### 2.2 `dealers` Collection
- `_id`: ObjectId
- `user`: ObjectId $\rightarrow$ `users`, unique
- `dealerCode`: String, unique (e.g. `DEALER_001`), uppercase
- `businessName`: String, required
- `businessType`: Enum `['Manufacturer', 'Distributor', 'Wholesaler', 'Retailer', 'Authorized Dealer']`
- `primaryCategory`: ObjectId $\rightarrow$ `categories`, indexed
- `primaryCategoryName`: String
- `ownerName`: String, required
- `officialEmail`: String, required, indexed
- `phone`: String, required
- `gstin`: String, unique, uppercase
- `pan`: String, uppercase
- `businessAddress`: `{ address, city, state, pincode }`
- `warehouseAddress`: String, required
- `location`: GeoJSON Point `{ type: 'Point', coordinates: [lng, lat] }` (*2dsphere index*)
- `status`: Enum `['PENDING', 'APPROVED', 'REJECTED', 'SUSPENDED']`, indexed
- `tier`: Enum `['Bronze Tier', 'Silver Tier', 'Gold Tier']`
- `commissionRate`: Number, default: 5.0
- `payoutHold`: Boolean, default: false
- `bankDetails`: `{ accountName, accountNumber, ifsc, bankName, upiId }`
- `kycDocuments`: `[{ name, url, status, uploadedAt }]`
- `storeSettings`: `{ tagline, description, operatingHours, isOpen, fulfillmentSLA }`
- `temporaryPassword`: `{ hash, expiresAt, isUsed, mustChange }` (hash: `select: false`)
- `approvalHistory`: `[{ action, actionBy, timestamp, reason }]`

---

### 2.3 `products` Collection
- `_id`: ObjectId
- `dealer`: ObjectId $\rightarrow$ `dealers`, indexed
- `dealerCode`: String
- `dealerName`: String
- `name`: String, required
- `slug`: String, lowercase, indexed
- `sku`: String, unique, uppercase, indexed
- `category`: ObjectId $\rightarrow$ `categories`, indexed
- `categoryName`: String
- `subcategory`: String, indexed
- `brand`: String, default: 'Generic'
- `description`: String, required
- `price`: Number, required, min: 0
- `mrp`: Number, required, min: 0
- `discount`: Number, default: 0
- `gstRate`: Number, default: 18
- `stock`: Number, required, min: 0
- `threshold`: Number, default: 10
- `status`: Enum `['Active', 'Draft', 'Archived', 'Pending Approval', 'Rejected']`, indexed
- `image`: String, required
- `images`: Array of Strings
- `specs`: Map of Strings
- `highlights`: Array of Strings
- `warranty`: String
- `rating`: Number, default: 4.5
- `reviewCount`: Number, default: 0
- `totalSales`: Number, default: 0
- `deliveryInfo`: `{ standardDays, shippingFee, dispatchTime }`
- **Indexes:**
  - Unique on `sku`
  - Compound on `{ category: 1, status: 1 }`
  - Compound on `{ dealer: 1, status: 1 }`
  - Compound on `{ category: 1, subcategory: 1, status: 1 }`
  - Full-Text Search on `{ name: 'text', description: 'text', brand: 'text', subcategory: 'text' }`

---

### 2.4 `inventories` Collection
- `_id`: ObjectId
- `product`: ObjectId $\rightarrow$ `products`, unique, indexed
- `dealer`: ObjectId $\rightarrow$ `dealers`, indexed
- `sku`: String, uppercase
- `currentStock`: Number, min: 0
- `reservedStock`: Number, min: 0, default: 0
- `threshold`: Number, default: 10
- `locationBay`: String, default: 'Bay 01'
- `status`: Enum `['In Stock', 'Low Stock', 'Out of Stock']`, indexed

---

### 2.5 `inventorytransactions` Collection (Immutable Ledger)
- `_id`: ObjectId
- `product`: ObjectId $\rightarrow$ `products`, indexed
- `dealer`: ObjectId $\rightarrow$ `dealers`, indexed
- `type`: Enum `['PURCHASE_RESTOCK', 'ORDER_RESERVED', 'ORDER_DEDUCTED', 'ORDER_CANCELLED_RESTORE', 'MANUAL_ADJUSTMENT', 'AUDIT_CORRECTION']`, indexed
- `quantityChange`: Number, required
- `balanceAfter`: Number, required
- `referenceId`: String
- `reason`: String, required
- `performedBy`: ObjectId $\rightarrow$ `users`, required
- `createdAt`: Date

---

### 2.6 `orders` Collection (Master Order)
- `_id`: ObjectId
- `orderNumber`: String, unique (e.g. `GRV-923841`), indexed
- `customer`: ObjectId $\rightarrow$ `users`, indexed
- `customerSnapshot`: `{ name, email, phone }`
- `shippingAddress`: `{ name, mobile, pincode, house, street, landmark, city, state, type }`
- `items`: `[{ product, name, sku, price, mrp, quantity, category, dealer, dealerCode, dealerName, image, subtotal }]`
- `dealers`: Array of ObjectIds $\rightarrow$ `dealers`
- `dealerOrders`: Array of ObjectIds $\rightarrow$ `dealerorders`
- `pricing`: `{ itemsTotal, discount, deliveryFee, tax, total }`
- `payment`: `{ method, methodLabel, status, transactionId, paidAt }`
- `orderStatus`: Enum `['Placed', 'Confirmed', 'Processing', 'Shipped', 'Delivered', 'Cancelled']`, indexed
- `timeline`: `[{ status, title, note, timestamp }]`

---

### 2.7 `dealerorders` Collection (Suborder Partition)
- `_id`: ObjectId
- `parentOrder`: ObjectId $\rightarrow$ `orders`, indexed
- `parentOrderNumber`: String, indexed
- `dealer`: ObjectId $\rightarrow$ `dealers`, indexed
- `dealerCode`: String
- `customer`: ObjectId $\rightarrow$ `users`
- `customerSnapshot`: `{ name, city, state, phone, address }`
- `items`: `[{ product, name, sku, price, quantity, subtotal, image }]`
- `subtotal`: Number
- `commissionRate`: Number
- `commissionAmount`: Number
- `netSettlementAmount`: Number
- `orderStatus`: Enum `['Placed', 'Processing', 'Dispatched', 'In Transit', 'Delivered', 'Cancelled']`, indexed
- `paymentStatus`: Enum `['Paid', 'Pending', 'Refunded']`
- `fulfillmentPartner`: String
- `trackingNumber`: String
- `estimatedDelivery`: String
- `payoutStatus`: Enum `['Pending Escrow', 'Escrow Held', 'Released', 'Settled']`
- `timeline`: `[{ status, title, note, timestamp }]`

---

### 2.8 `addresses` Collection
- `_id`: ObjectId
- `user`: ObjectId $\rightarrow$ `users`, indexed
- `name`: String, required
- `mobile`: String, required
- `pincode`: String, length: 6
- `house`: String, required
- `street`: String, required
- `landmark`: String
- `city`: String, required
- `state`: String, required
- `type`: Enum `['Home', 'Work', 'Other']`
- `isDefault`: Boolean
- `coordinates`: `{ lat, lng }`
- **Schema Hook:** Pre-save check verifies customer has $\le 5$ saved addresses.

---

### 2.9 `dealerlocations` Collection
- `_id`: ObjectId
- `hubCode`: String, unique (e.g. `HUB-PUN-01`), uppercase
- `dealer`: ObjectId $\rightarrow$ `dealers`, indexed
- `dealerName`: String
- `hubType`: String
- `city`, `state`, `pincode`, `address`, `contactPhone`: String
- `capacityTons`: Number
- `serviceRadiusKm`: Number
- `activePincodes`: Array of Strings
- `location`: GeoJSON Point `{ type: 'Point', coordinates: [lng, lat] }` (*2dsphere index*)
- `status`: Enum `['Operational', 'Maintenance', 'Closed']`, indexed

---

### 2.10 `refreshtokens` Collection
- `_id`: ObjectId
- `tokenHash`: String, SHA-256 hash, indexed
- `user`: ObjectId $\rightarrow$ `users`, indexed
- `expiresAt`: Date, TTL index (*auto-deletes on expiration*)
- `revokedAt`: Date
- `replacedByTokenHash`: String
- `ipAddress`: String
- `userAgent`: String

---

### 2.11 `auditlogs` Collection
- `_id`: ObjectId
- `logId`: String, unique (e.g. `AUD_8812`)
- `action`: String, indexed
- `actor`: ObjectId $\rightarrow$ `users`
- `actorRole`: String
- `targetEntity`: String
- `targetId`: String
- `details`: String
- `ipAddress`: String
- `userAgent`: String
- `createdAt`: Date

