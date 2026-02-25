// Script to inspect old MongoDB (Swasthika/Abbort) DB collections
// Run: node scripts/inspect_old_db.js

import mongoose from 'mongoose';

const OLD_DB_URI = 'mongodb+srv://devakibrokerage_db_user:2hmSRDFDyuT4bLgJ@newswasthikacluster.snofy1c.mongodb.net/?appName=NewSwasthikaCluster';

async function inspectDB() {
    try {
        console.log('Connecting to old DB...');
        await mongoose.connect(OLD_DB_URI);
        console.log('✅ Connected!\n');

        const db = mongoose.connection.db;

        // List all collections
        const collections = await db.listCollections().toArray();
        console.log(`📦 Total collections found: ${collections.length}\n`);
        console.log('Collections:');
        collections.forEach(col => console.log(`  - ${col.name}`));
        console.log('');

        // For each collection, show a sample document's keys (fields)
        for (const col of collections) {
            const collection = db.collection(col.name);
            const count = await collection.countDocuments();
            const sample = await collection.findOne({});
            const fields = sample ? Object.keys(sample) : [];

            console.log(`\n📂 Collection: "${col.name}" — ${count} documents`);
            console.log(`   Fields: ${fields.join(', ')}`);
        }

        console.log('\n✅ Done inspecting!');
    } catch (err) {
        console.error('❌ Error:', err.message);
    } finally {
        await mongoose.disconnect();
        process.exit(0);
    }
}

inspectDB();
