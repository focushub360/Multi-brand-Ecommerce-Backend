/**
 * ==============================================================================
 * GROVE Multi-Brand E-Commerce Platform – Database Seed Script
 * ==============================================================================
 * Reads raw JSON seed files from `../frontend/src/data/` and seeds the MongoDB
 * database with realistic, interconnected, relational records across all modules:
 *
 * 1. Categories & Subcategories (Agriculture, Electronics, Automotive, Groceries)
 * 2. Platform Users (Super Admins, Dealers, Customers with hashed passwords)
 * 3. Customer Delivery Addresses
 * 4. Certified Dealers (KYC documents, banking, warehouses, geo-locations)
 * 5. Full Product Catalog (Admin + Agriculture + Groceries products)
 * 6. Warehouse Inventory & Audit Ledger (Transactions)
 * 7. Regional Dealer Hubs & Delivery Locations (GeoJSON 2dsphere points)
 * 8. Customer Orders & Discrete Dealer Sub-Orders
 * 9. Financial Payments & Escrow Ledger
 * 10. Merchant Settlement Batches
 * 11. Customer & Dealer Support Complaints / Threads
 * 12. System Admin Settings & Governance
 * 13. Security Audit Logs
 * ==============================================================================
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import mongoose from 'mongoose';

import { env } from './src/config/env.js';
import { connectDB, disconnectDB } from './src/config/db.js';
import { ROLES } from './src/constants/roles.js';
import { DEALER_STATUS } from './src/constants/dealerStatus.js';

import { Category } from './src/modules/categories/category.model.js';
import { User } from './src/modules/users/user.model.js';
import { Dealer } from './src/modules/dealers/dealer.model.js';
import { Product } from './src/modules/products/product.model.js';
import { Inventory } from './src/modules/inventory/inventory.model.js';
import { InventoryTransaction } from './src/modules/inventory/inventoryTransaction.model.js';
import { DealerLocation } from './src/modules/dealer-locations/dealerLocation.model.js';
import { Address } from './src/modules/addresses/address.model.js';
import { Order } from './src/modules/orders/order.model.js';
import { DealerOrder } from './src/modules/orders/dealerOrder.model.js';
import { Payment } from './src/modules/payments/payment.model.js';
import { Settlement } from './src/modules/settlements/settlement.model.js';
import { Complaint } from './src/modules/complaints/complaint.model.js';
import { AdminSettings } from './src/modules/admin/adminSettings.model.js';
import { AuditLog } from './src/modules/admin/auditLog.model.js';
import { Cart } from './src/modules/cart/cart.model.js';
import { Wishlist } from './src/modules/wishlist/wishlist.model.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.resolve(__dirname, '../frontend/src/data');

/**
 * Safely read and parse a JSON file from the frontend data directory
 */
const readJsonFile = (filename) => {
  const fullPath = path.join(DATA_DIR, filename);
  if (!fs.existsSync(fullPath)) {
    console.warn(`⚠️ Warning: Seed file ${filename} not found at ${fullPath}`);
    return null;
  }
  return JSON.parse(fs.readFileSync(fullPath, 'utf-8'));
};

/**
 * Safely parse date or return fallback
 */
const safeDate = (val, fallback = new Date()) => {
  if (!val || val === '—' || val === '-' || typeof val !== 'string') return fallback;
  if (/^\d{1,2}:\d{2}\s*(AM|PM)$/i.test(val.trim())) {
    const today = new Date().toISOString().split('T')[0];
    const parsed = new Date(`${today} ${val.trim()}`);
    return isNaN(parsed.getTime()) ? fallback : parsed;
  }
  const parsed = new Date(val);
  return isNaN(parsed.getTime()) ? fallback : parsed;
};

/**
 * City coordinate map for GeoJSON Point creation [longitude, latitude]
 */
const CITY_COORDINATES = {
  Pune: [73.8567, 18.5204],
  Solapur: [75.9064, 17.6599],
  Nashik: [73.7898, 19.9975],
  Nagpur: [79.0882, 21.1458],
  Ludhiana: [75.8573, 30.901],
  Indore: [75.8577, 22.7196],
  Hyderabad: [78.4867, 17.385],
  Baramati: [74.5815, 18.1517],
  Kolhapur: [74.2433, 16.705],
  Amravati: [77.7523, 20.932],
  Jalgaon: [75.5626, 21.0077],
  Ratnagiri: [73.3000, 16.9902]
};

const getCoordinates = (city) => {
  return CITY_COORDINATES[city] || [73.8567, 18.5204];
};

/**
 * Main Database Seeder Function
 */
