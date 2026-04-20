import * as dotenv from 'dotenv';
import * as path from 'path';
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

import * as mongoose from 'mongoose';

async function testConnection() {
  const uri = process.env.MONGODB_URI || '';
  console.log('URI prefix:', uri.substring(0, 40) + '...');
  console.log('Connecting...');
  
  try {
    const conn = await mongoose.connect(uri);
    console.log('MongoDB connected successfully!');
    
    const db = mongoose.connection.db!;
    const ping = await db.admin().ping();
    console.log('Ping result:', JSON.stringify(ping));
    
    const collections = await db.listCollections().toArray();
    console.log('Collections:', collections.map(c => c.name).join(', '));
    
    // Count docs in key collections
    for (const col of ['users', 'organizations', 'branches', 'students']) {
      try {
        const count = await db.collection(col).countDocuments();
        console.log(`  ${col}: ${count} documents`);
      } catch (e) {}
    }
    
    await mongoose.disconnect();
    console.log('Disconnected.');
  } catch (e: any) {
    console.error('CONNECTION FAILED:', e.message);
    process.exit(1);
  }
}

testConnection();
