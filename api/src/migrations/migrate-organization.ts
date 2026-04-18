/**
 * Migration Script: Assign all existing data to a default Organization
 *
 * What it does:
 * 1. Creates a default Organization (using the first branch's info, or sensible defaults)
 * 2. Sets organizationId on ALL documents in every collection
 * 3. Converts existing super_admin users → org_admin with organization assigned
 * 4. Creates a platform_admin user if none exists
 *
 * Usage:
 *   npx ts-node src/migrations/migrate-organization.ts
 *
 * Safe to run multiple times — it skips if the default org already exists.
 */

import * as mongoose from 'mongoose';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

// ── Models ──────────────────────────────────────────────────
import { Organization } from '../models/Organization';
import { User } from '../models/User';
import { Branch } from '../models/Branch';
import { Account } from '../models/Account';
import { AccountTransaction } from '../models/AccountTransaction';
import { ActivityLog } from '../models/ActivityLog';
import { Class } from '../models/Class';
import { Department } from '../models/Department';
import { Designation } from '../models/Designation';
import { Division } from '../models/Division';
import { Expense } from '../models/Expense';
import { ExpenseCategory } from '../models/ExpenseCategory';
import { FeePayment } from '../models/FeePayment';
import { FeeStructure } from '../models/FeeStructure';
import { FeeTypeConfig } from '../models/FeeTypeConfig';
import { Income } from '../models/Income';
import { IncomeCategory } from '../models/IncomeCategory';
import { PayrollEntry } from '../models/PayrollEntry';
import { ReceiptConfig } from '../models/ReceiptConfig';
import { Staff } from '../models/Staff';
import { Student } from '../models/Student';
import { TextBook } from '../models/TextBook';
import { TextbookIndent } from '../models/TextbookIndent';
import { TransportRoute } from '../models/TransportRoute';

const DEFAULT_ORG_CODE = 'DEFAULT';

async function migrate() {
  const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/d4mediacampus';
  console.log('Connecting to MongoDB...');
  await mongoose.connect(mongoURI);
  console.log('Connected.\n');

  // ── 1. Check if default org already exists ────────────────
  let org = await Organization.findOne({ code: DEFAULT_ORG_CODE });
  if (org) {
    console.log(`Default organization already exists: "${org.name}" (${org._id})`);
    console.log('Continuing to backfill any missing organizationId fields...\n');
  } else {
    // Use the first branch's details as the org info
    const firstBranch = await Branch.findOne().sort({ createdAt: 1 }).lean();

    const orgData = {
      name: firstBranch?.name ? `${firstBranch.name} Organization` : 'Default Organization',
      code: DEFAULT_ORG_CODE,
      address: firstBranch?.address || 'Address pending',
      phone: firstBranch?.phone || '0000000000',
      email: firstBranch?.email ? `org-${firstBranch.email}` : 'org@default.local',
      status: 'active' as const,
      subscriptionPlan: 'premium',
      maxBranches: 50,
    };

    org = await Organization.create(orgData);
    console.log(`Created default organization: "${org.name}" (${org._id})\n`);
  }

  const orgId = org._id;

  // ── 2. Backfill organizationId on all collections ─────────
  // Each entry: [Model, label]
  const collections: [mongoose.Model<any>, string][] = [
    [Branch, 'Branch'],
    [User, 'User'],
    [Account, 'Account'],
    [AccountTransaction, 'AccountTransaction'],
    [ActivityLog, 'ActivityLog'],
    [Class, 'Class'],
    [Department, 'Department'],
    [Designation, 'Designation'],
    [Division, 'Division'],
    [Expense, 'Expense'],
    [ExpenseCategory, 'ExpenseCategory'],
    [FeePayment, 'FeePayment'],
    [FeeStructure, 'FeeStructure'],
    [FeeTypeConfig, 'FeeTypeConfig'],
    [Income, 'Income'],
    [IncomeCategory, 'IncomeCategory'],
    [PayrollEntry, 'PayrollEntry'],
    [ReceiptConfig, 'ReceiptConfig'],
    [Staff, 'Staff'],
    [Student, 'Student'],
    [TextBook, 'TextBook'],
    [TextbookIndent, 'TextbookIndent'],
    [TransportRoute, 'TransportRoute'],
  ];

  for (const [Model, label] of collections) {
    // Only update docs that DON'T already have an organizationId
    const result = await Model.updateMany(
      { $or: [{ organizationId: { $exists: false } }, { organizationId: null }] },
      { $set: { organizationId: orgId } }
    );
    if (result.modifiedCount > 0) {
      console.log(`  ${label}: ${result.modifiedCount} documents updated`);
    } else {
      console.log(`  ${label}: already up to date`);
    }
  }

  // ── 3. Convert old super_admin users → org_admin ──────────
  console.log('\n── Role migration ──');
  const superAdmins = await User.find({ role: 'super_admin' as any });
  if (superAdmins.length > 0) {
    for (const sa of superAdmins) {
      await User.updateOne(
        { _id: sa._id },
        { $set: { role: 'org_admin', organizationId: orgId } }
      );
      console.log(`  Converted user "${sa.name}" (${sa.email}) from super_admin → org_admin`);
    }
  } else {
    console.log('  No super_admin users found to convert.');
  }

  // Also ensure any existing org_admin / branch_admin users have organizationId set
  const adminsWithoutOrg = await User.find({
    role: { $in: ['org_admin', 'branch_admin', 'accountant', 'teacher', 'staff'] },
    $or: [{ organizationId: { $exists: false } }, { organizationId: null }]
  });
  if (adminsWithoutOrg.length > 0) {
    await User.updateMany(
      { _id: { $in: adminsWithoutOrg.map(u => u._id) } },
      { $set: { organizationId: orgId } }
    );
    console.log(`  Assigned organizationId to ${adminsWithoutOrg.length} users missing it.`);
  }

  // ── 4. Ensure a platform_admin exists ─────────────────────
  console.log('\n── Platform admin check ──');
  const platformAdmin = await User.findOne({ role: 'platform_admin' });
  if (platformAdmin) {
    console.log(`  Platform admin already exists: "${platformAdmin.name}" (${platformAdmin.email})`);
  } else {
    console.log('  No platform_admin found.');
    console.log('  ⚠  You should create one manually via the DB or a seed script.');
    console.log('     The platform_admin role does NOT require an organizationId or branchId.');
  }

  // ── Summary ───────────────────────────────────────────────
  console.log('\n══════════════════════════════════════');
  console.log('  Migration complete!');
  console.log(`  Organization: ${org.name} (${orgId})`);

  const totalBranches = await Branch.countDocuments({ organizationId: orgId });
  const totalUsers = await User.countDocuments({ organizationId: orgId });
  console.log(`  Branches under org: ${totalBranches}`);
  console.log(`  Users under org:    ${totalUsers}`);
  console.log('══════════════════════════════════════\n');

  await mongoose.disconnect();
  console.log('Database connection closed.');
}

migrate().catch((err) => {
  console.error('Migration failed:', err);
  mongoose.disconnect();
  process.exit(1);
});
