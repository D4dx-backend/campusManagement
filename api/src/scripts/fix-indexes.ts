import dotenv from 'dotenv';
dotenv.config();
import mongoose from 'mongoose';
import { AcademicYear } from '../models/AcademicYear';
import { Department } from '../models/Department';
import { Designation } from '../models/Designation';
import { StaffCategory } from '../models/StaffCategory';
import { ExpenseCategory } from '../models/ExpenseCategory';
import { IncomeCategory } from '../models/IncomeCategory';
import { FeeTypeConfig } from '../models/FeeTypeConfig';

const COLLECTIONS = [
  'academicyears',
  'departments',
  'designations',
  'staffcategories',
  'expensecategories',
  'incomecategories',
  'feetypeconfigs',
];

const MODELS = [AcademicYear, Department, Designation, StaffCategory, ExpenseCategory, IncomeCategory, FeeTypeConfig];

async function run() {
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/d4mediacampus');
  console.log('Connected to MongoDB');
  const db = mongoose.connection.db!;

  // 1. Drop stale indexes
  for (const col of COLLECTIONS) {
    try {
      const indexes = await db.collection(col).indexes();
      const custom = indexes.filter((i: any) => i.name !== '_id_');
      console.log(`\n${col}: ${custom.length} custom indexes`);
      for (const idx of custom) {
        console.log(`  - ${idx.name} unique=${!!idx.unique} sparse=${!!idx.sparse}`);
      }
      if (custom.length > 0) {
        await db.collection(col).dropIndexes();
        console.log('  -> Dropped all custom indexes');
      }
    } catch (e: any) {
      if (e.codeName === 'NamespaceNotFound') {
        console.log(`${col}: collection does not exist yet (OK)`);
      } else {
        console.error(`${col}: ${e.message}`);
      }
    }
  }

  // 2. Recreate indexes from updated Mongoose schemas
  console.log('\nRecreating indexes from models...');
  for (const model of MODELS) {
    await model.syncIndexes();
    console.log(`  OK ${model.modelName}`);
  }

  // 3. Verify
  console.log('\nVerifying new indexes:');
  for (const col of COLLECTIONS) {
    try {
      const indexes = await db.collection(col).indexes();
      const custom = indexes.filter((i: any) => i.name !== '_id_');
      for (const idx of custom) {
        const sparseTag = idx.sparse ? ' [sparse]' : '';
        const uniqueTag = idx.unique ? ' [unique]' : '';
        console.log(`  ${col}: ${idx.name}${uniqueTag}${sparseTag}`);
      }
    } catch { /* skip */ }
  }

  console.log('\nDone!');
  process.exit(0);
}

run().catch(e => { console.error(e); process.exit(1); });
