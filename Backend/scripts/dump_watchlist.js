
import { MongoClient } from 'mongodb';

const URI = 'mongodb+srv://devakibrokerage_db_user:2hmSRDFDyuT4bLgJ@newswasthikacluster.snofy1c.mongodb.net/?appName=NewSwasthikaCluster';

async function dumpWatchlist() {
    const client = new MongoClient(URI);
    try {
        await client.connect();
        const db = client.db();

        const customerId = '7871939446';
        const doc = await db.collection('userwatchlists').findOne({ customer_id_str: customerId });
        if (!doc) {
            // Try searching by just customer_id or other fields
            const all = await db.collection('userwatchlists').find({}).limit(1).toArray();
            console.log('No doc found for customer_id_str. Sample doc from collection:', all[0]);
        } else {
            console.log('Found Watchlist Doc:', doc);
        }

    } catch (err) {
        console.error(err);
    } finally {
        await client.close();
    }
}

dumpWatchlist();
