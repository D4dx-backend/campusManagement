import { connectDB } from '../config/database';
import { User } from '../models/User';

export const addReceiptPermission = async () => {
  try {
    console.log('🔄 Adding receipt-config permission to existing users...');

    // Connect to database
    await connectDB();

    // Add receipt-config permission to all branch admins
    const branchAdmins = await User.find({ role: 'branch_admin' });
    console.log(`Found ${branchAdmins.length} branch admin(s)`);

    for (const admin of branchAdmins) {
      // Check if permission already exists
      const hasReceiptPermission = admin.permissions.some(p => 
        p.module === 'receipt-config'
      );

      if (!hasReceiptPermission) {
        admin.permissions.push({
          module: 'receipt-config',
          actions: ['create', 'read', 'update', 'delete']
        });
        await admin.save();
        console.log(`✅ Added receipt-config permission to: ${admin.name} (${admin.email})`);
      } else {
        console.log(`⏭️  ${admin.name} already has receipt-config permission`);
      }
    }

    // Add receipt-config permission to all super admins
    const superAdmins = await User.find({ role: 'super_admin' });
    console.log(`Found ${superAdmins.length} super admin(s)`);

    for (const admin of superAdmins) {
      // Check if permission already exists
      const hasReceiptPermission = admin.permissions.some(p => 
        p.module === 'receipt-config'
      );

      if (!hasReceiptPermission) {
        admin.permissions.push({
          module: 'receipt-config',
          actions: ['create', 'read', 'update', 'delete']
        });
        await admin.save();
        console.log(`✅ Added receipt-config permission to: ${admin.name} (${admin.email})`);
      } else {
        console.log(`⏭️  ${admin.name} already has receipt-config permission`);
      }
    }

    console.log('🎉 Receipt permission update completed!');
    console.log('📝 Users should logout and login again to refresh their permissions.');

  } catch (error) {
    console.error('❌ Permission update failed:', error);
    throw error;
  }
};

// Run script if called directly
if (require.main === module) {
  addReceiptPermission()
    .then(() => {
      console.log('✅ Permission update completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Permission update failed:', error);
      process.exit(1);
    });
}