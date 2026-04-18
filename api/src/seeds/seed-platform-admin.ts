/**
 * Seed: Create Platform Admin (god-level) user
 *
 * Usage:  npm run seed:platform-admin
 */

import * as mongoose from 'mongoose';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

import { User } from '../models/User';

const PLATFORM_ADMIN = {
  name: 'Shameer Babu VP',
  email: 'shameerbabuvpz@gmail.com',
  mobile: '0000000000',           // placeholder — update later
  pin: 'Admin@123',
  role: 'platform_admin' as const,
  permissions: [
    { module: 'students', actions: ['create', 'read', 'update', 'delete'] },
    { module: 'staff', actions: ['create', 'read', 'update', 'delete'] },
    { module: 'classes', actions: ['create', 'read', 'update', 'delete'] },
    { module: 'divisions', actions: ['create', 'read', 'update', 'delete'] },
    { module: 'departments', actions: ['create', 'read', 'update', 'delete'] },
    { module: 'designations', actions: ['create', 'read', 'update', 'delete'] },
    { module: 'fees', actions: ['create', 'read', 'update', 'delete'] },
    { module: 'expenses', actions: ['create', 'read', 'update', 'delete'] },
    { module: 'payroll', actions: ['create', 'read', 'update', 'delete'] },
    { module: 'reports', actions: ['create', 'read', 'update', 'delete'] },
    { module: 'textbooks', actions: ['create', 'read', 'update', 'delete'] },
    { module: 'activity_logs', actions: ['create', 'read', 'update', 'delete'] },
    { module: 'accounting', actions: ['create', 'read', 'update', 'delete'] },
  ],
  status: 'active',
};

async function seed() {
  const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/d4mediacampus';
  console.log('Connecting to MongoDB...');
  await mongoose.connect(mongoURI);
  console.log('Connected.\n');

  const existing = await User.findOne({ email: PLATFORM_ADMIN.email });
  if (existing) {
    console.log(`Platform admin already exists: "${existing.name}" (${existing.email})`);
    console.log('Skipping creation. Delete manually first if you want to recreate.');
  } else {
    const user = await User.create(PLATFORM_ADMIN);
    console.log('Platform admin created successfully!');
    console.log(`  Name:  ${user.name}`);
    console.log(`  Email: ${user.email}`);
    console.log(`  Role:  ${user.role}`);
    console.log(`  ID:    ${user._id}`);
  }

  await mongoose.disconnect();
  console.log('\nDone.');
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  mongoose.disconnect();
  process.exit(1);
});
