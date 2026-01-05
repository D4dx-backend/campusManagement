import mongoose from 'mongoose';
import { User } from '../models/User';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const addAccountingPermissions = async () => {
  try {
    // Connect to MongoDB
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/campus_management';
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB');

    // Find all accountant users who don't have accounting permissions yet
    const accountants = await User.find({
      role: 'accountant',
      'permissions.module': { $ne: 'accounting' }
    });

    console.log(`📊 Found ${accountants.length} accountant users without accounting permissions`);

    if (accountants.length === 0) {
      console.log('✅ All accountant users already have accounting permissions');
      await mongoose.connection.close();
      process.exit(0);
    }

    // Add accounting permissions to each accountant
    const accountingPermission = {
      module: 'accounting',
      actions: ['create', 'read', 'update', 'delete'] as ('create' | 'read' | 'update' | 'delete')[]
    };

    let updatedCount = 0;
    for (const accountant of accountants) {
      accountant.permissions.push(accountingPermission);
      await accountant.save();
      updatedCount++;
      console.log(`✅ Added accounting permissions to: ${accountant.name} (${accountant.email})`);
    }

    console.log(`\n✅ Successfully updated ${updatedCount} accountant users`);
    console.log('\n📋 Summary:');
    console.log(`   - Accountants with accounting permissions: ${accountants.length}`);
    console.log('   - Permission granted: accounting (create, read, update, delete)');

    await mongoose.connection.close();
    console.log('\n✅ Database connection closed');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error adding accounting permissions:', error);
    await mongoose.connection.close();
    process.exit(1);
  }
};

// Run the script
addAccountingPermissions();
