
import { MongoClient } from 'mongodb';

const URI = 'mongodb+srv://devakibrokerage_db_user:2hmSRDFDyuT4bLgJ@newswasthikacluster.snofy1c.mongodb.net/?appName=NewSwasthikaCluster';

async function inspectRohitOrders() {
    const client = new MongoClient(URI);
    try {
        await client.connect();
        const db = client.db();

        const customerId = '5879950105';
        // Broker ID is 9635725324 per previous context/screenshot

        console.log(`--- Inspecting Orders for Client 5879950105 ---`);

        // Check all orders for this customer
        const allOrders = await db.collection('orders').find({ customer_id_str: customerId }).toArray();
        console.log('Total Orders in DB:', allOrders.length);

        if (allOrders.length > 0) {
            const statuses = [...new Set(allOrders.map(o => o.order_status || o.status))];
            console.log('Unique status fields found:', statuses);

            const closed = allOrders.filter(o => (o.order_status === 'CLOSED' || o.status === 'CLOSED'));
            console.log('Orders with status CLOSED:', closed.length);

            if (closed.length > 0) {
                console.log('Sample Data for first CLOSED order:');
                console.log(JSON.stringify({
                    symbol: closed[0].symbol,
                    order_status: closed[0].order_status,
                    closed_at: closed[0].closed_at,
                    updatedAt: closed[0].updatedAt,
                    createdAt: closed[0].createdAt,
                    placed_at: closed[0].placed_at
                }, null, 2));
            }
        } else {
            console.log('No orders found for this customer ID in the database.');
        }

    } catch (err) {
        console.error(err);
    } finally {
        await client.close();
    }
}

inspectRohitOrders();
