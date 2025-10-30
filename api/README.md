# d4mediaCampus API

A comprehensive backend API for the d4mediaCampus school management system built with Node.js, Express, TypeScript, and MongoDB.

## 🚀 Features

### Core Modules
- **Authentication & Authorization** - JWT-based auth with role-based access control
- **User Management** - Multi-role user system (Super Admin, Branch Admin, Accountant, Teacher, Staff)
- **Branch Management** - Multi-branch support for school chains
- **Student Management** - Complete student lifecycle management
- **Staff Management** - Employee records and management
- **Academic Structure** - Classes, divisions, and departments
- **Fee Management** - Fee collection and payment tracking
- **Payroll Management** - Staff salary processing
- **Expense Management** - Institutional expense tracking
- **Textbook Management** - Inventory and issuance tracking
- **Reports & Analytics** - Comprehensive reporting system
- **Activity Logging** - Complete audit trail

### Technical Features
- **TypeScript** - Full type safety and better development experience
- **MongoDB** - Scalable NoSQL database with Mongoose ODM
- **JWT Authentication** - Secure token-based authentication
- **Role-based Access Control** - Granular permissions system
- **Input Validation** - Comprehensive request validation with Joi
- **Error Handling** - Centralized error handling and logging
- **Rate Limiting** - API rate limiting for security
- **CORS Support** - Cross-origin resource sharing
- **Security Headers** - Helmet.js for security headers
- **Request Logging** - Morgan for HTTP request logging
- **Compression** - Response compression for better performance

## 📋 Prerequisites

- Node.js (v18.0.0 or higher)
- MongoDB (v5.0 or higher)
- npm or yarn package manager

## 🛠️ Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd d4mediaCampus-api
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**
   ```bash
   cp .env.example .env
   ```
   
   Update the `.env` file with your configuration:
   ```env
   # Server Configuration
   PORT=5000
   NODE_ENV=development
   
   # Database Configuration
   MONGODB_URI=mongodb://localhost:27017/d4mediacampus
   
   # JWT Configuration
   JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
   JWT_EXPIRES_IN=7d
   
   # CORS Configuration
   FRONTEND_URL=http://localhost:8080
   ```

4. **Start MongoDB**
   ```bash
   # Using MongoDB service
   sudo systemctl start mongod
   
   # Or using Docker
   docker run -d -p 27017:27017 --name mongodb mongo:latest
   ```

5. **Seed the database (First time setup)**
   ```bash
   npm run seed
   ```
   
   This will create:
   - Super Admin (Mobile: 9999999999, PIN: 123456)
   - Branch Admin (Mobile: 9999999998, PIN: 123456)
   - Accountant (Mobile: 9999999997, PIN: 123456)
   - Default branch, classes, divisions, and departments

6. **Build the project**
   ```bash
   npm run build
   ```

7. **Start the server**
   ```bash
   # Development mode
   npm run dev
   
   # Production mode
   npm start
   ```

8. **Test the API**
   ```bash
   # Health check
   curl http://localhost:5000/health
   
   # Login test
   curl -X POST http://localhost:5000/api/auth/login \
     -H "Content-Type: application/json" \
     -d '{"mobile":"9999999999","pin":"123456"}'
   ```

## 🔧 Development

### Available Scripts

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build TypeScript to JavaScript
- `npm start` - Start production server
- `npm test` - Run tests
- `npm run lint` - Run ESLint
- `npm run lint:fix` - Fix ESLint issues

### Project Structure

```
src/
├── config/          # Configuration files
│   └── database.ts  # MongoDB connection
├── middleware/      # Express middleware
│   ├── auth.ts      # Authentication & authorization
│   ├── errorHandler.ts
│   ├── notFound.ts
│   └── validation.ts
├── models/          # MongoDB models
│   ├── User.ts
│   ├── Branch.ts
│   ├── Student.ts
│   ├── Staff.ts
│   ├── Class.ts
│   ├── Division.ts
│   ├── Department.ts
│   ├── FeePayment.ts
│   ├── PayrollEntry.ts
│   ├── Expense.ts
│   ├── TextBook.ts
│   └── ActivityLog.ts
├── routes/          # API routes
│   ├── auth.ts
│   ├── users.ts
│   ├── branches.ts
│   ├── students.ts
│   ├── staff.ts
│   ├── classes.ts
│   ├── divisions.ts
│   ├── departments.ts
│   ├── fees.ts
│   ├── payroll.ts
│   ├── expenses.ts
│   ├── textbooks.ts
│   ├── reports.ts
│   └── activityLogs.ts
├── types/           # TypeScript type definitions
│   └── index.ts
├── validations/     # Joi validation schemas
│   ├── auth.ts
│   └── student.ts
└── server.ts        # Main server file
```

## 📚 API Documentation

