
import { MongoClient } from 'mongodb';

const URI = 'mongodb+srv://devakibrokerage_db_user:2hmSRDFDyuT4bLgJ@newswasthikacluster.snofy1c.mongodb.net/?appName=NewSwasthikaCluster';

async function checkIds() {
    const client = new MongoClient(URI);
    try {
        await client.connect();
        const db = client.db();

        console.log('--- Checking IDs in Orders vs Brokers ---');

        const sampleOrder = await db.collection('orders').findOne({ order_status: 'CLOSED' });
        console.log('Sample CLOSED Order:', {
            broker_id_str: sampleOrder.broker_id_str,
            customer_id_str: sampleOrder.customer_id_str,
            status: sampleOrder.order_status
        });

        const sampleBroker = await db.collection('brokers').findOne({});
        console.log('Sample Broker:', {
            login_id: sampleBroker.login_id,
            name: sampleBroker.name
        });

        const sampleCustomer = await db.collection('customers').findOne({ customer_id: sampleOrder.customer_id_str });
        console.log('Sample Customer for that Order:', sampleCustomer ? {
            customer_id: sampleCustomer.customer_id,
            name: sampleCustomer.name,
            attached_broker_id: sampleCustomer.attached_broker_id
        } : 'NOT FOUND');

    } catch (err) {
        console.error(err);
    } finally {
        await client.close();
    }
}

checkIds();
