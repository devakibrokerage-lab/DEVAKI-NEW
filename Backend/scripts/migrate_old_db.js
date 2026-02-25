// Migration Script: Old DB → Devaki-New Structure
// Run: node scripts/migrate_old_db.js
//
// Ye script old MongoDB (NewSwasthikaCluster) ke data ko
// devaki-new model structure ke according update karega.
//
// SAFE: Sirf $set use karta hai, existing data delete nahi hoga.

import mongoose from 'mongoose';

const OLD_DB_URI = 'mongodb+srv://devakibrokerage_db_user:2hmSRDFDyuT4bLgJ@newswasthikacluster.snofy1c.mongodb.net/?appName=NewSwasthikaCluster';

async function migrate() {
    try {
        console.log('Connecting to old DB...');
        await mongoose.connect(OLD_DB_URI);
        console.log('✅ Connected!\n');

        const db = mongoose.connection.db;

        // ============================================================
        // MIGRATION 1: brokers collection
        // Add missing field: organization_name (NEW in devaki-new model)
        // ============================================================
        console.log('--- Migration 1: brokers.organization_name ---');
        const brokersBefore = await db.collection('brokers').countDocuments({ organization_name: { $exists: false } });
        console.log(`   Brokers missing "organization_name": ${brokersBefore}`);

        if (brokersBefore > 0) {
            const result1 = await db.collection('brokers').updateMany(
                { organization_name: { $exists: false } },   // condition: field nahi hai
                { $set: { organization_name: '' } }           // action: empty string se set karo
            );
            console.log(`   ✅ Updated ${result1.modifiedCount} broker documents.`);
        } else {
            console.log('   ✅ Already up to date, no changes needed.');
        }

        // ============================================================
        // MIGRATION 2: fundmodels collection
        // Add missing field: option_limit_percentage (default: 10)
        // (Note: Some docs already have it, script handles both cases)
        // ============================================================
        console.log('\n--- Migration 2: fundmodels.option_limit_percentage ---');
        const fundsBefore = await db.collection('fundmodels').countDocuments({ option_limit_percentage: { $exists: false } });
        console.log(`   FundModels missing "option_limit_percentage": ${fundsBefore}`);

        if (fundsBefore > 0) {
            const result2 = await db.collection('fundmodels').updateMany(
                { option_limit_percentage: { $exists: false } },
                { $set: { option_limit_percentage: 10 } }
            );
            console.log(`   ✅ Updated ${result2.modifiedCount} fundmodel documents.`);
        } else {
            console.log('   ✅ Already up to date, no changes needed.');
        }

        // ============================================================
        // MIGRATION 3: deletedcustomers.deleted_by
        // Old: ObjectId type → New: String type
        // Convert ObjectId to its string representation
        // ============================================================
        console.log('\n--- Migration 3: deletedcustomers.deleted_by (ObjectId → String) ---');
        const deletedCusts = await db.collection('deletedcustomers').find({}).toArray();
        let convertCount = 0;
        const bulkOps = [];

        for (const doc of deletedCusts) {
            // Agar deleted_by ObjectId type hai (not a string) toh convert karo
            if (doc.deleted_by && typeof doc.deleted_by !== 'string') {
                bulkOps.push({
                    updateOne: {
                        filter: { _id: doc._id },
                        update: { $set: { deleted_by: doc.deleted_by.toString() } }
                    }
                });
                convertCount++;
            }
        }

        if (bulkOps.length > 0) {
            const result3 = await db.collection('deletedcustomers').bulkWrite(bulkOps);
            console.log(`   ✅ Converted ${result3.modifiedCount} deletedcustomers.deleted_by to String.`);
        } else {
            console.log(`   ✅ All ${deletedCusts.length} docs already have deleted_by as String. No changes needed.`);
        }

        // ============================================================
        // FINAL: Verify
        // ============================================================
        console.log('\n========== Verification ==========');

        const brokersCheck = await db.collection('brokers').countDocuments({ organization_name: { $exists: false } });
        console.log(`brokers missing organization_name: ${brokersCheck} (should be 0)`);

        const fundsCheck = await db.collection('fundmodels').countDocuments({ option_limit_percentage: { $exists: false } });
        console.log(`fundmodels missing option_limit_percentage: ${fundsCheck} (should be 0)`);

        console.log('\n✅ Migration complete!');

    } catch (err) {
        console.error('❌ Migration failed:', err.message);
    } finally {
        await mongoose.disconnect();
        process.exit(0);
    }
}

migrate();
