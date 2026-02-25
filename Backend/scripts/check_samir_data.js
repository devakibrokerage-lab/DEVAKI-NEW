
import { MongoClient } from 'mongodb';

const URI = 'mongodb+srv://devakibrokerage_db_user:2hmSRDFDyuT4bLgJ@newswasthikacluster.snofy1c.mongodb.net/?appName=NewSwasthikaCluster';

async function checkSamirData() {
    const client = new MongoClient(URI);
    try {
        await client.connect();
        const db = client.db();

        const customerId = '7871939446';
        const brokerId = '9635725324';

        console.log(`--- Checking Data for Samir Dave (ID: ${customerId}) ---`);

        const customer = await db.collection('customers').findOne({ customer_id: customerId });
        console.log('Customer:', customer ? 'Found' : 'NOT FOUND');

        const ordersCount = await db.collection('orders').countDocuments({ customer_id_str: customerId });
        console.log('Orders Count:', ordersCount);

        const funds = await db.collection('fundmodels').findOne({ customer_id_str: customerId });
        console.log('Funds:', funds ? 'Found' : 'NOT FOUND');

        const watchlist = await db.collection('userwatchlists').findOne({ customer_id_str: customerId });
        console.log('Watchlist:', watchlist ? `Found (${watchlist.instruments?.length || 0} items)` : 'NOT FOUND');

    } catch (err) {
        console.error(err);
    } finally {
        await client.close();
    }
}

checkSamirData();
