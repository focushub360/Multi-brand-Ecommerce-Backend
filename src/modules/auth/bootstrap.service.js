import { User } from '../users/user.model.js';
import { Category } from '../categories/category.model.js';
import { ROLES } from '../../constants/roles.js';
import { env } from '../../config/env.js';

export const bootstrapSuperAdminAndData = async () => {
  try {
    // 1. Check if Super Admin exists
    const existingSuperAdmin = await User.findOne({ role: ROLES.SUPER_ADMIN });

    if (!existingSuperAdmin) {
      console.log('⚡ Bootstrapping initial Super Admin account from environment configuration...');
      const admin = new User({
        name: env.ADMIN_NAME,
        email: env.ADMIN_EMAIL.toLowerCase().trim(),
        password: env.ADMIN_PASSWORD,
        role: ROLES.SUPER_ADMIN,
        phone: '+91 98200 99100',
        status: 'ACTIVE',
        isEmailVerified: true
      });

      await admin.save();
      console.log(`✅ Super Admin bootstrap completed successfully: ${admin.email}`);
    } else {
      console.log(`ℹ️ Super Admin account verified: ${existingSuperAdmin.email}`);
    }

    // 2. Seed Default Core Categories if none exist
    const categoryCount = await Category.countDocuments();
    if (categoryCount === 0) {
      console.log('⚡ Seeding initial GROVE core categories...');
      const initialCategories = [
        {
          name: 'Agriculture & Farming',
          slug: 'agriculture-farming',
          description: 'Essential commercial agricultural implements, tractors, precision drip irrigation, seeds, and bio-nutrients.',
          icon: 'Tractor',
          commissionRate: 4.5,
          subcategories: [
            { name: 'Micro-Irrigation & Tubing', slug: 'micro-irrigation', description: 'Drip lines, emitters, lateral pipes' },
            { name: 'Tractors & Heavy Machinery', slug: 'tractors-machinery', description: 'Commercial tractors, power tillers' },
            { name: 'Pumps & Solar Borewells', slug: 'pumps-motors', description: 'Submersible pumps, solar controllers' },
            { name: 'Tillage & Implements', slug: 'tillage-implements', description: 'Cultivators, plows, disc harrows' },
            { name: 'Fertilizers & Nutrients', slug: 'fertilizers-nutrients', description: 'Organic bio-fertilizers, micronutrients' }
          ]
        },
        {
          name: 'Electronics & Gadgets',
          slug: 'electronics-gadgets',
          description: 'Precision farm telemetry sensors, IoT monitoring probes, agricultural spray drones, and communication gear.',
          icon: 'Cpu',
          commissionRate: 5.5,
          subcategories: [
            { name: 'Smart Farming Sensors', slug: 'smart-sensors', description: 'Soil moisture, pH, and weather stations' },
            { name: 'Audio & Industrial Headsets', slug: 'audio-communication', description: 'Noise-cancelling radios and headsets' },
            { name: 'Telemetry Gateway Hubs', slug: 'telemetry-gateways', description: 'LoRaWAN hubs, 4G cellular relays' }
          ]
        },
        {
          name: 'Automotive & Spare Parts',
          slug: 'automotive-spare-parts',
          description: 'Replacement parts, alternators, radial tyres, brake systems, lubricants, and filtration components.',
          icon: 'Wrench',
          commissionRate: 6.0,
          subcategories: [
            { name: 'Tyres & Heavy Rims', slug: 'tyres-rims', description: 'Commercial radial tractor and utility vehicle tyres' },
            { name: 'Brake Systems & Pads', slug: 'brake-systems', description: 'Heavy-duty brake pads, drums, rotors' },
            { name: 'Electrical & Starters', slug: 'electrical-starters', description: 'Heavy alternators, starter motors, wiring harnesses' },
            { name: 'Filters & Lubrication', slug: 'filters-lubricants', description: 'Engine oil filters, hydraulic fluids' }
          ]
        },
        {
          name: 'Groceries',
          slug: 'groceries',
          description: 'Farm-fresh organic staples, wholesale grains, pulses, spices, and agricultural produce.',
          icon: 'ShoppingBasket',
          commissionRate: 3.5,
          subcategories: [
            { name: 'Organic Grains & Pulses', slug: 'organic-grains', description: 'Certified farm direct grains' },
            { name: 'Spices & Seasoning', slug: 'spices-seasonings', description: 'Wholesale indigenous spices' }
          ]
        }
      ];

      await Category.insertMany(initialCategories);
      console.log('✅ Core categories seeded successfully.');
    }
  } catch (err) {
    console.error('❌ Super Admin Bootstrap Error:', err.message);
  }
};

