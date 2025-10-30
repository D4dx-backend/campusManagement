import { connectDB } from '../config/database';
import { User } from '../models/User';

export const removeReceiptPermission = async () => {
  try {
    console.log('🔄 Removing receipt-config permission from all users...');

    // Connect to database
    await connectDB();

    // Remove receipt-config permission from all users
    const result = await User.updateMany(
      { 'permissions.module': 'receipt-config' },
      { $pull: { permissions: { module: 'receipt-config' } } }
    );

    console.log(`✅ Removed receipt-config permission from ${result.modifiedCount} user(s)`);
    console.log('📝 Receipt configuration is now managed by role (admin and branch_admin only)');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error removing permissions:', error);
    process.exit(1);
  }
};

// Run if called directly
if (require.main === module) {
  removeReceiptPermission();
}
