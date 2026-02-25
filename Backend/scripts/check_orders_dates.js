// Inspect orders data to see date ranges and customer assignments
import { MongoClient } from 'mongodb';

const URI = 'mongodb+srv://devakibrokerage_db_user:2hmSRDFDyuT4bLgJ@newswasthikacluster.snofy1c.mongodb.net/?appName=NewSwasthikaCluster';

async function checkOrders() {
    const client = new MongoClient(URI);
    try {
        await client.connect();
        const db = client.db();
        const collection = db.collection('orders');

        console.log('--- Orders Data Summary ---');

        // Total orders
        const total = await collection.countDocuments();
        console.log(`Total orders: ${total}`);

        // Unique customers
        const customers = await collection.distinct('customer_id_str');
        console.log(`Unique customers in orders: ${customers.join(', ')}`);

        // Date range for a few customers
        for (const cid of customers.slice(0, 5)) {
            const first = await collection.find({ customer_id_str: cid }).sort({ createdAt: 1 }).limit(1).toArray();
            const last = await collection.find({ customer_id_str: cid }).sort({ createdAt: -1 }).limit(1).toArray();

            if (first.length && last.length) {
                console.log(`\nCustomer: ${cid}`);
                console.log(`  Count: ${await collection.countDocuments({ customer_id_str: cid })}`);
                console.log(`  Earliest (createdAt): ${first[0].createdAt}`);
                console.log(`  Latest (createdAt): ${last[0].createdAt}`);
                console.log(`  Latest (closed_at): ${last[0].closed_at}`);
            }
        }

        console.log('\n--- Sample Order Document ---');
        const sample = await collection.findOne({ customer_id_str: { $exists: true } });
        console.log(JSON.stringify(sample, null, 2));

    } catch (err) {
        console.error(err);
    } finally {
        await client.close();
    }
}

checkOrders();