### Base URL
```
http://localhost:5000/api
```

### Authentication

All API endpoints (except login) require authentication via JWT token in the Authorization header:
```
Authorization: Bearer <jwt_token>
```

### Core Endpoints

#### Authentication
- `POST /auth/login` - User login
- `POST /auth/register` - Register new user (Super Admin only)
- `GET /auth/profile` - Get current user profile
- `PUT /auth/change-pin` - Change user PIN
- `POST /auth/logout` - User logout

#### Students
- `GET /students` - Get all students (with pagination and filters)
- `GET /students/:id` - Get student by ID
- `POST /students` - Create new student
- `PUT /students/:id` - Update student
- `DELETE /students/:id` - Delete student
- `GET /students/stats/overview` - Get student statistics

#### Fee Management
- `GET /fees` - Get all fee payments
- `POST /fees` - Record fee payment
- `GET /fees/stats/overview` - Get fee statistics

#### Staff Management
- `GET /staff` - Get all staff members
- `POST /staff` - Create new staff member
- `PUT /staff/:id` - Update staff member
- `DELETE /staff/:id` - Delete staff member

### Request/Response Format

#### Success Response
```json
{
  "success": true,
  "message": "Operation successful",
  "data": { ... },
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 100,
    "pages": 10
  }
}
```

#### Error Response
```json
{
  "success": false,
  "message": "Error message",
  "error": "Detailed error information"
}
```

### Query Parameters

Most GET endpoints support the following query parameters:

- `page` - Page number (default: 1)
- `limit` - Items per page (default: 10, max: 100)
- `search` - Search term
- `status` - Filter by status (active/inactive)
- `sortBy` - Sort field
- `sortOrder` - Sort order (asc/desc)
- `startDate` - Filter from date
- `endDate` - Filter to date

## 🔐 Security Features

### Authentication & Authorization
- JWT-based authentication
- Role-based access control (RBAC)
- Permission-based module access
- PIN-based login system
- Secure password hashing with bcrypt

### Security Middleware
- Helmet.js for security headers
- CORS configuration
- Rate limiting
- Input validation and sanitization
- SQL injection prevention
- XSS protection

### Data Security
- Branch-level data isolation
- Audit logging for all operations
- Sensitive data encryption
- Secure file upload handling

## 🏗️ Database Schema

### User Roles
- **Super Admin** - Full system access, can manage branches
- **Branch Admin** - Full access to their branch
- **Accountant** - Financial operations access
- **Teacher** - Academic operations access
- **Staff** - Limited access based on permissions

### Key Collections
- `users` - System users with roles and permissions
- `branches` - School branches (for multi-branch support)
- `students` - Student records
- `staff` - Staff/employee records
- `classes` - Academic classes
- `divisions` - Class divisions/sections
- `departments` - Academic/administrative departments
- `feepayments` - Fee collection records
- `payrollentries` - Salary payment records
- `expenses` - Institutional expenses
- `textbooks` - Textbook inventory
- `activitylogs` - System audit logs

## 🚀 Deployment

### Environment Variables for Production
```env
NODE_ENV=production
PORT=5000
MONGODB_URI=mongodb://your-production-db-url
JWT_SECRET=your-production-jwt-secret
FRONTEND_URL=https://your-frontend-domain.com
```

### Docker Deployment
```dockerfile
# Dockerfile example
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY dist ./dist
EXPOSE 5000
CMD ["npm", "start"]
```

### PM2 Process Manager
```bash
# Install PM2
npm install -g pm2

# Start application
pm2 start dist/server.js --name "d4mediacampus-api"

# Save PM2 configuration
pm2 save
pm2 startup
```

## 📊 Monitoring & Logging

### Health Check
```
GET /health
```

Returns server status, uptime, and environment information.

### Activity Logging
All user actions are automatically logged with:
- User information
- Action performed
- Module accessed
- Timestamp
- IP address
- Branch context

### Error Logging
- Centralized error handling
- Detailed error logging
- Environment-specific error responses

## 🧪 Testing

### Running Tests
```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

### Test Structure
```
tests/
├── unit/           # Unit tests
├── integration/    # Integration tests
└── fixtures/       # Test data
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Code Style
- Follow TypeScript best practices
- Use ESLint configuration
- Write meaningful commit messages
- Add tests for new features
- Update documentation

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

For support and questions:
- Create an issue in the repository
- Contact the development team
- Check the documentation

## 🔄 Version History

### v1.0.0 (Current)
- Initial release
- Core modules implementation
- Authentication and authorization
- Student and staff management
- Fee and payroll management
- Basic reporting

### Planned Features
- Advanced reporting and analytics
- SMS and email notifications
- File upload and document management
- Advanced search and filtering
- Mobile app API support
- Integration with external systems

---

**Built with ❤️ for d4mediaCampus**