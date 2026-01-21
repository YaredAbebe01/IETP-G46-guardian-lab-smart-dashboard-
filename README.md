# Guardian Lab Monitoring System

Full-stack IoT monitoring system with Next.js frontend, Node.js backend, MongoDB database, and Arduino hardware integration.

## Features

### Frontend (Next.js 15)

### Backend (Node.js + Express)

### Hardware (Arduino)

## Installation

### Prerequisites
- Node.js (v18 or higher)
- npm or yarn
- MongoDB Atlas account (provided)
- Arduino + sensors (optional - demo mode available)
- Chrome/Edge browser (for WebSerial)

### 1. Backend Setup

```bash
# Navigate to backend directory
cd backend

# Install dependencies
npm install

# Start backend server
pnpm run dev
```

Backend will run on `http://localhost:5000`

### 2. Frontend Setup

```bash
# Return to project root
cd ..

# Install dependencies
pnpm install


# Start frontend development server
pnpm run dev
```

Frontend will run on `http://localhost:3000`

##  Quick Start Guide

### Option 1: Demo Mode (No Hardware Required)

1. Start backend server: `cd backend && npm run dev`
2. Start frontend: `npm run dev` (from project root)
3. Open browser: `http://localhost:3000`
4. Click **"Register"** and create an account
5. Select role: **Admin** (for full access)
6. Login with your credentials
7. Click **"Demo Mode"** button on dashboard
8. Watch real-time simulated sensor data!

### Option 2: Real Arduino Hardware

1. Follow setup in `ARDUINO_SETUP.md`
2. Upload Arduino code to your board
3. Start backend and frontend servers
4. Register/Login to the dashboard
5. Click **"Connect Device"** button
6. Select Arduino port from browser popup
7. Real sensor data streams automatically!


## Development

### Frontend Development
```bash
npm run dev          # Start dev server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
```

### Backend Development
```bash
cd backend
npm run dev          # Start with nodemon (auto-reload)
npm start            # Start production server
```

##  Browser Support

- Chrome 89+ (WebSerial API)
- Edge 89+ (WebSerial API)
- Safari/Firefox: Demo mode only (no WebSerial)



### Hardware
- Arduino Uno/Nano
- MQ-2 Gas Sensor
- DHT22 Temp/Humidity Sensor
- LED (Fan indicator)
- Buzzer (Alarm)

## Additional Documentation

- [Backend API Docs](./backend/README.md) - Detailed API documentation



## License

MIT License - Feel free to use this project for learning and development.

---

**Built with 
for IoT monitoring and laboratory safety**

🌟 **Star this repo if you find it helpful!**
