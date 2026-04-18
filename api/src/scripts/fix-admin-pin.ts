import * as dotenv from 'dotenv';
import * as path from 'path';
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

import * as mongoose from 'mongoose';
import { User } from '../models/User';

async function fix() {
  const uri = process.env.MONGODB_URI || '';
  await mongoose.connect(uri);

  // Fix platform admin PIN
  const admin = await User.findOne({ email: 'shameerbabuvpz@gmail.com' });
  if (admin) {
    console.log('Found platform admin:', admin.name, admin.role, 'mobile:', admin.mobile);
    admin.pin = '1234';
    await admin.save();
    console.log('PIN updated to: 1234');
  } else {
    console.log('Platform admin not found');
  }

  // Check org_admin
  const orgAdmin = await User.findOne({ role: 'org_admin' });
  if (orgAdmin) {
    console.log('\nOrg admin:', orgAdmin.name, orgAdmin.email, 'mobile:', orgAdmin.mobile);
  } else {
    console.log('\nNo org_admin found');
  }

  // Check branch admins
  const branchAdmins = await User.find({ role: 'branch_admin' }).limit(5);
  for (const ba of branchAdmins) {
    console.log('Branch admin:', ba.name, ba.email, 'mobile:', ba.mobile);
  }

  // Check super_admin (old role)
  const superAdmins = await User.find({ role: 'super_admin' }).limit(5);
  for (const sa of superAdmins) {
    console.log('Super admin (old):', sa.name, sa.email, 'mobile:', sa.mobile, 'role:', sa.role);
  }

  await mongoose.disconnect();
  console.log('\nDone.');
}

fix().catch(e => { console.error(e); process.exit(1); });
