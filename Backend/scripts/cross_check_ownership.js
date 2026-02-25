
import { MongoClient } from 'mongodb';

const URI = 'mongodb+srv://devakibrokerage_db_user:2hmSRDFDyuT4bLgJ@newswasthikacluster.snofy1c.mongodb.net/?appName=NewSwasthikaCluster';

async function crossCheck() {
    const client = new MongoClient(URI);
    try {
        await client.connect();
        const db = client.db();

        console.log('--- Cross-Checking Order Ownership ---');

        // Get unique broker IDs from orders
        const brokerIdsInOrders = await db.collection('orders').distinct('broker_id_str');
        console.log(`Broker IDs present in Orders: ${brokerIdsInOrders.join(', ')}`);

        // Get all brokers
        const brokers = await db.collection('brokers').find({}).toArray();
        console.log('\nBrokers in DB:');
        brokers.forEach(b => console.log(`  - Name: ${b.name}, LoginID: ${b.login_id}, MongoID: ${b._id}`));

        // Check a sample customer's linkage
        const customer = await db.collection('customers').findOne({});
        if (customer) {
            console.log(`\nSample Customer: ${customer.name} (ID: ${customer.customer_id})`);
            console.log(`  Linked to Broker (ObjectId): ${customer.attached_broker_id}`);

            const attachedBroker = brokers.find(b => b._id.toString() === customer.attached_broker_id.toString());
            console.log(`  Actual Attached Broker LoginID: ${attachedBroker ? attachedBroker.login_id : 'NOT FOUND'}`);

            const orders = await db.collection('orders').countDocuments({ customer_id_str: customer.customer_id });
            console.log(`  Orders found for this Customer ID in DB: ${orders}`);

            if (orders > 0) {
                const sampleOrder = await db.collection('orders').findOne({ customer_id_str: customer.customer_id });
                console.log(`  Sample Order's broker_id_str: ${sampleOrder.broker_id_str}`);
            }
        }

    } catch (err) {
        console.error(err);
    } finally {
        await client.close();
    }
}

crossCheck();
