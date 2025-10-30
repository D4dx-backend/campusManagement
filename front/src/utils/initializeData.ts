import { 
  defaultClasses, 
  defaultDivisions, 
  defaultExpenseCategories, 
  defaultIncomeCategories
} from '@/data/defaultMasterData';
import { ActivityLog, Branch } from '@/types';

export const initializeMasterData = () => {
  // Initialize Classes
  if (!localStorage.getItem('campuswise_classes')) {
    localStorage.setItem('campuswise_classes', JSON.stringify(defaultClasses));
  }

  // Initialize Divisions
  if (!localStorage.getItem('campuswise_divisions')) {
    localStorage.setItem('campuswise_divisions', JSON.stringify(defaultDivisions));
  }

  // Initialize Expense Categories
  if (!localStorage.getItem('campuswise_expense_categories')) {
    localStorage.setItem('campuswise_expense_categories', JSON.stringify(defaultExpenseCategories));
  }

  // Initialize Income Categories
  if (!localStorage.getItem('campuswise_income_categories')) {
    localStorage.setItem('campuswise_income_categories', JSON.stringify(defaultIncomeCategories));
  }

  // Departments are now managed via API, no localStorage initialization needed

  // Initialize Activity Logs with sample data
  if (!localStorage.getItem('campuswise_activity_logs')) {
    const sampleLogs: ActivityLog[] = [
      {
        id: '1',
        userId: '1',
        userName: 'Super Admin',
        userRole: 'super_admin',
        action: 'Login',
        module: 'Authentication',
        details: 'Super Admin logged into the system',
        timestamp: new Date().toISOString(),
        ipAddress: '192.168.1.100'
      },
      {
        id: '2',
        userId: '2',
        userName: 'Branch Admin',
        userRole: 'branch_admin',
        action: 'Login',
        module: 'Authentication',
        details: 'Branch Admin logged into Main Campus',
        timestamp: new Date(Date.now() - 1800000).toISOString(),
        ipAddress: '192.168.1.101'
      },
      {
        id: '3',
        userId: '3',
        userName: 'John Teacher',
        userRole: 'teacher',
        action: 'Create',
        module: 'Students',
        details: 'Added new student: Sarah Johnson to Class 5-A',
        timestamp: new Date(Date.now() - 3600000).toISOString(),
        ipAddress: '192.168.1.102'
      },
      {
        id: '4',
        userId: '4',
        userName: 'Mary Accountant',
        userRole: 'accountant',
        action: 'Update',
        module: 'Fees',
        details: 'Updated fee payment for student ID: STU001',
        timestamp: new Date(Date.now() - 7200000).toISOString(),
        ipAddress: '192.168.1.103'
      },
      {
        id: '5',
        userId: '1',
        userName: 'Super Admin',
        userRole: 'super_admin',
        action: 'Create',
        module: 'BranchManagement',
        details: 'Created new branch: Main Campus',
        timestamp: new Date(Date.now() - 14400000).toISOString(),
        ipAddress: '192.168.1.100'
      }
    ];
    localStorage.setItem('campuswise_activity_logs', JSON.stringify(sampleLogs));
  }

  // Initialize Branches with default branch
  if (!localStorage.getItem('campuswise_branches')) {
    const defaultBranch: Branch = {
      id: 'branch1',
      name: 'Main Campus',
      code: 'MAIN',
      address: '123 Education Street, City, State - 123456',
      phone: '+91-9876543210',
      email: 'main@d4media.com',
      principalName: 'Dr. Principal Name',
      establishedDate: '2020-01-01',
      status: 'active',
      createdAt: '2024-01-01T00:00:00.000Z',
      createdBy: '1', // Super Admin ID
    };
    localStorage.setItem('campuswise_branches', JSON.stringify([defaultBranch]));
  }
};