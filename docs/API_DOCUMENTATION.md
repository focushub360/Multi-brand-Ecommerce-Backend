# GROVE Multi-Brand E-Commerce API Documentation

> **Base URL:** `/api/v1`  
> **Interactive Swagger UI:** `/api/v1/docs`  
> **Raw OpenAPI Specification:** `/api/v1/docs.json`  

---

## 1. Authentication & Security
All authenticated endpoints require a JWT Bearer token in the `Authorization` header:
```http
Authorization: Bearer <your_access_token>
```
Refresh tokens are automatically managed via HTTP-only, secure, SameSite cookies or via `req.body.refreshToken`.

### Endpoints
- `POST /api/v1/auth/login` – Unified single login for `SUPER_ADMIN`, `DEALER`, and `USER`.
- `POST /api/v1/auth/register` – Customer registration.
- `POST /api/v1/auth/refresh-token` – Refresh-token rotation.
- `POST /api/v1/auth/logout` – Session revocation and cookie clearing.
- `GET /api/v1/auth/me` – Current authenticated user session details.
- `POST /api/v1/auth/change-password` – Password change for authenticated users.
- `POST /api/v1/auth/dealer/initial-setup-password` – Single-use 12-char temporary password reset for approved dealers.

---

## 2. Categories & Taxonomy
- `GET /api/v1/categories` – Public active categories and subcategories.
- `GET /api/v1/categories/:slug` – Category details by slug.
- `POST /api/v1/categories` – Create category (`SUPER_ADMIN` only).
- `PUT /api/v1/categories/:id` – Update category (`SUPER_ADMIN` only).
- `DELETE /api/v1/categories/:id` – Delete category (`SUPER_ADMIN` only).
- `POST /api/v1/categories/:id/subcategories` – Add subcategory (`SUPER_ADMIN` only).

---

