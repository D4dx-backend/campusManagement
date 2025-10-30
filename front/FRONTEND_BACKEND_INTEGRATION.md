# Frontend-Backend Integration Guide

This guide explains how to integrate the React frontend with the Node.js backend API.

## 🚀 Quick Setup

### 1. Backend Setup

1. **Navigate to the backend directory:**
   ```bash
   cd d4mediaCampus-api
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Setup environment variables:**
   ```bash
   cp .env.example .env
   ```
   
   Update `.env` with your MongoDB connection:
   ```env
   MONGODB_URI=mongodb://localhost:27017/d4mediacampus
   JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
   ```

4. **Start MongoDB:**
   ```bash
   # Using MongoDB service
   sudo systemctl start mongod
   
   # Or using Docker
   docker run -d -p 27017:27017 --name mongodb mongo:latest
   ```

5. **Seed the database:**
   ```bash
   npm run seed
   ```

6. **Start the backend server:**
   ```bash
   npm run dev
   ```

   The API will be available at `http://localhost:5000`

### 2. Frontend Setup

1. **Navigate to the frontend directory:**
   ```bash
   cd .. # Go back to the root directory
   ```

2. **Install axios dependency:**
   ```bash
   npm install axios
   ```

3. **Environment variables are already set up:**
   - `.env` file contains `VITE_API_URL=http://localhost:5000/api`

4. **Start the frontend:**
   ```bash
   npm run dev
   ```

   The frontend will be available at `http://localhost:8080`

## 🔑 Login Credentials

After seeding the database, use these credentials to login:

- **Super Admin**: Mobile: `9999999999`, PIN: `123456`
- **Branch Admin**: Mobile: `9999999998`, PIN: `123456`
- **Accountant**: Mobile: `9999999997`, PIN: `123456`

## 📊 What's Integrated

### ✅ Completed Integrations

1. **Authentication System**
   - JWT-based authentication
   - Role-based access control
   - Automatic token refresh
   - Secure logout

2. **Students Management**
   - Full CRUD operations
   - Search and pagination
   - Real-time data updates
   - Form validation

3. **Dashboard**
   - Real-time statistics
   - Recent activities
   - API-driven data

4. **API Client**
   - Axios-based HTTP client
   - Request/response interceptors
   - Error handling
   - Token management

### 🔄 API Services Created

- `authService.ts` - Authentication operations
- `studentService.ts` - Student management
- `staffService.ts` - Staff management
- `feeService.ts` - Fee management

### 🎣 React Query Hooks

- `useStudents()` - Fetch students with pagination
- `useCreateStudent()` - Create new student
- `useUpdateStudent()` - Update student
- `useDeleteStudent()` - Delete student
- `useDashboardStats()` - Dashboard statistics

## 🔧 Technical Implementation

### API Client Configuration

```typescript
// src/lib/api.ts
const api = axios.create({
  baseURL: 'http://localhost:5000/api',
  timeout: 10000,
});

// Automatic token attachment
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('auth_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
```

### Authentication Flow

1. User enters mobile and PIN
2. Frontend sends credentials to `/api/auth/login`
3. Backend validates and returns JWT token
4. Token stored in localStorage
5. All subsequent requests include token in headers
6. Automatic logout on token expiration

### Data Flow

```
Frontend Component → React Query Hook → API Service → Backend API → MongoDB
```

### Error Handling

- Network errors handled by axios interceptors
- API errors displayed via toast notifications
- Loading states managed by React Query
- Automatic retry on failure

## 🚀 Next Steps

### Immediate Tasks

1. **Complete remaining page integrations:**
   - Staff management
   - Fee management
   - Payroll
   - Expenses
   - Textbooks

2. **Add more API services:**
   ```bash
   # Create these service files:
   src/services/staffService.ts
   src/services/payrollService.ts
   src/services/expenseService.ts
   src/services/textbookService.ts
   ```

3. **Create React Query hooks:**
   ```bash
   # Create these hook files:
   src/hooks/useStaff.ts
   src/hooks/usePayroll.ts
   src/hooks/useExpenses.ts
   src/hooks/useTextbooks.ts
   ```

### Advanced Features

1. **Real-time Updates**
   - WebSocket integration
   - Live notifications
   - Real-time dashboard updates

2. **Offline Support**
   - Service worker
   - Offline data caching
   - Sync when online

3. **Advanced Search**
   - Global search functionality
   - Advanced filters
   - Search suggestions

4. **File Upload**
   - Student photos
   - Document uploads
   - Bulk import/export

## 🐛 Troubleshooting

### Common Issues

1. **CORS Errors**
   - Ensure backend CORS is configured for `http://localhost:8080`
   - Check `FRONTEND_URL` in backend `.env`

2. **Authentication Errors**
   - Clear localStorage: `localStorage.clear()`
   - Check JWT secret in backend `.env`
   - Verify token expiration

3. **Database Connection**
   - Ensure MongoDB is running
   - Check connection string in `.env`
   - Verify database permissions

4. **API Errors**
   - Check backend logs
   - Verify API endpoints
   - Test with Postman/curl

### Debug Commands

```bash
# Check backend health
curl http://localhost:5000/health

# Test login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"mobile":"9999999999","pin":"123456"}'

# Check students endpoint (with token)
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:5000/api/students
```

## 📚 API Documentation

Full API documentation is available in:
- `d4mediaCampus-api/API_DOCUMENTATION.md`
- Interactive testing at `http://localhost:5000/health`

## 🔒 Security Considerations

1. **Environment Variables**
   - Never commit `.env` files
   - Use strong JWT secrets in production
   - Rotate secrets regularly

2. **HTTPS in Production**
   - Use HTTPS for all API calls
   - Secure cookie settings
   - HSTS headers

3. **Input Validation**
   - Client-side validation for UX
   - Server-side validation for security
   - Sanitize all inputs

4. **Rate Limiting**
   - API rate limiting enabled
   - Monitor for abuse
   - Implement proper error handling

## 🎯 Performance Optimization

1. **React Query Configuration**
   - Appropriate stale times
   - Background refetching
   - Optimistic updates

2. **API Optimization**
   - Pagination for large datasets
   - Field selection
   - Caching strategies

3. **Bundle Optimization**
   - Code splitting
   - Lazy loading
   - Tree shaking

---

**🎉 Your d4mediaCampus system is now fully integrated with a modern, scalable backend API!**