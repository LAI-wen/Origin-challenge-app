# 8-Bit Habits 

A gamified habit-tracking app with retro pixel aesthetics that transforms habit building into an exciting survival challenge.

## 🎮 Project Overview

"8-Bit Habits" combines habit formation with survival game mechanics, featuring group challenges, automatic elimination for missed check-ins, and a nostalgic pixel-art visual style.

## ✅ Development Status

**Phase 1 Complete** - Core Authentication & Internationalization
- ✅ **Backend Infrastructure**: Node.js + Express + PostgreSQL + Prisma
- ✅ **Frontend Setup**: React Native (Expo) with cross-platform support
- ✅ **Google OAuth**: Complete authentication system with @react-native-google-signin
- ✅ **Multi-language**: i18n support (Traditional Chinese / English)
- ✅ **Database**: User management with automatic profile creation
- ✅ **Development Tools**: ESLint, Prettier, Prisma Studio

## 🏗️ Architecture

This is a monorepo containing both frontend and backend:

### Backend (`challenge-app-backend/`)
- **Runtime**: Node.js + Express
- **Database**: PostgreSQL with Prisma ORM  
- **Authentication**: Google OAuth 2.0 + JWT tokens
- **Features**: Dual token support (ID token + Access token)

### Frontend (`challenge-app-frontend/`)
- **Framework**: React Native (Expo)
- **Platforms**: Android (primary), Web (development)
- **Authentication**: @react-native-google-signin/google-signin
- **Internationalization**: react-i18next with automatic language detection

## 🚀 Installation & Setup

