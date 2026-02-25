
import axios from 'axios';

const API_URL = 'http://localhost:8080'; // assuming backend is on 8080
const token = 'super-broker-local-token'; // using local token for convenience if permissible, or I can use a real fetch if I have a token.
// Actually, I'll just use the DB directly to simulate the query exactly as the controller does.

import { MongoClient } from 'mongodb';

const URI = 'mongodb+srv://devakibrokerage_db_user:2hmSRDFDyuT4bLgJ@newswasthikacluster.snofy1c.mongodb.net/?appName=NewSwasthikaCluster';

async function simulateBackendQuery() {
    const client = new MongoClient(URI);
    try {
        await client.connect();
        const db = client.db();

        const customerId = '7871939446';
        const brokerId = '9635725324';
        const orderStatus = 'CLOSED';

        const filter = {
            broker_id_str: brokerId,
            customer_id_str: customerId,
            order_status: orderStatus
        };

        console.log('Simulating Filter:', filter);

        const orders = await db.collection('orders').find(filter).toArray();
        console.log('Orders found with exact filter:', orders.length);

        if (orders.length > 0) {
            console.log('Sample Order Date fields:', {
                closed_at: orders[0].closed_at,
                updatedAt: orders[0].updatedAt,
                createdAt: orders[0].createdAt
            });
        }

    } catch (err) {
        console.error(err);
    } finally {
        await client.close();
    }
}

simulateBackendQuery();
