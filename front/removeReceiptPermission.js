// Node.js Script to Remove Receipt Configuration Permission
// This script removes the receipt-config permission from all users
// Receipt configuration is now managed by role (admin and branch_admin) instead of permissions

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

async function removeReceiptPermission() {
  try {
    // Connect to MongoDB
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    // Remove receipt-config permission from all users
    const result = await User.updateMany(
      { 'permissions.module': 'receipt-config' },
      { $pull: { permissions: { module: 'receipt-config' } } }
    );

    console.log(`✅ Removed receipt-config permission from ${result.modifiedCount} user(s)`);
    console.log('📝 Receipt configuration is now managed by role (admin and branch_admin only)');
    console.log('🔄 Users should logout and login again to refresh their permissions.');

  } catch (error) {
    console.error('❌ Error removing permissions:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

// Run the script
removeReceiptPermission();

// Usage:
// 1. Install dependencies: npm install mongoose
// 2. Set your MongoDB connection string in MONGODB_URI environment variable
// 3. Run: node removeReceiptPermission.js
