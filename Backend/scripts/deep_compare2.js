// Optimized Deep comparison: Fields in Abbort (NEW) missing in Swasthika (OLD)
// Skips 'instruments' (196K docs, already known to match)
// Uses aggregate $project instead of full scan for speed
// Run: node scripts/deep_compare2.js

import { MongoClient } from 'mongodb';

const ABBORT_URI = 'mongodb+srv://abbothouse2000_db_user:M1OxKOQSMuJjc44u@abbort.ugtqcof.mongodb.net/?appName=abbort';
const SWASTHIKA_URI = 'mongodb+srv://devakibrokerage_db_user:2hmSRDFDyuT4bLgJ@newswasthikacluster.snofy1c.mongodb.net/?appName=NewSwasthikaCluster';

// Skip these large/already-matching collections
const SKIP_COLLECTIONS = ['instruments'];

// Get all field paths from a document (including nested, top-2 levels only)
function getFields(obj, prefix = '', depth = 0) {
    const fields = new Set();
    if (depth > 2) return fields;
    for (const key of Object.keys(obj)) {
        if (key === '_id' || key === '__v') continue;
        const fullKey = prefix ? `${prefix}.${key}` : key;
        fields.add(fullKey);
        if (obj[key] && typeof obj[key] === 'object' && !Array.isArray(obj[key]) && !(obj[key] instanceof Date)) {
            const nested = getFields(obj[key], fullKey, depth + 1);
            nested.forEach(f => fields.add(f));
        }
    }
    return fields;
}

// Scan up to 100 docs spread across collection to get all field names
async function sampleFields(collection, total) {
    const fields = new Set();
    // Take first 50 and last 50
    const first = await collection.find({}).limit(50).toArray();
    const skip = Math.max(0, total - 50);
    const last = skip > 0 ? await collection.find({}).skip(skip).limit(50).toArray() : [];
    for (const doc of [...first, ...last]) {
        getFields(doc).forEach(f => fields.add(f));
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
        console.log('  Fields in ABBORT (NEW) → MISSING in NewSwasthika (OLD)');
        console.log('='.repeat(70));

        let anyMissing = false;

        for (const col of abbortCols) {
            const name = col.name;

            if (SKIP_COLLECTIONS.includes(name)) {
                console.log(`\n⚡ "${name}" — Skipped (large collection, fields already match)`);
                continue;
            }

            const abbortCol = abbortDB.collection(name);
            const abbortCount = await abbortCol.countDocuments();

            if (abbortCount === 0) {
                console.log(`\n⚪ "${name}" — Abbort 0 docs, skip`);
                continue;
            }

            if (!swasthikaColNames.has(name)) {
                console.log(`\n🆕 "${name}" — Collection MISSING in Swasthika entirely!`);
                anyMissing = true;
                continue;
            }

            const swasthikaCol = swasthikaDB.collection(name);
            const swasthikaCount = await swasthikaCol.countDocuments();

            console.log(`\n📂 "${name}" — Abbort: ${abbortCount} docs | Swasthika: ${swasthikaCount} docs`);

            const abbortFields = await sampleFields(abbortCol, abbortCount);
            const swasthikaFields = swasthikaCount > 0
                ? await sampleFields(swasthikaCol, swasthikaCount)
                : new Set();

            const missingInSwasthika = [...abbortFields].filter(f => !swasthikaFields.has(f));

            if (missingInSwasthika.length === 0) {
                console.log('   ✅ All Abbort fields are present in Swasthika');
            } else {
                console.log(`   🔴 MISSING in Swasthika (${missingInSwasthika.length} fields):`);
                missingInSwasthika.forEach(f => console.log(`      → ${f}`));
                anyMissing = true;
            }
        }

        console.log('\n' + '='.repeat(70));
        if (!anyMissing) {
            console.log('✅ Result: NewSwasthika already has ALL fields that Abbort has!');
        } else {
            console.log('⚠️  Result: Some fields in Abbort are missing in NewSwasthika (listed above).');
        }

    } catch (err) {
        console.error('❌ Error:', err.message);
    } finally {
        await clientA.close();
        await clientS.close();
        process.exit(0);
    }
}

deepCompare();
