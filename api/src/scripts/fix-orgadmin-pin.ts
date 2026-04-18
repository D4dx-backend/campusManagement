import * as dotenv from 'dotenv';
import * as path from 'path';
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

import * as mongoose from 'mongoose';
import { User } from '../models/User';

async function fix() {
  const uri = process.env.MONGODB_URI || '';
  await mongoose.connect(uri);

  // Set org_admin PIN to known value
  const orgAdmin = await User.findOne({ role: 'org_admin' });
  if (orgAdmin) {
    orgAdmin.pin = '5678';
    await orgAdmin.save();
    console.log('Org admin PIN updated to: 5678');
    console.log('  Name:', orgAdmin.name);
    console.log('  Mobile:', orgAdmin.mobile);
    console.log('  Email:', orgAdmin.email);
  }

  await mongoose.disconnect();
}

fix().catch(e => { console.error(e); process.exit(1); });
