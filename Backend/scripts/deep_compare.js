// Deep comparison: Find fields present in Abbort (NEW) but MISSING in Swasthika (OLD)
// Scans ALL documents (not just samples)
// Run: node scripts/deep_compare.js

import { MongoClient } from 'mongodb';

const ABBORT_URI = 'mongodb+srv://abbothouse2000_db_user:M1OxKOQSMuJjc44u@abbort.ugtqcof.mongodb.net/?appName=abbort';
const SWASTHIKA_URI = 'mongodb+srv://devakibrokerage_db_user:2hmSRDFDyuT4bLgJ@newswasthikacluster.snofy1c.mongodb.net/?appName=NewSwasthikaCluster';

// Recursively get all field paths from a document (including nested)
function getAllFieldPaths(obj, prefix = '') {
    const fields = new Set();
    for (const key of Object.keys(obj)) {
        const fullKey = prefix ? `${prefix}.${key}` : key;
        fields.add(fullKey);
        if (obj[key] && typeof obj[key] === 'object' && !Array.isArray(obj[key]) && !(obj[key] instanceof Date)) {
            const nested = getAllFieldPaths(obj[key], fullKey);
            nested.forEach(f => fields.add(f));
        }
    }
    return fields;
}

// Get ALL unique field paths across ALL documents in a collection
async function getAllFields(collection) {
    const fields = new Set();
    const cursor = collection.find({});
    for await (const doc of cursor) {
        const docFields = getAllFieldPaths(doc);
        docFields.forEach(f => fields.add(f));
    }
    return fields;
}

async function deepCompare() {
    const clientA = new MongoClient(ABBORT_URI);
    const clientS = new MongoClient(SWASTHIKA_URI);

    try {
        console.log('Connecting to both clusters...');
        await clientA.connect();
        await clientS.connect();
        console.log('✅ Both connected!\n');

        const abbortDB = clientA.db();
        const swasthikaDB = clientS.db();

        const abbortCols = await abbortDB.listCollections().toArray();
        const swasthikaCols = await swasthikaDB.listCollections().toArray();

        const swasthikaColNames = new Set(swasthikaCols.map(c => c.name));

        console.log('='.repeat(70));
        console.log('  Fields in ABBORT (NEW) that are MISSING in NewSwasthika (OLD)');
        console.log('='.repeat(70));

        let anyMissing = false;

        for (const col of abbortCols) {
            const name = col.name;

            // Count docs
            const abbortCol = abbortDB.collection(name);
            const abbortCount = await abbortCol.countDocuments();

            if (abbortCount === 0) {
                console.log(`\n⚪ "${name}" — Abbort has 0 docs, skipping`);
                continue;
            }

            if (!swasthikaColNames.has(name)) {
                console.log(`\n➕ "${name}" — Exists in Abbort but MISSING entirely in Swasthika!`);
                anyMissing = true;
                continue;
            }

            const swasthikaCol = swasthikaDB.collection(name);
            const swasthikaCount = await swasthikaCol.countDocuments();

            // Scan ALL docs
            process.stdout.write(`\nScanning "${name}" (Abbort: ${abbortCount} docs, Swasthika: ${swasthikaCount} docs)...`);
            const abbortFields = await getAllFields(abbortCol);
            const swasthikaFields = swasthikaCount > 0 ? await getAllFields(swasthikaCol) : new Set();

            // Fields in Abbort but NOT in Swasthika
            const missing = [...abbortFields].filter(f => !swasthikaFields.has(f));

            // Exclude system fields
            const filtered = missing.filter(f => !['_id', '__v'].includes(f));

            if (filtered.length === 0) {
                console.log(' ✅ All fields present in Swasthika');
            } else {
                console.log(` ❌ MISSING FIELDS in Swasthika:`);
                filtered.forEach(f => console.log(`     → ${f}`));
                anyMissing = true;
            }
        }

        if (!anyMissing) {
            console.log('\n✅ No missing fields! NewSwasthika already has everything Abbort has.');
        }

        console.log('\n' + '='.repeat(70));
        console.log('✅ Deep comparison done!');

    } catch (err) {
        console.error('❌ Error:', err.message);
    } finally {
        await clientA.close();
        await clientS.close();
        process.exit(0);
    }
}

deepCompare();
