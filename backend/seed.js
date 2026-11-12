/**
 * ==============================================================================
 * GROVE Multi-Brand E-Commerce Platform – Database Seed Script
 * ==============================================================================
 * Clears the existing database and seeds:
 * 1. Exactly 3 demo accounts: user1, dealer1, admin
 * 2. Exactly 5 products per category: Agriculture, Electronics, Automotive (15 total)
 * 3. 4 Categories: Agriculture, Electronics, Automotive, Groceries
 * 4. 1 Dealer entity linked to dealer1 (DEALER_001)
 * 5. 15 Inventory records matching the products
 * 6. 1 Default delivery address for user1
 * 7. 1 Dealer location hub for DEALER_001
 * 8. System Admin settings and initial audit log
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

  // 2. Seed Categories
  console.log('🌱 Seeding Categories...');
  const categories = await Category.create([
    {
      name: 'Agriculture & Farming',
      slug: 'agriculture',
      description: 'Machinery, irrigation, tillage equipment, and agronomy solutions.',
      icon: 'Sprout',
      commissionRate: 5.0,
      status: 'Active',
      subcategories: [
        { name: 'Tractors & Heavy Machinery', slug: 'tractors-machinery', description: 'Utility and heavy tractors' },
        { name: 'Micro-Irrigation & Tubing', slug: 'micro-irrigation', description: 'Drip, sprinklers, and pipes' },
        { name: 'Tillage & Soil Preparation', slug: 'tillage-equipment', description: 'Cultivators and plows' },
        { name: 'Crop Protection & Spraying', slug: 'crop-protection', description: 'Sprayers and misters' },
        { name: 'Solar & Sustainable Energy', slug: 'solar-energy', description: 'Solar pumps and generators' }
      ]
    },
    {
      name: 'Electronics & Gadgets',
      slug: 'electronics',
      description: 'Industrial electronics, IoT telemetry, sensors, and computing hardware.',
      icon: 'Smartphone',
      commissionRate: 7.0,
      status: 'Active',
      subcategories: [
        { name: 'Wearables & Tracking', slug: 'wearables-tracking', description: 'Smartwatches and GPS tags' },
        { name: 'Audio & Field Gear', slug: 'audio-field-gear', description: 'Industrial noise-cancelling gear' },
        { name: 'Computer Peripherals', slug: 'computer-peripherals', description: 'Dustproof keyboards and mice' },
        { name: 'Rugged Computing', slug: 'rugged-computing', description: 'Field laptops and tablets' },
        { name: 'Power & Energy', slug: 'power-energy', description: 'Solar chargers and inverters' }
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
        { name: 'Braking Systems', slug: 'braking-systems', description: 'Brake pads, rotors, and hydraulics' },
        { name: 'Engine Filtration', slug: 'engine-filtration', description: 'Oil, fuel, and air filters' },
        { name: 'Suspension & Steering', slug: 'suspension-steering', description: 'Shock absorbers and springs' },
        { name: 'Tires & Rims', slug: 'tires-rims', description: 'Commercial tractor and truck tires' }
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
    businessName: 'Apex Agri-Tech & Machinery',
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
      accountName: 'Apex Agri-Tech & Machinery',
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

  console.log(`✅ Created Dealer profile: ${dealerEntity.businessName} (${dealerEntity.dealerCode})\n`);

  // 5. Seed Exactly 5 Products per Category (15 Total)
  console.log('📦 Seeding Products (5 Agriculture, 5 Electronics, 5 Automotive)...');

  const rawProducts = [
    // --- Agriculture (5 products) ---
    {
      name: 'Heavy Duty 45HP Utility Farm Tractor',
      sku: 'SKU-AG-01',
      slug: 'heavy-duty-farm-tractor-ag-01',
      category: agriCat._id,
      categoryName: agriCat.name,
      subcategory: 'Tractors & Heavy Machinery',
      brand: 'GROVE AgriMaster',
      description: 'Commercial 45HP dual-clutch utility tractor with advanced 8F+2R transmission, high ground clearance, and power steering for rigorous farming operations.',
      price: 585000,
      mrp: 620000,
      discount: 5,
      stock: 15,
      image: '/images/prod-tractor.png',
      images: ['/images/prod-tractor.png', '/images/prod-cultivator.png'],
      rating: 4.8,
      reviewCount: 42,
      specs: { 'Horsepower': '45 HP', 'Cylinders': '3 Cylinders', 'Lifting Capacity': '1500 kg', 'Fuel Tank': '50 Liters' },
      highlights: ['45 HP Fuel-Efficient Diesel Engine', 'Dual Clutch & Power Steering', '1500 kg Hydraulic Lift Capacity', '1 Year Comprehensive Warranty']
    },
    {
      name: 'Precision Micro-Drip Irrigation System (1 Acre)',
      sku: 'SKU-AG-02',
      slug: 'precision-micro-drip-irrigation-ag-02',
      category: agriCat._id,
      categoryName: agriCat.name,
      subcategory: 'Micro-Irrigation & Tubing',
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
      name: 'Heavy-Duty Multi-Row Rotary Cultivator',
      sku: 'SKU-AG-03',
      slug: 'heavy-duty-rotary-cultivator-ag-03',
      category: agriCat._id,
      categoryName: agriCat.name,
      subcategory: 'Tillage & Soil Preparation',
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
      name: 'Battery-Operated High-Pressure Backpack Sprayer 16L',
      sku: 'SKU-AG-04',
      slug: 'battery-backpack-sprayer-ag-04',
      category: agriCat._id,
      categoryName: agriCat.name,
      subcategory: 'Crop Protection & Spraying',
      brand: 'KisanShield',
      description: '16-Liter rechargeable knapsack sprayer with dual diaphragm pump, pressure regulator, and telescopic brass lance for uniform pest control.',
      price: 2850,
      mrp: 3600,
      discount: 20,
      stock: 60,
      image: '/images/prod-sprayer.png',
      images: ['/images/prod-sprayer.png'],
      rating: 4.5,
      reviewCount: 54,
      specs: { 'Tank Capacity': '16 Liters', 'Battery': '12V 8Ah Lead Acid', 'Working Pressure': '0.15 - 0.40 Mpa', 'Discharge Rate': '3.1 L/min' },
      highlights: ['Up to 6 Hours Continuous Operation', 'Extendable Brass Spray Lance', 'Ergonomic Padded Shoulder Straps', 'Dual Nozzle Set Included']
    },
    {
      name: 'Solar Irrigation Water Pumping System 5HP',
      sku: 'SKU-AG-05',
      slug: 'solar-irrigation-pumping-system-ag-05',
      category: agriCat._id,
      categoryName: agriCat.name,
      subcategory: 'Solar & Sustainable Energy',
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

    // --- Electronics (5 products) ---
    {
      name: 'GROVE Field Rugged Smartwatch with GPS & Sensor Hub',
      sku: 'SKU-EL-01',
      slug: 'grove-field-rugged-smartwatch-el-01',
      category: elecCat._id,
      categoryName: elecCat.name,
      subcategory: 'Wearables & Tracking',
      brand: 'TechField',
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
      name: 'Industrial Wireless Noise-Cancelling Communications Headset',
      sku: 'SKU-EL-02',
      slug: 'industrial-wireless-headset-el-02',
      category: elecCat._id,
      categoryName: elecCat.name,
      subcategory: 'Audio & Field Gear',
      brand: 'AcoustiMax',
      description: 'Heavy-duty wireless over-ear headset with active noise cancellation up to 35dB, boom mic with environmental noise suppression, and 40h battery.',
      price: 2999,
      mrp: 4499,
      discount: 33,
      stock: 35,
      image: '/images/prod-headphones.png',
      images: ['/images/prod-headphones.png'],
      rating: 4.6,
      reviewCount: 46,
      specs: { 'Noise Cancellation': 'Hybrid Active ANC (up to 35dB)', 'Battery': '800mAh (40 Hours)', 'Connectivity': 'Bluetooth 5.2 + 3.5mm Aux', 'Weight': '260 g' },
      highlights: ['Engine & Machinery Noise Filtering', 'All-Day Memory Foam Ear Cushions', 'Detachable Noise-Cancelling Boom Mic', 'Foldable Heavy-Duty Headband']
    },
    {
      name: 'Dustproof Mechanical Industrial Control Keyboard',
      sku: 'SKU-EL-03',
      slug: 'dustproof-mechanical-keyboard-el-03',
      category: elecCat._id,
      categoryName: elecCat.name,
      subcategory: 'Computer Peripherals',
      brand: 'K-Tek',
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
      name: 'Rugged All-Weather Telemetry Field Laptop 14-inch',
      sku: 'SKU-EL-04',
      slug: 'rugged-telemetry-field-laptop-el-04',
      category: elecCat._id,
      categoryName: elecCat.name,
      subcategory: 'Rugged Computing',
      brand: 'ToughPro',
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
      name: 'High-Efficiency Monocrystalline Solar Charger 100W',
      sku: 'SKU-EL-05',
      slug: 'monocrystalline-solar-charger-el-05',
      category: elecCat._id,
      categoryName: elecCat.name,
      subcategory: 'Power & Energy',
      brand: 'VoltGreen',
      description: 'Foldable 100W solar panel charger with integrated QC3.0 USB-A and 65W USB-C PD outputs for field charging laptops, drones, and telemetry equipment.',
      price: 6499,
      mrp: 8200,
      discount: 20,
      stock: 50,
      image: '/images/prod-solar.png',
      images: ['/images/prod-solar.png'],
      rating: 4.8,
      reviewCount: 62,
      specs: { 'Wattage': '100W Peak', 'Cell Type': 'Grade-A Monocrystalline (23.5% Efficiency)', 'Outputs': 'USB-C PD 65W, USB-A QC 3.0, DC 18V', 'Folded Dimensions': '42 x 38 x 4 cm' },
      highlights: ['High-Conversion Monocrystalline Cells', 'Direct Laptop & Drone USB-PD Fast Charging', 'Waterproof ETFE Surface Coating', 'Magnetic Fold-Up Carry Handle']
    },

    // --- Automotive (5 products) ---
    {
      name: 'Semi-Metallic Heavy Duty Commercial Brake Pads',
      sku: 'SKU-AU-01',
      slug: 'semi-metallic-commercial-brake-pads-au-01',
      category: autoCat._id,
      categoryName: autoCat.name,
      subcategory: 'Braking Systems',
      brand: 'Bremco',
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
      name: 'Heavy Duty Tractor & Truck Oil Filter',
      sku: 'SKU-AU-02',
      slug: 'heavy-duty-tractor-oil-filter-au-02',
      category: autoCat._id,
      categoryName: autoCat.name,
      subcategory: 'Engine Filtration',
      brand: 'FleetFilter',
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
      name: 'Dual-Tube Heavy Vehicle Hydraulic Shock Absorber',
      sku: 'SKU-AU-03',
      slug: 'dual-tube-hydraulic-shock-absorber-au-03',
      category: autoCat._id,
      categoryName: autoCat.name,
      subcategory: 'Suspension & Steering',
      brand: 'RideControl',
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
      name: 'All-Terrain Commercial Agricultural Radial Rear Tire',
      sku: 'SKU-AU-04',
      slug: 'all-terrain-radial-rear-tire-au-04',
      category: autoCat._id,
      categoryName: autoCat.name,
      subcategory: 'Tires & Rims',
      brand: 'ApolloTread',
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
      name: 'Heavy Vehicle Multi-Leaf Spring Suspension Pack',
      sku: 'SKU-AU-05',
      slug: 'heavy-vehicle-multi-leaf-spring-au-05',
      category: autoCat._id,
      categoryName: autoCat.name,
      subcategory: 'Suspension & Steering',
      brand: 'SuspensionMaster',
      description: 'Heavy-duty parabolic 9-leaf spring assembly fabricated from heat-treated manganese spring steel for commercial transport trailers.',
      price: 8200,
      mrp: 10500,
      discount: 21,
      stock: 16,
      image: '/images/prod-shockabsorber.png',
      images: ['/images/prod-shockabsorber.png'],
      rating: 4.5,
      reviewCount: 23,
      specs: { 'Leaves Count': '9 Leaves', 'Leaf Width': '75 mm', 'Payload Rating': '3,500 kg per Pack', 'Material': 'Grade 55Si7 Manganese Steel' },
      highlights: ['Shot-Peened & Anti-Corrosion Zinc Primed', 'High Fatigue Resistance Under Max Payloads', 'Includes Center Pin & U-Bolt Clamping Kit', 'OEM Fitment for Commercial Utility Trailers']
    }
  ];

  // Enrich products with dealer metadata
  const productsToInsert = rawProducts.map((p) => ({
    ...p,
    dealer: dealerEntity._id,
    dealerCode: dealerEntity.dealerCode,
    dealerName: dealerEntity.businessName,
    threshold: 10,
    status: 'Active',
    deliveryInfo: {
      standardDays: '2 - 4 Business Days',
      shippingFee: 'FREE Express Delivery',
      dispatchTime: 'Dispatched within 24 Hours'
    }
  }));

  const createdProducts = await Product.create(productsToInsert);
  console.log(`✅ Seeded ${createdProducts.length} products across 3 categories.\n`);

  // 6. Seed Warehouse Inventory Records & Initial Stock Ledger
  console.log('📊 Seeding Warehouse Inventory Records...');
  const inventoryDocs = createdProducts.map((prod) => ({
    product: prod._id,
    dealer: dealerEntity._id,
    sku: prod.sku,
    currentStock: prod.stock,
    reservedStock: 0,
    threshold: prod.threshold || 10,
    locationBay: 'Bay A-01',
    status: 'In Stock'
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
  await Address.create({
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

  // 9. Seed System Admin Settings & Audit Log
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
    details: 'Database initialized with demo accounts (user1, dealer1, admin) and 15 catalog products.',
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
  console.log(`• Dealers:       1 Verified Dealer (Apex Agri-Tech & Machinery)`);
  console.log(`• Products:      15 Total Products (5 per category)`);
  console.log(`  - Agriculture: 5 products (SKU-AG-01 to SKU-AG-05)`);
  console.log(`  - Electronics: 5 products (SKU-EL-01 to SKU-EL-05)`);
  console.log(`  - Automotive:  5 products (SKU-AU-01 to SKU-AU-05)`);
  console.log(`• Inventories:   15 Active Stock Records`);
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