export const seedDatabase = async () => {
  console.log('\n================================================================');
  console.log('🌱 STARTING GROVE DATABASE SEEDING PROCESS');
  console.log(`📁 Source directory: ${DATA_DIR}`);
  console.log('================================================================\n');

  try {
    await connectDB();

    // --------------------------------------------------------------------------
    // STEP 0: Clean existing collections
    // --------------------------------------------------------------------------
    console.log('🧹 Purging existing collections to ensure idempotent seeding...');
    await Promise.all([
      Category.deleteMany({}),
      User.deleteMany({}),
      Dealer.deleteMany({}),
      Product.deleteMany({}),
      Inventory.deleteMany({}),
      InventoryTransaction.deleteMany({}),
      DealerLocation.deleteMany({}),
      Address.deleteMany({}),
      Order.deleteMany({}),
      DealerOrder.deleteMany({}),
      Payment.deleteMany({}),
      Settlement.deleteMany({}),
      Complaint.deleteMany({}),
      AdminSettings.deleteMany({}),
      AuditLog.deleteMany({}),
      Cart.deleteMany({}),
      Wishlist.deleteMany({})
    ]);
    console.log('✅ Collections purged successfully.\n');

    // --------------------------------------------------------------------------
    // STEP 1: Seed Categories & Subcategories
    // --------------------------------------------------------------------------
    console.log('📦 Step 1: Seeding Categories and Subcategories...');
    const rawCategories = readJsonFile('adminCategories.json') || [];

    // Ensure Groceries & Farm Produce category exists
    const fullCategoriesList = [...rawCategories];
    const hasGroceries = fullCategoriesList.some((c) => c.slug === 'groceries');
    if (!hasGroceries) {
      fullCategoriesList.push({
        id: 'cat-groc',
        name: 'Groceries & Farm Produce',
        slug: 'groceries',
        description: 'Direct farm harvests, certified organic staples, cold-pressed edible oils, pulses, and spices.',
        icon: 'ShoppingBag',
        commissionRate: 5.0,
        status: 'Active',
        subcategories: [
          { name: 'Fresh Fruits & Vegetables', slug: 'fresh-fruits-vegetables', status: 'Active' },
          { name: 'Grains, Pulses & Millets', slug: 'grains-pulses-millets', status: 'Active' },
          { name: 'Organic Cold-Pressed Oils', slug: 'organic-cold-pressed-oils', status: 'Active' },
          { name: 'Spices, Herbs & Seasonings', slug: 'spices-herbs-seasonings', status: 'Active' }
        ]
      });
    }

    const categoryMap = new Map(); // slug / name -> Category Doc
    for (const cat of fullCategoriesList) {
      const createdCat = await Category.create({
        name: cat.name.trim(),
        slug: cat.slug.toLowerCase().trim(),
        description: cat.description || '',
        icon: cat.icon || 'Package',
        commissionRate: Number(cat.commissionRate) || 5.0,
        status: cat.status === 'Active' ? 'Active' : 'Inactive',
        subcategories: (cat.subcategories || []).map((sub) => ({
          name: sub.name.trim(),
          slug: sub.slug.toLowerCase().trim(),
          description: sub.description || '',
          status: sub.status === 'Inactive' ? 'Inactive' : 'Active'
        }))
      });
      categoryMap.set(createdCat.slug, createdCat);
      categoryMap.set(createdCat.name.toLowerCase(), createdCat);
    }
    console.log(`✅ Seeded ${fullCategoriesList.length} categories with subcategories.`);

    // --------------------------------------------------------------------------
    // STEP 2: Seed Users (Super Admin, Ops, Dealers, Customers)
    // --------------------------------------------------------------------------
    console.log('\n👥 Step 2: Seeding System Users (Admins, Dealers, Customers)...');
    const rawUsers = readJsonFile('users.json') || [];
    const rawAdminUsers = readJsonFile('adminUsers.json') || [];
    const rawCustomers = readJsonFile('adminCustomers.json') || [];
    const rawDealers = readJsonFile('adminDealers.json') || [];

    const userMap = new Map(); // email -> User Doc

    // 2.1 Super Admins
    const adminAccounts = [
      {
        name: env.ADMIN_NAME || 'GROVE Super Admin',
        email: (env.ADMIN_EMAIL || 'admin@grove.com').toLowerCase(),
        password: env.ADMIN_PASSWORD || 'Admin@123',
        role: ROLES.SUPER_ADMIN,
        phone: '+91 98200 99100',
        avatar: 'GA',
        status: 'ACTIVE',
        isEmailVerified: true
      },
      {
        name: 'Priya Sharma',
        email: 'ops@grove.com',
        password: 'Admin@123',
        role: ROLES.SUPER_ADMIN,
        phone: '+91 98200 99101',
        avatar: 'PS',
        status: 'ACTIVE',
        isEmailVerified: true
      }
    ];

    for (const adm of adminAccounts) {
      if (!userMap.has(adm.email)) {
        const u = await User.create(adm);
        userMap.set(adm.email, u);
      }
    }

    // 2.2 Dealers from adminDealers.json
    for (const d of rawDealers) {
      const email = d.email.toLowerCase().trim();
      if (!userMap.has(email)) {
        const u = await User.create({
          name: d.contactPerson || d.businessName,
          email,
          password: 'Grove@123',
          role: ROLES.DEALER,
          phone: d.phone || '+91 98201 44219',
          avatar: d.businessName.substring(0, 2).toUpperCase(),
          status: d.status === 'Suspended' ? 'SUSPENDED' : 'ACTIVE',
          isEmailVerified: true
        });
        userMap.set(email, u);
      }
    }

    // 2.3 Customers from users.json and adminCustomers.json
    for (const u of rawUsers) {
      const email = u.email.toLowerCase().trim();
      if (!userMap.has(email)) {
        const role = u.role === 'admin' ? ROLES.SUPER_ADMIN : u.role === 'dealer' ? ROLES.DEALER : ROLES.USER;
        const createdU = await User.create({
          name: u.name,
          email,
          password: u.password || 'Grove@123',
          role,
          phone: '+91 98200 44102',
          avatar: u.name.substring(0, 2).toUpperCase(),
          status: 'ACTIVE',
          isEmailVerified: true
        });
        userMap.set(email, createdU);
      }
    }

    for (const c of rawCustomers) {
      const email = c.email.toLowerCase().trim();
      if (!userMap.has(email)) {
        const createdC = await User.create({
          name: c.contactPerson || c.name,
          email,
          password: 'Grove@123',
          role: ROLES.USER,
          phone: c.phone || '+91 98201 44219',
          avatar: (c.contactPerson || c.name).substring(0, 2).toUpperCase(),
          status: 'ACTIVE',
          isEmailVerified: true
        });
        userMap.set(email, createdC);
      }
    }

    console.log(`✅ Seeded ${userMap.size} user accounts with hashed bcrypt passwords.`);

    // --------------------------------------------------------------------------
    // STEP 3: Seed Customer Delivery Addresses
    // --------------------------------------------------------------------------
    console.log('\n🏡 Step 3: Seeding Customer Delivery Addresses...');
    let addressCount = 0;
    for (const c of rawCustomers) {
      const u = userMap.get(c.email.toLowerCase().trim());
      if (u && u.role === ROLES.USER) {
        const coords = getCoordinates(c.city);
        const pincodeMatch = (c.address || '').match(/\b\d{6}\b/) || ['411001'];
        await Address.create({
          user: u._id,
          name: c.contactPerson || c.name,
          mobile: (c.phone || '+91 98201 44219').replace(/[^0-9]/g, '').slice(-10),
          pincode: pincodeMatch[0],
          house: 'Plot / Farm No. 12',
          street: c.address || 'Industrial MIDC Road',
          landmark: 'Near Krishi Vigyan Kendra',
          city: c.city || 'Pune',
          state: c.state || 'Maharashtra',
          type: 'Work',
          isDefault: true,
          coordinates: {
            lat: coords[1],
            lng: coords[0]
          }
        });
        addressCount++;
      }
    }
    console.log(`✅ Seeded ${addressCount} default customer addresses.`);

    // --------------------------------------------------------------------------
    // STEP 4: Seed Dealers & KYC Profiles
    // --------------------------------------------------------------------------
    console.log('\n🏢 Step 4: Seeding Certified Dealers & KYC Records...');
    const dealerMap = new Map(); // dealerId (e.g. 'DEALER_001') -> Dealer Doc

    const agriCategory = categoryMap.get('agriculture-farming') || fullCategoriesList[0];
    const elecCategory = categoryMap.get('electronics-gadgets') || fullCategoriesList[1];
    const autoCategory = categoryMap.get('automotive-spare-parts') || fullCategoriesList[2];
    const grocCategory = categoryMap.get('groceries') || fullCategoriesList[3];

    // Assign categories to dealers
    const dealerCategoryAllocation = {
      DEALER_001: agriCategory,
      DEALER_002: agriCategory,
      DEALER_003: agriCategory,
      DEALER_004: autoCategory,
      DEALER_005: agriCategory,
      DEALER_006: agriCategory,
      DEALER_007: elecCategory,
      DEALER_008: autoCategory,
      DEALER_009: grocCategory,
      DEALER_010: autoCategory,
      DEALER_011: agriCategory,
      DEALER_012: grocCategory
    };

    for (const d of rawDealers) {
      const u = userMap.get(d.email.toLowerCase().trim());
      if (!u) continue;

      let dealerStatus = DEALER_STATUS.PENDING;
      if (d.status === 'Active') dealerStatus = DEALER_STATUS.APPROVED;
      else if (d.status === 'Suspended') dealerStatus = DEALER_STATUS.SUSPENDED;
      else if (d.status === 'Rejected') dealerStatus = DEALER_STATUS.REJECTED;

      const primaryCat = dealerCategoryAllocation[d.id] || agriCategory;
      const coords = getCoordinates(d.city);

      const createdDealer = await Dealer.create({
        user: u._id,
        dealerCode: d.id,
        businessName: d.businessName,
        businessType: 'Authorized Dealer',
        primaryCategory: primaryCat._id,
        primaryCategoryName: primaryCat.name,
        ownerName: d.contactPerson,
        officialEmail: d.email.toLowerCase().trim(),
        phone: d.phone,
        gstin: d.gstin,
        pan: d.pan || d.gstin.substring(2, 12),
        businessAddress: {
          address: d.warehouseAddress || `${d.city} Industrial Zone`,
          city: d.city,
          state: d.state,
          pincode: d.pincode
        },
        warehouseAddress: d.warehouseAddress || `${d.city} Hub A, Bay 10`,
        location: {
          type: 'Point',
          coordinates: coords
        },
        status: dealerStatus,
        tier: d.tier || 'Silver Tier',
        commissionRate: Number(d.commissionRate) || 5.0,
        payoutHold: Boolean(d.payoutHold),
        bankDetails: {
          accountName: d.bankDetails?.accountName || d.businessName,
          accountNumber: d.bankDetails?.accountNumber || '912020045582910',
          ifsc: d.bankDetails?.ifsc || 'HDFC0001248',
          bankName: d.bankDetails?.bankName || 'HDFC Bank',
          upiId: `${d.id.toLowerCase()}@okhdfcbank`
        },
        kycDocuments: (d.kycDocuments || []).map((k) => ({
          name: k.name,
          url: `https://storage.grove.com/kyc/${d.id.toLowerCase()}_${k.name.toLowerCase().replace(/[^a-z0-9]+/g, '_')}.pdf`,
          status: k.status === 'Verified' ? 'Verified' : 'Under Review',
          uploadedAt: safeDate(k.uploadDate)
        })),
        storeSettings: {
          tagline: 'Authorized regional hub delivering industrial-grade machinery & equipment.',
          description: `${d.businessName} is a certified GROVE regional channel partner maintaining high-availability inventory.`,
          operatingHours: 'Mon - Sat: 08:30 AM - 07:30 PM',
          isOpen: true,
          fulfillmentSLA: 99.0
        }
      });

      dealerMap.set(d.id, createdDealer);
    }
    console.log(`✅ Seeded ${dealerMap.size} dealers with full business and banking profiles.`);

    // --------------------------------------------------------------------------
    // STEP 5: Seed Products (Admin + Agriculture + Groceries)
    // --------------------------------------------------------------------------
    console.log('\n🚜 Step 5: Seeding Multi-Brand Catalog Products...');
    const rawAdminProducts = readJsonFile('adminProducts.json') || [];
    const rawAgriProducts = readJsonFile('agricultureProducts.json') || [];

    const productMap = new Map(); // prod.id or sku -> Product Doc
    const productList = [];

    // 5.1 Admin Catalog Products
    for (const p of rawAdminProducts) {
      const dealer = dealerMap.get(p.dealerId) || dealerMap.get('DEALER_001');
      const cat =
        categoryMap.get(p.category.toLowerCase()) ||
        categoryMap.get(p.category.toLowerCase().replace(/ & /g, '-').replace(/\s+/g, '-')) ||
        agriCategory;

      const price = Number(p.price);
      const mrp = Number(p.mrp || price);
      const discount = mrp > price ? Math.round(((mrp - price) / mrp) * 100) : 0;
      const slug = `${p.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')}-${p.id.toLowerCase()}`;

      const prod = await Product.create({
        dealer: dealer._id,
        dealerCode: dealer.dealerCode,
        dealerName: dealer.businessName,
        name: p.name.trim(),
        slug,
        sku: p.sku.toUpperCase().trim(),
        category: cat._id,
        categoryName: cat.name,
        subcategory: p.subcategory || 'General Equipment',
        brand: p.name.split(' ')[0] || 'GROVE Prime',
        description: p.description,
        price,
        mrp,
        discount,
        stock: Number(p.stock) || 50,
        threshold: Number(p.threshold) || 10,
        status: p.status === 'Active' ? 'Active' : 'Draft',
        image: p.image,
        images: [p.image],
        rating: Number(p.rating) || 4.5,
        reviewCount: Math.floor(15 + Math.random() * 85),
        totalSales: Number(p.totalSales) || 50,
        warranty: '2 Years Comprehensive Manufacturer Warranty',
        highlights: [
          'Heavy-duty industrial build engineered for maximum operational uptime',
          'Certified for commercial durability under extreme temperature & duty cycles',
          'Direct OEM technical service and quick replacement warranty support'
        ]
      });

      productMap.set(p.id, prod);
      productMap.set(p.sku.toUpperCase(), prod);
      productList.push(prod);
    }

    // 5.2 Agriculture In-Depth Catalog Products (from agricultureProducts.json)
    const fallbackDealer = dealerMap.get('DEALER_001') || Array.from(dealerMap.values())[0];
    for (const ag of rawAgriProducts) {
      const sku = `AGR-IN-${ag.id.toUpperCase()}`;
      if (productMap.has(sku)) continue;

      const price = Number(ag.price) || 25000;
      const mrp = Number(ag.originalPrice) || price;
      const discount = mrp > price ? Math.round(((mrp - price) / mrp) * 100) : 0;
      const slug = `${ag.slug || ag.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${ag.id}`;

      const prod = await Product.create({
        dealer: fallbackDealer._id,
        dealerCode: fallbackDealer.dealerCode,
        dealerName: fallbackDealer.businessName,
        name: ag.name.trim(),
        slug,
        sku,
        category: agriCategory._id,
        categoryName: agriCategory.name,
        subcategory: ag.specifications?.Subcategory || 'Tractors & Heavy Machinery',
        brand: ag.brand || 'GROVE TerraForce',
        description: ag.description || 'Premium commercial agricultural machinery.',
        price,
        mrp,
        discount,
        stock: 35,
        threshold: 5,
        status: 'Active',
        image: ag.image,
        images: ag.images && ag.images.length > 0 ? ag.images : [ag.image],
        rating: Number(ag.rating) || 4.8,
        reviewCount: Number(ag.reviewCount) || 120,
        totalSales: 80,
        specs: ag.specifications || {},
        highlights: ag.highlights || [
          'Engineered for maximum fuel efficiency and heavy implements',
          'Heavy cast-iron chassis and rugged differential gears'
        ],
        warranty: ag.warranty || '3 Years Manufacturer Warranty'
      });

      productMap.set(ag.id, prod);
      productMap.set(sku, prod);
      productList.push(prod);
    }

    // 5.3 Groceries Seed Products
    const groceriesDealer = dealerMap.get('DEALER_009') || fallbackDealer;
    const grocerySeeds = [
      {
        name: 'Certified Organic Sona Masoori Rice (25kg)',
        sku: 'GROC-RICE-SONA-25KG',
        subcategory: 'Grains, Pulses & Millets',
        price: 2450,
        mrp: 2999,
        image: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&w=800&q=80',
        description: 'Single-origin aged organic Sona Masoori unpolished aromatic rice sourced directly from certified farmer producer groups.'
      },
      {
        name: 'Wood-Pressed Cold Virgin Groundnut Oil (5L)',
        sku: 'GROC-OIL-GND-5L',
        subcategory: 'Organic Cold-Pressed Oils',
        price: 1850,
        mrp: 2200,
        image: 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?auto=format&fit=crop&w=800&q=80',
        description: 'Pure traditional kolhu wood-pressed unrefined groundnut cooking oil with zero preservatives and natural antioxidants.'
      },
      {
        name: 'Export Grade Salem Turmeric Whole Finger (5kg)',
        sku: 'GROC-SPICE-TURM-5KG',
        subcategory: 'Spices, Herbs & Seasonings',
        price: 950,
        mrp: 1250,
        image: 'https://images.unsplash.com/photo-1615485290382-441e4d049cb5?auto=format&fit=crop&w=800&q=80',
        description: 'High-curcumin (5.2%) sun-dried raw Salem turmeric finger harvest directly from certified organic farms.'
      }
    ];

    for (const g of grocerySeeds) {
      const slug = g.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
      const prod = await Product.create({
        dealer: groceriesDealer._id,
        dealerCode: groceriesDealer.dealerCode,
        dealerName: groceriesDealer.businessName,
        name: g.name,
        slug,
        sku: g.sku,
        category: grocCategory._id,
        categoryName: grocCategory.name,
        subcategory: g.subcategory,
        brand: 'GROVE Organics',
        description: g.description,
        price: g.price,
        mrp: g.mrp,
        discount: Math.round(((g.mrp - g.price) / g.mrp) * 100),
        stock: 120,
        threshold: 20,
        status: 'Active',
        image: g.image,
        images: [g.image],
        rating: 4.9,
        reviewCount: 42,
        totalSales: 160,
        warranty: 'Freshness Guarantee & Farm Origin Verified'
      });
      productMap.set(g.sku, prod);
      productList.push(prod);
    }

    console.log(`✅ Seeded ${productList.length} products with complete specs and pricing.`);

    // --------------------------------------------------------------------------
    // STEP 6: Seed Warehouse Inventory & Audit Ledger
    // --------------------------------------------------------------------------
    console.log('\n📊 Step 6: Initializing Inventory Balances and Audit Ledger...');
    const adminUser = userMap.get('admin@grove.com');

    for (const prod of productList) {
      await Inventory.create({
        product: prod._id,
        dealer: prod.dealer,
        sku: prod.sku,
        currentStock: prod.stock,
        reservedStock: 0,
        threshold: prod.threshold,
        locationBay: `Bay-${prod.sku.slice(-4)}`,
        status: prod.stock > prod.threshold ? 'In Stock' : prod.stock > 0 ? 'Low Stock' : 'Out of Stock'
      });

      await InventoryTransaction.create({
        product: prod._id,
        dealer: prod.dealer,
        type: 'PURCHASE_RESTOCK',
        quantityChange: prod.stock,
        balanceAfter: prod.stock,
        referenceId: `RESTOCK-${prod.sku}`,
        reason: 'Initial master warehouse stock onboarding from raw seed data',
        performedBy: adminUser._id
      });
    }
    console.log(`✅ Created ${productList.length} Inventory items & audit ledger transactions.`);

    // --------------------------------------------------------------------------
    // STEP 7: Seed Regional Hubs & Dealer Locations (GeoJSON 2dsphere)
    // --------------------------------------------------------------------------
    console.log('\n📍 Step 7: Seeding Dealer Regional Hubs & Service Areas...');
    const rawLocations = readJsonFile('adminLocations.json') || [];

    for (const loc of rawLocations) {
      const dealer = dealerMap.get(loc.dealerId) || fallbackDealer;
      const coords = getCoordinates(loc.city);

      await DealerLocation.create({
        hubCode: loc.hubCode,
        dealer: dealer._id,
        dealerName: loc.dealerName || dealer.businessName,
        hubType: loc.hubType || 'Regional Logistics Hub',
        city: loc.city,
        state: loc.state,
        pincode: loc.pincode,
        address: loc.address,
        contactPhone: loc.contactPhone,
        capacityTons: loc.capacityTons || 250,
        serviceRadiusKm: loc.serviceRadiusKm || 120,
        activePincodes: [
          loc.pincode,
          String(Number(loc.pincode) + 1),
          String(Number(loc.pincode) + 2),
          String(Number(loc.pincode) + 3)
        ],
        location: {
          type: 'Point',
          coordinates: coords
        },
        status: loc.status === 'Operational' ? 'Operational' : 'Maintenance'
      });
    }
    console.log(`✅ Seeded ${rawLocations.length} dealer hubs with GeoJSON 2dsphere indexing.`);

    // --------------------------------------------------------------------------
    // STEP 8: Seed Customer Orders & Discrete Dealer Sub-Orders
    // --------------------------------------------------------------------------
    console.log('\n🛍️ Step 8: Seeding Orders and Split Dealer Sub-Orders...');
    const rawOrders = readJsonFile('adminOrders.json') || [];
    const orderMap = new Map(); // order.id -> Order Doc

    for (const ord of rawOrders) {
      const customerEmail = ord.customer.email.toLowerCase().trim();
      const customerUser = userMap.get(customerEmail) || userMap.get('farmer@grove.com');
      const dealer = dealerMap.get(ord.dealerId) || fallbackDealer;

      // Map order items to real products
      const orderItems = [];
      let calculatedItemsTotal = 0;

      for (const item of ord.items) {
        const prod =
          productMap.get(item.id) ||
          productMap.get(item.sku) ||
          productList[0];

        const itemQty = Number(item.quantity) || 1;
        const itemPrice = Number(item.price) || prod.price;
        const itemSubtotal = itemPrice * itemQty;
        calculatedItemsTotal += itemSubtotal;

        orderItems.push({
          product: prod._id,
          name: prod.name,
          sku: prod.sku,
          price: itemPrice,
          mrp: prod.mrp,
          quantity: itemQty,
          category: prod.categoryName,
          dealer: dealer._id,
          dealerCode: dealer.dealerCode,
          dealerName: dealer.businessName,
          image: prod.image,
          subtotal: itemSubtotal
        });
      }

      const commissionRate = dealer.commissionRate || 5.0;
      const commissionAmount = Math.round((calculatedItemsTotal * commissionRate) / 100);
      const netSettlement = calculatedItemsTotal - commissionAmount;

      const orderDoc = await Order.create({
        orderNumber: ord.id,
        customer: customerUser._id,
        customerSnapshot: {
          name: ord.customer.name,
          email: ord.customer.email,
          phone: ord.customer.phone
        },
        shippingAddress: {
          name: ord.customer.contactPerson || ord.customer.name,
          mobile: ord.customer.phone.replace(/[^0-9]/g, '').slice(-10),
          pincode: (ord.customer.address.match(/\b\d{6}\b/) || ['411001'])[0],
          house: 'Plot / Farm No. 42',
          street: ord.customer.address,
          landmark: 'Industrial Area Phase 2',
          city: ord.customer.city,
          state: ord.customer.state,
          type: 'Work'
        },
        items: orderItems,
        dealers: [dealer._id],
        pricing: {
          itemsTotal: calculatedItemsTotal,
          discount: 0,
          deliveryFee: 0,
          tax: Math.round(calculatedItemsTotal * 0.05),
          total: calculatedItemsTotal
        },
        payment: {
          method: ord.paymentMethod.toLowerCase().includes('upi')
            ? 'upi'
            : ord.paymentMethod.toLowerCase().includes('card')
            ? 'card'
            : 'netbanking',
          methodLabel: ord.paymentMethod,
          status: ord.paymentStatus === 'Paid' ? 'Completed' : 'Pending',
          transactionId: `TXN-${ord.id.replace('GRV-', '')}`,
          paidAt: safeDate(ord.date)
        },
        orderStatus: ord.orderStatus || 'Placed',
        timeline: [
          {
            status: 'Placed',
            title: 'Order Placed by Customer',
            note: 'Payment received via payment gateway.',
            timestamp: safeDate(ord.date)
          }
        ]
      });

      // Create DealerOrder
      const dealerOrderDoc = await DealerOrder.create({
        parentOrder: orderDoc._id,
        parentOrderNumber: orderDoc.orderNumber,
        dealer: dealer._id,
        dealerCode: dealer.dealerCode,
        customer: customerUser._id,
        customerSnapshot: {
          name: ord.customer.name,
          city: ord.customer.city,
          state: ord.customer.state,
          phone: ord.customer.phone,
          address: ord.customer.address
        },
        items: orderItems.map((i) => ({
          product: i.product,
          name: i.name,
          sku: i.sku,
          price: i.price,
          quantity: i.quantity,
          subtotal: i.subtotal,
          image: i.image
        })),
        subtotal: calculatedItemsTotal,
        commissionRate,
        commissionAmount,
        netSettlementAmount: netSettlement,
        orderStatus: ord.orderStatus || 'Placed',
        paymentStatus: ord.paymentStatus === 'Paid' ? 'Paid' : 'Pending',
        fulfillmentPartner: ord.carrier || 'Delhivery Cargo Express',
        trackingNumber: ord.trackingNumber || `DLH-${Math.floor(100000 + Math.random() * 900000)}`,
        estimatedDelivery: '3 - 5 Business Days',
        payoutStatus: ord.paymentStatus === 'Paid' ? 'Escrow Held' : 'Pending Escrow',
        timeline: [
          {
            status: ord.orderStatus || 'Placed',
            title: `Order confirmed by ${dealer.businessName}`,
            note: 'Package queued at dispatch sorting station.',
            timestamp: safeDate(ord.date)
          }
        ]
      });

      orderDoc.dealerOrders.push(dealerOrderDoc._id);
      await orderDoc.save();

      orderMap.set(ord.id, orderDoc);
    }
    console.log(`✅ Seeded ${orderMap.size} master orders and linked DealerOrders.`);

    // --------------------------------------------------------------------------
    // STEP 9: Seed Financial Transactions & Settlements
    // --------------------------------------------------------------------------
    console.log('\n💳 Step 9: Seeding Financial Payments and Escrow Settlements...');
    const rawPayments = readJsonFile('adminPayments.json') || {};
    const rawTransactions = rawPayments.transactions || [];
    const rawSettlements = rawPayments.dealerSettlements || [];

    for (const txn of rawTransactions) {
      const order = orderMap.get(txn.orderId) || Array.from(orderMap.values())[0];
      const method = txn.paymentMethod.toLowerCase().includes('upi')
        ? 'upi'
        : txn.paymentMethod.toLowerCase().includes('card')
        ? 'card'
        : 'netbanking';

      await Payment.create({
        transactionId: txn.id,
        order: order._id,
        orderNumber: order.orderNumber,
        customer: order.customer,
        customerName: txn.customer,
        amount: txn.amount,
        currency: 'INR',
        paymentMethod: method,
        status: txn.status.toUpperCase() === 'FAILED' ? 'FAILED' : 'COMPLETED',
        escrowStatus: txn.escrowStatus === 'Void' ? 'Refunded' : txn.escrowStatus || 'Escrow Held',
        paidAt: safeDate(txn.date)
      });
    }

    for (const st of rawSettlements) {
      const dealer = dealerMap.get(st.dealerId) || fallbackDealer;
      let settlementStatus = 'HELD';
      if (st.status === 'Settled') settlementStatus = 'SETTLED';
      else if (st.status === 'Pending Clearance') settlementStatus = 'PROCESSING';

      await Settlement.create({
        settlementId: st.id,
        dealer: dealer._id,
        dealerName: dealer.businessName,
        cycle: 'October 2024 - Cycle 2',
        grossAmount: st.grossSales,
        commissionDeducted: st.commissionDeducted,
        taxDeducted: Math.round(st.grossSales * 0.01),
        netPayout: st.netPayout,
        bankRef: `UTR-HDFC-${Math.floor(100000000 + Math.random() * 900000000)}`,
        status: settlementStatus,
        settledAt: st.payoutDate !== 'Pending KYC' ? safeDate(st.payoutDate) : null
      });
    }
    console.log(`✅ Seeded ${rawTransactions.length} payments & ${rawSettlements.length} settlement batches.`);

    // --------------------------------------------------------------------------
    // STEP 10: Seed Customer & Dealer Support Tickets
    // --------------------------------------------------------------------------
    console.log('\n🎧 Step 10: Seeding Customer Support & Dealer Desk Tickets...');
    const rawSupport = readJsonFile('adminSupport.json') || [];

    for (const sup of rawSupport) {
      const requester = userMap.get(sup.requesterEmail.toLowerCase().trim()) || adminUser;
      const dealer = sup.concernedDealer ? dealerMap.get('DEALER_002') || fallbackDealer : null;

      // Category mapper
      let cat = 'General';
      if (sup.category === 'Logistics & Courier') cat = 'Logistics & Courier';
      else if (sup.category === 'Billing & Tax') cat = 'Billing & Tax';
      else if (sup.category === 'Merchant Onboarding') cat = 'Account & KYC';
      else if (sup.category === 'Transit Claims') cat = 'Logistics & Courier';

      await Complaint.create({
        ticketId: sup.id,
        ticketType: sup.ticketType === 'dealer' ? 'dealer' : 'customer',
        requester: requester._id,
        requesterName: sup.requesterName,
        requesterEmail: sup.requesterEmail,
        requesterRole: sup.requesterRole,
        concernedDealer: dealer ? dealer._id : null,
        concernedDealerName: sup.concernedDealer || '',
        subject: sup.subject,
        category: cat,
        priority: sup.priority === 'Normal' ? 'Medium' : sup.priority,
        status: sup.status,
        messages: (sup.messages || []).map((m) => ({
          sender: requester._id,
          senderName: m.sender,
          senderRole: m.senderRole === 'admin' ? 'admin' : m.senderRole === 'dealer' ? 'dealer' : 'customer',
          text: m.text,
          timestamp: safeDate(m.timestamp)
        })),
        internalNotes: (sup.internalNotes || []).map((note) => ({
          author: adminUser._id,
          note,
          timestamp: safeDate(sup.createdAt)
        }))
      });
    }
    console.log(`✅ Seeded ${rawSupport.length} customer and dealer support complaints.`);

    // --------------------------------------------------------------------------
    // STEP 11: Seed Platform Admin Settings & Policy Config
    // --------------------------------------------------------------------------
    console.log('\n⚙️ Step 11: Seeding Platform Governance & Admin Settings...');
    const rawSettings = readJsonFile('adminSettings.json') || {};

    await AdminSettings.create({
      general: {
        marketplaceName: rawSettings.general?.marketplaceName || 'GROVE Agritech & Commercial Marketplace',
        supportEmail: rawSettings.general?.supportEmail || 'operations@grove.com',
        supportPhone: rawSettings.general?.supportPhone || '+91 80000 12345',
        defaultCurrency: 'INR (₹)',
        maintenanceMode: false
      },
      commission: {
        defaultCommissionRate: rawSettings.commission?.defaultCommissionRate || 5.0,
        minPayoutThreshold: rawSettings.commission?.minPayoutThreshold || 10000,
        escrowHoldPeriodDays: rawSettings.commission?.escrowHoldPeriodDays || 3,
        taxTcsRate: rawSettings.commission?.taxTcsRate || 1.0
      },
      notifications: {
        emailOnNewKyc: true,
        emailOnLowStock: true,
        emailDailySummary: true
      },
      updatedBy: adminUser._id
    });
    console.log('✅ Seeded master platform admin settings.');

    // --------------------------------------------------------------------------
    // STEP 12: Seed Security Audit Logs
    // --------------------------------------------------------------------------
    console.log('\n🛡️ Step 12: Seeding Security and Regulatory Audit Logs...');
    const rawReports = readJsonFile('adminReports.json') || {};
    const rawAuditLogs = rawReports.auditLogs || [];

    for (const log of rawAuditLogs) {
      await AuditLog.create({
        logId: log.id,
        action: log.action,
        actor: adminUser._id,
        actorRole: log.role || 'Super Admin',
        targetEntity: log.module,
        targetId: log.id,
        details: log.details,
        ipAddress: '192.168.1.100',
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0'
      });
    }
    console.log(`✅ Seeded ${rawAuditLogs.length} security audit log records.`);

    // --------------------------------------------------------------------------
    // SUMMARY
    // --------------------------------------------------------------------------
    console.log('\n================================================================');
    console.log('🎉 GROVE DATABASE SEEDING COMPLETED SUCCESSFULLY!');
    console.log('================================================================');
    console.table([
      { Collection: 'Categories', Count: fullCategoriesList.length },
      { Collection: 'Users', Count: userMap.size },
      { Collection: 'Customer Addresses', Count: addressCount },
      { Collection: 'Dealers', Count: dealerMap.size },
      { Collection: 'Products', Count: productList.length },
      { Collection: 'Inventory Items', Count: productList.length },
      { Collection: 'Inventory Transactions', Count: productList.length },
      { Collection: 'Dealer Hub Locations', Count: rawLocations.length },
      { Collection: 'Master Orders', Count: orderMap.size },
      { Collection: 'Dealer Orders', Count: orderMap.size },
      { Collection: 'Payments', Count: rawTransactions.length },
      { Collection: 'Settlements', Count: rawSettlements.length },
      { Collection: 'Support Complaints', Count: rawSupport.length },
      { Collection: 'Audit Logs', Count: rawAuditLogs.length }
    ]);
    console.log('================================================================\n');
  } catch (error) {
    console.error('\n❌ SEEDING FAILED WITH ERROR:');
    console.error(error);
    process.exit(1);
  } finally {
    await disconnectDB();
  }
};

// Execute if run directly from command line
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  seedDatabase();
}

