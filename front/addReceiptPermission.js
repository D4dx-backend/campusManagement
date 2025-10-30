// Node.js Script to Add Receipt Configuration Permission
// Run this script to add the required permission to branch admin users

import mongoose from 'mongoose';

// MongoDB connection (adjust connection string as needed)
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/your-database';

// User schema (adjust according to your actual schema)
const userSchema = new mongoose.Schema({
  name: String,
  email: String,
  mobile: String,
  role: String,
  branchId: String,
  permissions: [{
    module: String,
    actions: [String]
  }],
  status: String
});

const User = mongoose.model('User', userSchema);

async function addReceiptPermission() {
  try {
    // Connect to MongoDB
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    // Find all branch admin users
    const branchAdmins = await User.find({ role: 'branch_admin' });
    console.log(`Found ${branchAdmins.length} branch admin users`);

    // Add receipt-config permission to each branch admin
    for (const user of branchAdmins) {
      // Check if permission already exists
      const hasReceiptPermission = user.permissions.some(p =>
        p.module === 'receipt-config' || p.module === 'receipt' || p.module === 'settings'
      );

      if (!hasReceiptPermission) {
        // Add the permission
        user.permissions.push({
          module: 'receipt-config',
          actions: ['create', 'read', 'update', 'delete']
        });

        await user.save();
        console.log(`✅ Added receipt-config permission to user: ${user.name} (${user.email})`);
      } else {
        console.log(`⏭️  User ${user.name} already has receipt permissions`);
      }
    }

    console.log('\n🎉 Permission update completed!');
    console.log('📝 Branch admins should logout and login again to refresh their permissions.');

  } catch (error) {
    console.error('❌ Error adding permissions:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

// Run the script
addReceiptPermission();

// Usage:
// 1. Install dependencies: npm install mongoose
// 2. Set your MongoDB connection string in MONGODB_URI environment variable
// 3. Run: node add-receipt-permission.js