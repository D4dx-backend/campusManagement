// Quick script to fix a user's role
import mongoose from 'mongoose';
import readline from 'readline';

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

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(query) {
  return new Promise(resolve => rl.question(query, resolve));
}

async function fixUserRole() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Ask for user identifier
    const identifier = await question('Enter user email or mobile number: ');
    
    // Find user
    const user = await User.findOne({
      $or: [
        { email: identifier.trim() },
        { mobile: identifier.trim() }
      ]
    });

    if (!user) {
      console.log('❌ User not found!');
      process.exit(1);
    }

    console.log('\n=== Current User Info ===');
    console.log(`Name: ${user.name}`);
    console.log(`Email: ${user.email}`);
    console.log(`Mobile: ${user.mobile}`);
    console.log(`Current Role: "${user.role}"`);
    console.log(`Status: ${user.status}`);
    console.log(`Branch ID: ${user.branchId || 'None'}`);

    // Ask for new role
    console.log('\n=== Available Roles ===');
    console.log('1. super_admin');
    console.log('2. branch_admin');
    console.log('3. accountant');
    console.log('4. teacher');
    console.log('5. staff');
    
    const roleChoice = await question('\nSelect role (1-5): ');
    
    const roles = ['super_admin', 'branch_admin', 'accountant', 'teacher', 'staff'];
    const newRole = roles[parseInt(roleChoice) - 1];
    
    if (!newRole) {
      console.log('❌ Invalid choice!');
      process.exit(1);
    }

    // Ask for status
    const statusChoice = await question('Set status to active? (y/n): ');
    const newStatus = statusChoice.toLowerCase() === 'y' ? 'active' : user.status;

    // Confirm changes
    console.log('\n=== Proposed Changes ===');
    console.log(`Role: "${user.role}" → "${newRole}"`);
    console.log(`Status: "${user.status}" → "${newStatus}"`);
    
    const confirm = await question('\nApply these changes? (y/n): ');
    
    if (confirm.toLowerCase() !== 'y') {
      console.log('❌ Changes cancelled');
      process.exit(0);
    }

    // Apply changes
    user.role = newRole;
    user.status = newStatus;
    await user.save();

    console.log('\n✅ User updated successfully!');
    console.log('\n⚠️  IMPORTANT: User must logout and login again for changes to take effect!');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    rl.close();
    await mongoose.disconnect();
    console.log('\nDisconnected from MongoDB');
  }
}

fixUserRole();

// Usage:
// export MONGODB_URI="your-connection-string"
// node fixUserRole.js
