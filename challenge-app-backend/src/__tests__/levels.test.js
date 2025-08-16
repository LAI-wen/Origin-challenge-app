// src/__tests__/levels.test.js
const request = require('supertest');
const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');

// Mock prisma before importing controllers
jest.mock('../models/prisma', () => ({
  player: {
    findUnique: jest.fn(),
  },
  level: {
    create: jest.fn(),
    findUnique: jest.fn(),
  },
  levelMember: {
    create: jest.fn(),
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

describe('POST /api/levels', () => {
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
  });

  it('should return 401 when no authorization token is provided', async () => {
    const levelData = {
      name: 'Test Level',
      description: 'A test level',
      rule: {
        startTime: '06:00',
        endTime: '22:00',
        maxMissedDays: 3
      },
      settings: {
        checkinContentVisibility: 'public'
      },
      startDate: '2025-08-20T00:00:00Z',
      endDate: '2025-09-20T00:00:00Z'
    };

    const response = await request(app)
      .post('/api/levels')
      .send(levelData);

    expect(response.status).toBe(401);
    expect(response.body.error).toBe('Access token is required');
  });

  it('should return 401 when invalid token is provided', async () => {
    const levelData = {
      name: 'Test Level',
      description: 'A test level'
    };

    const response = await request(app)
      .post('/api/levels')
      .set('Authorization', 'Bearer invalid-token')
      .send(levelData);

    expect(response.status).toBe(401);
    expect(response.body.error).toBe('Invalid token');
  });

  it('should return 400 when required fields are missing', async () => {
    prisma.player.findUnique.mockResolvedValue(mockUser);

    const response = await request(app)
      .post('/api/levels')
      .set('Authorization', `Bearer ${validToken}`)
      .send({});

    expect(response.status).toBe(400);
    expect(response.body.error).toBe('Level name is required');
  });

  it('should create a level successfully with valid data', async () => {
    const levelData = {
      name: 'Test Level',
      description: 'A test level for testing',
      rule: {
        startTime: '06:00',
        endTime: '22:00',
        maxMissedDays: 3
      },
      settings: {
        checkinContentVisibility: 'public'
      },
      startDate: '2025-08-20T00:00:00Z',
      endDate: '2025-09-20T00:00:00Z'
    };

    const mockCreatedLevel = {
      id: 'test-level-id',
      name: levelData.name,
      description: levelData.description,
      inviteCode: 'ABCD1234',
      ownerId: mockUser.id,
      rule: levelData.rule,
      settings: levelData.settings,
      startDate: new Date(levelData.startDate),
      endDate: new Date(levelData.endDate),
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const mockCreatedMember = {
      id: 'test-member-id',
      playerId: mockUser.id,
      levelId: 'test-level-id',
      role: 'CREATOR',
      status: 'ACTIVE',
      missedDays: 0,
      joinedAt: new Date(),
      updatedAt: new Date()
    };

    prisma.player.findUnique.mockResolvedValue(mockUser);
    prisma.level.create.mockResolvedValue(mockCreatedLevel);
    prisma.levelMember.create.mockResolvedValue(mockCreatedMember);

    const response = await request(app)
      .post('/api/levels')
      .set('Authorization', `Bearer ${validToken}`)
      .send(levelData);

    expect(response.status).toBe(201);
    expect(response.body.success).toBe(true);
    expect(response.body.level).toMatchObject({
      id: 'test-level-id',
      name: levelData.name,
      description: levelData.description,
      inviteCode: 'ABCD1234',
      ownerId: mockUser.id,
      isActive: true
    });

    // Verify database calls
    expect(prisma.level.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        name: levelData.name,
        description: levelData.description,
        ownerId: mockUser.id,
        rule: levelData.rule,
        settings: levelData.settings,
        startDate: new Date(levelData.startDate),
        endDate: new Date(levelData.endDate),
        inviteCode: expect.any(String)
      })
    });

    expect(prisma.levelMember.create).toHaveBeenCalledWith({
      data: {
        playerId: mockUser.id,
        levelId: 'test-level-id',
        role: 'CREATOR',
        status: 'ACTIVE'
      }
    });
  });

  it('should create a level with default values when optional fields are missing', async () => {
    const levelData = {
      name: 'Minimal Level'
    };

    const mockCreatedLevel = {
      id: 'test-level-id',
      name: levelData.name,
      description: null,
      inviteCode: 'ABCD1234',
      ownerId: mockUser.id,
      rule: {
        startTime: '05:00',
        endTime: '23:00',
        maxMissedDays: 3
      },
      settings: {
        checkinContentVisibility: 'public'
      },
      startDate: expect.any(Date),
      endDate: null,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const mockCreatedMember = {
      id: 'test-member-id',
      playerId: mockUser.id,
      levelId: 'test-level-id',
      role: 'CREATOR',
      status: 'ACTIVE',
      missedDays: 0,
      joinedAt: new Date(),
      updatedAt: new Date()
    };

    prisma.player.findUnique.mockResolvedValue(mockUser);
    prisma.level.create.mockResolvedValue(mockCreatedLevel);
    prisma.levelMember.create.mockResolvedValue(mockCreatedMember);

    const response = await request(app)
      .post('/api/levels')
      .set('Authorization', `Bearer ${validToken}`)
      .send(levelData);

    expect(response.status).toBe(201);
    expect(response.body.success).toBe(true);
    expect(response.body.level.name).toBe(levelData.name);
    expect(response.body.level.inviteCode).toMatch(/^[A-Z0-9]{8}$/);

    // Verify default values are applied
    expect(prisma.level.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        name: levelData.name,
        description: null,
        rule: {
          startTime: '05:00',
          endTime: '23:00',
          maxMissedDays: 3
        },
        settings: {
          checkinContentVisibility: 'public'
        },
        inviteCode: expect.any(String)
      })
    });
  });

  it('should handle database errors gracefully', async () => {
    const levelData = {
      name: 'Test Level'
    };

    prisma.player.findUnique.mockResolvedValue(mockUser);
    prisma.level.create.mockRejectedValue(new Error('Database connection failed'));

    const response = await request(app)
      .post('/api/levels')
      .set('Authorization', `Bearer ${validToken}`)
      .send(levelData);

    expect(response.status).toBe(500);
    expect(response.body.error).toBe('Failed to create level');
  });
});