import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const MONGO_URI = process.env.MONGODB_URI || process.env.MONGO_URI;

if (!MONGO_URI) {
  console.error('❌ MONGO_URI is not set in .env');
  process.exit(1);
}

async function runMigration() {
  try {
    console.log('🔄 Connecting to MongoDB Atlas...');
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connected successfully.');

    const db = mongoose.connection.db;
    const dealersColl = db.collection('dealers');
    const usersColl = db.collection('users');

    // 1. Drop obsolete unique index 'user_1' on dealers if present
    try {
      const indexes = await dealersColl.indexes();
      const userIndex = indexes.find((idx) => idx.name === 'user_1' || idx.key?.user);
      if (userIndex) {
        console.log(`🗑️ Dropping obsolete index: ${userIndex.name}...`);
        await dealersColl.dropIndex(userIndex.name);
        console.log(`✅ Index ${userIndex.name} dropped.`);
      }
    } catch (idxErr) {
      console.warn('⚠️ Note on index drop:', idxErr.message);
    }

    // 2. Migrate existing dealer passwords from users collection
    const dealers = await dealersColl.find({}).toArray();
    console.log(`📦 Found ${dealers.length} dealers to verify/migrate.`);

    let migratedCount = 0;
    for (const dealer of dealers) {
      if (dealer.user) {
        const linkedUser = await usersColl.findOne({ _id: dealer.user });
        if (linkedUser && linkedUser.password) {
          const updateFields = {
            mustChangePassword: linkedUser.mustChangePassword ?? false,
            lastLogin: linkedUser.lastLogin || dealer.updatedAt || new Date()
          };
          // Only copy password if dealer doesn't already have one
          if (!dealer.password) {
            updateFields.password = linkedUser.password;
          }

          await dealersColl.updateOne(
            { _id: dealer._id },
            { $set: updateFields }
          );
          migratedCount++;
          console.log(`  ✓ Migrated credentials for: ${dealer.businessName} (${dealer.officialEmail})`);
        }
      }
    }
    console.log(`✅ Successfully updated ${migratedCount} dealer records with independent credentials.`);

    // 3. Remove all dealer records from the users collection
    const deleteResult = await usersColl.deleteMany({ role: 'DEALER' });
    console.log(`🗑️ Removed ${deleteResult.deletedCount} dealer accounts from the users collection.`);

    console.log('\n🎉 Autonomous Dealer Authentication Migration Complete!');
    console.log('------------------------------------------------------------');
    console.log('- Dealers now authenticate exclusively through the dealers collection.');
    console.log('- No dealer profiles or credentials remain in the users collection.');
    console.log('- Direct DB deletions on dealers will now immediately revoke access.');
  } catch (err) {
    console.error('❌ Migration failed:', err);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB.');
  }
}

runMigration();
