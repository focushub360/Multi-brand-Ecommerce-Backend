# GROVE Multi-Brand E-Commerce Platform – RBAC Permission Matrix

> **Core Model:** Strict Server-Enforced Role-Based Access Control (RBAC)  
> **Roles:** `SUPER_ADMIN`, `DEALER`, `USER` (Customer)  

---

## 1. Permission Matrix Table

| Resource / Capability | Public (Guest) | USER (Customer) | DEALER (Approved) | SUPER_ADMIN |
|---|:---:|:---:|:---:|:---:|
| **Single Login (`POST /auth/login`)** | ✅ Yes | ✅ Yes | ✅ Yes | ✅ Yes |
| **Customer Registration (`POST /auth/register`)** | ✅ Yes | ❌ No | ❌ No | ❌ No |
| **Dealer Application (`POST /dealers/apply`)** | ✅ Yes | ❌ No | ❌ No | ❌ No |
| **Dealer Initial Password Setup** | ✅ Yes (12-char Temp PW) | ❌ No | ❌ No | ❌ No |
| **Browse Categories & Products** | ✅ Yes | ✅ Yes | ✅ Yes | ✅ Yes |
| **Nearby Dealer Proximity Search** | ✅ Yes | ✅ Yes | ✅ Yes | ✅ Yes |
| **Check Delivery Serviceability** | ✅ Yes | ✅ Yes | ✅ Yes | ✅ Yes |
| **Manage Shopping Cart** | ❌ No | ✅ Full Access | ❌ No | ❌ No |
| **Manage Wishlist** | ❌ No | ✅ Full Access | ❌ No | ❌ No |
| **Manage Addresses (Max 5 Limit)** | ❌ No | ✅ Full Access | ❌ No | ❌ No |
| **Place Orders (Checkout)** | ❌ No | ✅ Full Access | ❌ No | ❌ No |
| **View Own Orders** | ❌ No | ✅ Own Orders | ❌ No | ❌ No |
| **Cancel Own Order** | ❌ No | ✅ Own (Pre-dispatch) | ❌ No | ❌ No |
| **View Dealer Suborders** | ❌ No | ❌ No | ✅ Own Line Items Only | ❌ No |
| **Update Fulfillment Status (Track/Ship)** | ❌ No | ❌ No | ✅ Own Suborders | ❌ No (Read-Only) |
| **Global Order Inspection** | ❌ No | ❌ No | ❌ No | ✅ Read-Only |
| **Create Products** | ❌ No | ❌ No | ✅ Primary Category Only | 🚫 Prohibited |
| **Edit Products** | ❌ No | ❌ No | ✅ Own Products Only | ✅ Full Platform Access |
| **Delete / Archive Products** | ❌ No | ❌ No | ✅ Own Products Only | ✅ Full Platform Access |
| **Manage Stock & Adjust Inventory** | ❌ No | ❌ No | ✅ Own Inventory | ✅ Global Adjustments |
| **Dealer Store Settings (Hours/Desc)** | ❌ No | ❌ No | ✅ Hours & Desc Only | ✅ Full Platform Access |
| **Dealer Business Info (Name/GSTIN/Cat)**| ❌ No | ❌ No | 🚫 Prohibited | ✅ Full Platform Access |
| **Approve / Reject Dealer Applications** | ❌ No | ❌ No | ❌ No | ✅ Full Platform Access |
| **Suspend / Reactivate Dealers** | ❌ No | ❌ No | ❌ No | ✅ Full Platform Access |
| **Dealer Sales Analytics & CSV Export** | ❌ No | ❌ No | ✅ Own Sales Only | ❌ No |
| **Platform Sales & Revenue Analytics** | ❌ No | ❌ No | ❌ No | ✅ Platform-Wide |
| **Create / Manage Categories** | ❌ No | ❌ No | ❌ No | ✅ Full Platform Access |
| **Create / Manage Dealer Hub Depots** | ❌ No | ❌ No | ❌ No | ✅ Full Platform Access |
| **View & Release Escrow Settlements** | ❌ No | ❌ No | ✅ View Own Payouts | ✅ View & Release Escrow |
| **Support Disputes & Complaint Threads**| ❌ No | ✅ File & Reply Own | ✅ File & Reply Own | ✅ Full Governance |
| **View Security Audit Logs** | ❌ No | ❌ No | ❌ No | ✅ Full Platform Access |
| **Platform Governance Settings** | ❌ No | ❌ No | ❌ No | ✅ Full Platform Access |
| **Create / Edit Customer Accounts** | ❌ No | ✅ Own Profile Only | ❌ No | 🚫 Prohibited (Delete Only)|

---

## 2. Critical Business Rules & Invariants

1. **Exactly One Super Admin:**
   - Bootstrapped securely via environment variables. Public admin registration endpoints are prohibited.
2. **Dealer Category Lockdown:**
   - Each approved dealer is assigned one `primaryCategory`. Product creation verifies server-side category matching.
3. **Multi-Dealer Order Isolation:**
   - Multi-dealer customer orders are split into discrete `DealerOrder` suborders. Dealers never have visibility into other dealers' pricing, margins, customer addresses outside their order scope, or payouts.
4. **Max 5 Saved Addresses:**
   - Enforced by Mongoose schema pre-save hooks and service-layer validation.
5. **Single Unified Login:**
   - All roles authenticate through `POST /api/v1/auth/login`. Role resolution is strictly performed on the backend from verified database records.