## 3. Product Catalog
- `GET /api/v1/products` – Public catalog query with filters (`q`, `category`, `subcategory`, `brand`, `minPrice`, `maxPrice`, `inStock`, `sort`, `page`, `limit`).
- `GET /api/v1/products/:id` – Product details by ID or slug.
- `GET /api/v1/products/dealer/my-products` – Authenticated dealer's catalog (`DEALER` only).
- `POST /api/v1/products` – Dealer creates product (**Category strictly validated against dealer's primary category**).
- `PUT /api/v1/products/:id` – Dealer updates own product.
- `DELETE /api/v1/products/:id` – Dealer archives own product.
- `PUT /api/v1/products/admin/:id` – Super Admin modifies product.
- `DELETE /api/v1/products/admin/:id` – Super Admin deletes product.

---

## 4. Multi-Depot Inventory
- `GET /api/v1/inventory/my-inventory` – Dealer inventory list and stock stats (`DEALER` only).
- `PATCH /api/v1/inventory/:productId/stock` – Dealer stock adjustment (creates immutable ledger entry).
- `GET /api/v1/inventory/:productId/transactions` – Audit trail of stock movements for SKU.
- `GET /api/v1/inventory/global` – Super Admin global stock audit (`SUPER_ADMIN` only).

---

## 5. Customer Shopping Cart & Wishlist
- `GET /api/v1/cart` – View cart with server-side price recalculation.
- `POST /api/v1/cart/items` – Add product to cart with stock validation.
- `PATCH /api/v1/cart/items/:productId` – Update item quantity.
- `DELETE /api/v1/cart/items/:productId` – Remove item from cart.
- `DELETE /api/v1/cart` – Clear cart.
- `GET /api/v1/wishlist` – View wishlist.
- `POST /api/v1/wishlist/toggle` – Toggle product in wishlist without duplicates.
- `DELETE /api/v1/wishlist/:productId` – Remove product from wishlist.

---

## 6. Delivery Addresses
- `GET /api/v1/addresses` – View customer saved addresses.
- `POST /api/v1/addresses` – Save delivery address (**Enforces strict maximum 5 address limit**).
- `PUT /api/v1/addresses/:id` – Edit saved address.
- `DELETE /api/v1/addresses/:id` – Delete saved address.
- `PATCH /api/v1/addresses/:id/default` – Set default address.

---

## 7. Geospatial Locations & Serviceability
- `GET /api/v1/dealer-locations/nearby` – Find nearby hubs via MongoDB `2dsphere` proximity query (`lng`, `lat`, `maxDistanceKm`).
- `POST /api/v1/dealer-locations/check-serviceability` – Check delivery availability for customer pincode or coordinates.
- `GET /api/v1/dealer-locations` – List all depot locations (`SUPER_ADMIN` only).
- `POST /api/v1/dealer-locations` – Create dealer location hub (`SUPER_ADMIN` only).
- `PUT /api/v1/dealer-locations/:id` – Update dealer location (`SUPER_ADMIN` only).
- `DELETE /api/v1/dealer-locations/:id` – Remove location (`SUPER_ADMIN` only).

---

## 8. Orders & Multi-Dealer Fulfillment
- `POST /api/v1/orders/checkout` – Place order. Atomic transaction reserves stock, creates master `Order`, generates separate `DealerOrder` suborders for each merchant, records payment, and clears cart.
- `GET /api/v1/orders/my-orders` – Customer order history.
- `GET /api/v1/orders/my-orders/:orderId` – Customer order details & fulfillment timeline.
- `POST /api/v1/orders/my-orders/:orderId/cancel` – Customer order cancellation (restores inventory).
- `GET /api/v1/orders/dealer/my-orders` – Dealer fulfillment suborders.
- `GET /api/v1/orders/dealer/my-orders/:id` – Dealer fulfillment suborder details.
- `PATCH /api/v1/orders/dealer/my-orders/:id/status` – Dealer updates fulfillment status (`Processing`, `Dispatched`, `Delivered`) and tracking number.
- `GET /api/v1/orders/admin` – Global order inspection (`SUPER_ADMIN` only, Read-Only).
- `GET /api/v1/orders/admin/:id` – Master order & suborder inspection (`SUPER_ADMIN` only).

---

## 9. Payments & Escrow Settlements
- `GET /api/v1/payments` – Global payment transactions & escrow status (`SUPER_ADMIN` only).
- `GET /api/v1/payments/:id` – Single payment transaction.
- `GET /api/v1/settlements` – Global dealer settlement batches (`SUPER_ADMIN` only).
- `POST /api/v1/settlements/:id/release` – Release escrow hold & disburse payout (`SUPER_ADMIN` only).
- `GET /api/v1/settlements/my-settlements` – Dealer payout history (`DEALER` only).

---

## 10. Support Tickets & Complaints
- `POST /api/v1/complaints` – Create support dispute or ticket.
- `GET /api/v1/complaints/my-tickets` – View my tickets.
- `GET /api/v1/complaints/:ticketId` – View conversation thread.
- `POST /api/v1/complaints/:ticketId/messages` – Submit message in ticket thread.
- `GET /api/v1/complaints/admin/all` – Super Admin view all tickets (`SUPER_ADMIN` only).
- `PATCH /api/v1/complaints/admin/:ticketId/status` – Update ticket status & add internal note (`SUPER_ADMIN` only).

---

## 11. Performance Analytics & Exports
- `GET /api/v1/analytics/admin` – Platform-wide GMV, average ticket size, and category distribution (`SUPER_ADMIN` only).
- `GET /api/v1/analytics/dealer` – Dealer revenue, orders, and monthly trends (`DEALER` only).
- `GET /api/v1/analytics/dealer/export-csv` – Download RFC-4180 compliant CSV order ledger (`DEALER` only).

---

## 12. Super Admin Governance
- `GET /api/v1/admin/dealers` – List dealer applications with status filters.
- `GET /api/v1/admin/dealers/:id` – Full dealer profile with KYC documents.
- `POST /api/v1/admin/dealers/:id/approve` – Approve dealer, issue 12-char temp password via Nodemailer.
- `POST /api/v1/admin/dealers/:id/reject` – Reject dealer with recorded reason and notification.
- `PATCH /api/v1/admin/dealers/:id/status` – Suspend or reactivate dealer.
- `GET /api/v1/admin/audit-logs` – Immutable administrative action audit trail.
- `GET /api/v1/admin/settings` – Platform governance configuration.
- `PUT /api/v1/admin/settings` – Update platform commission rules, escrow days, and notifications.

