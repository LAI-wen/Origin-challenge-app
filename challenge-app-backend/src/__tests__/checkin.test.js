// src/__tests__/checkin.test.js
const request = require('supertest');
const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');

// Mock prisma before importing controllers
jest.mock('../models/prisma', () => ({
  player: {
    findUnique: jest.fn(),
  },
  levelMember: {
    findFirst: jest.fn(),
    update: jest.fn(),
  },
  checkIn: {
    create: jest.fn(),
    findFirst: jest.fn(),
    findMany: jest.fn(),
    count: jest.fn(),
  },
}));

const prisma = require('../models/prisma');
const levelsRoutes = require('../routes/levels.route');

// Create test app
const createTestApp = () => {
  const app = express();
  app.use(cors());
  app.use(express.json());
  app.use('/api/levels', levelsRoutes);
  return app;
};

describe('CheckIn API', () => {
  let app;
  let validToken;
  const mockUser = {
    id: 'test-user-id',
    email: 'test@example.com',
    name: 'Test User'
  };

  beforeEach(() => {
    app = createTestApp();
    validToken = jwt.sign(mockUser, process.env.JWT_SECRET || 'your-default-secret-change-this');
    jest.clearAllMocks();
    
    // Mock the user lookup for authentication middleware
    prisma.player.findUnique.mockResolvedValue(mockUser);
  });

  describe('POST /api/levels/:id/checkins', () => {
    const mockLevelMember = {
      id: 'member-id',
      playerId: 'test-user-id',
      levelId: 'test-level-id',
      role: 'PLAYER',
      status: 'ACTIVE',
      missedDays: 1,
      level: {
        id: 'test-level-id',
        name: 'Test Level',
        rule: {
          startTime: '06:00',
          endTime: '22:00',
          maxMissedDays: 3
        },
        isActive: true
      }
    };

    it('should return 401 when no authorization token is provided', async () => {
      const response = await request(app)
        .post('/api/levels/test-level-id/checkins')
        .send({ type: 'TEXT', content: 'Test checkin' });

      expect(response.status).toBe(401);
    });

    it('should return 400 when check-in type is invalid', async () => {
      const response = await request(app)
        .post('/api/levels/test-level-id/checkins')
        .set('Authorization', `Bearer ${validToken}`)
        .send({ type: 'INVALID', content: 'Test checkin' });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Invalid check-in type. Must be TEXT, IMAGE, or CHECKMARK');
    });

    it('should return 400 when TEXT type has no content', async () => {
      const response = await request(app)
        .post('/api/levels/test-level-id/checkins')
        .set('Authorization', `Bearer ${validToken}`)
        .send({ type: 'TEXT', content: '' });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Content is required for TEXT check-ins');
    });

    it('should return 400 when IMAGE type has no image data', async () => {
      const response = await request(app)
        .post('/api/levels/test-level-id/checkins')
        .set('Authorization', `Bearer ${validToken}`)
        .send({ type: 'IMAGE', imageData: '' });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Image data is required for IMAGE check-ins');
    });

    it('should return 403 when user is not a member of the level', async () => {
      prisma.levelMember.findFirst.mockResolvedValue(null);

      const response = await request(app)
        .post('/api/levels/test-level-id/checkins')
        .set('Authorization', `Bearer ${validToken}`)
        .send({ type: 'TEXT', content: 'Test checkin' });

      expect(response.status).toBe(403);
      expect(response.body.error).toBe('Access denied: You are not an active member of this level');
    });

    it('should return 400 when level is not active', async () => {
      const inactiveLevelMember = {
        ...mockLevelMember,
        level: { ...mockLevelMember.level, isActive: false }
      };
      prisma.levelMember.findFirst.mockResolvedValue(inactiveLevelMember);

      const response = await request(app)
        .post('/api/levels/test-level-id/checkins')
        .set('Authorization', `Bearer ${validToken}`)
        .send({ type: 'TEXT', content: 'Test checkin' });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Cannot check in to inactive level');
    });

    it('should return 409 when user already checked in today', async () => {
      // Mock time to be within allowed window
      const mockDate = new Date('2025-08-19T10:00:00Z');
      jest.spyOn(global, 'Date').mockImplementation(() => mockDate);
      Date.now = jest.fn(() => mockDate.getTime());
      
      const existingCheckin = {
        id: 'existing-checkin-id',
        type: 'TEXT',
        createdAt: mockDate
      };

      prisma.levelMember.findFirst.mockResolvedValue(mockLevelMember);
      prisma.checkIn.findFirst.mockResolvedValue(existingCheckin);

      const response = await request(app)
        .post('/api/levels/test-level-id/checkins')
        .set('Authorization', `Bearer ${validToken}`)
        .send({ type: 'TEXT', content: 'Test checkin' });

      expect(response.status).toBe(409);
      expect(response.body.error).toBe('You have already checked in today for this level');
      expect(response.body.existingCheckin).toBeDefined();
      
      // Restore Date mock
      jest.restoreAllMocks();
    });

    it('should successfully create TEXT check-in', async () => {
      // Mock time to be within allowed window (10:00 AM)
      const mockDate = new Date('2025-08-19T10:00:00Z');
      jest.spyOn(global, 'Date').mockImplementation(() => mockDate);
      Date.now = jest.fn(() => mockDate.getTime());
      
      const newCheckin = {
        id: 'new-checkin-id',
        levelMemberId: 'member-id',
        type: 'TEXT',
        content: 'Daily workout completed',
        imagePixelUrl: null,
        metadata: {},
        createdAt: mockDate
      };

      prisma.levelMember.findFirst.mockResolvedValue(mockLevelMember);
      prisma.checkIn.findFirst.mockResolvedValue(null); // No existing checkin
      prisma.checkIn.create.mockResolvedValue(newCheckin);
      prisma.levelMember.update.mockResolvedValue(mockLevelMember);

      const response = await request(app)
        .post('/api/levels/test-level-id/checkins')
        .set('Authorization', `Bearer ${validToken}`)
        .send({ type: 'TEXT', content: 'Daily workout completed' });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Successfully checked in to Test Level');
      expect(response.body.checkin.type).toBe('TEXT');
      expect(response.body.checkin.content).toBe('Daily workout completed');

      // Verify missed days reset
      expect(prisma.levelMember.update).toHaveBeenCalledWith({
        where: { id: 'member-id' },
        data: { missedDays: 0 }
      });
      
      // Restore Date mock
      jest.restoreAllMocks();
    });

    it('should successfully create CHECKMARK check-in', async () => {
      // Mock time to be within allowed window
      const mockDate = new Date('2025-08-19T10:00:00Z');
      jest.spyOn(global, 'Date').mockImplementation(() => mockDate);
      Date.now = jest.fn(() => mockDate.getTime());
      
      const newCheckin = {
        id: 'new-checkin-id',
        levelMemberId: 'member-id',
        type: 'CHECKMARK',
        content: null,
        imagePixelUrl: null,
        metadata: {},
        createdAt: mockDate
      };

      prisma.levelMember.findFirst.mockResolvedValue(mockLevelMember);
      prisma.checkIn.findFirst.mockResolvedValue(null);
      prisma.checkIn.create.mockResolvedValue(newCheckin);
      prisma.levelMember.update.mockResolvedValue(mockLevelMember);

      const response = await request(app)
        .post('/api/levels/test-level-id/checkins')
        .set('Authorization', `Bearer ${validToken}`)
        .send({ type: 'CHECKMARK' });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.checkin.type).toBe('CHECKMARK');
      expect(response.body.checkin.content).toBeNull();
      
      // Restore Date mock
      jest.restoreAllMocks();
    });

    it('should successfully create IMAGE check-in', async () => {
      // Mock time to be within allowed window
      const mockDate = new Date('2025-08-19T10:00:00Z');
      jest.spyOn(global, 'Date').mockImplementation(() => mockDate);
      Date.now = jest.fn(() => mockDate.getTime());
      
      const newCheckin = {
        id: 'new-checkin-id',
        levelMemberId: 'member-id',
        type: 'IMAGE',
        content: null,
        imagePixelUrl: 'temp_123456789.png',
        metadata: { originalSize: 1024, processed: false },
        createdAt: mockDate
      };

      prisma.levelMember.findFirst.mockResolvedValue(mockLevelMember);
      prisma.checkIn.findFirst.mockResolvedValue(null);
      prisma.checkIn.create.mockResolvedValue(newCheckin);
      prisma.levelMember.update.mockResolvedValue(mockLevelMember);

      const response = await request(app)
        .post('/api/levels/test-level-id/checkins')
        .set('Authorization', `Bearer ${validToken}`)
        .send({ type: 'IMAGE', imageData: 'base64encodedimagedata' });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.checkin.type).toBe('IMAGE');
      expect(response.body.checkin.imagePixelUrl).toMatch(/temp_\d+\.png/);
      
      // Restore Date mock
      jest.restoreAllMocks();
    });

    it('should handle database errors gracefully', async () => {
      // Mock time to be within allowed window
      const mockDate = new Date('2025-08-19T10:00:00Z');
      jest.spyOn(global, 'Date').mockImplementation(() => mockDate);
      Date.now = jest.fn(() => mockDate.getTime());
      
      prisma.levelMember.findFirst.mockResolvedValue(mockLevelMember);
      prisma.checkIn.findFirst.mockResolvedValue(null);
      prisma.checkIn.create.mockRejectedValue(new Error('Database connection failed'));

      const response = await request(app)
        .post('/api/levels/test-level-id/checkins')
        .set('Authorization', `Bearer ${validToken}`)
        .send({ type: 'TEXT', content: 'Test content' });

      expect(response.status).toBe(500);
      expect(response.body.error).toBe('Failed to submit check-in');
      
      // Restore Date mock
      jest.restoreAllMocks();
    });
  });

  describe('GET /api/levels/:id/checkins/today', () => {
    const mockLevelMember = {
      id: 'member-id',
      playerId: 'test-user-id',
      levelId: 'test-level-id',
      role: 'PLAYER',
      status: 'ACTIVE',
      level: {
        id: 'test-level-id',
        name: 'Test Level',
        rule: {
          startTime: '06:00',
          endTime: '22:00'
        }
      }
    };

    it('should return 401 when no authorization token is provided', async () => {
      const response = await request(app)
        .get('/api/levels/test-level-id/checkins/today');

      expect(response.status).toBe(401);
    });

    it('should return 403 when user is not a member', async () => {
      prisma.levelMember.findFirst.mockResolvedValue(null);

      const response = await request(app)
        .get('/api/levels/test-level-id/checkins/today')
        .set('Authorization', `Bearer ${validToken}`);

      expect(response.status).toBe(403);
    });

    it('should return today status when no check-in exists', async () => {
      prisma.levelMember.findFirst.mockResolvedValue(mockLevelMember);
      prisma.checkIn.findFirst.mockResolvedValue(null);

      const response = await request(app)
        .get('/api/levels/test-level-id/checkins/today')
        .set('Authorization', `Bearer ${validToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.hasCheckedIn).toBe(false);
      expect(response.body.checkin).toBeNull();
      expect(response.body.timeWindow).toBeDefined();
      expect(response.body.timeWindow.start).toBe('06:00');
      expect(response.body.timeWindow.end).toBe('22:00');
    });

    it('should return today status when check-in exists', async () => {
      const todayCheckin = {
        id: 'today-checkin-id',
        type: 'TEXT',
        content: 'Today workout',
        createdAt: new Date()
      };

      prisma.levelMember.findFirst.mockResolvedValue(mockLevelMember);
      prisma.checkIn.findFirst.mockResolvedValue(todayCheckin);

      const response = await request(app)
        .get('/api/levels/test-level-id/checkins/today')
        .set('Authorization', `Bearer ${validToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.hasCheckedIn).toBe(true);
      expect(response.body.checkin.id).toBe('today-checkin-id');
      expect(response.body.checkin.type).toBe('TEXT');
    });
  });

  describe('GET /api/levels/:id/checkins', () => {
    const mockLevelMember = {
      id: 'member-id',
      playerId: 'test-user-id',
      levelId: 'test-level-id',
      role: 'PLAYER',
      status: 'ACTIVE',
      level: {
        id: 'test-level-id',
        name: 'Test Level',
        settings: {
          checkinContentVisibility: 'public'
        },
        ownerId: 'other-user-id'
      }
    };

    it('should return 401 when no authorization token is provided', async () => {
      const response = await request(app)
        .get('/api/levels/test-level-id/checkins');

      expect(response.status).toBe(401);
    });

    it('should return 403 when user is not a member', async () => {
      prisma.levelMember.findFirst.mockResolvedValue(null);

      const response = await request(app)
        .get('/api/levels/test-level-id/checkins')
        .set('Authorization', `Bearer ${validToken}`);

      expect(response.status).toBe(403);
    });

    it('should return level check-ins with public visibility', async () => {
      const mockCheckins = [
        {
          id: 'checkin-1',
          type: 'TEXT',
          content: 'Workout completed',
          createdAt: new Date(),
          levelMember: {
            id: 'member-1',
            role: 'PLAYER',
            player: {
              id: 'player-1',
              name: 'Player One',
              avatarUrl: null
            }
          }
        },
        {
          id: 'checkin-2',
          type: 'CHECKMARK',
          createdAt: new Date(),
          levelMember: {
            id: 'member-2',
            role: 'PLAYER',
            player: {
              id: 'player-2',
              name: 'Player Two',
              avatarUrl: null
            }
          }
        }
      ];

      prisma.levelMember.findFirst.mockResolvedValue(mockLevelMember);
      prisma.checkIn.findMany.mockResolvedValue(mockCheckins);

      const response = await request(app)
        .get('/api/levels/test-level-id/checkins')
        .set('Authorization', `Bearer ${validToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.checkins).toHaveLength(2);
      expect(response.body.total).toBe(2);
      expect(response.body.levelName).toBe('Test Level');
    });
  });

  describe('GET /api/levels/:id/checkins/history/:playerId', () => {
    const mockLevelMember = {
      id: 'member-id',
      playerId: 'test-user-id',
      levelId: 'test-level-id',
      role: 'PLAYER',
      status: 'ACTIVE',
      level: {
        settings: {
          checkinContentVisibility: 'public'
        },
        ownerId: 'other-user-id'
      }
    };

    const mockTargetMember = {
      id: 'target-member-id',
      playerId: 'target-player-id',
      levelId: 'test-level-id',
      role: 'PLAYER',
      status: 'ACTIVE',
      player: {
        id: 'target-player-id',
        name: 'Target Player',
        avatarUrl: null
      }
    };

    it('should return 401 when no authorization token is provided', async () => {
      const response = await request(app)
        .get('/api/levels/test-level-id/checkins/history/target-player-id');

      expect(response.status).toBe(401);
    });

    it('should return 403 when user is not a member', async () => {
      prisma.levelMember.findFirst.mockResolvedValueOnce(null);

      const response = await request(app)
        .get('/api/levels/test-level-id/checkins/history/target-player-id')
        .set('Authorization', `Bearer ${validToken}`);

      expect(response.status).toBe(403);
    });

    it('should return 404 when target player is not found', async () => {
      prisma.levelMember.findFirst
        .mockResolvedValueOnce(mockLevelMember)
        .mockResolvedValueOnce(null);

      const response = await request(app)
        .get('/api/levels/test-level-id/checkins/history/target-player-id')
        .set('Authorization', `Bearer ${validToken}`);

      expect(response.status).toBe(404);
      expect(response.body.error).toBe('Player not found in this level');
    });

    it('should return player check-in history', async () => {
      const mockCheckins = [
        {
          id: 'checkin-1',
          type: 'TEXT',
          content: 'Morning workout',
          createdAt: new Date('2025-08-20T08:00:00Z')
        },
        {
          id: 'checkin-2',
          type: 'CHECKMARK',
          createdAt: new Date('2025-08-19T07:00:00Z')
        }
      ];

      prisma.levelMember.findFirst
        .mockResolvedValueOnce(mockLevelMember)
        .mockResolvedValueOnce(mockTargetMember);
      prisma.checkIn.findMany.mockResolvedValue(mockCheckins);
      prisma.checkIn.count.mockResolvedValue(2);

      const response = await request(app)
        .get('/api/levels/test-level-id/checkins/history/target-player-id')
        .set('Authorization', `Bearer ${validToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.player.name).toBe('Target Player');
      expect(response.body.checkins).toHaveLength(2);
      expect(response.body.pagination.total).toBe(2);
    });
  });
});