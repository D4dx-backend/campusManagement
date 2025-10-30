import { connectDB } from '../config/database';
import { User } from '../models/User';
import { Branch } from '../models/Branch';

export const updateUsers = async () => {
  try {
    console.log('🔄 Updating user credentials...');

    // Connect to database
    await connectDB();

    // Clear existing users
    await User.deleteMany({});
    console.log('🗑️ Cleared existing users');

    // Create Super Admin first
    const superAdmin = new User({
      email: 'admin@d4mediacampus.com',
      mobile: '9876543210',
      pin: '1234',
      name: 'Super Administrator',
      role: 'super_admin',
      permissions: [
        { module: 'users', actions: ['create', 'read', 'update', 'delete'] },
        { module: 'branches', actions: ['create', 'read', 'update', 'delete'] },
        { module: 'students', actions: ['create', 'read', 'update', 'delete'] },
        { module: 'staff', actions: ['create', 'read', 'update', 'delete'] },
        { module: 'classes', actions: ['create', 'read', 'update', 'delete'] },
        { module: 'divisions', actions: ['create', 'read', 'update', 'delete'] },
        { module: 'departments', actions: ['create', 'read', 'update', 'delete'] },
        { module: 'fees', actions: ['create', 'read', 'update', 'delete'] },
        { module: 'payroll', actions: ['create', 'read', 'update', 'delete'] },
        { module: 'expenses', actions: ['create', 'read', 'update', 'delete'] },
        { module: 'textbooks', actions: ['create', 'read', 'update', 'delete'] },
        { module: 'reports', actions: ['read'] },
        { module: 'activity_logs', actions: ['read'] }
      ],
      status: 'active'
    });
    await superAdmin.save();
    console.log('✅ Super admin created');

    // Create default branch after super admin
    let defaultBranch = await Branch.findOne({ code: 'MAIN' });
    if (!defaultBranch) {
      defaultBranch = new Branch({
        name: 'Main Branch',
        code: 'MAIN',
        address: '123 Education Street, Learning City',
        phone: '+1234567890',
        email: 'main@d4mediacampus.com',
        principalName: 'Dr. Principal',
        establishedDate: new Date('2020-01-01'),
        status: 'active',
        createdBy: superAdmin._id
      });
      await defaultBranch.save();
      console.log('✅ Default branch created');
    }

    // Create Branch Admin
    const branchAdmin = new User({
      email: 'branch.admin@d4mediacampus.com',
      mobile: '9876543211',
      pin: '5678',
      name: 'Branch Administrator',
      role: 'branch_admin',
      branchId: defaultBranch._id,
      permissions: [
        { module: 'students', actions: ['create', 'read', 'update', 'delete'] },
        { module: 'staff', actions: ['create', 'read', 'update', 'delete'] },
        { module: 'classes', actions: ['create', 'read', 'update', 'delete'] },
        { module: 'divisions', actions: ['create', 'read', 'update', 'delete'] },
        { module: 'departments', actions: ['create', 'read', 'update', 'delete'] },
        { module: 'fees', actions: ['create', 'read', 'update', 'delete'] },
        { module: 'payroll', actions: ['create', 'read', 'update', 'delete'] },
        { module: 'expenses', actions: ['create', 'read', 'update', 'delete'] },
        { module: 'textbooks', actions: ['create', 'read', 'update', 'delete'] },
        { module: 'reports', actions: ['read'] },
        { module: 'activity_logs', actions: ['read'] }
      ],
      status: 'active'
    });
    await branchAdmin.save();
    console.log('✅ Branch admin created');

    // Create Teacher
    const teacher = new User({
      email: 'teacher@d4mediacampus.com',
      mobile: '9876543212',
      pin: '9012',
      name: 'Teacher User',
      role: 'teacher',
      branchId: defaultBranch._id,
      permissions: [
        { module: 'students', actions: ['read', 'update'] },
        { module: 'classes', actions: ['read'] },
        { module: 'divisions', actions: ['read'] },
        { module: 'textbooks', actions: ['read'] },
        { module: 'reports', actions: ['read'] }
      ],
      status: 'active'
    });
    await teacher.save();
    console.log('✅ Teacher created');

    // Create Accountant
    const accountant = new User({
      email: 'accountant@d4mediacampus.com',
      mobile: '9876543213',
      pin: '3456',
      name: 'Accountant User',
      role: 'accountant',
      branchId: defaultBranch._id,
      permissions: [
        { module: 'students', actions: ['read'] },
        { module: 'staff', actions: ['read'] },
        { module: 'fees', actions: ['create', 'read', 'update', 'delete'] },
        { module: 'payroll', actions: ['create', 'read', 'update', 'delete'] },
        { module: 'expenses', actions: ['create', 'read', 'update', 'delete'] },
        { module: 'reports', actions: ['read'] }
      ],
      status: 'active'
    });
    await accountant.save();
    console.log('✅ Accountant created');

    console.log('🎉 User credentials updated successfully!');
    console.log('\n📋 Updated Login Credentials:');
    console.log('Super Admin:');
    console.log('  Mobile: 9876543210');
    console.log('  PIN: 1234');
    console.log('\nBranch Admin:');
    console.log('  Mobile: 9876543211');
    console.log('  PIN: 5678');
    console.log('\nTeacher:');
    console.log('  Mobile: 9876543212');
    console.log('  PIN: 9012');
    console.log('\nAccountant:');
    console.log('  Mobile: 9876543213');
    console.log('  PIN: 3456');

  } catch (error) {
    console.error('❌ User update failed:', error);
    throw error;
  }
};

// Run updater if called directly
if (require.main === module) {
  updateUsers()
    .then(() => {
      console.log('✅ User update completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ User update failed:', error);
      process.exit(1);
    });
}