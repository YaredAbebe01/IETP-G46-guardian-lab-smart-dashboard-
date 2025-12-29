# Guardian Lab Monitoring - Backend API

Backend API for Smart Environment Monitoring System with role-based authentication.

## Quick Start

### 1. Install Dependencies
```bash
cd backend
pnpm install
```

### 2. Environment Setup


### 3. Start Server
```bash
# Development mode with auto-reload
npm run dev

# Production mode
npm start
```

Server will start on `http://localhost:5000`

##  Notes

- Default role for new users: `viewer`
- MongoDB connection includes retry logic
- All passwords are hashed before storage
- Settings are auto-created on user registration
