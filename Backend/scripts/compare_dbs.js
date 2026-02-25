// Script: Compare two MongoDB clusters side by side
// Abbort (devaki-new NEW DB) vs NewSwasthikaCluster (OLD DB)
// Run: node scripts/compare_dbs.js

import { MongoClient } from 'mongodb';

const ABBORT_URI = 'mongodb+srv://abbothouse2000_db_user:M1OxKOQSMuJjc44u@abbort.ugtqcof.mongodb.net/?appName=abbort';
const SWASTHIKA_URI = 'mongodb+srv://devakibrokerage_db_user:2hmSRDFDyuT4bLgJ@newswasthikacluster.snofy1c.mongodb.net/?appName=NewSwasthikaCluster';

async function getCollectionInfo(db) {
    const collections = await db.listCollections().toArray();
    const result = {};
    for (const col of collections) {
        const c = db.collection(col.name);
        const count = await c.countDocuments();
        // Get a few sample docs to gather ALL possible fields (not just first doc)
        const samples = await c.find({}).limit(5).toArray();
        const fields = new Set();
        for (const doc of samples) {
            Object.keys(doc).forEach(k => fields.add(k));
        }
        result[col.name] = { count, fields: [...fields].sort() };
    }
    return result;
}

async function compare() {
    const clientA = new MongoClient(ABBORT_URI);
    const clientS = new MongoClient(SWASTHIKA_URI);

    try {
        console.log('Connecting to both clusters...');
        await clientA.connect();
        await clientS.connect();
        console.log('✅ Both connected!\n');

        const abbortDB = clientA.db();
        const swasthikaDB = clientS.db();

        console.log('Fetching collection info...');
        const abbort = await getCollectionInfo(abbortDB);
        const swasthika = await getCollectionInfo(swasthikaDB);

        const allCollections = new Set([...Object.keys(abbort), ...Object.keys(swasthika)]);

        console.log('\n' + '='.repeat(70));
        console.log('  COMPARISON: Abbort (NEW) vs NewSwasthikaCluster (OLD)');
        console.log('='.repeat(70));

        for (const col of [...allCollections].sort()) {
            const inAbbort = !!abbort[col];
            const inSwasthika = !!swasthika[col];

            if (!inAbbort) {
                console.log(`\n❌ "${col}" — ONLY in Swasthika (OLD), MISSING in Abbort (NEW)`);
                continue;
            }
            if (!inSwasthika) {
                console.log(`\n➕ "${col}" — ONLY in Abbort (NEW), MISSING in Swasthika (OLD)`);
                continue;
            }

            // Both have it — compare fields
            const abbortFields = new Set(abbort[col].fields);
            const swasthikaFields = new Set(swasthika[col].fields);

            const missingInSwasthika = abbort[col].fields.filter(f => !swasthikaFields.has(f));
            const missingInAbbort = swasthika[col].fields.filter(f => !abbortFields.has(f));

            const hasDiff = missingInSwasthika.length > 0 || missingInAbbort.length > 0;

            console.log(`\n📂 "${col}"`);
            console.log(`   Abbort docs: ${abbort[col].count}  |  Swasthika docs: ${swasthika[col].count}`);

            if (!hasDiff) {
                console.log('   ✅ Fields MATCH perfectly');
            } else {
                if (missingInSwasthika.length > 0) {
                    console.log(`   🔴 Fields in Abbort (NEW) but MISSING in Swasthika (OLD): ${missingInSwasthika.join(', ')}`);
                }
                if (missingInAbbort.length > 0) {
                    console.log(`   🟡 Fields in Swasthika (OLD) but NOT in Abbort (NEW): ${missingInAbbort.join(', ')}`);
                }
            }
        }

        console.log('\n' + '='.repeat(70));
        console.log('✅ Comparison Done!');

    } catch (err) {
        console.error('❌ Error:', err.message);
    } finally {
        await clientA.close();
        await clientS.close();
        process.exit(0);
    }
}

compare();
