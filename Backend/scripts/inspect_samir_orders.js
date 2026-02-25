
import { MongoClient } from 'mongodb';

const URI = 'mongodb+srv://devakibrokerage_db_user:2hmSRDFDyuT4bLgJ@newswasthikacluster.snofy1c.mongodb.net/?appName=NewSwasthikaCluster';

async function inspectSamirOrders() {
    const client = new MongoClient(URI);
    try {
        await client.connect();
        const db = client.db();

        const customerId = '7871939446';
        const brokerId = '9635725324';

        console.log(`--- Inspecting Orders for Samir Dave (ID: ${customerId}) ---`);

        const orders = await db.collection('orders').find({ customer_id_str: customerId }).toArray();
        console.log('Total Orders found in DB:', orders.length);

        if (orders.length > 0) {
            const statuses = [...new Set(orders.map(o => o.status))];
            console.log('Unique Statuses:', statuses);

            const closedOrders = orders.filter(o => o.status === 'CLOSED');
            console.log('Orders with status "CLOSED":', closedOrders.length);

            if (closedOrders.length > 0) {
                console.log('Sample CLOSED Order Timestamps:', {
                    closed_at: closedOrders[0].closed_at,
                    updatedAt: closedOrders[0].updatedAt,
                    createdAt: closedOrders[0].createdAt,
                    closedAt: closedOrders[0].closedAt // checking for casing variants
                });

                // Log full sample of one closed order
                console.log('Sample CLOSED Order (full):', JSON.stringify(closedOrders[0], null, 2));
            } else {
                console.log('Sample Open Order (full):', JSON.stringify(orders[0], null, 2));
            }
        }

    } catch (err) {
        console.error(err);
    } finally {
        await client.close();
    }
}

inspectSamirOrders();
