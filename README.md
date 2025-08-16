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

## 🚀 Quick Start

### Prerequisites
- Node.js (v18+)
- Docker (for PostgreSQL)
- Android Studio (for emulator)
- Google Cloud Console OAuth credentials

### 1. Setup Database
```bash
# Start PostgreSQL container
docker run --name challenge-app-postgres \
  -e POSTGRES_PASSWORD=challengeapp_password \
  -e POSTGRES_DB=challengeapp \
  -e POSTGRES_USER=challengeapp \
  -p 5432:5432 -d postgres:15
```

### 2. Setup Backend
```bash
cd challenge-app-backend
npm install
npx prisma migrate deploy
npx prisma generate
npm start  # Server runs on http://localhost:3000

# Optional: Database management UI
npx prisma studio  # Opens http://localhost:5556
```

### 3. Setup Frontend
```bash
cd challenge-app-frontend
npm install

# For Android testing
npx expo run:android

# For web development
npx expo start --web
```

### 4. Test Google Authentication
1. Start both backend and frontend services
2. Open Android emulator
3. Click "Sign in with Google" button
4. Complete OAuth flow
5. Check Prisma Studio for user record creation

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