import { ActivityLog, UserRole } from '@/types';

interface LogActivityParams {
  userId: string;
  userName: string;
  userRole: UserRole;
  action: string;
  module: string;
  details: string;
  ipAddress?: string;
}

export const logActivity = (params: LogActivityParams) => {
  try {
    const existingLogs = JSON.parse(localStorage.getItem('campuswise_activity_logs') || '[]') as ActivityLog[];
    
    const newLog: ActivityLog = {
      id: Date.now().toString(),
      userId: params.userId,
      userName: params.userName,
      userRole: params.userRole,
      action: params.action,
      module: params.module,
      details: params.details,
      timestamp: new Date().toISOString(),
      ipAddress: params.ipAddress || 'Unknown',
    };

    const updatedLogs = [newLog, ...existingLogs].slice(0, 1000); // Keep only last 1000 logs
    localStorage.setItem('campuswise_activity_logs', JSON.stringify(updatedLogs));
  } catch (error) {
    console.error('Failed to log activity:', error);
  }
};

// Helper functions for common actions
export const logUserLogin = (userId: string, userName: string, userRole: UserRole, ipAddress?: string) => {
  logActivity({
    userId,
    userName,
    userRole,
    action: 'Login',
    module: 'Authentication',
    details: 'User logged into the system',
    ipAddress,
  });
};

export const logUserLogout = (userId: string, userName: string, userRole: UserRole, ipAddress?: string) => {
  logActivity({
    userId,
    userName,
    userRole,
    action: 'Logout',
    module: 'Authentication',
    details: 'User logged out of the system',
    ipAddress,
  });
};

export const logDataCreate = (userId: string, userName: string, userRole: UserRole, module: string, itemName: string, ipAddress?: string) => {
  logActivity({
    userId,
    userName,
    userRole,
    action: 'Create',
    module,
    details: `Created new ${module.toLowerCase()}: ${itemName}`,
    ipAddress,
  });
};

export const logDataUpdate = (userId: string, userName: string, userRole: UserRole, module: string, itemName: string, ipAddress?: string) => {
  logActivity({
    userId,
    userName,
    userRole,
    action: 'Update',
    module,
    details: `Updated ${module.toLowerCase()}: ${itemName}`,
    ipAddress,
  });
};

export const logDataDelete = (userId: string, userName: string, userRole: UserRole, module: string, itemName: string, ipAddress?: string) => {
  logActivity({
    userId,
    userName,
    userRole,
    action: 'Delete',
    module,
    details: `Deleted ${module.toLowerCase()}: ${itemName}`,
    ipAddress,
  });
};