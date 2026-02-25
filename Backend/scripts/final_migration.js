// FINAL MIGRATION: Add ALL missing fields to NewSwasthika DB
// Based on devaki-new MODEL SCHEMAS (source of truth)
// Instruments collection skipped
// Run: node scripts/final_migration.js

import { MongoClient } from 'mongodb';

const SWASTHIKA_URI = 'mongodb+srv://devakibrokerage_db_user:2hmSRDFDyuT4bLgJ@newswasthikacluster.snofy1c.mongodb.net/?appName=NewSwasthikaCluster';

async function migrate() {
    const client = new MongoClient(SWASTHIKA_URI);

    try {
        console.log('Connecting to NewSwasthikaCluster...');
        await client.connect();
        const db = client.db();
        console.log('✅ Connected!\n');

        // ============================================================
        // 1. brokers — Add: organization_name
        //    (BrokerModel.js: organization_name: { type: String, required: true })
        // ============================================================
        console.log('--- [1/5] brokers: organization_name ---');
        const b1 = await db.collection('brokers').countDocuments({ organization_name: { $exists: false } });
        console.log(`   Missing in ${b1} documents`);
        if (b1 > 0) {
            const r = await db.collection('brokers').updateMany(
                { organization_name: { $exists: false } },
                { $set: { organization_name: '' } }
            );
            console.log(`   ✅ Updated ${r.modifiedCount} docs`);
        } else {
            console.log('   ✅ Already present in all docs');
        }

        // ============================================================
        // 2. customers — Add: profile_photo
        //    (CustomerModel.js: profile_photo: { type: String, default: null })
        // ============================================================
        console.log('\n--- [2/5] customers: profile_photo ---');
        const c1 = await db.collection('customers').countDocuments({ profile_photo: { $exists: false } });
        console.log(`   Missing in ${c1} documents`);
        if (c1 > 0) {
            const r = await db.collection('customers').updateMany(
                { profile_photo: { $exists: false } },
                { $set: { profile_photo: null } }
            );
            console.log(`   ✅ Updated ${r.modifiedCount} docs`);
        } else {
            console.log('   ✅ Already present in all docs');
        }

        // ============================================================
        // 3. fundmodels — Add: option_limit_percentage, intraday.free_limit
        //    (FundModel.js: option_limit_percentage: { default: 10 })
        //    (FundModel.js: intraday.free_limit: { default: 0.00 })
        // ============================================================
        console.log('\n--- [3/5] fundmodels: option_limit_percentage + intraday.free_limit ---');
        const f1 = await db.collection('fundmodels').countDocuments({ option_limit_percentage: { $exists: false } });
        const f2 = await db.collection('fundmodels').countDocuments({ 'intraday.free_limit': { $exists: false } });
        console.log(`   option_limit_percentage missing in ${f1} docs`);
        console.log(`   intraday.free_limit missing in ${f2} docs`);

        const fundUpdate = {};
        if (f1 > 0) fundUpdate.option_limit_percentage = 10;
        if (f2 > 0) fundUpdate['intraday.free_limit'] = 0.00;

        if (Object.keys(fundUpdate).length > 0) {
            const r = await db.collection('fundmodels').updateMany({}, { $set: fundUpdate });
            console.log(`   ✅ Updated ${r.modifiedCount} docs`);
        } else {
            console.log('   ✅ Already present in all docs');
        }

        // ============================================================
        // 4. orders — Add: expire, came_From, closed_ltp, broker_order_id,
        //             exchange_order_id, notional_value, closed_at, updated_at, meta
        //    (OrdersModel.js - all optional fields that may be missing in old docs)
        // ============================================================
        console.log('\n--- [4/5] orders: checking optional missing fields ---');
        const fieldsToCheck = {
            'expire': { $exists: false },
            'came_From': { $exists: false },
            'closed_ltp': { $exists: false },
            'broker_order_id': { $exists: false },
            'exchange_order_id': { $exists: false },
            'notional_value': { $exists: false },
            'closed_at': { $exists: false },
            'updated_at': { $exists: false },
            'meta': { $exists: false },
        };

        const orderDefaults = {
            notional_value: 0,
            meta: {},
        };

        for (const [field, condition] of Object.entries(fieldsToCheck)) {
            const count = await db.collection('orders').countDocuments({ [field]: { $exists: false } });
            if (count > 0) {
                const setVal = orderDefaults[field] !== undefined ? orderDefaults[field] : null;
                await db.collection('orders').updateMany(
                    { [field]: { $exists: false } },
                    { $set: { [field]: setVal } }
                );
                console.log(`   ✅ orders.${field}: set to ${JSON.stringify(setVal)} in ${count} docs`);
            }
        }
        console.log('   ✅ orders check complete');

        // ============================================================
        // 5. registrations — Add: reviewNotes, reviewedBy, reviewedAt,
        //                     telegramSent, telegramMessageId, linkedCustomerId,
        //                     ipAddress, userAgent
        //    (RegistrationModel.js fields that may be missing)
        // ============================================================
        console.log('\n--- [5/5] registrations: checking missing fields ---');
        const regFields = {
            reviewNotes: '',
            telegramSent: false,
            telegramMessageId: null,
            reviewedBy: null,
            reviewedAt: null,
            linkedCustomerId: null,
            ipAddress: null,
            userAgent: null,
        };

        for (const [field, defaultVal] of Object.entries(regFields)) {
            const count = await db.collection('registrations').countDocuments({ [field]: { $exists: false } });
            if (count > 0) {
                await db.collection('registrations').updateMany(
                    { [field]: { $exists: false } },
                    { $set: { [field]: defaultVal } }
                );
                console.log(`   ✅ registrations.${field}: set to ${JSON.stringify(defaultVal)} in ${count} docs`);
            }
        }
        console.log('   ✅ registrations check complete');

        // ============================================================
        // FINAL VERIFICATION
        // ============================================================
        console.log('\n========== VERIFICATION ==========');
        const checks = [
            { col: 'brokers', field: 'organization_name' },
            { col: 'customers', field: 'profile_photo' },
            { col: 'fundmodels', field: 'option_limit_percentage' },
            { col: 'fundmodels', field: 'intraday.free_limit' },
        ];

        let allGood = true;
        for (const { col, field } of checks) {
            const missing = await db.collection(col).countDocuments({ [field]: { $exists: false } });
            const status = missing === 0 ? '✅' : '❌';
            console.log(`${status} ${col}.${field} missing: ${missing}`);
            if (missing > 0) allGood = false;
        }

        console.log('\n' + (allGood ? '✅ All migrations complete!' : '⚠️ Some fields still missing, check above'));

    } catch (err) {
        console.error('❌ Error:', err.message);
    } finally {
        await client.close();
        process.exit(0);
    }
}

migrate();