### Prerequisites
- **Node.js** (v18 or higher) - [Download](https://nodejs.org/)
- **Docker** (for PostgreSQL database) - [Download](https://www.docker.com/)
- **Android Studio** (for Android emulator) - [Download](https://developer.android.com/studio)
- **Google Cloud Console** OAuth credentials - [Setup Guide](./OAUTH_SETUP.md)

### Step 1: Clone and Setup Project
```bash
# Clone the repository
git clone <repository-url>
cd Origin-challenge-app

# Install dependencies for both frontend and backend
cd challenge-app-backend && npm install && cd ..
cd challenge-app-frontend && npm install && cd ..
```

### Step 2: Configure Environment Variables
Create `.env` files in both directories:

**Backend Environment (`challenge-app-backend/.env`):**
```bash
DATABASE_URL="postgresql://challengeapp:challengeapp_password@localhost:5432/challengeapp"
GOOGLE_CLIENT_ID="your-web-client-id-from-google-cloud-console"
JWT_SECRET="your-secure-random-jwt-secret"
PORT=3000
```

**Frontend Environment (`challenge-app-frontend/.env`):**
```bash
# For Android emulator (uses 10.0.2.2 to access host)
EXPO_PUBLIC_API_URL=http://10.0.2.2:3000

# For physical device or web (use your computer's IP)
# EXPO_PUBLIC_API_URL=http://192.168.1.100:3000
```

### Step 3: Start Database
```bash
# Start PostgreSQL container
docker run --name challenge-app-postgres \
  -e POSTGRES_PASSWORD=challengeapp_password \
  -e POSTGRES_DB=challengeapp \
  -e POSTGRES_USER=challengeapp \
  -p 5432:5432 -d postgres:15

# Verify database is running
docker ps | grep challenge-app-postgres
```

### Step 4: Initialize Backend
```bash
cd challenge-app-backend

# Generate Prisma client and run migrations
npx prisma generate
npx prisma migrate deploy

# Start backend server
npm start
# ✅ Server should start on http://localhost:3000

# Optional: Start database management UI (in new terminal)
npx prisma studio
# ✅ Prisma Studio opens at http://localhost:5556
```

### Step 5: Start Frontend

#### For Android Development:
```bash
cd challenge-app-frontend

# Start Android emulator first (or connect physical device)
# Then run the app
npx expo run:android

# ✅ App builds and installs on Android device/emulator
```

#### For Web Development:
```bash
cd challenge-app-frontend

# Start web version
npx expo start --web

# ✅ App opens in browser at http://localhost:8081
```

### Step 6: Test Authentication Flow

1. **Verify Services Running:**
   - ✅ Backend: http://localhost:3000 (should show API status)
   - ✅ Database: PostgreSQL container running
   - ✅ Frontend: Android app or web browser

2. **Test Google Login:**
   - Click "Sign in with Google" button
   - Complete OAuth flow in browser/Google app
   - Verify successful login and user welcome screen
   - Test logout functionality

3. **Verify Database Records:**
   - Open Prisma Studio: http://localhost:5556
   - Check `User` table for new user records
   - Verify Google profile data is correctly stored

### 🔧 Development Commands

**Backend:**
```bash
cd challenge-app-backend
npm start              # Start development server
npm run lint          # Run ESLint
npm run format        # Run Prettier
npx prisma studio     # Database management UI
npx prisma migrate dev # Create new migration
```

**Frontend:**
```bash
cd challenge-app-frontend
npx expo start         # Start Expo dev server
npx expo start --web   # Start web version
npx expo run:android   # Build and run on Android
npm run lint          # Run ESLint
npm run format        # Run Prettier
```

### 🐛 Troubleshooting

**Common Issues:**
- **Port conflicts:** Kill processes on ports 3000, 5556, 8081
- **Database connection:** Ensure Docker container is running
- **Android build errors:** Clear Metro cache: `npx expo start --clear`
- **Google OAuth errors:** Check [OAUTH_TROUBLESHOOTING.md](./OAUTH_TROUBLESHOOTING.md)

**Development Tips:**
- Use `docker-compose up` for easier database management
- Enable hot reload for faster development
- Check console logs for authentication debugging
- Use Prisma Studio to monitor database changes in real-time

## 🎯 Current Features (Phase 1)

### ✅ Authentication System
- **Google OAuth 2.0** integration with official @react-native-google-signin
- **Automatic user creation** with profile data from Google
- **JWT token management** with secure local storage
- **Cross-platform support** (Android native, Web fallback)

### ✅ Multi-language Support
- **Internationalization** with react-i18next
- **Language switching** between Traditional Chinese and English
- **Automatic language detection** based on system locale

### ✅ Database Management
- **PostgreSQL** database with Docker containerization
- **Prisma ORM** with type-safe database operations
- **User profile management** with Google integration
- **Prisma Studio** for database administration

### 🔄 Planned Features (Future Phases)
- Challenge Levels with custom rules and invite codes
- Daily Check-ins with text, image, or checkmark options
- Automatic elimination for missed check-ins
- Role-based system (Creator/Player/Audience)
- Privacy controls for check-in content visibility
- Web admin panel for level creators

## 🔧 Development

### Documentation
- **[DEVELOPMENT_GUIDE.md](./DEVELOPMENT_GUIDE.md)** - Complete development & testing guide
- **[OAUTH_TROUBLESHOOTING.md](./OAUTH_TROUBLESHOOTING.md)** - Google OAuth troubleshooting
- **[CLAUDE.md](./CLAUDE.md)** - Development guidance for Claude Code
- **[SPEC.md](./SPEC.md)** - Detailed product specification

### Code Quality
- **ESLint + Prettier** configured for both frontend and backend
- **TypeScript** for frontend type safety
- **Prisma** for type-safe database operations

## 🔐 Security & Configuration

### Environment Variables
```bash
# Backend (.env)
DATABASE_URL="postgresql://challengeapp:challengeapp_password@localhost:5432/challengeapp"
GOOGLE_CLIENT_ID="your-google-client-id"
JWT_SECRET="your-jwt-secret"
PORT=3000

# Frontend (.env)
EXPO_PUBLIC_API_URL=http://10.0.2.2:3000
```

### Security Best Practices
- ✅ Google OAuth client secrets never committed to repository
- ✅ Sensitive configuration in environment variables
- ✅ JWT tokens stored securely (SecureStore on native, localStorage on web)
- ✅ Google OAuth audience validation on backend