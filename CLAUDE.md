# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

"8-Bit Habits" (原 Pixel Quest) is a gamified habit-tracking app with a retro pixel aesthetic. The app combines habit formation with survival game mechanics, featuring group challenges, automatic elimination for missed check-ins, and a pixel-art visual style.

## Architecture

This is a full-stack application split into two main directories:

### Backend (`challenge-app-backend/`)
- **Framework**: Node.js + Express
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: Google OAuth + JWT
- **Key Features**: REST API, automated elimination scheduling, email notifications

### Frontend (`challenge-app-frontend/`)  
- **Framework**: React Native (Expo)
- **Platform**: Cross-platform mobile app (iOS/Android/Web)
- **Authentication**: Google OAuth integration via Expo Auth Session
- **UI Style**: Pixel/retro gaming aesthetic

## Common Development Commands

### Backend Development
```bash
cd challenge-app-backend
npm start                    # Start the backend server
npm run lint                 # Run ESLint (if configured)
npm run format              # Run Prettier formatting
npx prisma generate         # Generate Prisma client after schema changes
npx prisma migrate dev      # Run database migrations
npx prisma studio          # Open Prisma Studio for database inspection
```

### Frontend Development  
```bash
cd challenge-app-frontend
npm start                   # Start Expo development server
npm run android            # Start on Android device/emulator
npm run ios                # Start on iOS device/simulator  
npm run web                # Start web version
npm run lint               # Run ESLint
npm run format             # Run Prettier formatting
```

## Key Architectural Concepts

### Data Model Design
The app uses gaming terminology consistently:
- **Players** (not Users) - App users with pixel avatars
- **Levels** (not Groups) - Challenge instances with custom rules
- **LevelMembers** - Player participation in levels with roles (creator/player/audience)
- **CheckIns** - Daily habit reports with multiple types (text/image/checkmark)

### Authentication Flow
1. Google OAuth via Expo Auth Session (frontend)
2. Token validation and JWT generation (backend `/api/auth/google`)
3. Persistent login state via JWT storage

### Core Game Mechanics
- **Daily Check-ins**: Time-restricted habit reporting within level-defined windows
- **Automatic Elimination**: Scheduled job eliminates players exceeding missed day limits
- **Privacy Settings**: Configurable visibility for check-in content (public/private/creator-only)
- **Role System**: Creator/Player/Audience roles with different permissions

### Scheduled Jobs
The backend implements daily scheduling logic (`node-cron`) for:
- Evaluating missed check-ins
- Automatic player elimination
- Achievement badge distribution
- Email notification dispatch

### Image Processing Pipeline
- Players upload clear images locally
- Backend stores compressed, pixelated versions for consistent visual style
- Server-side image processing maintains the retro aesthetic

## Development Notes

### Database Migrations
Always run `npx prisma migrate dev` after schema changes. The current schema is minimal but designed to be extensible for the features outlined in SPEC.md.

### Environment Variables
Both frontend and backend require proper `.env` configuration for:
- Database connections (PostgreSQL)
- Google OAuth credentials (separate for each platform)
- JWT secrets
- Email service configuration (future)

### Internationalization
The app supports Traditional Chinese and English. All user-facing text should be properly internationalized from the start.

### API Design Patterns
Follow RESTful conventions with gaming terminology:
- `/api/levels` for challenge management
- `/api/levels/:id/checkin` for habit reporting
- `/api/auth/google` for authentication

The API should respect role-based permissions and privacy settings when returning data.

## Testing Strategy

Currently no test suite is configured. When implementing tests:
- Backend: Focus on API endpoints, authentication, and scheduling logic
- Frontend: Component testing for critical user flows (login, check-in, level management)
- Integration: End-to-end testing of the complete check-in and elimination workflows