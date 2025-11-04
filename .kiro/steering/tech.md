# Technology Stack

## Backend (API)

**Framework & Runtime**
- Node.js (v18.0.0+) with Express.js
- TypeScript for type safety
- MongoDB with Mongoose ODM

**Key Dependencies**
- `express` - Web framework
- `mongoose` - MongoDB object modeling
- `jsonwebtoken` - JWT authentication
- `bcryptjs` - Password hashing
- `joi` - Input validation
- `multer` - File upload handling
- `helmet` - Security headers
- `cors` - Cross-origin resource sharing
- `express-rate-limit` - API rate limiting
- `morgan` - HTTP request logging

**Development Tools**
- `nodemon` - Development server with hot reload
- `ts-node` - TypeScript execution
- `eslint` - Code linting
- `jest` - Testing framework

## Frontend

**Framework & Build Tool**
- React 18 with TypeScript
- Vite for build tooling and development server
- React Router for navigation

**UI & Styling**
- shadcn/ui component library
- Radix UI primitives
- Tailwind CSS for styling
- Lucide React for icons

**State Management & Data Fetching**
- TanStack React Query for server state
- React Hook Form for form management
- Axios for HTTP requests
- Zod for schema validation

**Development Tools**
- ESLint for code linting
- Playwright for end-to-end testing
- TypeScript for type safety

## Common Commands

### Backend Development
```bash
# Development server with hot reload
npm run dev

# Build TypeScript to JavaScript
npm run build

# Start production server
npm start

# Run tests
npm test

# Lint code
npm run lint

# Seed database with initial data
npm run seed
```

### Frontend Development
```bash
# Development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Lint code
npm run lint
```

## Environment Configuration

### Backend (.env)
```env
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/d4mediacampus
JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRES_IN=7d
FRONTEND_URL=http://localhost:8080
```

### Frontend (.env)
```env
VITE_API_URL=http://localhost:5000/api
```

## Development Workflow

1. **Backend**: Run `npm run dev` on port 5000
2. **Frontend**: Run `npm run dev` on port 3000 (proxies to backend)
3. **Database**: MongoDB running on port 27017
4. **API Testing**: Use `/health` endpoint for connectivity checks

## Build & Deployment

- **Backend**: TypeScript compiles to `dist/` directory
- **Frontend**: Vite builds to `dist/` directory
- **Production**: Use `npm start` for backend, serve frontend static files
- **Docker**: Both services can be containerized