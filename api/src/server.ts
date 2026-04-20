import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import 'express-async-errors';

import { connectDB } from './config/database';
import { errorHandler } from './middleware/errorHandler';
import { notFound } from './middleware/notFound';

// Import routes
import authRoutes from './routes/auth';
import userRoutes from './routes/users';
import branchRoutes from './routes/branches';
import studentRoutes from './routes/students';
import staffRoutes from './routes/staff';
import classRoutes from './routes/classes';
import divisionRoutes from './routes/divisions';
import departmentRoutes from './routes/departments';
import designationRoutes from './routes/designations';
import staffCategoryRoutes from './routes/staffCategories';
import feeRoutes from './routes/fees';
import feeStructureRoutes from './routes/feeStructures';
import feeTypeConfigRoutes from './routes/feeTypeConfigs';
import payrollRoutes from './routes/payroll';
import expenseRoutes from './routes/expenses';
import expenseCategoryRoutes from './routes/expenseCategories';
import incomeCategoryRoutes from './routes/incomeCategories';
import textbookRoutes from './routes/textbooks';
import textbookIndentRoutes from './routes/textbookIndents';
import reportRoutes from './routes/reports';
import activityLogRoutes from './routes/activityLogs';
import transportRouteRoutes from './routes/transportRoutes';
import uploadRoutes from './routes/upload';
import accountingRoutes from './routes/accounting';
import accountRoutes from './routes/accounts';
import incomeRoutes from './routes/income';
import organizationRoutes from './routes/organizations';
import academicYearRoutes from './routes/academicYears';
import subjectRoutes from './routes/subjects';
import examRoutes from './routes/exams';
import markRoutes from './routes/marks';
import promotionRoutes from './routes/promotions';
import attendanceRoutes from './routes/attendance';
import leaveRequestRoutes from './routes/leaveRequests';
import domainRoutes from './routes/domains';
import helpRoutes from './routes/help';
import orgTemplateRoutes from './routes/orgTemplates';
import timetableConfigRoutes from './routes/timetableConfigs';
import timetableRoutes from './routes/timetables';
import lmsRoutes from './routes/lms';
import studentPortalRoutes from './routes/studentPortal';
import staffLeaveRoutes from './routes/staffLeaveRequests';
import announcementRoutes from './routes/announcements';
import homeworkRoutes from './routes/homework';
import teacherAllocationRoutes from './routes/teacherAllocations';

const app = express();
const PORT = process.env.PORT || 5001;

// Connect to MongoDB
connectDB();

// Security middleware
app.use(helmet());

// Allow main frontend URL + any custom domain that hits this API
const allowedOriginBase = process.env.FRONTEND_URL || 'http://localhost:3000';
app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, curl, etc.)
    if (!origin) return callback(null, true);
    // Always allow the main frontend URL
    if (origin === allowedOriginBase) return callback(null, true);
    // Allow any origin in development
    if ((process.env.NODE_ENV || 'development') === 'development') return callback(null, true);
    // In production, allow all origins (domain mapping handles auth per org)
    // The domain→org mapping + auth token ensures security
    return callback(null, true);
  },
  credentials: true
}));

// Rate limiting — higher ceiling in development, configurable via .env in production
const isDev = (process.env.NODE_ENV || 'development') === 'development';
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'), // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || (isDev ? '5000' : '500')),
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => isDev, // disable rate limiting entirely in development
});
app.use('/api/', limiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Compression middleware
app.use(compression());

// Serve static files (uploaded logos)
app.use('/uploads', express.static('uploads'));

// Logging middleware
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    success: true, 
    message: 'Server is running', 
    timestamp: new Date().toISOString(),
    port: PORT 
  });
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/organizations', organizationRoutes);
app.use('/api/org-templates', orgTemplateRoutes);
app.use('/api/users', userRoutes);
app.use('/api/branches', branchRoutes);
app.use('/api/students', studentRoutes);
app.use('/api/staff', staffRoutes);
app.use('/api/classes', classRoutes);
app.use('/api/divisions', divisionRoutes);
app.use('/api/departments', departmentRoutes);
app.use('/api/designations', designationRoutes);
app.use('/api/staff-categories', staffCategoryRoutes);
app.use('/api/fees', feeRoutes);
app.use('/api/fee-structures', feeStructureRoutes);
app.use('/api/fee-type-configs', feeTypeConfigRoutes);
app.use('/api/payroll', payrollRoutes);
app.use('/api/expenses', expenseRoutes);
app.use('/api/expense-categories', expenseCategoryRoutes);
app.use('/api/income-categories', incomeCategoryRoutes);
app.use('/api/textbooks', textbookRoutes);
app.use('/api/textbook-indents', textbookIndentRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/activity-logs', activityLogRoutes);
app.use('/api/transport-routes', transportRouteRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/accounting', accountingRoutes);
app.use('/api/accounts', accountRoutes);
app.use('/api/income', incomeRoutes);
app.use('/api/academic-years', academicYearRoutes);
app.use('/api/subjects', subjectRoutes);
app.use('/api/exams', examRoutes);
app.use('/api/marks', markRoutes);
app.use('/api/promotions', promotionRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/leave-requests', leaveRequestRoutes);
app.use('/api/domains', domainRoutes);
app.use('/api/help', helpRoutes);
app.use('/api/timetable-configs', timetableConfigRoutes);
app.use('/api/timetables', timetableRoutes);
app.use('/api/lms', lmsRoutes);
app.use('/api/student-portal', studentPortalRoutes);
app.use('/api/staff-leave-requests', staffLeaveRoutes);
app.use('/api/announcements', announcementRoutes);
app.use('/api/homework', homeworkRoutes);
app.use('/api/teacher-allocations', teacherAllocationRoutes);

// Error handling middleware
app.use(notFound);
app.use(errorHandler);

// Start server
app.listen(PORT, () => {
});

export default app;