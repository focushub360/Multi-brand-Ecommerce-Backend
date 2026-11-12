/**
 * ==============================================================================
 * GROVE Multi-Brand E-Commerce Platform – Database Seed Script
 * ==============================================================================
 * Clears the existing database and seeds:
 * 1. Exactly 3 demo accounts: user1, dealer1, admin
 * 2. 1 Authorized Dealer entity linked to dealer1 (DEALER_001)
 * 3. 4 Categories: Agriculture, Electronics, Automotive, Groceries
 * 4. Exactly 3 products per subcategory (18 products per category, 54 total):
 *    - Agriculture & Farming: 6 subcategories × 3 products = 18 products
 *    - Electronics & Gadgets: 6 subcategories × 3 products = 18 products
 *    - Automotive & Spare Parts: 6 subcategories × 3 products = 18 products
 * 5. 54 Warehouse Inventory records matching the products
 * 6. 54 Inventory Inbound Audit Transactions
 * 7. 1 Default delivery address for user1
 * 8. 1 Dealer location logistics hub for DEALER_001
 * 9. System Admin platform settings & initial audit log
 * ==============================================================================
 */

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

async function seedDatabase() {
  console.log('🚀 Starting GROVE Database Seed Process...');
  await connectDB();

  // 1. Clear ALL collections
  console.log('🧹 Clearing existing database collections...');
  await Promise.all([
    User.deleteMany({}),
    Dealer.deleteMany({}),
    Category.deleteMany({}),
    Product.deleteMany({}),
    Inventory.deleteMany({}),
    InventoryTransaction.deleteMany({}),
    Address.deleteMany({}),
    DealerLocation.deleteMany({}),
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
  console.log('✅ All existing collections cleared successfully.\n');

  // 2. Seed Categories (matching exact frontend constants & subcategories)
  console.log('🌱 Seeding Categories...');
  const categories = await Category.create([
    {
      name: 'Agriculture & Farming',
      slug: 'agriculture',
      description: 'Machinery, irrigation, tillage equipment, seeds, and agronomy solutions.',
      icon: 'Sprout',
      commissionRate: 5.0,
      status: 'Active',
      subcategories: [
        { name: 'Hybrid Seeds', slug: 'hybrid-seeds', description: 'Certified high-yield hybrid crop and vegetable seeds' },
        { name: 'Fertilizers & Soil Nutrition', slug: 'fertilizers-soil', description: 'Bio-fertilizers, organic compost, and micronutrients' },
        { name: 'Crop Protection', slug: 'crop-protection', description: 'Sprayers, pest management, and biological treatments' },
        { name: 'Irrigation & Drip Systems', slug: 'irrigation-drip', description: 'Drip lines, sprinkler kits, valves, and tubing' },
        { name: 'Solar Pumps', slug: 'solar-pumps', description: 'Solar submersible pumps and clean energy pumping' },
        { name: 'Farm Machinery', slug: 'farm-machinery', description: 'Tractors, power tillers, cultivators, and implements' }
      ]
    },
    {
      name: 'Electronics & Gadgets',
      slug: 'electronics',
      description: 'Field electronics, smart wearables, rugged computing, audio, and sensors.',
      icon: 'Smartphone',
      commissionRate: 7.0,
      status: 'Active',
      subcategories: [
        { name: 'Audio & Headphones', slug: 'audio-headphones', description: 'Industrial noise-cancelling and communication gear' },
        { name: 'Laptops & Computers', slug: 'laptops-computers', description: 'Rugged field laptops and portable computing' },
        { name: 'Wearables & Smartwatches', slug: 'wearables-smartwatches', description: 'Smartwatches, activity and biometric trackers' },
        { name: 'Keyboards & Accessories', slug: 'keyboards-accessories', description: 'Industrial and mechanical peripherals' },
        { name: 'Smart Sensors & IoT', slug: 'smart-sensors-iot', description: 'Telemetry units, wireless environmental sensors' },
        { name: 'Drones & Robotics', slug: 'drones-robotics', description: 'Agricultural spraying and survey drones' }
      ]
    },
    {
      name: 'Automotive & Spare Parts',
      slug: 'automotive',
      description: 'OEM parts, heavy vehicle braking, filtration, and all-terrain tires.',
      icon: 'Cog',
      commissionRate: 6.0,
      status: 'Active',
      subcategories: [
        { name: 'Tires & Wheels', slug: 'tires-wheels', description: 'Commercial tractor and haulage tires' },
        { name: 'Braking Systems', slug: 'braking-systems', description: 'Brake pads, rotors, drums, and hydraulics' },
        { name: 'Suspension & Steering', slug: 'suspension-steering', description: 'Shock absorbers, leaf springs, and steering racks' },
        { name: 'Electrical & Battery', slug: 'electrical-battery', description: 'Heavy-duty commercial batteries and alternators' },
        { name: 'Engine & Drivetrain', slug: 'engine-drivetrain', description: 'Oil filters, pistons, belts, and gear assemblies' },
        { name: 'Spares & Accessories', slug: 'spares-accessories', description: 'Emergency roadside spares, jacks, and toolkits' }
      ]
    },
    {
      name: 'Groceries',
      slug: 'groceries',
      description: 'Daily pantry essentials, fresh produce, and organic farm goods.',
      icon: 'ShoppingBasket',
      commissionRate: 4.0,
      status: 'Active',
      subcategories: [
        { name: 'Daily Essentials', slug: 'daily-essentials', description: 'Grains, oils, and pulses' },
        { name: 'Organic Produce', slug: 'organic-produce', description: 'Farm fresh fruits and vegetables' }
      ]
    }
  ]);

  const agriCat = categories.find((c) => c.slug === 'agriculture');
  const elecCat = categories.find((c) => c.slug === 'electronics');
  const autoCat = categories.find((c) => c.slug === 'automotive');

  console.log(`✅ Seeded ${categories.length} categories.\n`);

  // 3. Seed Exactly 3 Demo Accounts (user1, dealer1, admin)
  console.log('👤 Seeding 3 Demo Accounts (user1, dealer1, admin)...');
  const [user1, dealer1, admin] = await User.create([
    {
      name: 'User One',
      email: 'user1@grove.com',
      password: 'Password@123',
      role: ROLES.USER,
      phone: '+91 98765 43210',
      status: 'ACTIVE',
      isEmailVerified: true
    },
    {
      name: 'Dealer One',
      email: 'dealer1@grove.com',
      password: 'Password@123',
      role: ROLES.DEALER,
      phone: '+91 98220 12345',
      status: 'ACTIVE',
      isEmailVerified: true
    },
    {
      name: 'Super Admin',
      email: 'admin@grove.com',
      password: 'Admin@123',
      role: ROLES.SUPER_ADMIN,
      phone: '+91 99999 00000',
      status: 'ACTIVE',
      isEmailVerified: true
    }
  ]);

  console.log('✅ Created 3 accounts:');
  console.log('   - Customer: user1@grove.com    (Password@123)');
  console.log('   - Dealer:   dealer1@grove.com  (Password@123)');
  console.log('   - Admin:    admin@grove.com    (Admin@123)\n');

  // 4. Seed Dealer Profile for dealer1
  console.log('🏢 Seeding Dealer Profile for dealer1 (DEALER_001)...');
  const dealerEntity = await Dealer.create({
    user: dealer1._id,
    dealerCode: 'DEALER_001',
    businessName: 'Apex Machinery & Equipment',
    businessType: 'Authorized Dealer',
    primaryCategory: agriCat._id,
    primaryCategoryName: agriCat.name,
    ownerName: dealer1.name,
    officialEmail: dealer1.email,
    phone: dealer1.phone,
    gstin: '27AABCA1234F1Z5',
    pan: 'AABCA1234F',
    businessAddress: {
      address: 'Plot 42, Sanaswadi Industrial Area, Pune-Nagar Road',
      city: 'Pune',
      state: 'Maharashtra',
      pincode: '412208'
    },
    warehouseAddress: 'Plot 42, Sanaswadi Industrial Area, Pune-Nagar Road, Pune - 412208',
    location: {
      type: 'Point',
      coordinates: [73.8567, 18.5204]
    },
    status: DEALER_STATUS.APPROVED,
    tier: 'Gold Tier',
    commissionRate: 5.0,
    bankDetails: {
      accountName: 'Apex Machinery & Equipment',
      accountNumber: '987654321098',
      ifsc: 'SBIN0001234',
      bankName: 'State Bank of India'
    },
    kycDocuments: [
      { name: 'GSTIN Registration Certificate', url: 'https://grove.internal/docs/gstin.pdf', status: 'Verified' },
      { name: 'Business License', url: 'https://grove.internal/docs/license.pdf', status: 'Verified' }
    ],
    storeSettings: {
      tagline: 'Leading Agricultural Equipment & Industrial Hardware',
      description: 'Certified dealer for agricultural machinery, precision irrigation, electronics telemetry, and commercial automotive spares.',
      operatingHours: 'Mon - Sat: 08:30 AM - 07:30 PM',
      isOpen: true,
      fulfillmentSLA: 99.5
    }
  });

  console.log(`✅ Created Dealer profile: ${dealerEntity.businessName} (${dealerEntity.dealerCode})`);

  // Seed Additional Specialized Dealers for Electronics and Automotive
  const dealer2User = await User.create({
    name: 'ElectroTech Systems Lead',
    email: 'dealer2@grove.com',
    phone: '9822054321',
    password: 'Password@123',
    role: ROLES.DEALER,
    status: 'ACTIVE',
    isEmailVerified: true
  });

  const dealer2Entity = await Dealer.create({
    user: dealer2User._id,
    dealerCode: 'DEALER_002',
    businessName: 'ElectroTech Smart Components & Sensors',
    businessType: 'Authorized Dealer',
    primaryCategory: elecCat._id,
    primaryCategoryName: elecCat.name,
    ownerName: dealer2User.name,
    officialEmail: dealer2User.email,
    phone: dealer2User.phone,
    gstin: '27XYZPA9876Q1Z2',
    pan: 'XYZPA9876Q',
    businessAddress: {
      address: 'Survey No 88, Hadapsar Electronic Estate',
      city: 'Pune',
      state: 'Maharashtra',
      pincode: '411028'
    },
    warehouseAddress: 'Survey No 88, Hadapsar Electronic Estate, Pune - 411028',
    location: {
      type: 'Point',
      coordinates: [73.9312, 18.5089]
    },
    status: DEALER_STATUS.APPROVED,
    tier: 'Silver Tier',
    commissionRate: 5.0,
    bankDetails: {
      accountName: 'ElectroTech Smart Components',
      accountNumber: '987654321099',
      ifsc: 'HDFC0001234',
      bankName: 'HDFC Bank'
    },
    kycDocuments: [
      { name: 'GSTIN Registration Certificate', url: 'https://grove.internal/docs/gstin-el.pdf', status: 'Verified' },
      { name: 'Business License', url: 'https://grove.internal/docs/license-el.pdf', status: 'Verified' }
    ],
    storeSettings: {
      tagline: 'Precision Agri-Sensors & Telemetry Electronics',
      description: 'Authorized regional dealer for field cameras, telemetry laptops, solar pumps, and smart agriculture monitoring.',
      operatingHours: 'Mon - Sat: 09:00 AM - 08:00 PM',
      isOpen: true,
      fulfillmentSLA: 98.8
    }
  });
  console.log(`✅ Created Dealer profile: ${dealer2Entity.businessName} (${dealer2Entity.dealerCode})`);

  const dealer3User = await User.create({
    name: 'AutoMech Agro Spares Lead',
    email: 'dealer3@grove.com',
    phone: '9822067890',
    password: 'Password@123',
    role: ROLES.DEALER,
    status: 'ACTIVE',
    isEmailVerified: true
  });

  const dealer3Entity = await Dealer.create({
    user: dealer3User._id,
    dealerCode: 'DEALER_003',
    businessName: 'AutoMech Heavy Commercial Spares',
    businessType: 'Authorized Dealer',
    primaryCategory: autoCat._id,
    primaryCategoryName: autoCat.name,
    ownerName: dealer3User.name,
    officialEmail: dealer3User.email,
    phone: dealer3User.phone,
    gstin: '27DEFGH5678J1Z9',
    pan: 'DEFGH5678J',
    businessAddress: {
      address: 'Plot 15, Chakan Auto Hub Phase 2',
      city: 'Pune',
      state: 'Maharashtra',
      pincode: '410501'
    },
    warehouseAddress: 'Plot 15, Chakan Auto Hub Phase 2, Pune - 410501',
    location: {
      type: 'Point',
      coordinates: [73.8643, 18.7589]
    },
    status: DEALER_STATUS.APPROVED,
    tier: 'Gold Tier',
    commissionRate: 5.0,
    bankDetails: {
      accountName: 'AutoMech Heavy Commercial Spares',
      accountNumber: '987654321100',
      ifsc: 'ICIC0001234',
      bankName: 'ICICI Bank'
    },
    kycDocuments: [
      { name: 'GSTIN Registration Certificate', url: 'https://grove.internal/docs/gstin-au.pdf', status: 'Verified' },
      { name: 'Business License', url: 'https://grove.internal/docs/license-au.pdf', status: 'Verified' }
    ],
    storeSettings: {
      tagline: 'OEM Tractor Engine & Drivetrain Components',
      description: 'Authorized regional dealer for tractor replacement parts, commercial farm tires, hydraulic systems, and tool kits.',
      operatingHours: 'Mon - Sat: 08:30 AM - 07:30 PM',
      isOpen: true,
      fulfillmentSLA: 99.2
    }
  });
  console.log(`✅ Created Dealer profile: ${dealer3Entity.businessName} (${dealer3Entity.dealerCode})\n`);

  // 5. Seed Catalog Products (JSON format: exactly 3 products per subcategory, 18 per category, 54 total)
  console.log('📦 Seeding Products (18 Agriculture, 18 Electronics, 18 Automotive)...');

  const rawProducts = [
    // =========================================================================
    // CATEGORY: Agriculture & Farming (18 Products - 3 per subcategory)
    // =========================================================================

    // --- Subcategory 1: Hybrid Seeds (3 items) ---
    {
      name: 'High-Yield Hybrid Basmati Paddy Seeds (10kg)',
      sku: 'SKU-AG-01',
      slug: 'high-yield-hybrid-basmati-paddy-seeds-ag-01',
      category: agriCat._id,
      categoryName: agriCat.name,
      subcategory: 'Hybrid Seeds',
      brand: 'GROVE AgriMaster',
      description: 'Certified high-germination hybrid paddy seeds offering aromatic extra-long grains with supreme resistance to bacterial leaf blight.',
      price: 1850,
      mrp: 2200,
      discount: 16,
      stock: 45,
      image: 'https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?auto=format&fit=crop&w=500&q=80',
      images: ['https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?auto=format&fit=crop&w=500&q=80', '/images/card-agri.png'],
      rating: 4.8,
      reviewCount: 38,
      specs: { 'Crop Type': 'Basmati Rice', 'Pack Weight': '10 kg', 'Germination Rate': '95%+', 'Maturity Duration': '125-130 Days' },
      highlights: ['95%+ High Germination Rate', 'Resistance to Bacterial Leaf Blight', 'Export Grade Long-Grain Basmati', 'Lab Tested & Moisture Sealed']
    },
    {
      name: 'Hybrid Golden Corn Maize Seeds (5kg)',
      sku: 'SKU-AG-02',
      slug: 'hybrid-golden-corn-maize-seeds-ag-02',
      category: agriCat._id,
      categoryName: agriCat.name,
      subcategory: 'Hybrid Seeds',
      brand: 'AgriPower',
      description: 'High-density hybrid yellow corn seeds with heavy ear filling, drought tolerance, and uniform harvest maturity.',
      price: 1250,
      mrp: 1600,
      discount: 22,
      stock: 50,
      image: 'https://images.unsplash.com/photo-1551754655-cd27e38d2076?auto=format&fit=crop&w=500&q=80',
      images: ['https://images.unsplash.com/photo-1551754655-cd27e38d2076?auto=format&fit=crop&w=500&q=80', '/images/card-agri-clean.png'],
      rating: 4.7,
      reviewCount: 29,
      specs: { 'Crop Type': 'Yellow Corn / Maize', 'Pack Weight': '5 kg', 'Plant Density': '26,000 Plants/Acre', 'Cob Length': '8 - 9.5 Inches' },
      highlights: ['Excellent Heat & Moisture Stress Tolerance', 'High Shelling Percentage (>82%)', 'Deep Orange-Yellow Kernels', 'Ideal for Grain and Fodder Yield']
    },
    {
      name: 'Certified Disease-Resistant Wheat Seeds (25kg)',
      sku: 'SKU-AG-03',
      slug: 'certified-disease-resistant-wheat-seeds-ag-03',
      category: agriCat._id,
      categoryName: agriCat.name,
      subcategory: 'Hybrid Seeds',
      brand: 'GROVE AgriMaster',
      description: 'Breeder-certified high-tiller wheat seeds with strong lodging resistance and superior protein content for commercial milling.',
      price: 2100,
      mrp: 2600,
      discount: 19,
      stock: 35,
      image: 'https://images.unsplash.com/photo-1530595467537-0b5996c41f2d?auto=format&fit=crop&w=500&q=80',
      images: ['https://images.unsplash.com/photo-1530595467537-0b5996c41f2d?auto=format&fit=crop&w=500&q=80', '/images/card-agri.png'],
      rating: 4.6,
      reviewCount: 44,
      specs: { 'Crop Type': 'Bread Wheat (HD-2967)', 'Pack Weight': '25 kg', 'Sowing Season': 'Rabi (Nov - Dec)', 'Average Yield': '22-24 Quintals/Acre' },
      highlights: ['Immune to Yellow & Brown Rust', 'Heavy Tillering (12-14 tillers/plant)', 'High Gluten Content for Premium Flour', 'Government Certified Quality Seed']
    },

    // --- Subcategory 2: Fertilizers & Soil Nutrition (3 items) ---
    {
      name: 'Organic Vermicompost Soil Conditioner (50kg)',
      sku: 'SKU-AG-04',
      slug: 'organic-vermicompost-soil-conditioner-ag-04',
      category: agriCat._id,
      categoryName: agriCat.name,
      subcategory: 'Fertilizers & Soil Nutrition',
      brand: 'AgriPower',
      description: '100% natural earthworm compost enriched with active beneficial soil microbes, nitrogen, phosphorus, and moisture-retaining humus.',
      price: 850,
      mrp: 1100,
      discount: 23,
      stock: 60,
      image: 'https://images.unsplash.com/photo-1628352081506-83c43123ed6d?auto=format&fit=crop&w=500&q=80',
      images: ['https://images.unsplash.com/photo-1628352081506-83c43123ed6d?auto=format&fit=crop&w=500&q=80', '/images/card-agri-clean.png'],
      rating: 4.9,
      reviewCount: 65,
      specs: { 'Composition': '100% Pure Worm Castings', 'Pack Weight': '50 kg Bag', 'Moisture Content': '18-22%', 'Organic Carbon': '>16%' },
      highlights: ['Restores Depleted Soil Fertility', 'Improves Soil Water Holding Capacity', 'Zero Weed Seeds & Odor Free', 'Certified for Organic Farming']
    },
    {
      name: 'Water-Soluble NPK 19-19-19 Fertilizer (25kg)',
      sku: 'SKU-AG-05',
      slug: 'water-soluble-npk-fertilizer-ag-05',
      category: agriCat._id,
      categoryName: agriCat.name,
      subcategory: 'Fertilizers & Soil Nutrition',
      brand: 'GROVE AgriMaster',
      description: 'Balanced 1:1:1 soluble plant nutrient formula with chelated trace elements for foliar spraying and fertigation setups.',
      price: 2450,
      mrp: 2900,
      discount: 16,
      stock: 40,
      image: 'https://images.unsplash.com/photo-1585314062340-f1a5a7c9328d?auto=format&fit=crop&w=500&q=80',
      images: ['https://images.unsplash.com/photo-1585314062340-f1a5a7c9328d?auto=format&fit=crop&w=500&q=80', '/images/card-agri.png'],
      rating: 4.7,
      reviewCount: 52,
      specs: { 'Formula': 'NPK 19-19-19 + TE', 'Solubility': '100% Water Soluble', 'Application': 'Fertigation & Foliar Spray', 'Pack Weight': '25 kg Bag' },
      highlights: ['Instant Dissolution with Zero Residue', 'Promotes Rapid Vegetative Growth', 'Enhances Root Formation & Bloom Count', 'Compatible with All Drip Irrigation Lines']
    },
    {
      name: 'Micronutrient Chelated Zinc & Boron Booster (5L)',
      sku: 'SKU-AG-06',
      slug: 'micronutrient-chelated-booster-ag-06',
      category: agriCat._id,
      categoryName: agriCat.name,
      subcategory: 'Fertilizers & Soil Nutrition',
      brand: 'AgriPower',
      description: 'EDTA-chelated liquid formulation supplying bioavailable Zinc, Boron, Iron, and Magnesium to correct leaf chlorosis and prevent flower drop.',
      price: 1650,
      mrp: 2100,
      discount: 21,
      stock: 30,
      image: 'https://images.unsplash.com/photo-1589923188900-85dae523342b?auto=format&fit=crop&w=500&q=80',
      images: ['https://images.unsplash.com/photo-1589923188900-85dae523342b?auto=format&fit=crop&w=500&q=80', '/images/card-agri-clean.png'],
      rating: 4.6,
      reviewCount: 31,
      specs: { 'Active Nutrients': 'Zn (12%), B (5%), Fe (3%), Mg (2%)', 'Volume': '5 Liters Can', 'pH Stability': '4.0 - 9.0', 'Dosage': '2-3 ml per Liter' },
      highlights: ['Prevents Fruit Cracking & Blossom End Rot', '100% Chelated Rapid Leaf Absorption', 'Boosts Chlorophyll & Photosynthesis', 'Mixes Seamlessly with Fungicides']
    },

    // --- Subcategory 3: Crop Protection (3 items) ---
    {
      name: 'Battery-Operated High-Pressure Backpack Sprayer 16L',
      sku: 'SKU-AG-07',
      slug: 'battery-backpack-sprayer-ag-07',
      category: agriCat._id,
      categoryName: agriCat.name,
      subcategory: 'Crop Protection',
      brand: 'KisanShield',
      description: '16-Liter rechargeable knapsack sprayer with dual diaphragm pump, pressure regulator, and telescopic brass lance for uniform pest control.',
      price: 2850,
      mrp: 3600,
      discount: 20,
      stock: 40,
      image: '/images/prod-sprayer.png',
      images: ['/images/prod-sprayer.png'],
      rating: 4.5,
      reviewCount: 54,
      specs: { 'Tank Capacity': '16 Liters', 'Battery': '12V 8Ah Lead Acid', 'Working Pressure': '0.15 - 0.40 Mpa', 'Discharge Rate': '3.1 L/min' },
      highlights: ['Up to 6 Hours Continuous Operation', 'Extendable Brass Spray Lance', 'Ergonomic Padded Shoulder Straps', 'Dual Nozzle Set Included']
    },
    {
      name: 'Neem-Based Bio-Pesticide Organic Concentrate (5L)',
      sku: 'SKU-AG-08',
      slug: 'neem-bio-pesticide-concentrate-ag-08',
      category: agriCat._id,
      categoryName: agriCat.name,
      subcategory: 'Crop Protection',
      brand: 'KisanShield',
      description: 'Cold-pressed neem oil concentrate with 10,000 PPM Azadirachtin providing broad-spectrum protection against chewing and sucking insect pests.',
      price: 1450,
      mrp: 1850,
      discount: 22,
      stock: 35,
      image: 'https://images.unsplash.com/photo-1592982537447-7440770cbfc9?auto=format&fit=crop&w=500&q=80',
      images: ['https://images.unsplash.com/photo-1592982537447-7440770cbfc9?auto=format&fit=crop&w=500&q=80', '/images/prod-sprayer.png'],
      rating: 4.8,
      reviewCount: 41,
      specs: { 'Active Ingredient': 'Azadirachtin 10,000 PPM (1%)', 'Volume': '5 Liters', 'Target Pests': 'Aphids, Whiteflies, Caterpillars, Thrips', 'Residual Effect': '14 Days' },
      highlights: ['100% Organic & Eco-Friendly', 'Safe for Pollinators & Beneficial Insects', 'Non-Toxic to Earthworms', 'Zero Pre-Harvest Interval (PHI)']
    },
    {
      name: 'Automated Knapsack Thermal Fogger & Mister Machine',
      sku: 'SKU-AG-09',
      slug: 'automated-knapsack-thermal-fogger-ag-09',
      category: agriCat._id,
      categoryName: agriCat.name,
      subcategory: 'Crop Protection',
      brand: 'KisanShield',
      description: 'Ultra-low volume (ULV) pulse-jet thermal fogger machine for dense orchard disinfection, vector mosquito control, and greenhouse fumigation.',
      price: 8900,
      mrp: 11500,
      discount: 23,
      stock: 15,
      image: 'https://images.unsplash.com/photo-1584473457406-6240486418e9?auto=format&fit=crop&w=500&q=80',
      images: ['https://images.unsplash.com/photo-1584473457406-6240486418e9?auto=format&fit=crop&w=500&q=80', '/images/prod-sprayer.png'],
      rating: 4.6,
      reviewCount: 19,
      specs: { 'Tank Volume': '6 Liters Solution + 1.2L Fuel', 'Particle Size': '5 - 30 Microns', 'Spray Output': '25 L/Hour', 'Chassis': 'Stainless Steel Pulse-Jet' },
      highlights: ['Penetrates Dense Crop Foliage', 'Self-Igniting Battery Electronic Start', 'Dual-Cooling Airflow Jacket', 'Lightweight 7.5 kg Dry Weight']
    },

    // --- Subcategory 4: Irrigation & Drip Systems (3 items) ---
    {
      name: 'Precision Micro-Drip Irrigation System (1 Acre)',
      sku: 'SKU-AG-10',
      slug: 'precision-micro-drip-irrigation-ag-10',
      category: agriCat._id,
      categoryName: agriCat.name,
      subcategory: 'Irrigation & Drip Systems',
      brand: 'DripAqua',
      description: 'Complete agricultural drip irrigation kit covering 1 acre with pressure-compensating drippers, durable 16mm mainline tubing, disc filter, and venturi injector.',
      price: 4200,
      mrp: 5500,
      discount: 23,
      stock: 45,
      image: '/images/prod-drip.png',
      images: ['/images/prod-drip.png'],
      rating: 4.7,
      reviewCount: 68,
      specs: { 'Coverage': '1 Acre', 'Tubing Size': '16 mm', 'Dripper Spacing': '40 cm', 'Operating Pressure': '1.0 - 2.5 bar' },
      highlights: ['Up to 70% Water Saving', 'Anti-Clogging Pressure Compensating Emitters', 'UV-Stabilized Virgin Polymer', 'Includes Venturi Fertilizer Injector']
    },
    {
      name: 'Heavy Duty HDPE Drip Lateral Tubing 16mm (500m Roll)',
      sku: 'SKU-AG-11',
      slug: 'hdpe-drip-lateral-tubing-16mm-ag-11',
      category: agriCat._id,
      categoryName: agriCat.name,
      subcategory: 'Irrigation & Drip Systems',
      brand: 'DripAqua',
      description: 'Premium linear low-density polyethylene (LLDPE) irrigation roll engineered for high tensile strength, UV degradation resistance, and chemical immunity.',
      price: 2800,
      mrp: 3400,
      discount: 18,
      stock: 50,
      image: 'https://images.unsplash.com/photo-1563514227147-6d2ff665a6a0?auto=format&fit=crop&w=500&q=80',
      images: ['https://images.unsplash.com/photo-1563514227147-6d2ff665a6a0?auto=format&fit=crop&w=500&q=80', '/images/prod-drip.png'],
      rating: 4.8,
      reviewCount: 37,
      specs: { 'Outer Diameter': '16 mm', 'Roll Length': '500 Meters', 'Wall Thickness': '1.2 mm Class 2', 'Burst Pressure': '6.0 bar' },
      highlights: ['Virgin High-Grade Polymer Material', 'Carbon Black UV Stabilized Protection', 'Resists Insect Chewing & Kinking', 'Tested for 10+ Year Field Lifespan']
    },
    {
      name: 'Automated 4-Zone Smart Solenoid Irrigation Timer Valve',
      sku: 'SKU-AG-12',
      slug: 'smart-solenoid-irrigation-timer-valve-ag-12',
      category: agriCat._id,
      categoryName: agriCat.name,
      subcategory: 'Irrigation & Drip Systems',
      brand: 'DripAqua',
      description: 'Solar-rechargeable automatic 4-zone water manifold controller with rainfall pause sensor and programmable pulse watering cycles.',
      price: 6500,
      mrp: 8200,
      discount: 21,
      stock: 25,
      image: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=500&q=80',
      images: ['https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=500&q=80', '/images/prod-drip.png'],
      rating: 4.9,
      reviewCount: 22,
      specs: { 'Inlet / Outlet': '1 Inch BSP Brass Thread', 'Zone Ports': '4 Independent Solenoid Lines', 'Power': 'Integrated Solar Panel + Li-Ion', 'Waterproof': 'IP67 Sealed Housing' },
      highlights: ['Automated Dawn & Dusk Watering Modes', 'Rain Sensor Auto-Delay Feature', 'High-Flow Brass Valves Prevent Leakage', 'Manual Quick-Bypass Button']
    },

    // --- Subcategory 5: Solar Pumps (3 items) ---
    {
      name: 'Solar Irrigation Water Pumping System 5HP',
      sku: 'SKU-AG-13',
      slug: 'solar-irrigation-pumping-system-ag-13',
      category: agriCat._id,
      categoryName: agriCat.name,
      subcategory: 'Solar Pumps',
      brand: 'SolarAgro',
      description: 'Submersible 5HP stainless steel solar water pump with MPPT solar pump controller, automated dry-run protection, and high discharge head.',
      price: 68000,
      mrp: 79000,
      discount: 13,
      stock: 20,
      image: '/images/prod-solar.png',
      images: ['/images/prod-solar.png'],
      rating: 4.9,
      reviewCount: 27,
      specs: { 'Motor Power': '5 HP / 3.7 kW', 'Max Head': '90 Meters', 'Max Flow Rate': '18,000 L/Hour', 'Controller': 'Advanced MPPT Variable Frequency' },
      highlights: ['Zero Recurring Electricity Cost', 'Grade 304 Stainless Steel Construction', 'Integrated Dry-Run & Lightning Protection', 'Remote Telemetry Monitoring Compatible']
    },
    {
      name: 'Submersible Solar Borewell Pump 3HP with Controller',
      sku: 'SKU-AG-14',
      slug: 'submersible-solar-borewell-pump-3hp-ag-14',
      category: agriCat._id,
      categoryName: agriCat.name,
      subcategory: 'Solar Pumps',
      brand: 'SolarAgro',
      description: 'High-head 3HP brushless DC helical rotor solar borewell pump engineered for deep groundwater extraction up to 120 meters.',
      price: 52000,
      mrp: 62000,
      discount: 16,
      stock: 18,
      image: 'https://images.unsplash.com/photo-1508873696983-2df5293cb32b?auto=format&fit=crop&w=500&q=80',
      images: ['https://images.unsplash.com/photo-1508873696983-2df5293cb32b?auto=format&fit=crop&w=500&q=80', '/images/prod-solar.png'],
      rating: 4.8,
      reviewCount: 33,
      specs: { 'Motor Type': 'BLDC Permanent Magnet 3HP', 'Operating Voltage': '72V - 150V DC', 'Max Head': '120 Meters', 'Discharge Diameter': '1.5 Inch' },
      highlights: ['High-Efficiency Brushless DC Technology', 'Soft-Start Extends Motor Lifespan', 'Submersible Down to 120m Wells', 'Complete Auto-Protection Suite']
    },
    {
      name: 'Surface Monoblock DC Solar Water Pump 2HP',
      sku: 'SKU-AG-15',
      slug: 'surface-monoblock-dc-solar-pump-2hp-ag-15',
      category: agriCat._id,
      categoryName: agriCat.name,
      subcategory: 'Solar Pumps',
      brand: 'SolarAgro',
      description: 'Open-well surface monoblock centrifugal solar pump designed for canal lifting, pond drainage, and open irrigation channels.',
      price: 38000,
      mrp: 45000,
      discount: 15,
      stock: 22,
      image: 'https://images.unsplash.com/photo-1509391365360-2e959784a276?auto=format&fit=crop&w=500&q=80',
      images: ['https://images.unsplash.com/photo-1509391365360-2e959784a276?auto=format&fit=crop&w=500&q=80', '/images/prod-solar.png'],
      rating: 4.7,
      reviewCount: 20,
      specs: { 'Power Output': '2 HP (1.5 kW)', 'Suction Lift': '7.5 Meters', 'Discharge Output': '24,000 L/Hour', 'Impeller': 'Non-Corrosive Gunmetal Bronze' },
      highlights: ['Cast-Iron Heavy Duty Pump Volute', 'Plug-and-Play Solar Array Direct Drive', 'Self-Priming Chamber Design', 'Low Maintenance Ceramic Shaft Seal']
    },

    // --- Subcategory 6: Farm Machinery (3 items) ---
    {
      name: 'Heavy Duty 45HP Utility Farm Tractor',
      sku: 'SKU-AG-16',
      slug: 'heavy-duty-farm-tractor-ag-16',
      category: agriCat._id,
      categoryName: agriCat.name,
      subcategory: 'Farm Machinery',
      brand: 'GROVE AgriMaster',
      description: 'Commercial 45HP dual-clutch utility tractor with advanced 8F+2R transmission, high ground clearance, and power steering for rigorous farming operations.',
      price: 585000,
      mrp: 620000,
      discount: 5,
      stock: 12,
      image: '/images/prod-tractor.png',
      images: ['/images/prod-tractor.png', '/images/prod-cultivator.png'],
      rating: 4.8,
      reviewCount: 42,
      specs: { 'Horsepower': '45 HP', 'Cylinders': '3 Cylinders', 'Lifting Capacity': '1500 kg', 'Fuel Tank': '50 Liters' },
      highlights: ['45 HP Fuel-Efficient Diesel Engine', 'Dual Clutch & Power Steering', '1500 kg Hydraulic Lift Capacity', '1 Year Comprehensive Warranty']
    },
    {
      name: 'Heavy-Duty Multi-Row Rotary Cultivator',
      sku: 'SKU-AG-17',
      slug: 'heavy-duty-rotary-cultivator-ag-17',
      category: agriCat._id,
      categoryName: agriCat.name,
      subcategory: 'Farm Machinery',
      brand: 'AgriPower',
      description: 'Heavy-duty tractor mounted rotary tiller designed for fine seedbed preparation in dry and wet soils with heat-treated boronic steel blades.',
      price: 34500,
      mrp: 39000,
      discount: 11,
      stock: 18,
      image: '/images/prod-cultivator.png',
      images: ['/images/prod-cultivator.png'],
      rating: 4.6,
      reviewCount: 31,
      specs: { 'Working Width': '5 Feet', 'Blades Count': '36 Blades', 'Tractor Power Required': '35-45 HP', 'Drive Type': 'Gear Drive' },
      highlights: ['High-Tensile Boron Steel L-Type Blades', 'Heavy Duty Sealed Gearbox', 'Adjustable Depth Skids', 'Vibration Dampened Side Shields']
    },
    {
      name: 'Self-Propelled 7HP Mini Power Weeder & Tiller',
      sku: 'SKU-AG-18',
      slug: 'self-propelled-power-weeder-tiller-ag-18',
      category: agriCat._id,
      categoryName: agriCat.name,
      subcategory: 'Farm Machinery',
      brand: 'GROVE AgriMaster',
      description: 'Compact 7HP 4-stroke petrol-driven inter-cultivator weeder with adjustable tilling width for sugarcane, vegetable, and orchard beds.',
      price: 29000,
      mrp: 35000,
      discount: 17,
      stock: 16,
      image: 'https://images.unsplash.com/photo-1595246140625-573b715d11dc?auto=format&fit=crop&w=500&q=80',
      images: ['https://images.unsplash.com/photo-1595246140625-573b715d11dc?auto=format&fit=crop&w=500&q=80', '/images/prod-cultivator.png'],
      rating: 4.7,
      reviewCount: 26,
      specs: { 'Engine': '7 HP 212cc 4-Stroke OHV', 'Tilling Width': '60 - 90 cm Adjustable', 'Tilling Depth': '15 - 20 cm', 'Fuel Consumption': '0.8 L/Hour' },
      highlights: ['360-Degree Swivel Handlebars', 'Oil-Bath Air Filter for Dusty Environments', 'Forward and Reverse Gear Transmission', 'Includes Ditching & Weeding Blade Wheels']
    },


    // =========================================================================
    // CATEGORY: Electronics & Gadgets (18 Products - 3 per subcategory)
    // =========================================================================

    // --- Subcategory 1: Audio & Headphones (3 items) ---
    {
      name: 'Professional Studio Broadcast Headset with Boom Mic',
      sku: 'SKU-EL-01',
      slug: 'professional-studio-broadcast-headset-el-01',
      category: elecCat._id,
      categoryName: elecCat.name,
      subcategory: 'Audio & Headphones',
      brand: 'Audio-Technica',
      description: 'Closed-back dynamic monitoring headphones with high-output cardioid dynamic microphone tailored for noisy control rooms and field broadcasting.',
      price: 5499,
      mrp: 7200,
      discount: 24,
      stock: 25,
      image: '/images/prod-headphones.png',
      images: ['/images/prod-headphones.png'],
      rating: 4.8,
      reviewCount: 42,
      specs: { 'Drivers': '40 mm Neodymium Magnets', 'Frequency Response': '20 - 20,000 Hz', 'Microphone': 'Flexible Dynamic Boom Mic', 'Cable': '3.0 m Detachable Coiled' },
      highlights: ['Exceptional Clarity Across Mid-Range', 'Rigid Sound-Isolating Earcups', 'Comfort-Cushioned Headband', 'Gold-Plated 3.5mm & 6.3mm Adapters']
    },
    {
      name: 'Rugged Waterproof Tactical In-Ear Earbuds IPX8',
      sku: 'SKU-EL-02',
      slug: 'rugged-waterproof-tactical-earbuds-el-02',
      category: elecCat._id,
      categoryName: elecCat.name,
      subcategory: 'Audio & Headphones',
      brand: 'Noise',
      description: 'IPX8 waterproof wireless earbuds with military-grade silicone wing tips, 48-hour endurance charging case, and ambient transparency audio.',
      price: 1999,
      mrp: 2999,
      discount: 33,
      stock: 40,
      image: 'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?auto=format&fit=crop&w=500&q=80',
      images: ['https://images.unsplash.com/photo-1590658268037-6bf12165a8df?auto=format&fit=crop&w=500&q=80', '/images/prod-headphones.png'],
      rating: 4.6,
      reviewCount: 56,
      specs: { 'Waterproof Rating': 'IPX8 Fully Submersible', 'Bluetooth Version': 'v5.3 Low Latency', 'Playtime': '10h Buds + 38h Case', 'Drivers': '10 mm Titanium Coated' },
      highlights: ['Sweat & High-Pressure Water Jet Proof', 'Touch Controls with Glove Responsiveness', 'ENC Quad Mics for Wind Noise Cancellation', 'USB-C Fast Charging (10m charge = 2h play)']
    },
    {
      name: 'Industrial Wireless Noise-Cancelling Field Headset',
      sku: 'SKU-EL-03',
      slug: 'industrial-wireless-noise-cancelling-headset-el-03',
      category: elecCat._id,
      categoryName: elecCat.name,
      subcategory: 'Audio & Headphones',
      brand: 'GROVE Tech',
      description: 'Heavy-duty wireless over-ear headset with active noise cancellation up to 35dB, boom mic with environmental suppression, and 40h battery.',
      price: 2999,
      mrp: 4499,
      discount: 33,
      stock: 35,
      image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=500&q=80',
      images: ['https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=500&q=80', '/images/prod-headphones.png'],
      rating: 4.7,
      reviewCount: 46,
      specs: { 'Noise Cancellation': 'Hybrid Active ANC (up to 35dB)', 'Battery': '800mAh (40 Hours)', 'Connectivity': 'Bluetooth 5.2 + 3.5mm Aux', 'Weight': '260 g' },
      highlights: ['Engine & Machinery Noise Filtering', 'All-Day Memory Foam Ear Cushions', 'Detachable Noise-Cancelling Boom Mic', 'Foldable Heavy-Duty Headband']
    },

    // --- Subcategory 2: Laptops & Computers (3 items) ---
    {
      name: 'Rugged All-Weather Telemetry Field Laptop 14-inch',
      sku: 'SKU-EL-04',
      slug: 'rugged-telemetry-field-laptop-el-04',
      category: elecCat._id,
      categoryName: elecCat.name,
      subcategory: 'Laptops & Computers',
      brand: 'Lenovo',
      description: 'Full-ruggedized 14-inch outdoor laptop with drop-resistant chassis, glove-touch outdoor sunlight readable screen, and hot-swappable dual batteries.',
      price: 48999,
      mrp: 58000,
      discount: 15,
      stock: 14,
      image: '/images/prod-laptop.png',
      images: ['/images/prod-laptop.png'],
      rating: 4.9,
      reviewCount: 19,
      specs: { 'Processor': 'Intel Core i5 12th Gen', 'RAM': '16 GB DDR4', 'Storage': '512 GB NVMe SSD', 'Drop Spec': '1.8 Meter Shockproof Drop Rating' },
      highlights: ['Sunlight-Readable 1200 Nits Display', 'Glove-Operable Touchscreen', 'Dual Hot-Swappable 12-Hour Batteries', 'Dedicated RS232 Serial & GPS Ports']
    },
    {
      name: 'Industrial Workstation Core i7 Rugged Laptop 32GB',
      sku: 'SKU-EL-05',
      slug: 'industrial-workstation-core-i7-laptop-el-05',
      category: elecCat._id,
      categoryName: elecCat.name,
      subcategory: 'Laptops & Computers',
      brand: 'Lenovo',
      description: 'High-performance MIL-SPEC field workstation laptop featuring NVIDIA RTX dedicated graphics, magnesium alloy casing, and spill-resistant keyboard.',
      price: 74999,
      mrp: 88000,
      discount: 15,
      stock: 10,
      image: 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?auto=format&fit=crop&w=500&q=80',
      images: ['https://images.unsplash.com/photo-1496181133206-80ce9b88a853?auto=format&fit=crop&w=500&q=80', '/images/prod-laptop.png'],
      rating: 4.8,
      reviewCount: 23,
      specs: { 'Processor': 'Intel Core i7-13700H', 'Graphics': 'NVIDIA RTX 4050 6GB', 'RAM': '32 GB DDR5', 'Display': '15.6 Inch 100% sRGB FHD' },
      highlights: ['Heavy CAD & Agronomy Telemetry Processing', 'Magnesium Alloy Drop-Proof Unibody', 'Biometric Fingerprint & Smart Card Reader', 'Thunderbolt 4 & Dual PCIe Expansion']
    },
    {
      name: 'Compact Fanless Rugged Mini PC Industrial Controller',
      sku: 'SKU-EL-06',
      slug: 'compact-fanless-rugged-mini-pc-el-06',
      category: elecCat._id,
      categoryName: elecCat.name,
      subcategory: 'Laptops & Computers',
      brand: 'GROVE Tech',
      description: 'Solid-state extruded aluminum fanless embedded PC designed for 24/7 agricultural greenhouse automation, IoT telemetry hubs, and factory kiosks.',
      price: 27500,
      mrp: 33000,
      discount: 16,
      stock: 20,
      image: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=500&q=80',
      images: ['https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=500&q=80', '/images/prod-laptop.png'],
      rating: 4.7,
      reviewCount: 16,
      specs: { 'CPU': 'Intel Celeron J6412 Quad-Core', 'Ports': '4x COM RS485, 2x Gigabit LAN, 6x USB', 'Operating Temp': '-20°C to +70°C', 'Power Input': '9V - 36V Wide DC' },
      highlights: ['100% Sealed Dust-Free Fanless Cooling', 'Continuous 24/7/365 Hardware Reliability', 'DIN-Rail & VESA Mount Included', 'Hardware Watchdog Timer Auto-Reboot']
    },

    // --- Subcategory 3: Wearables & Smartwatches (3 items) ---
    {
      name: 'GROVE Field Rugged Smartwatch with GPS & Sensor Hub',
      sku: 'SKU-EL-07',
      slug: 'grove-field-rugged-smartwatch-el-07',
      category: elecCat._id,
      categoryName: elecCat.name,
      subcategory: 'Wearables & Smartwatches',
      brand: 'GROVE Tech',
      description: 'MIL-STD-810H rated outdoor smartwatch with dual-band GPS, barometer, optical pulse oximeter, and 14-day ultra-long battery life.',
      price: 4299,
      mrp: 5999,
      discount: 28,
      stock: 40,
      image: '/images/prod-smartwatch.png',
      images: ['/images/prod-smartwatch.png'],
      rating: 4.7,
      reviewCount: 88,
      specs: { 'Display': '1.43 inch AMOLED Sapphire', 'Water Resistance': '5 ATM / 50M', 'Battery Life': 'Up to 14 Days', 'Sensors': 'Dual GPS, Altimeter, Barometer, SpO2' },
      highlights: ['Military-Grade Shock & Dust Resistance', 'Ultra-Bright 1000 nits Outdoor Display', 'Real-Time Field Telemetry Tracking', 'Bluetooth 5.3 Calling Enabled']
    },
    {
      name: 'Outdoor Multisport GPS Tactical Smartwatch',
      sku: 'SKU-EL-08',
      slug: 'outdoor-multisport-gps-tactical-smartwatch-el-08',
      category: elecCat._id,
      categoryName: elecCat.name,
      subcategory: 'Wearables & Smartwatches',
      brand: 'Noise',
      description: 'Heavy rugged smartwatch featuring offline topological maps, compass, LED tactical flashlight, and heart rate variability analytics.',
      price: 6499,
      mrp: 8499,
      discount: 24,
      stock: 30,
      image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=500&q=80',
      images: ['https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=500&q=80', '/images/prod-smartwatch.png'],
      rating: 4.8,
      reviewCount: 54,
      specs: { 'Bezel': 'Titanium Alloy with Ceramic Back', 'Battery': '500mAh (Up to 21 Days Standby)', 'GPS': 'Five Satellite Dual-Frequency', 'Waterproof': '10 ATM Submersible' },
      highlights: ['Built-In High-Intensity White & Red Flashlight', 'Offline Topographic Waypoint Navigation', 'VO2 Max & Recovery Assistant', 'Reinforced Gorilla Glass DX+']
    },
    {
      name: 'Biometric Telemetry & Heart Health Smart Fitness Band',
      sku: 'SKU-EL-09',
      slug: 'biometric-telemetry-smart-fitness-band-el-09',
      category: elecCat._id,
      categoryName: elecCat.name,
      subcategory: 'Wearables & Smartwatches',
      brand: 'GROVE Tech',
      description: 'Ultralight health wristband monitoring continuous skin temperature, stress levels, blood oxygenation, and sleep stage cycles.',
      price: 1899,
      mrp: 2499,
      discount: 24,
      stock: 45,
      image: 'https://images.unsplash.com/photo-1579586337278-3befd40fd17a?auto=format&fit=crop&w=500&q=80',
      images: ['https://images.unsplash.com/photo-1579586337278-3befd40fd17a?auto=format&fit=crop&w=500&q=80', '/images/prod-smartwatch.png'],
      rating: 4.5,
      reviewCount: 39,
      specs: { 'Display': '1.1 Inch Curved AMOLED', 'Weight': 'Only 22 Grams', 'Battery': '14 Days Magnetic Quick Charge', 'Compatibility': 'Android & iOS' },
      highlights: ['Continuous 24/7 SpO2 & Heart Monitoring', 'Automatic Workout Detection (30+ Sports)', 'Gentle Silent Vibration Smart Alarms', 'Hypoallergenic Silicone Band']
    },

    // --- Subcategory 4: Keyboards & Accessories (3 items) ---
    {
      name: 'Dustproof Mechanical Industrial Control Keyboard',
      sku: 'SKU-EL-10',
      slug: 'dustproof-mechanical-keyboard-el-10',
      category: elecCat._id,
      categoryName: elecCat.name,
      subcategory: 'Keyboards & Accessories',
      brand: 'Keychron',
      description: 'IP65-rated sealed mechanical keyboard engineered for industrial workstations, warehouses, and harsh field environments.',
      price: 3499,
      mrp: 4999,
      discount: 30,
      stock: 25,
      image: '/images/prod-keyboard.png',
      images: ['/images/prod-keyboard.png'],
      rating: 4.5,
      reviewCount: 39,
      specs: { 'Switch Type': 'Dustproof Sealed Optical Switches', 'Ingress Protection': 'IP65 Dust & Water Resistant', 'Chassis': 'Anodized Aircraft Aluminum', 'Keycaps': 'Double-Shot PBT' },
      highlights: ['Sealed Internal Membrane Shield', '50 Million Keystroke Durability', 'Oil and Solvent Resistant Keycaps', 'Integrated Braided USB-C Cable']
    },
    {
      name: 'Wireless Backlit Hot-Swappable Mechanical Keyboard',
      sku: 'SKU-EL-11',
      slug: 'wireless-backlit-mechanical-keyboard-el-11',
      category: elecCat._id,
      categoryName: elecCat.name,
      subcategory: 'Keyboards & Accessories',
      brand: 'Keychron',
      description: 'Compact 75% mechanical keyboard with Bluetooth 5.1 and 2.4GHz wireless connectivity, south-facing RGB backlight, and sound-absorbing silicone pads.',
      price: 5299,
      mrp: 6500,
      discount: 18,
      stock: 28,
      image: 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?auto=format&fit=crop&w=500&q=80',
      images: ['https://images.unsplash.com/photo-1587829741301-dc798b83add3?auto=format&fit=crop&w=500&q=80', '/images/prod-keyboard.png'],
      rating: 4.9,
      reviewCount: 47,
      specs: { 'Layout': '75% (84 Keys)', 'Switches': 'Gateron G Pro Mechanical Brown', 'Connectivity': 'Bluetooth 5.1 / 2.4G / Type-C', 'Battery': '4000 mAh' },
      highlights: ['Hot-Swappable 3-Pin / 5-Pin Switch Sockets', 'Connects up to 3 Devices Simultaneously', 'CNC Aluminum Top Frame Plate', 'Mac & Windows Keycap Sets Included']
    },
    {
      name: 'Ergonomic IP68 Heavy-Duty Industrial Trackball Mouse',
      sku: 'SKU-EL-12',
      slug: 'ergonomic-industrial-trackball-mouse-el-12',
      category: elecCat._id,
      categoryName: elecCat.name,
      subcategory: 'Keyboards & Accessories',
      brand: 'GROVE Tech',
      description: 'Fully sealed optical laser trackball mouse with water-washable stainless steel ball and chemical-resistant housing for control room consoles.',
      price: 2699,
      mrp: 3499,
      discount: 23,
      stock: 32,
      image: 'https://images.unsplash.com/photo-1615663245857-ac93bb7c39e7?auto=format&fit=crop&w=500&q=80',
      images: ['https://images.unsplash.com/photo-1615663245857-ac93bb7c39e7?auto=format&fit=crop&w=500&q=80', '/images/prod-keyboard.png'],
      rating: 4.6,
      reviewCount: 18,
      specs: { 'Tracking Technology': 'Optical Laser 1200 DPI', 'Ball Diameter': '38 mm Solid Steel', 'Ingress Rating': 'IP68 Washable', 'Interface': 'USB Plug & Play' },
      highlights: ['No Moving Mechanical Friction Parts', 'Functions Reliably with Thick Work Gloves', 'Resistant to Salt Spray & Oil Splashes', 'Zero Desktop Surface Drag Needed']
    },

    // --- Subcategory 5: Smart Sensors & IoT (3 items) ---
    {
      name: 'Wireless Soil Moisture & Temperature LoRaWAN Sensor',
      sku: 'SKU-EL-13',
      slug: 'wireless-soil-moisture-lorawan-sensor-el-13',
      category: elecCat._id,
      categoryName: elecCat.name,
      subcategory: 'Smart Sensors & IoT',
      brand: 'AgroSense',
      description: 'Precision FDR soil probe measuring volumetric water content, soil temperature, and EC salinity transmitting up to 10km via LoRaWAN.',
      price: 4800,
      mrp: 5900,
      discount: 19,
      stock: 35,
      image: 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=500&q=80',
      images: ['https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=500&q=80', '/images/card-electronics.png'],
      rating: 4.8,
      reviewCount: 31,
      specs: { 'Wireless Protocol': 'LoRaWAN 868/915 MHz', 'Battery Life': '5+ Years (19000mAh Li-SOCl2)', 'Transmission Range': 'Up to 10 km Line of Sight', 'Probe Material': 'Food-Grade Stainless Steel 316' },
      highlights: ['Measures Moisture, Temp & Salinity Simultaneously', 'IP68 Underground Enclosure', 'Cloud API & MQTT Dashboard Integration', 'No Recurring Cellular SIM Fees Required']
    },
    {
      name: 'Industrial Weather Station Telemetry Gateway 4G',
      sku: 'SKU-EL-14',
      slug: 'industrial-weather-station-telemetry-gateway-el-14',
      category: elecCat._id,
      categoryName: elecCat.name,
      subcategory: 'Smart Sensors & IoT',
      brand: 'AgroSense',
      description: 'All-in-one ultrasonic meteorological station tracking wind speed, direction, ambient temp, humidity, solar radiation, and barometric pressure.',
      price: 14500,
      mrp: 18000,
      discount: 19,
      stock: 20,
      image: 'https://images.unsplash.com/photo-1558346490-a72e53ae2d4f?auto=format&fit=crop&w=500&q=80',
      images: ['https://images.unsplash.com/photo-1558346490-a72e53ae2d4f?auto=format&fit=crop&w=500&q=80', '/images/card-electronics.png'],
      rating: 4.9,
      reviewCount: 22,
      specs: { 'Communication': '4G LTE-M / NB-IoT / RS485 Modbus', 'Power': 'Solar Panel with Internal Backup Battery', 'Sensors': '7-in-1 Solid-State Ultrasonic Sensors', 'Mount': 'Heavy Mast Pole Clamp' },
      highlights: ['No Mechanical Moving Parts to Jam', 'Microclimate Real-Time Frost & Heat Warnings', 'Solar-Self Sustained for Infinite Autonomy', 'Data Logs Direct to Mobile Application']
    },
    {
      name: 'Digital Ultrasonic Wireless Water Tank Depth Monitor',
      sku: 'SKU-EL-15',
      slug: 'digital-ultrasonic-tank-depth-monitor-el-15',
      category: elecCat._id,
      categoryName: elecCat.name,
      subcategory: 'Smart Sensors & IoT',
      brand: 'GROVE Tech',
      description: 'Non-contact ultrasonic liquid level transmitter with high-contrast indoor display console and automated low-level warning sirens.',
      price: 3200,
      mrp: 4100,
      discount: 22,
      stock: 30,
      image: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=500&q=80',
      images: ['https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=500&q=80', '/images/card-electronics.png'],
      rating: 4.6,
      reviewCount: 27,
      specs: { 'Measurement Range': '0.2 m to 15.0 Meters', 'Accuracy': '±1 mm Ultrasonic Echo', 'RF Range': '100m Wireless to Indoor Console', 'Sensor Rating': 'IP67 Weatherproof' },
      highlights: ['Non-Contact Sensor Never Corrodes in Water', 'Graphical Bar Display Shows Remaining Liters', 'Configurable High/Low Water Level Alarms', 'Effortless 5-Minute Tank Top Installation']
    },

    // --- Subcategory 6: Drones & Robotics (3 items) ---
    {
      name: 'Autonomous Agricultural 10L Crop Spraying Drone Hexacopter',
      sku: 'SKU-EL-16',
      slug: 'autonomous-agricultural-crop-spraying-drone-el-16',
      category: elecCat._id,
      categoryName: elecCat.name,
      subcategory: 'Drones & Robotics',
      brand: 'AeroKisan',
      description: 'Commercial hexacopter sprayer equipped with dual centrifugal atomizing nozzles, RTK centimeter-accurate positioning, and obstacle avoidance radar.',
      price: 215000,
      mrp: 245000,
      discount: 12,
      stock: 6,
      image: 'https://images.unsplash.com/photo-1508614589041-895b88991e3e?auto=format&fit=crop&w=500&q=80',
      images: ['https://images.unsplash.com/photo-1508614589041-895b88991e3e?auto=format&fit=crop&w=500&q=80', '/images/card-electronics-clean.png'],
      rating: 4.9,
      reviewCount: 14,
      specs: { 'Payload Capacity': '10 Liters Spray Tank', 'Flight Time': '15-20 Min per Battery Cycle', 'Spraying Efficiency': 'Up to 15 Acres per Hour', 'Radar': 'Spherical Omnidirectional Obstacle Avoidance' },
      highlights: ['Autonomous GPS Route Planning from App', 'Centrifugal Nozzles Guarantee Zero Drift', 'Foldable Carbon-Fiber Truss Arms', 'Dual Smart Hot-Swappable Fast Batteries']
    },
    {
      name: 'High-Resolution Multispectral Field Survey Mapping Drone',
      sku: 'SKU-EL-17',
      slug: 'multispectral-field-survey-drone-el-17',
      category: elecCat._id,
      categoryName: elecCat.name,
      subcategory: 'Drones & Robotics',
      brand: 'AeroKisan',
      description: 'Fixed-wing quad-hybrid survey drone with 5-band multispectral camera for generating NDVI crop health index, vegetation stress, and irrigation maps.',
      price: 165000,
      mrp: 185000,
      discount: 11,
      stock: 8,
      image: 'https://images.unsplash.com/photo-1527977966376-1c8408f9f108?auto=format&fit=crop&w=500&q=80',
      images: ['https://images.unsplash.com/photo-1527977966376-1c8408f9f108?auto=format&fit=crop&w=500&q=80', '/images/card-electronics.png'],
      rating: 4.8,
      reviewCount: 17,
      specs: { 'Camera': '5-Band (Blue, Green, Red, Red Edge, NIR)', 'Survey Area': 'Up to 150 Acres per Flight', 'Max Flight Time': '42 Minutes', 'Positioning': 'RTK/PPK Ready Centimeter Accuracy' },
      highlights: ['Generates Instant NDVI Crop Stress Indices', 'Detects Nitrogen Deficiency & Pest Outbreaks', 'Automated One-Click Mission Planning', 'Includes 1-Year Agronomy Orthomosaic Cloud License']
    },
    {
      name: 'Autonomous AI Field Scouting Rover with Optical Cameras',
      sku: 'SKU-EL-18',
      slug: 'autonomous-ai-field-scouting-rover-el-18',
      category: elecCat._id,
      categoryName: elecCat.name,
      subcategory: 'Drones & Robotics',
      brand: 'GROVE Tech',
      description: 'All-terrain robotic field rover with tracked tread suspension, dual RGB-D stereoscopic cameras, and edge AI processor for automated weed identification.',
      price: 95000,
      mrp: 110000,
      discount: 14,
      stock: 10,
      image: 'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?auto=format&fit=crop&w=500&q=80',
      images: ['https://images.unsplash.com/photo-1485827404703-89b55fcc595e?auto=format&fit=crop&w=500&q=80', '/images/card-electronics-clean.png'],
      rating: 4.7,
      reviewCount: 11,
      specs: { 'Mobility': 'Rubber Tank Track All-Terrain System', 'Compute': 'Edge AI 21 TOPS Neural Engine', 'Battery': '48V 30Ah Lithium (8h Operating Time)', 'Sensors': '3D LiDAR + Stereoscopic Depth Cameras' },
      highlights: ['Navigates High-Density Crop Furrows', 'Detects Early-Stage Weeds with 98% Accuracy', 'Autonomous Solar Docking Recharging', 'Wireless 4G Live Video Stream & Control']
    },


    // =========================================================================
    // CATEGORY: Automotive & Spare Parts (18 Products - 3 per subcategory)
    // =========================================================================

    // --- Subcategory 1: Tires & Wheels (3 items) ---
    {
      name: 'All-Terrain Commercial Agricultural Radial Rear Tire',
      sku: 'SKU-AU-01',
      slug: 'all-terrain-radial-rear-tire-au-01',
      category: autoCat._id,
      categoryName: autoCat.name,
      subcategory: 'Tires & Wheels',
      brand: 'Apollo',
      description: 'Deep-lug agricultural drive wheel tire engineered with dual-angle lug geometry for superior field traction and reduced soil compaction.',
      price: 22500,
      mrp: 27000,
      discount: 16,
      stock: 20,
      image: '/images/prod-tyre.png',
      images: ['/images/prod-tyre.png'],
      rating: 4.9,
      reviewCount: 45,
      specs: { 'Size': '13.6 - 28', 'PR (Ply Rating)': '12 Ply', 'Load Index': '128 A8', 'Tread Depth': '38 mm' },
      highlights: ['Self-Cleaning Mud-Shedding Lug Design', 'Puncture-Resistant Heavy Sidewall Plies', 'Even Footprint Minimizes Soil Compaction', 'High Roadability & Wear Resistance']
    },
    {
      name: 'Commercial Heavy Truck Front Steer Axle Radial Tire',
      sku: 'SKU-AU-02',
      slug: 'commercial-heavy-truck-steer-tire-au-02',
      category: autoCat._id,
      categoryName: autoCat.name,
      subcategory: 'Tires & Wheels',
      brand: 'MRF',
      description: 'All-position steer tire with five ribbed decoupled shoulder profiles for supreme fuel efficiency, even wear, and dependable wet highway braking.',
      price: 14500,
      mrp: 17500,
      discount: 17,
      stock: 24,
      image: 'https://images.unsplash.com/photo-1578844251758-2f71da64c96f?auto=format&fit=crop&w=500&q=80',
      images: ['https://images.unsplash.com/photo-1578844251758-2f71da64c96f?auto=format&fit=crop&w=500&q=80', '/images/prod-tyre.png'],
      rating: 4.7,
      reviewCount: 38,
      specs: { 'Size': '295/80 R22.5', 'Ply Rating': '16 PR', 'Speed Rating': 'M (130 km/h)', 'Max Load': '3,550 kg Single' },
      highlights: ['Advanced Micro-Sipe Grooves Displace Water', 'High-Tensile Steel Belt Package', 'Retreadable High-Durability Casing', 'Optimized Low Rolling Resistance Compound']
    },
    {
      name: 'Reinforced Heavy Duty Alloy Wheel Rim 16-Inch',
      sku: 'SKU-AU-03',
      slug: 'reinforced-heavy-duty-alloy-wheel-rim-au-03',
      category: autoCat._id,
      categoryName: autoCat.name,
      subcategory: 'Tires & Wheels',
      brand: 'Apollo',
      description: 'One-piece forged aluminum alloy heavy rim engineered for commercial flatbeds, transport vans, and rugged agricultural haulage.',
      price: 8200,
      mrp: 10200,
      discount: 20,
      stock: 30,
      image: 'https://images.unsplash.com/photo-1611821064430-0d40291d0f0b?auto=format&fit=crop&w=500&q=80',
      images: ['https://images.unsplash.com/photo-1611821064430-0d40291d0f0b?auto=format&fit=crop&w=500&q=80', '/images/prod-tyre.png'],
      rating: 4.8,
      reviewCount: 29,
      specs: { 'Rim Diameter': '16 Inch', 'Rim Width': '6.5 J', 'PCD': '5 x 160 mm', 'Payload Capacity': '1,450 kg per Rim' },
      highlights: ['Aviation-Grade Forged T6061 Aluminum', 'Corrosion-Resistant Diamond Polished Finish', 'Dissipates Brake Heat Faster than Steel', 'Tested Against Severe Impact Standards']
    },

    // --- Subcategory 2: Braking Systems (3 items) ---
    {
      name: 'Semi-Metallic Heavy Duty Commercial Brake Pads Set',
      sku: 'SKU-AU-04',
      slug: 'semi-metallic-commercial-brake-pads-au-04',
      category: autoCat._id,
      categoryName: autoCat.name,
      subcategory: 'Braking Systems',
      brand: 'Brembo',
      description: 'High-friction semi-metallic front brake pad set for light commercial trucks, tractors, and agricultural haulers with low-dust thermal slots.',
      price: 1850,
      mrp: 2400,
      discount: 22,
      stock: 50,
      image: '/images/prod-brakepads.png',
      images: ['/images/prod-brakepads.png'],
      rating: 4.7,
      reviewCount: 74,
      specs: { 'Material': 'Semi-Metallic Carbon Composite', 'Operating Temp': '-40°C to +650°C', 'Wear Indicator': 'Acoustic Wear Sensor', 'Axle Placement': 'Front Axle' },
      highlights: ['Extended Rotor Life Formulation', 'Fade-Resistant Heavy Load Braking', 'Dual Chamfered Noise Damping Slots', 'Includes Hardware Installation Clips']
    },
    {
      name: 'Vented Heavy Duty Front Brake Disc Rotors Pair',
      sku: 'SKU-AU-05',
      slug: 'vented-front-brake-disc-rotors-pair-au-05',
      category: autoCat._id,
      categoryName: autoCat.name,
      subcategory: 'Braking Systems',
      brand: 'Bosch',
      description: 'Precision balanced G3000 high-carbon gray iron vented brake rotors providing maximum cooling airflow and warp resistance under loaded descents.',
      price: 4200,
      mrp: 5400,
      discount: 22,
      stock: 30,
      image: 'https://images.unsplash.com/photo-1600705722908-bab1e61c0b4d?auto=format&fit=crop&w=500&q=80',
      images: ['https://images.unsplash.com/photo-1600705722908-bab1e61c0b4d?auto=format&fit=crop&w=500&q=80', '/images/prod-brakepads.png'],
      rating: 4.8,
      reviewCount: 36,
      specs: { 'Diameter': '300 mm', 'Thickness': '28 mm Vented', 'Material': 'High-Carbon G3000 Alloy Gray Cast Iron', 'Coating': 'Anti-Rust Zinc Dichromate' },
      highlights: ['Directional Cooling Vane Architecture', 'Precision Mill-Balanced Against Brake Shimmy', 'Resists Thermal Cracking Under 700°C', 'Direct Bolt-On OEM Standard Replacement']
    },
    {
      name: 'Pneumatic Commercial Air Brake Master Cylinder Valve',
      sku: 'SKU-AU-06',
      slug: 'pneumatic-air-brake-master-cylinder-au-06',
      category: autoCat._id,
      categoryName: autoCat.name,
      subcategory: 'Braking Systems',
      brand: 'Brembo',
      description: 'Dual-circuit foot brake air valve engineered for commercial transport trucks and multi-axle trailers with anodized aluminum body.',
      price: 5800,
      mrp: 7200,
      discount: 19,
      stock: 25,
      image: 'https://images.unsplash.com/photo-1486006920555-c77dce18193b?auto=format&fit=crop&w=500&q=80',
      images: ['https://images.unsplash.com/photo-1486006920555-c77dce18193b?auto=format&fit=crop&w=500&q=80', '/images/prod-brakepads.png'],
      rating: 4.6,
      reviewCount: 21,
      specs: { 'Operating Pressure': 'Up to 10.0 bar', 'Ports': 'M22x1.5 Push-to-Connect Air Ports', 'Body Material': 'Forged Aluminum Alloy', 'Temperature Range': '-40°C to +80°C' },
      highlights: ['Dual-Circuit Redundancy Prevents Total Loss', 'Instant Proportional Braking Pressure Feedback', 'Weatherproof Rubber Plunger Boot', 'Certified ISO 9001 Commercial Safety Standard']
    },

    // --- Subcategory 3: Suspension & Steering (3 items) ---
    {
      name: 'Dual-Tube Heavy Vehicle Hydraulic Shock Absorber',
      sku: 'SKU-AU-07',
      slug: 'dual-tube-hydraulic-shock-absorber-au-07',
      category: autoCat._id,
      categoryName: autoCat.name,
      subcategory: 'Suspension & Steering',
      brand: 'Gabriel',
      description: 'Commercial-grade twin-tube hydraulic shock absorber with multi-lip piston seal and all-weather hydraulic fluid for rough terrain damping.',
      price: 3400,
      mrp: 4600,
      discount: 26,
      stock: 32,
      image: '/images/prod-shockabsorber.png',
      images: ['/images/prod-shockabsorber.png'],
      rating: 4.6,
      reviewCount: 29,
      specs: { 'Extended Length': '540 mm', 'Collapsed Length': '345 mm', 'Bore Diameter': '45 mm', 'Mounting': 'Eye-to-Eye Poly Bushing' },
      highlights: ['Nitro-Carburized Heavy Piston Rod', 'Twin-Tube High Heat Dissipation Design', 'Prevents Axle Hop & Load Sway', 'Polyurethane Long-Life Bushings Included']
    },
    {
      name: 'Heavy Commercial Multi-Leaf Spring Suspension Pack',
      sku: 'SKU-AU-08',
      slug: 'heavy-commercial-multi-leaf-spring-au-08',
      category: autoCat._id,
      categoryName: autoCat.name,
      subcategory: 'Suspension & Steering',
      brand: 'Gabriel',
      description: 'Heavy-duty parabolic 9-leaf spring assembly fabricated from heat-treated manganese spring steel for commercial transport trailers.',
      price: 8200,
      mrp: 10500,
      discount: 21,
      stock: 16,
      image: 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=500&q=80',
      images: ['https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=500&q=80', '/images/prod-shockabsorber.png'],
      rating: 4.5,
      reviewCount: 23,
      specs: { 'Leaves Count': '9 Leaves', 'Leaf Width': '75 mm', 'Payload Rating': '3,500 kg per Pack', 'Material': 'Grade 55Si7 Manganese Steel' },
      highlights: ['Shot-Peened & Anti-Corrosion Zinc Primed', 'High Fatigue Resistance Under Max Payloads', 'Includes Center Pin & U-Bolt Clamping Kit', 'OEM Fitment for Commercial Utility Trailers']
    },
    {
      name: 'Heavy Duty Steering Tie Rod End & Drag Link Assembly',
      sku: 'SKU-AU-09',
      slug: 'heavy-duty-steering-tie-rod-end-au-09',
      category: autoCat._id,
      categoryName: autoCat.name,
      subcategory: 'Suspension & Steering',
      brand: 'Bosch',
      description: 'Forged chrome-moly ball stud steering tie rod end with greasable zerk fitting and polychloroprene dust boot preventing grit intrusion.',
      price: 2750,
      mrp: 3500,
      discount: 21,
      stock: 28,
      image: 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=500&q=80',
      images: ['https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=500&q=80', '/images/prod-shockabsorber.png'],
      rating: 4.7,
      reviewCount: 31,
      specs: { 'Thread Size': 'M24 x 1.5 Right Hand', 'Stud Taper': '1:10 Heavy Commercial', 'Housing': 'Forged 40Cr Alloy Steel', 'Bearing': 'Sintered Metal Self-Lubricating' },
      highlights: ['Zero Play Tight Steering Control', 'Greasable Design for Extended Service Life', 'Resists Rut Shocks and Off-Road Jerks', 'Includes Castle Nut & Cotter Pin Hardware']
    },

    // --- Subcategory 4: Electrical & Battery (3 items) ---
    {
      name: 'Heavy-Duty Commercial Vehicle Maintenance-Free Battery 12V 150Ah',
      sku: 'SKU-AU-10',
      slug: 'heavy-duty-commercial-battery-12v-150ah-au-10',
      category: autoCat._id,
      categoryName: autoCat.name,
      subcategory: 'Electrical & Battery',
      brand: 'Duramax',
      description: 'Rugged vibration-resistant commercial lead-acid calcium battery designed for high cranking power in tractors, trucks, and generator sets.',
      price: 11500,
      mrp: 13900,
      discount: 17,
      stock: 22,
      image: 'https://images.unsplash.com/photo-1558441719-7b3b3a61ec75?auto=format&fit=crop&w=500&q=80',
      images: ['https://images.unsplash.com/photo-1558441719-7b3b3a61ec75?auto=format&fit=crop&w=500&q=80', '/images/card-automotive.png'],
      rating: 4.9,
      reviewCount: 52,
      specs: { 'Capacity': '150 Ah @ 20-Hour Rate', 'Cold Cranking Amps (CCA)': '1050 CCA', 'Voltage': '12 Volts', 'Warranty': '36 Months Pro-Rata' },
      highlights: ['Sealed Maintenance-Free Calcium Technology', 'Exceptional Cranking in Sub-Zero Weather', 'Reinforced Polypropylene Shockproof Case', 'Built-In Magic-Eye State of Charge Indicator']
    },
    {
      name: 'High-Output 120A Heavy Duty Commercial Alternator',
      sku: 'SKU-AU-11',
      slug: 'high-output-120a-commercial-alternator-au-11',
      category: autoCat._id,
      categoryName: autoCat.name,
      subcategory: 'Electrical & Battery',
      brand: 'Bosch',
      description: 'Brushless high-efficiency commercial alternator with internal voltage regulator and heavy sealed bearings for dusty farm and road conditions.',
      price: 7800,
      mrp: 9600,
      discount: 19,
      stock: 18,
      image: 'https://images.unsplash.com/photo-1508974239320-0a029497e820?auto=format&fit=crop&w=500&q=80',
      images: ['https://images.unsplash.com/photo-1508974239320-0a029497e820?auto=format&fit=crop&w=500&q=80', '/images/card-automotive-clean.png'],
      rating: 4.8,
      reviewCount: 34,
      specs: { 'Output Current': '120 Amperes', 'Voltage System': '12V Negative Ground', 'Rotation': 'Clockwise Multi-Groove Pulley', 'Regulator': 'Solid-State Smart Voltage Controller' },
      highlights: ['Charges Auxiliary Lights & Equipment at Idle', 'Heavy Dust Baffles & Anti-Corrosion Rotor', 'High-Temp 180°C Copper Field Windings', 'Direct Replacement for Commercial Tractors']
    },
    {
      name: 'High-Torque 24V Commercial Heavy Vehicle Starter Motor',
      sku: 'SKU-AU-12',
      slug: 'high-torque-24v-commercial-starter-motor-au-12',
      category: autoCat._id,
      categoryName: autoCat.name,
      subcategory: 'Electrical & Battery',
      brand: 'Duramax',
      description: 'Gear-reduction 24V 4.5kW starter motor engineered to fire high-displacement diesel engines reliably in extreme temperature climates.',
      price: 6900,
      mrp: 8500,
      discount: 19,
      stock: 20,
      image: 'https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?auto=format&fit=crop&w=500&q=80',
      images: ['https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?auto=format&fit=crop&w=500&q=80', '/images/card-automotive.png'],
      rating: 4.7,
      reviewCount: 26,
      specs: { 'Rated Power': '4.5 kW / 24 Volts', 'Pinion Teeth': '10 Teeth Hardened Gear', 'Rotation': 'Clockwise', 'Mounting Flange': '3-Bolt Heavy SAE Standard' },
      highlights: ['High-Efficiency Epicyclic Planetary Gear Reduction', 'Soft-Engage Solenoid Extends Flywheel Life', 'Totally Sealed IP67 Waterproof Armature', 'Rapid Ignition Even with Cold Engine Oil']
    },

    // --- Subcategory 5: Engine & Drivetrain (3 items) ---
    {
      name: 'Heavy Duty Spin-On Engine Oil Filter with Anti-Drain Valve',
      sku: 'SKU-AU-13',
      slug: 'heavy-duty-tractor-oil-filter-au-13',
      category: autoCat._id,
      categoryName: autoCat.name,
      subcategory: 'Engine & Drivetrain',
      brand: 'Bosch',
      description: 'Spin-on heavy engine oil filter featuring synthetic micro-glass media that captures 99% of contaminants down to 20 microns.',
      price: 680,
      mrp: 950,
      discount: 28,
      stock: 120,
      image: '/images/prod-oilfilter-raw.png',
      images: ['/images/prod-oilfilter-raw.png'],
      rating: 4.8,
      reviewCount: 110,
      specs: { 'Thread Size': '1-12 UNF-2B', 'Micron Rating': '20 Microns @ 99%', 'Burst Pressure': '350 PSI', 'Gasket Type': 'Nitrile Rubber Seal' },
      highlights: ['Heavy-Gauge Steel Canister Housing', 'Silicone Anti-Drainback Valve', 'Prevents Cold-Start Engine Wear', 'Recommended for 500-Hour Service Intervals']
    },
    {
      name: 'High-Flow Heavy Commercial Diesel Engine Air Filter',
      sku: 'SKU-AU-14',
      slug: 'high-flow-heavy-engine-air-filter-au-14',
      category: autoCat._id,
      categoryName: autoCat.name,
      subcategory: 'Engine & Drivetrain',
      brand: 'Duramax',
      description: 'Dual-stage radial seal primary engine air filter element with synthetic nano-fiber media preventing abrasive silicon dust ingestion.',
      price: 1250,
      mrp: 1650,
      discount: 24,
      stock: 65,
      image: 'https://images.unsplash.com/photo-1580273916550-e323be2ae537?auto=format&fit=crop&w=500&q=80',
      images: ['https://images.unsplash.com/photo-1580273916550-e323be2ae537?auto=format&fit=crop&w=500&q=80', '/images/prod-oilfilter-raw.png'],
      rating: 4.7,
      reviewCount: 48,
      specs: { 'Efficiency': '99.9% Dust Filtration', 'Outer Diameter': '180 mm', 'Height': '360 mm', 'Seal Type': 'Molded Urethane Radial Lip' },
      highlights: ['Protects Engine Cylinders from Dust Abrasion', 'Flame-Retardant Filter Paper Pleats', 'Includes Inner Secondary Safety Filter', 'Maximizes Engine Horsepower and Fuel Economy']
    },
    {
      name: 'Heavy Duty Ceramic Clutch Plate & Pressure Plate Kit',
      sku: 'SKU-AU-15',
      slug: 'ceramic-clutch-plate-pressure-plate-kit-au-15',
      category: autoCat._id,
      categoryName: autoCat.name,
      subcategory: 'Engine & Drivetrain',
      brand: 'MRF',
      description: 'Dual-clutch 310mm ceramic paddle friction disc kit engineered for high-torque commercial tractors, tipper trucks, and heavy haulers.',
      price: 8900,
      mrp: 11200,
      discount: 21,
      stock: 20,
      image: 'https://images.unsplash.com/photo-1517524008697-84bbe3c3fd98?auto=format&fit=crop&w=500&q=80',
      images: ['https://images.unsplash.com/photo-1517524008697-84bbe3c3fd98?auto=format&fit=crop&w=500&q=80', '/images/prod-cultivator.png'],
      rating: 4.9,
      reviewCount: 33,
      specs: { 'Disc Diameter': '310 mm', 'Spline Count': '14 Splines', 'Friction Material': 'Sintered Ceramic-Metallic Buttons', 'Pressure Plate Type': 'Diaphragm Spring High-Clamp' },
      highlights: ['Eliminates Clutch Slippage Under 5-Ton Loads', 'Withstands 600°C High-Thermal Friction Heat', 'Damped Hub Springs Reduce Transmission Jerks', 'Includes Release Bearing and Alignment Tool']
    },

    // --- Subcategory 6: Spares & Accessories (3 items) ---
    {
      name: 'Hydraulic Heavy-Duty 20-Ton Bottle Jack with Case',
      sku: 'SKU-AU-16',
      slug: 'hydraulic-heavy-duty-20-ton-bottle-jack-au-16',
      category: autoCat._id,
      categoryName: autoCat.name,
      subcategory: 'Spares & Accessories',
      brand: 'Bosch',
      description: 'Commercial drop-forged alloy steel hydraulic bottle jack with bypass safety valve and heat-treated extension screw.',
      price: 3450,
      mrp: 4500,
      discount: 23,
      stock: 35,
      image: 'https://images.unsplash.com/photo-1581235720704-06d3acfcb36f?auto=format&fit=crop&w=500&q=80',
      images: ['https://images.unsplash.com/photo-1581235720704-06d3acfcb36f?auto=format&fit=crop&w=500&q=80', '/images/card-automotive.png'],
      rating: 4.8,
      reviewCount: 42,
      specs: { 'Lifting Capacity': '20 Tons (20,000 kg)', 'Min Height': '242 mm', 'Max Lift Height': '452 mm', 'Base': 'Broad Forged Steel Stability Base' },
      highlights: ['Effortless Lifting for Loaded Trucks & Tractors', 'Built-In Overload Protection Bypass Valve', 'Cross-Grooved Saddle for Anti-Slip Grip', 'Sturdy Steel Pumping Handle Included']
    },
    {
      name: 'Emergency Commercial Roadside Warning Triangle & Hazard Kit',
      sku: 'SKU-AU-17',
      slug: 'emergency-roadside-warning-triangle-kit-au-17',
      category: autoCat._id,
      categoryName: autoCat.name,
      subcategory: 'Spares & Accessories',
      brand: 'Duramax',
      description: 'DOT/ECE certified reflective collapsible hazard triangle with weighted windproof metal base and high-visibility flashing LED beacons.',
      price: 950,
      mrp: 1400,
      discount: 32,
      stock: 50,
      image: 'https://images.unsplash.com/photo-1563720223185-11003d516935?auto=format&fit=crop&w=500&q=80',
      images: ['https://images.unsplash.com/photo-1563720223185-11003d516935?auto=format&fit=crop&w=500&q=80', '/images/card-automotive-clean.png'],
      rating: 4.6,
      reviewCount: 57,
      specs: { 'Certification': 'ECE R27 & CMVR Compliant', 'Reflector Visibility': 'Visible from 500 Meters', 'Base': 'Heavy Galvanized Steel Four-Leg Stand', 'Case': 'Compact Hard Storage Tube' },
      highlights: ['Stands Firm in High 60 km/h Highway Gusts', 'Daylight Fluorescent Inner Triangle', 'Essential Mandated Commercial Safety Kit', 'Folds Flat in Seconds for Cab Stowage']
    },
    {
      name: 'Professional 150-Piece Heavy Mechanical Socket Toolset',
      sku: 'SKU-AU-18',
      slug: 'professional-150-piece-socket-toolset-au-18',
      category: autoCat._id,
      categoryName: autoCat.name,
      subcategory: 'Spares & Accessories',
      brand: 'Bosch',
      description: 'Comprehensive 1/2-inch, 3/8-inch, and 1/4-inch drive Chrome-Vanadium alloy socket and 72-tooth quick-release ratchet toolkit in blow-molded case.',
      price: 5400,
      mrp: 6900,
      discount: 22,
      stock: 25,
      image: 'https://images.unsplash.com/photo-1530124566582-a618bc2615dc?auto=format&fit=crop&w=500&q=80',
      images: ['https://images.unsplash.com/photo-1530124566582-a618bc2615dc?auto=format&fit=crop&w=500&q=80', '/images/card-automotive.png'],
      rating: 4.9,
      reviewCount: 49,
      specs: { 'Material': 'Drop-Forged Chrome Vanadium (Cr-V)', 'Ratchets': '72-Tooth Quick Release (5-Degree Swing)', 'Drive Sizes': '1/4", 3/8", 1/2" Metric & SAE', 'Case': 'Heavy-Duty Latch Blow-Molded Case' },
      highlights: ['Corrosion-Resistant Full Chrome Mirror Finish', 'High-Torque 6-Point Socket Off-Corner Gripping', 'Includes Deep Sockets, Extension Bars & Universal Joints', 'Lifetime Manufacturer Mechanical Tool Warranty']
    }
  ];

  // Enrich products with dealer metadata matching their specialized category
  const productsToInsert = rawProducts.map((p) => {
    let assignedDealer = dealerEntity; // DEALER_001 (Agri)
    if (p.categoryName && p.categoryName.includes('Electronic')) {
      assignedDealer = dealer2Entity; // DEALER_002 (Electronics)
    } else if (p.categoryName && p.categoryName.includes('Auto')) {
      assignedDealer = dealer3Entity; // DEALER_003 (Automotive)
    }

    return {
      ...p,
      dealer: assignedDealer._id,
      dealerCode: assignedDealer.dealerCode,
      dealerName: assignedDealer.businessName,
      threshold: 10,
      status: 'Active',
      deliveryInfo: {
        standardDays: '2 - 4 Business Days',
        shippingFee: 'FREE Express Delivery',
        dispatchTime: 'Dispatched within 24 Hours'
      }
    };
  });

  const createdProducts = await Product.create(productsToInsert);
  console.log(`✅ Seeded ${createdProducts.length} catalog products across 3 categories (18 per category, 3 per subcategory).\n`);

  // 6. Seed Warehouse Inventory Records & Initial Stock Ledger
  console.log('📊 Seeding Warehouse Inventory Records...');
  const inventoryDocs = createdProducts.map((prod) => ({
    product: prod._id,
    dealer: prod.dealer,
    sku: prod.sku,
    currentStock: prod.stock,
    reservedStock: 0,
    threshold: prod.threshold || 10,
    locationBay: 'Bay A-01',
    status: prod.stock > 10 ? 'In Stock' : prod.stock > 0 ? 'Low Stock' : 'Out of Stock'
  }));

  const createdInventory = await Inventory.create(inventoryDocs);

  const transactions = createdInventory.map((inv) => ({
    product: inv.product,
    dealer: inv.dealer,
    type: 'PURCHASE_RESTOCK',
    quantityChange: inv.currentStock,
    balanceAfter: inv.currentStock,
    reason: 'Initial Seed Inbound Balance',
    performedBy: admin._id
  }));

  await InventoryTransaction.create(transactions);
  console.log(`✅ Seeded ${createdInventory.length} inventory records and audit transactions.\n`);

  // 7. Seed Default Delivery Address for user1
  console.log('📍 Seeding Default Delivery Address for user1...');
  const userAddress = await Address.create({
    user: user1._id,
    name: user1.name,
    mobile: '9876543210',
    pincode: '411016',
    house: 'Flat 402, Green Meadows Apartment',
    street: 'Model Colony, Shivajinagar',
    landmark: 'Near Symbiosis College',
    city: 'Pune',
    state: 'Maharashtra',
    type: 'Home',
    isDefault: true,
    coordinates: {
      lat: 18.5362,
      lng: 73.8340
    }
  });
  console.log('✅ Seeded delivery address for user1.\n');

  // 8. Seed Regional Dealer Hub for DEALER_001
  console.log('🚚 Seeding Regional Logistics Depot for DEALER_001...');
  await DealerLocation.create({
    hubCode: 'HUB-PUN-01',
    dealer: dealerEntity._id,
    dealerName: dealerEntity.businessName,
    hubType: 'Regional Spares & Logistics Depot',
    city: 'Pune',
    state: 'Maharashtra',
    pincode: '411001',
    address: 'Plot 42, Sanaswadi Industrial Logistics Complex',
    contactPhone: dealer1.phone,
    capacityTons: 250,
    serviceRadiusKm: 150,
    activePinCodesCount: 48,
    status: 'Operational',
    location: {
      type: 'Point',
      coordinates: [73.8567, 18.5204]
    }
  });
  console.log('✅ Seeded logistics depot.\n');

  // 9. Seed Real Customer Orders & Dealer Suborders
  console.log('🛍️ Seeding Customer Orders and Dealer Suborders...');
  const orderSeeds = [
    {
      orderNumber: 'ORD-7821',
      items: [{ sku: 'SKU-AG-10', quantity: 1 }],
      orderStatus: 'Delivered',
      paymentMethod: 'upi',
      paymentStatus: 'Completed',
      daysAgo: 10,
      trackingNumber: 'DEL-AG-882190'
    },
    {
      orderNumber: 'ORD-7822',
      items: [{ sku: 'SKU-AG-01', quantity: 2 }],
      orderStatus: 'Shipped',
      paymentMethod: 'card',
      paymentStatus: 'Completed',
      daysAgo: 4,
      trackingNumber: 'DEL-AG-993182'
    },
    {
      orderNumber: 'ORD-7823',
      items: [{ sku: 'SKU-EL-01', quantity: 1 }],
      orderStatus: 'Processing',
      paymentMethod: 'netbanking',
      paymentStatus: 'Completed',
      daysAgo: 2,
      trackingNumber: 'DEL-EL-440192'
    },
    {
      orderNumber: 'ORD-7824',
      items: [{ sku: 'SKU-AU-04', quantity: 2 }],
      orderStatus: 'Placed',
      paymentMethod: 'cod',
      paymentStatus: 'Pending',
      daysAgo: 0,
      trackingNumber: ''
    },
    {
      orderNumber: 'ORD-7825',
      items: [{ sku: 'SKU-AG-07', quantity: 1 }],
      orderStatus: 'Delivered',
      paymentMethod: 'upi',
      paymentStatus: 'Completed',
      daysAgo: 18,
      trackingNumber: 'DEL-AG-110294'
    },
    // Multi-Category Multi-Dealer Order: 2 Agri (Dealer 1) + 1 Electronics (Dealer 2)
    {
      orderNumber: 'ORD-7826',
      items: [
        { sku: 'SKU-AG-01', quantity: 1 },
        { sku: 'SKU-AG-02', quantity: 1 },
        { sku: 'SKU-EL-01', quantity: 1 }
      ],
      orderStatus: 'Placed',
      paymentMethod: 'upi',
      paymentStatus: 'Completed',
      daysAgo: 1,
      trackingNumber: ''
    }
  ];

  for (const s of orderSeeds) {
    const createdAt = new Date(Date.now() - s.daysAgo * 24 * 60 * 60 * 1000);
    const orderItems = [];
    const dealerMap = new Map();

    for (const itemSeed of s.items) {
      const prod = createdProducts.find((p) => p.sku === itemSeed.sku);
      if (!prod) continue;

      const subtotal = prod.price * itemSeed.quantity;
      const lineItem = {
        product: prod._id,
        name: prod.name,
        sku: prod.sku,
        price: prod.price,
        mrp: prod.mrp,
        quantity: itemSeed.quantity,
        category: prod.categoryName,
        dealer: prod.dealer,
        dealerCode: prod.dealerCode,
        dealerName: prod.dealerName,
        image: prod.image,
        subtotal
      };
      orderItems.push(lineItem);

      const dKey = prod.dealer.toString();
      if (!dealerMap.has(dKey)) {
        dealerMap.set(dKey, {
          dealerId: prod.dealer,
          dealerCode: prod.dealerCode,
          dealerName: prod.dealerName,
          items: [],
          subtotal: 0
        });
      }
      const dEntry = dealerMap.get(dKey);
      dEntry.items.push(lineItem);
      dEntry.subtotal += subtotal;

      await Product.findByIdAndUpdate(prod._id, { $inc: { totalSales: itemSeed.quantity } });
    }

    if (orderItems.length === 0) continue;

    const itemsTotal = orderItems.reduce((acc, curr) => acc + curr.subtotal, 0);
    const taxTotal = Math.round(itemsTotal * 0.18);
    const grandTotal = itemsTotal + taxTotal;

    const masterOrder = await Order.create({
      orderNumber: s.orderNumber,
      customer: user1._id,
      customerSnapshot: {
        name: user1.name,
        email: user1.email,
        phone: user1.phone
      },
      shippingAddress: {
        name: userAddress.name,
        mobile: userAddress.mobile,
        pincode: userAddress.pincode,
        house: userAddress.house,
        street: userAddress.street,
        landmark: userAddress.landmark,
        city: userAddress.city,
        state: userAddress.state,
        type: userAddress.type
      },
      items: orderItems,
      dealers: Array.from(dealerMap.values()).map((d) => d.dealerId),
      pricing: {
        itemsTotal,
        discount: 0,
        deliveryFee: 0,
        tax: taxTotal,
        total: grandTotal
      },
      payment: {
        method: s.paymentMethod,
        methodLabel: s.paymentMethod.toUpperCase(),
        status: s.paymentStatus
      },
      orderStatus: s.orderStatus,
      timeline: [
        {
          status: 'Placed',
          title: 'Order Confirmed',
          note: 'Customer order placed successfully.',
          timestamp: createdAt
        },
        ...(s.orderStatus === 'Shipped' || s.orderStatus === 'Delivered'
          ? [
              {
                status: 'Shipped',
                title: 'Dispatched from Warehouse',
                note: `Carrier tracking: ${s.trackingNumber || 'DEL-EXP-772190'}`,
                timestamp: new Date(createdAt.getTime() + 24 * 3600000)
              }
            ]
          : []),
        ...(s.orderStatus === 'Delivered'
          ? [
              {
                status: 'Delivered',
                title: 'Order Delivered',
                note: 'Package signed and delivered to customer.',
                timestamp: new Date(createdAt.getTime() + 72 * 3600000)
              }
            ]
          : [])
      ],
      createdAt,
      updatedAt: createdAt
    });

    // Create discrete suborders per dealer
    const createdDealerOrderIds = [];
    let dIndex = 1;

    for (const [dKey, dEntry] of dealerMap.entries()) {
      const commissionRate = 5.0;
      const commissionAmount = Math.round((dEntry.subtotal * commissionRate) / 100);
      const netSettlementAmount = dEntry.subtotal - commissionAmount;
      const subOrderNumber = `${s.orderNumber}-D${dIndex++}`;

      const dealerOrder = await DealerOrder.create({
        parentOrder: masterOrder._id,
        parentOrderNumber: masterOrder.orderNumber,
        orderNumber: subOrderNumber,
        dealer: dEntry.dealerId,
        dealerCode: dEntry.dealerCode,
        customer: user1._id,
        customerSnapshot: {
          name: user1.name,
          city: userAddress.city,
          state: userAddress.state,
          phone: user1.phone,
          address: `${userAddress.house}, ${userAddress.street}, ${userAddress.city} - ${userAddress.pincode}`
        },
        items: dEntry.items,
        subtotal: dEntry.subtotal,
        commissionRate,
        commissionAmount,
        netSettlementAmount,
        orderStatus: s.orderStatus,
        paymentStatus: s.paymentStatus === 'Completed' ? 'Paid' : 'Pending',
        fulfillmentPartner: 'Delhivery Cargo Express',
        trackingNumber: s.trackingNumber || (s.orderStatus !== 'Placed' ? `DEL-${dEntry.dealerCode}-9912` : ''),
        estimatedDelivery: '3 - 5 Business Days',
        payoutStatus: s.orderStatus === 'Delivered' ? 'Settled' : s.orderStatus === 'Shipped' ? 'Released' : 'Escrow Held',
        timeline: masterOrder.timeline,
        createdAt,
        updatedAt: createdAt
      });

      createdDealerOrderIds.push(dealerOrder._id);

      if (s.orderStatus === 'Delivered') {
        await Settlement.create({
          settlementId: `SETTL-${subOrderNumber}`,
          dealer: dEntry.dealerId,
          dealerName: dEntry.dealerName,
          cycle: 'Weekly Standard Payout',
          grossAmount: dEntry.subtotal,
          commissionDeducted: commissionAmount,
          taxDeducted: Math.round(dEntry.subtotal * 0.01),
          netPayout: netSettlementAmount - Math.round(dEntry.subtotal * 0.01),
          bankRef: `NEFT${Math.floor(100000000 + Math.random() * 900000000)}`,
          status: 'SETTLED',
          dealerOrders: [dealerOrder._id],
          settledAt: new Date(createdAt.getTime() + 96 * 3600000)
        });
      }
    }

    masterOrder.dealerOrders = createdDealerOrderIds;
    await masterOrder.save();

    await Payment.create({
      transactionId: `TXN-ORD-${s.orderNumber}-${Math.floor(1000 + Math.random() * 9000)}`,
      order: masterOrder._id,
      orderNumber: masterOrder.orderNumber,
      customer: user1._id,
      customerName: user1.name,
      amount: masterOrder.pricing.total,
      currency: 'INR',
      paymentMethod: s.paymentMethod,
      status: s.paymentStatus === 'Completed' ? 'COMPLETED' : 'PENDING',
      escrowStatus: s.orderStatus === 'Delivered' ? 'Released' : 'Escrow Held',
      paidAt: s.paymentStatus === 'Completed' ? createdAt : null
    });
  }
  console.log(`✅ Seeded ${orderSeeds.length} customer orders and dealer suborders.\n`);

  // 10. Seed System Admin Settings & Audit Log
  console.log('⚙️ Seeding Admin Platform Settings & Audit Log...');
  await AdminSettings.create({
    general: {
      marketplaceName: 'GROVE Agritech & Commercial Marketplace',
      supportEmail: 'operations@grove.com',
      supportPhone: '+91 80000 12345',
      defaultCurrency: 'INR (₹)',
      maintenanceMode: false
    },
    commission: {
      defaultCommissionRate: 5.0,
      minPayoutThreshold: 10000,
      escrowHoldPeriodDays: 3,
      taxTcsRate: 1.0
    },
    notifications: {
      emailOnNewKyc: true,
      emailOnLowStock: true,
      emailDailySummary: true
    },
    updatedBy: admin._id
  });

  await AuditLog.create({
    logId: 'LOG-INIT-001',
    action: 'PLATFORM_BOOTSTRAP_SEED',
    actor: admin._id,
    actorRole: 'SUPER_ADMIN',
    targetEntity: 'System',
    targetId: 'SEED_INIT',
    details: 'Database initialized with demo accounts (user1, dealer1, admin) and 54 catalog products (18 per category, 3 per subcategory).',
    ipAddress: '127.0.0.1'
  });
  console.log('✅ Seeded Admin Settings and Audit Log.\n');

  console.log('==============================================================');
  console.log('🎉 SEEDING COMPLETE! Summary of Seeded Data:');
  console.log('==============================================================');
  console.log(`• Categories:    ${categories.length} (Agriculture, Electronics, Automotive, Groceries)`);
  console.log(`• Accounts:      3 Demo Accounts`);
  console.log(`  1. Customer:   user1@grove.com   / Password@123`);
  console.log(`  2. Dealer:     dealer1@grove.com / Password@123`);
  console.log(`  3. Admin:      admin@grove.com   / Admin@123`);
  console.log(`• Dealers:       1 Verified Dealer (${dealerEntity.businessName})`);
  console.log(`• Products:      ${createdProducts.length} Total Products (18 per category, 3 per subcategory)`);
  console.log(`  - Agriculture: 18 products (SKU-AG-01 to SKU-AG-18)`);
  console.log(`  - Electronics: 18 products (SKU-EL-01 to SKU-EL-18)`);
  console.log(`  - Automotive:  18 products (SKU-AU-01 to SKU-AU-18)`);
  console.log(`• Inventories:   ${createdInventory.length} Active Stock Records`);
  console.log(`• Delivery Hubs: 1 Operational Logistics Hub`);
  console.log(`• Addresses:     1 Default Customer Address`);
  console.log('==============================================================\n');

  await disconnectDB();
  process.exit(0);
}

seedDatabase().catch(async (err) => {
  console.error('❌ Database seed process failed with error:', err);
  await disconnectDB();
  process.exit(1);
});
