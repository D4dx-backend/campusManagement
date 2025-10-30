// Debug script to check user roles and permissions
import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/your-database';

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

async function debugUsers() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB\n');

    // Find all users
    const users = await User.find({}).select('name email mobile role branchId permissions status');
    
    console.log('=== ALL USERS ===\n');
    users.forEach(user => {
      console.log(`Name: ${user.name}`);
      console.log(`Email: ${user.email}`);
      console.log(`Mobile: ${user.mobile}`);
      console.log(`Role: "${user.role}" (type: ${typeof user.role})`);
      console.log(`Branch ID: ${user.branchId}`);
      console.log(`Status: ${user.status}`);
      console.log(`Permissions: ${user.permissions?.map(p => `${p.module}:${p.actions.join(',')}`).join(' | ') || 'None'}`);
      console.log('---\n');
    });

    // Check for branch admins specifically
    const branchAdmins = await User.find({ role: 'branch_admin' });
    console.log(`\n=== BRANCH ADMINS (${branchAdmins.length}) ===`);
    branchAdmins.forEach(admin => {
      console.log(`- ${admin.name} (${admin.email})`);
      console.log(`  Role value: "${admin.role}"`);
      console.log(`  Has receipt-config permission: ${admin.permissions?.some(p => p.module === 'receipt-config')}`);
    });

    // Check for super admins
    const superAdmins = await User.find({ role: 'super_admin' });
    console.log(`\n=== SUPER ADMINS (${superAdmins.length}) ===`);
    superAdmins.forEach(admin => {
      console.log(`- ${admin.name} (${admin.email})`);
      console.log(`  Role value: "${admin.role}"`);
    });

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\nDisconnected from MongoDB');
  }
}

debugUsers();

// Usage:
// export MONGODB_URI="your-connection-string"
// node debugUserRole.js
