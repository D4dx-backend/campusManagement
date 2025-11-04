import dotenv from 'dotenv';
import { User } from '../models/User';
import { Branch } from '../models/Branch';
import { Class } from '../models/Class';
import { Division } from '../models/Division';
import { Department } from '../models/Department';

import { connectDB } from '../config/database';

// Load environment variables
dotenv.config();

export const seedDatabase = async () => {
  try {
    console.log('🌱 Starting database seeding...');

    // Connect to database
    await connectDB();

    // Check if super admin already exists
    const existingSuperAdmin = await User.findOne({ role: 'super_admin' });
    if (existingSuperAdmin) {
      console.log('✅ Super admin already exists, skipping seeding');
      return;
    }

    // Create Super Admin
    const superAdmin = new User({
      email: 'admin@d4mediacampus.com',
      mobile: '9999999999',
      pin: '123456', // Will be hashed automatically
      name: 'Super Administrator',
      role: 'super_admin',
      permissions: [], // Super admin has all permissions
      status: 'active'
    });
    await superAdmin.save();
    console.log('✅ Super admin created');

    // Create Default Branch
    const defaultBranch = new Branch({
      name: 'Main Campus',
      code: 'MAIN',
      address: '123 Education Street, Learning City, State - 123456',
      phone: '9876543210',
      email: 'main@d4mediacampus.com',
      principalName: 'Dr. Principal Name',
      establishedDate: new Date('2020-01-01'),
      status: 'active',
      createdBy: superAdmin._id
    });
    await defaultBranch.save();
    console.log('✅ Default branch created');

    // Create Branch Admin
    const branchAdmin = new User({
      email: 'branch.admin@d4mediacampus.com',
      mobile: '9999999998',
      pin: '123456',
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

    // Create Accountant
    const accountant = new User({
      email: 'accountant@d4mediacampus.com',
      mobile: '9999999997',
      pin: '123456',
      name: 'School Accountant',
      role: 'accountant',
      branchId: defaultBranch._id,
      permissions: [
        { module: 'students', actions: ['read'] },
        { module: 'staff', actions: ['read'] },
        { module: 'fees', actions: ['create', 'read', 'update'] },
        { module: 'payroll', actions: ['create', 'read', 'update'] },
        { module: 'expenses', actions: ['create', 'read', 'update'] },
        { module: 'reports', actions: ['read'] }
      ],
      status: 'active'
    });
    await accountant.save();
    console.log('✅ Accountant created');

    // Create Default Departments
    const departments = [
      { name: 'Administration', code: 'ADMIN', description: 'Administrative department' },
      { name: 'Mathematics', code: 'MATH', description: 'Mathematics department' },
      { name: 'Science', code: 'SCI', description: 'Science department' },
      { name: 'English', code: 'ENG', description: 'English department' },
      { name: 'Social Studies', code: 'SOCIAL', description: 'Social studies department' },
      { name: 'Physical Education', code: 'PE', description: 'Physical education department' }
    ];

    for (const dept of departments) {
      const department = new Department({
        ...dept,
        branchId: defaultBranch._id
      });
      await department.save();
    }
    console.log('✅ Default departments created');

    // Create Default Classes
    const classes = [
      { name: 'Nursery', academicYear: '2024-25' },
      { name: 'LKG', academicYear: '2024-25' },
      { name: 'UKG', academicYear: '2024-25' },
      { name: 'Class 1', academicYear: '2024-25' },
      { name: 'Class 2', academicYear: '2024-25' },
      { name: 'Class 3', academicYear: '2024-25' },
      { name: 'Class 4', academicYear: '2024-25' },
      { name: 'Class 5', academicYear: '2024-25' },
      { name: 'Class 6', academicYear: '2024-25' },
      { name: 'Class 7', academicYear: '2024-25' },
      { name: 'Class 8', academicYear: '2024-25' },
      { name: 'Class 9', academicYear: '2024-25' },
      { name: 'Class 10', academicYear: '2024-25' }
    ];

    const createdClasses = [];
    for (const cls of classes) {
      const classObj = new Class({
        ...cls,
        branchId: defaultBranch._id
      });
      await classObj.save();
      createdClasses.push(classObj);
    }
    console.log('✅ Default classes created');

    // Create Default Divisions for some classes
    const divisionsToCreate = [
      { classIndex: 0, divisions: ['A'] }, // Nursery
      { classIndex: 1, divisions: ['A'] }, // LKG
      { classIndex: 2, divisions: ['A'] }, // UKG
      { classIndex: 3, divisions: ['A', 'B'] }, // Class 1
      { classIndex: 4, divisions: ['A', 'B'] }, // Class 2
      { classIndex: 5, divisions: ['A', 'B'] }, // Class 3
      { classIndex: 6, divisions: ['A', 'B'] }, // Class 4
      { classIndex: 7, divisions: ['A', 'B'] }, // Class 5
      { classIndex: 8, divisions: ['A', 'B'] }, // Class 6
      { classIndex: 9, divisions: ['A', 'B'] }, // Class 7
      { classIndex: 10, divisions: ['A', 'B'] }, // Class 8
      { classIndex: 11, divisions: ['A', 'B'] }, // Class 9
      { classIndex: 12, divisions: ['A', 'B'] } // Class 10
    ];

    for (const { classIndex, divisions } of divisionsToCreate) {
      const classObj = createdClasses[classIndex];
      for (const divisionName of divisions) {
        const division = new Division({
          classId: classObj._id,
          className: classObj.name,
          name: divisionName,
          capacity: 30,
          branchId: defaultBranch._id
        });
        await division.save();
      }
    }
    console.log('✅ Default divisions created');

    // Create Default Expense Categories
    const { ExpenseCategory } = await import('../models/ExpenseCategory');
    const expenseCategories = [
      { name: 'Salary & Wages', description: 'Staff salaries and wages' },
      { name: 'Utilities', description: 'Electricity, water, internet bills' },
      { name: 'Maintenance', description: 'Building and equipment maintenance' },
      { name: 'Office Supplies', description: 'Stationery and office materials' },
      { name: 'Transport', description: 'Vehicle fuel and maintenance' },
      { name: 'Marketing', description: 'Advertising and promotional expenses' }
    ];

    for (const category of expenseCategories) {
      const expenseCategory = new ExpenseCategory({
        ...category,
        branchId: defaultBranch._id,
        status: 'active'
      });
      await expenseCategory.save();
    }
    console.log('✅ Default expense categories created');

    // Create Default Income Categories
    const { IncomeCategory } = await import('../models/IncomeCategory');
    const incomeCategories = [
      { name: 'Tuition Fees', description: 'Student tuition and academic fees' },
      { name: 'Transport Fees', description: 'School bus and transport fees' },
      { name: 'Admission Fees', description: 'New student admission fees' },
      { name: 'Exam Fees', description: 'Examination and assessment fees' },
      { name: 'Activity Fees', description: 'Sports and extracurricular activity fees' },
      { name: 'Donations', description: 'Donations and contributions' }
    ];

    for (const category of incomeCategories) {
      const incomeCategory = new IncomeCategory({
        ...category,
        branchId: defaultBranch._id
      });
      await incomeCategory.save();
    }
    console.log('✅ Default income categories created');

    // Create Default Designations
    const { Designation } = await import('../models/Designation');
    const designations = [
      { name: 'Principal', description: 'Head of the institution' },
      { name: 'Vice Principal', description: 'Assistant to the principal' },
      { name: 'Head Teacher', description: 'Senior teaching position' },
      { name: 'Teacher', description: 'Teaching staff member' },
      { name: 'Assistant Teacher', description: 'Junior teaching position' },
      { name: 'Librarian', description: 'Library management' },
      { name: 'Lab Assistant', description: 'Laboratory support staff' },
      { name: 'Administrative Officer', description: 'Administrative support' },
      { name: 'Accountant', description: 'Financial management' },
      { name: 'Clerk', description: 'General office work' }
    ];

    for (const designation of designations) {
      const designationObj = new Designation({
        ...designation,
        branchId: defaultBranch._id
      });
      await designationObj.save();
    }
    console.log('✅ Default designations created');



    console.log('🎉 Database seeding completed successfully!');
    console.log('\n📋 Default Login Credentials:');
    console.log('Super Admin:');
    console.log('  Mobile: 9999999999');
    console.log('  PIN: 123456');
    console.log('\nBranch Admin:');
    console.log('  Mobile: 9999999998');
    console.log('  PIN: 123456');
    console.log('\nAccountant:');
    console.log('  Mobile: 9999999997');
    console.log('  PIN: 123456');

  } catch (error) {
    console.error('❌ Database seeding failed:', error);
    throw error;
  }
};

// Run seeder if called directly
if (require.main === module) {
  seedDatabase()
    .then(() => {
      console.log('✅ Seeding completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Seeding failed:', error);
      process.exit(1);
    });
}