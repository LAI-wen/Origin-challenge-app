# 8-Bit Habits 

A gamified habit-tracking app with retro pixel aesthetics that transforms habit building into an exciting survival challenge.

## 🎮 Project Overview

"8-Bit Habits" combines habit formation with survival game mechanics, featuring group challenges, automatic elimination for missed check-ins, and a nostalgic pixel-art visual style.

## 🏗️ Architecture

This is a monorepo containing both frontend and backend:

### Backend (`challenge-app-backend/`)
- Node.js + Express
- PostgreSQL with Prisma ORM  
- Google OAuth + JWT authentication
- Automated scheduling and notifications

### Frontend (`challenge-app-frontend/`)
- React Native (Expo)
- Cross-platform (iOS/Android/Web)
- Pixel art UI with gaming aesthetics
- Google OAuth integration

## 🚀 Quick Start

### Prerequisites
- Node.js (v18+)
- PostgreSQL
- Google OAuth credentials

### Setup Backend
```bash
cd challenge-app-backend
npm install
npx prisma migrate dev
npm start
```

### Setup Frontend  
```bash
cd challenge-app-frontend
npm install
npm start
```

## 📋 Features

- **Google OAuth Login** with pixel avatar creation
- **Challenge Levels** with custom rules and invite codes  
- **Daily Check-ins** with text, image, or simple checkmark options
- **Automatic Elimination** for missed check-ins
- **Role-based System** (Creator/Player/Audience)
- **Privacy Controls** for check-in content visibility
- **Multi-language Support** (Traditional Chinese & English)
- **Web Admin Panel** for level creators

## 🔧 Development

See [CLAUDE.md](./CLAUDE.md) for detailed development guidance and architectural notes.

## 📖 Documentation

- [SPEC.md](./SPEC.md) - Detailed product specification
- [CLAUDE.md](./CLAUDE.md) - Development guidance for Claude Code

## 🔐 Security Notes

- Never commit Google OAuth client secrets
- Store sensitive data in `secrets/` directory (git-ignored)
- Use environment variables for all configuration