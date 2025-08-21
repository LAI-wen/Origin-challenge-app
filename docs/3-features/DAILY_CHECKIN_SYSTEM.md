# Daily Check-in System

## Overview
The daily check-in system is the core mechanic that drives user engagement in the escape room challenge. Users must complete daily check-ins for 30 consecutive days to escape from their locked room.

## Features

### Check-in Types
The system supports three different types of daily check-ins:

1. **TEXT** - Journal/diary entries
   - Users write text content for reflection or progress notes
   - Minimum content validation to ensure meaningful entries
   - Supports emoji and multi-language content

2. **IMAGE** - Photo submissions
   - Camera integration using `expo-image-picker`
   - Gallery photo selection support
   - Base64 encoding for secure transmission
   - Image compression for optimal storage

3. **CHECKMARK** - Simple confirmation
   - Quick one-tap check-in for busy users
   - No additional content required
   - Instant feedback and confirmation

### Time Window Validation
- Check-ins must be submitted within specified time windows
- Configurable start and end times per room
- Timezone-aware validation
- Prevents late or early submissions

### Cross-room State Isolation
Each room maintains completely separate check-in state:
- Room-specific check-in history
- Independent progress tracking
- No interference between different rooms
- Proper database isolation using `levelId` parameters

## Technical Architecture

### Frontend Components

#### CheckinScreen.tsx
```typescript
interface CheckinScreenProps {
  levelId: string;
  levelName: string;
  onNavigateBack: () => void;
}
```

Main check-in interface featuring:
- Type selection (TEXT/IMAGE/CHECKMARK)
- Content input forms
- Image picker integration
- Submission handling and validation
- Success/error feedback

#### checkin.service.ts
```typescript
interface CheckinRequest {
  type: 'TEXT' | 'IMAGE' | 'CHECKMARK';
  content?: string;
  image?: string; // base64 encoded
}

interface CheckinResponse {
  success: boolean;
  checkinId: string;
  escapeProgress: {
    current: number;
    target: number;
    isEscaped: boolean;
  };
}
```

### Backend API Endpoints

#### POST /api/checkin/:levelId
Submit a daily check-in for a specific room.

**Request Body:**
```json
{
  "type": "TEXT|IMAGE|CHECKMARK",
  "content": "optional text content",
  "image": "optional base64 image data"
}
```

**Response:**
```json
{
  "success": true,
  "checkinId": "uuid",
  "escapeProgress": {
    "current": 15,
    "target": 30,
    "isEscaped": false
  },
  "timeWindow": {
    "start": "09:00",
    "end": "23:59"
  }
}
```

#### GET /api/checkin/:levelId/today
Check today's check-in status for a room.

**Response:**
```json
{
  "hasCheckedIn": false,
  "levelName": "My Escape Room",
  "timeWindow": {
    "start": "09:00", 
    "end": "23:59"
  },
  "escapeProgress": {
    "current": 14,
    "target": 30
  }
}
```

#### GET /api/checkin/:levelId/history
Retrieve check-in history for a room.

#### GET /api/checkin/:levelId/escape-status  
Get detailed escape progress and status.

### Database Schema

#### CheckIn Table
```sql
CREATE TABLE "CheckIn" (
  "id" TEXT PRIMARY KEY,
  "type" TEXT NOT NULL, -- 'TEXT', 'IMAGE', 'CHECKMARK'
  "content" TEXT,
  "imageData" TEXT, -- base64 encoded image
  "createdAt" TIMESTAMP DEFAULT now(),
  "levelMemberId" TEXT REFERENCES "LevelMember"("id")
);
```

#### RoomState JSON Structure
```json
{
  "escapeCondition": {
    "type": "CONSECUTIVE_DAYS",
    "target": 30,
    "current": 15,
    "lastCheckinDate": "2025-08-20",
    "streak": 15
  },
  "timeWindow": {
    "start": "09:00",
    "end": "23:59"
  }
}
```

## Role-based Access Control

### PLAYER Role
- Can check into rooms they've joined
- Cannot modify room settings
- Can view their own check-in history

### CREATOR Role  
- Can check into rooms they created
- Can delete their own rooms
- Can modify room settings
- Can view all member progress

### OWNER Role
- Same as CREATOR
- Cannot be removed from room
- Has ultimate control over room

## Mobile Optimization

### Android Support
- Native camera integration
- Photo gallery access
- Touch-optimized interface
- Proper keyboard handling

### Image Handling
- Automatic image compression
- Base64 encoding for transmission
- Error handling for large files
- Permission management for camera/gallery

## Error Handling

### Client-side Validation
- Type selection validation
- Content requirements checking
- Image size limitations
- Network connectivity checks

### Server-side Validation
- Authentication verification
- Room membership validation
- Time window enforcement
- Data sanitization

### Common Error Scenarios
1. **Already checked in today** - 409 Conflict
2. **Outside time window** - 400 Bad Request
3. **Invalid room access** - 403 Forbidden
4. **Missing required content** - 400 Bad Request
5. **Network timeout** - 408 Request Timeout

## Performance Considerations

### Database Optimization
- Indexed queries on `levelMemberId` and `createdAt`
- Efficient date range queries for history
- Connection pooling for concurrent users

### Image Storage
- Base64 encoding for simplicity
- Future: Consider cloud storage migration
- Compression to reduce payload size
- Caching strategies for repeated access

### Real-time Updates
- Immediate UI feedback on submission
- Progress counter updates
- Room state synchronization
- Offline capability planning

## Testing Strategy

### Unit Tests
- Service layer validation
- Component behavior testing
- API response handling
- Error scenario coverage

### Integration Tests  
- End-to-end check-in flow
- Cross-room isolation verification
- Role permission testing
- Time window validation

### Manual Testing Checklist
- [ ] All three check-in types work correctly
- [ ] Image picker functions on Android
- [ ] Time window validation prevents invalid submissions
- [ ] Cross-room state remains isolated
- [ ] Creator can check into own rooms
- [ ] Progress tracking updates correctly
- [ ] Error messages are user-friendly
- [ ] Offline/network error handling

## Future Enhancements

### Planned Features
1. **Check-in Streaks** - Visual indicators for consecutive days
2. **Rich Media** - Video check-ins and voice notes  
3. **Templates** - Pre-defined check-in prompts
4. **Analytics** - Check-in patterns and insights
5. **Notifications** - Reminders for missed check-ins
6. **Badges** - Achievement system for milestones

### Technical Improvements
1. **Cloud Storage** - Move images to AWS S3 or similar
2. **Push Notifications** - Daily check-in reminders
3. **Offline Support** - Queue check-ins when offline
4. **Real-time Sync** - WebSocket updates for multi-device
5. **Performance** - Lazy loading and pagination for history