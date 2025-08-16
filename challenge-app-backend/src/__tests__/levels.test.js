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
    findMany: jest.fn(),
  },
  levelMember: {
    create: jest.fn(),
    findMany: jest.fn(),
    findFirst: jest.fn(),
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

describe('GET /api/levels', () => {
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
    const response = await request(app)
      .get('/api/levels');

    expect(response.status).toBe(401);
    expect(response.body.error).toBe('Access token is required');
  });

  it('should return 401 when invalid token is provided', async () => {
    const response = await request(app)
      .get('/api/levels')
      .set('Authorization', 'Bearer invalid-token');

    expect(response.status).toBe(401);
    expect(response.body.error).toBe('Invalid token');
  });

  it('should return empty array when user has no levels', async () => {
    prisma.player.findUnique.mockResolvedValue(mockUser);
    prisma.levelMember.findMany.mockResolvedValue([]);

    const response = await request(app)
      .get('/api/levels')
      .set('Authorization', `Bearer ${validToken}`);

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.levels).toEqual([]);
    expect(response.body.total).toBe(0);
  });

  it('should return user levels with role and member count', async () => {
    const mockLevelMembers = [
      {
        id: 'member-1',
        playerId: mockUser.id,
        levelId: 'level-1',
        role: 'CREATOR',
        status: 'ACTIVE',
        level: {
          id: 'level-1',
          name: 'Morning Workout',
          description: 'Daily morning exercise routine',
          inviteCode: 'ABCD1234',
          ownerId: mockUser.id,
          isActive: true,
          rule: {
            startTime: '06:00',
            endTime: '22:00',
            maxMissedDays: 3
          },
          settings: {
            checkinContentVisibility: 'public'
          },
          startDate: new Date('2025-08-20T00:00:00Z'),
          endDate: new Date('2025-09-20T00:00:00Z'),
          createdAt: new Date('2025-08-16T10:00:00Z'),
          updatedAt: new Date('2025-08-16T10:00:00Z'),
          _count: {
            levelMembers: 5
          }
        }
      },
      {
        id: 'member-2',
        playerId: mockUser.id,
        levelId: 'level-2',
        role: 'PLAYER',
        status: 'ACTIVE',
        level: {
          id: 'level-2',
          name: 'Reading Challenge',
          description: 'Read 30 minutes daily',
          inviteCode: 'EFGH5678',
          ownerId: 'other-user-id',
          isActive: true,
          rule: {
            startTime: '05:00',
            endTime: '23:00',
            maxMissedDays: 2
          },
          settings: {
            checkinContentVisibility: 'public'
          },
          startDate: new Date('2025-08-15T00:00:00Z'),
          endDate: null,
          createdAt: new Date('2025-08-15T09:00:00Z'),
          updatedAt: new Date('2025-08-15T09:00:00Z'),
          _count: {
            levelMembers: 3
          }
        }
      }
    ];

    prisma.player.findUnique.mockResolvedValue(mockUser);
    prisma.levelMember.findMany.mockResolvedValue(mockLevelMembers);

    const response = await request(app)
      .get('/api/levels')
      .set('Authorization', `Bearer ${validToken}`);

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.total).toBe(2);
    expect(response.body.levels).toHaveLength(2);

    // Check first level (user is creator)
    const creatorLevel = response.body.levels.find(l => l.id === 'level-1');
    expect(creatorLevel).toMatchObject({
      id: 'level-1',
      name: 'Morning Workout',
      description: 'Daily morning exercise routine',
      userRole: 'CREATOR',
      memberCount: 5,
      isOwner: true,
      isActive: true
    });

    // Check second level (user is player)
    const playerLevel = response.body.levels.find(l => l.id === 'level-2');
    expect(playerLevel).toMatchObject({
      id: 'level-2',
      name: 'Reading Challenge',
      description: 'Read 30 minutes daily',
      userRole: 'PLAYER',
      memberCount: 3,
      isOwner: false,
      isActive: true
    });

    // Verify database query
    expect(prisma.levelMember.findMany).toHaveBeenCalledWith({
      where: {
        playerId: mockUser.id,
        status: 'ACTIVE'
      },
      include: {
        level: {
          include: {
            _count: {
              select: {
                levelMembers: {
                  where: {
                    status: 'ACTIVE'
                  }
                }
              }
            }
          }
        }
      },
      orderBy: {
        level: {
          createdAt: 'desc'
        }
      }
    });
  });

  it('should handle database errors gracefully', async () => {
    prisma.player.findUnique.mockResolvedValue(mockUser);
    prisma.levelMember.findMany.mockRejectedValue(new Error('Database connection failed'));

    const response = await request(app)
      .get('/api/levels')
      .set('Authorization', `Bearer ${validToken}`);

    expect(response.status).toBe(500);
    expect(response.body.error).toBe('Failed to fetch levels');
  });

  it('should filter only active levels and active members', async () => {
    const mockLevelMembers = [
      {
        id: 'member-1',
        playerId: mockUser.id,
        levelId: 'level-1',
        role: 'CREATOR',
        status: 'ACTIVE',
        level: {
          id: 'level-1',
          name: 'Active Level',
          description: 'This level is active',
          inviteCode: 'ABCD1234',
          ownerId: mockUser.id,
          isActive: true,
          rule: {},
          settings: {},
          startDate: new Date(),
          endDate: null,
          createdAt: new Date(),
          updatedAt: new Date(),
          _count: {
            levelMembers: 2
          }
        }
      }
    ];

    prisma.player.findUnique.mockResolvedValue(mockUser);
    prisma.levelMember.findMany.mockResolvedValue(mockLevelMembers);

    const response = await request(app)
      .get('/api/levels')
      .set('Authorization', `Bearer ${validToken}`);

    expect(response.status).toBe(200);
    expect(response.body.levels).toHaveLength(1);
    
    // Verify that the query filters for active status
    expect(prisma.levelMember.findMany).toHaveBeenCalledWith({
      where: {
        playerId: mockUser.id,
        status: 'ACTIVE'
      },
      include: expect.any(Object),
      orderBy: expect.any(Object)
    });
  });
});

describe('POST /api/levels/:id/join', () => {
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
    const response = await request(app)
      .post('/api/levels/test-level-id/join')
      .send({ inviteCode: 'ABCD1234' });

    expect(response.status).toBe(401);
    expect(response.body.error).toBe('Access token is required');
  });

  it('should return 401 when invalid token is provided', async () => {
    const response = await request(app)
      .post('/api/levels/test-level-id/join')
      .set('Authorization', 'Bearer invalid-token')
      .send({ inviteCode: 'ABCD1234' });

    expect(response.status).toBe(401);
    expect(response.body.error).toBe('Invalid token');
  });

  it('should return 400 when invite code is missing', async () => {
    prisma.player.findUnique.mockResolvedValue(mockUser);

    const response = await request(app)
      .post('/api/levels/test-level-id/join')
      .set('Authorization', `Bearer ${validToken}`)
      .send({});

    expect(response.status).toBe(400);
    expect(response.body.error).toBe('Invite code is required');
  });

  it('should return 400 when invite code is empty', async () => {
    prisma.player.findUnique.mockResolvedValue(mockUser);

    const response = await request(app)
      .post('/api/levels/test-level-id/join')
      .set('Authorization', `Bearer ${validToken}`)
      .send({ inviteCode: '' });

    expect(response.status).toBe(400);
    expect(response.body.error).toBe('Invite code is required');
  });

  it('should return 404 when level is not found', async () => {
    prisma.player.findUnique.mockResolvedValue(mockUser);
    prisma.level.findUnique.mockResolvedValue(null);

    const response = await request(app)
      .post('/api/levels/non-existent-level/join')
      .set('Authorization', `Bearer ${validToken}`)
      .send({ inviteCode: 'ABCD1234' });

    expect(response.status).toBe(404);
    expect(response.body.error).toBe('Level not found');
  });

  it('should return 400 when invite code is invalid', async () => {
    const mockLevel = {
      id: 'test-level-id',
      name: 'Test Level',
      inviteCode: 'ABCD1234',
      isActive: true,
      ownerId: 'other-user-id'
    };

    prisma.player.findUnique.mockResolvedValue(mockUser);
    prisma.level.findUnique.mockResolvedValue(mockLevel);

    const response = await request(app)
      .post('/api/levels/test-level-id/join')
      .set('Authorization', `Bearer ${validToken}`)
      .send({ inviteCode: 'WRONG123' });

    expect(response.status).toBe(400);
    expect(response.body.error).toBe('Invalid invite code');
  });

  it('should return 400 when level is not active', async () => {
    const mockLevel = {
      id: 'test-level-id',
      name: 'Test Level',
      inviteCode: 'ABCD1234',
      isActive: false,
      ownerId: 'other-user-id'
    };

    prisma.player.findUnique.mockResolvedValue(mockUser);
    prisma.level.findUnique.mockResolvedValue(mockLevel);

    const response = await request(app)
      .post('/api/levels/test-level-id/join')
      .set('Authorization', `Bearer ${validToken}`)
      .send({ inviteCode: 'ABCD1234' });

    expect(response.status).toBe(400);
    expect(response.body.error).toBe('Level is not active');
  });

  it('should return 409 when user is already a member', async () => {
    const mockLevel = {
      id: 'test-level-id',
      name: 'Test Level',
      inviteCode: 'ABCD1234',
      isActive: true,
      ownerId: 'other-user-id'
    };

    const mockExistingMember = {
      id: 'existing-member-id',
      playerId: mockUser.id,
      levelId: 'test-level-id',
      role: 'PLAYER',
      status: 'ACTIVE'
    };

    prisma.player.findUnique.mockResolvedValue(mockUser);
    prisma.level.findUnique.mockResolvedValue(mockLevel);
    prisma.levelMember.findFirst.mockResolvedValue(mockExistingMember);

    const response = await request(app)
      .post('/api/levels/test-level-id/join')
      .set('Authorization', `Bearer ${validToken}`)
      .send({ inviteCode: 'ABCD1234' });

    expect(response.status).toBe(409);
    expect(response.body.error).toBe('User is already a member of this level');
  });

  it('should successfully join level with valid invite code', async () => {
    const mockLevel = {
      id: 'test-level-id',
      name: 'Test Level',
      description: 'A test level for joining',
      inviteCode: 'ABCD1234',
      isActive: true,
      ownerId: 'other-user-id',
      rule: {
        startTime: '06:00',
        endTime: '22:00',
        maxMissedDays: 3
      },
      settings: {
        checkinContentVisibility: 'public'
      },
      startDate: new Date('2025-08-20T00:00:00Z'),
      endDate: new Date('2025-09-20T00:00:00Z'),
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const mockCreatedMember = {
      id: 'new-member-id',
      playerId: mockUser.id,
      levelId: 'test-level-id',
      role: 'PLAYER',
      status: 'ACTIVE',
      missedDays: 0,
      joinedAt: new Date(),
      updatedAt: new Date()
    };

    prisma.player.findUnique.mockResolvedValue(mockUser);
    prisma.level.findUnique.mockResolvedValue(mockLevel);
    prisma.levelMember.findFirst.mockResolvedValue(null); // User is not already a member
    prisma.levelMember.create.mockResolvedValue(mockCreatedMember);

    const response = await request(app)
      .post('/api/levels/test-level-id/join')
      .set('Authorization', `Bearer ${validToken}`)
      .send({ inviteCode: 'ABCD1234' });

    expect(response.status).toBe(201);
    expect(response.body.success).toBe(true);
    expect(response.body.message).toBe('Successfully joined level');
    expect(response.body.level).toMatchObject({
      id: 'test-level-id',
      name: 'Test Level',
      description: 'A test level for joining',
      isActive: true,
      userRole: 'PLAYER'
    });

    // Verify database calls
    expect(prisma.level.findUnique).toHaveBeenCalledWith({
      where: { id: 'test-level-id' }
    });

    expect(prisma.levelMember.findFirst).toHaveBeenCalledWith({
      where: {
        playerId: mockUser.id,
        levelId: 'test-level-id',
        status: 'ACTIVE'
      }
    });

    expect(prisma.levelMember.create).toHaveBeenCalledWith({
      data: {
        playerId: mockUser.id,
        levelId: 'test-level-id',
        role: 'PLAYER',
        status: 'ACTIVE'
      }
    });
  });

  it('should handle database errors gracefully', async () => {
    const mockLevel = {
      id: 'test-level-id',
      name: 'Test Level',
      inviteCode: 'ABCD1234',
      isActive: true,
      ownerId: 'other-user-id'
    };

    prisma.player.findUnique.mockResolvedValue(mockUser);
    prisma.level.findUnique.mockResolvedValue(mockLevel);
    prisma.levelMember.findFirst.mockResolvedValue(null);
    prisma.levelMember.create.mockRejectedValue(new Error('Database connection failed'));

    const response = await request(app)
      .post('/api/levels/test-level-id/join')
      .set('Authorization', `Bearer ${validToken}`)
      .send({ inviteCode: 'ABCD1234' });

    expect(response.status).toBe(500);
    expect(response.body.error).toBe('Failed to join level');
  });

  it('should allow owner to join their own level using invite code', async () => {
    const mockLevel = {
      id: 'test-level-id',
      name: 'Test Level',
      description: 'A test level owned by user',
      inviteCode: 'ABCD1234',
      isActive: true,
      ownerId: mockUser.id, // User owns this level
      rule: {
        startTime: '06:00',
        endTime: '22:00',
        maxMissedDays: 3
      },
      settings: {
        checkinContentVisibility: 'public'
      },
      startDate: new Date('2025-08-20T00:00:00Z'),
      endDate: new Date('2025-09-20T00:00:00Z'),
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const mockCreatedMember = {
      id: 'new-member-id',
      playerId: mockUser.id,
      levelId: 'test-level-id',
      role: 'PLAYER', // Even owner joins as PLAYER when using invite code
      status: 'ACTIVE',
      missedDays: 0,
      joinedAt: new Date(),
      updatedAt: new Date()
    };

    prisma.player.findUnique.mockResolvedValue(mockUser);
    prisma.level.findUnique.mockResolvedValue(mockLevel);
    prisma.levelMember.findFirst.mockResolvedValue(null); // User is not already a member
    prisma.levelMember.create.mockResolvedValue(mockCreatedMember);

    const response = await request(app)
      .post('/api/levels/test-level-id/join')
      .set('Authorization', `Bearer ${validToken}`)
      .send({ inviteCode: 'ABCD1234' });

    expect(response.status).toBe(201);
    expect(response.body.success).toBe(true);
    expect(response.body.level.userRole).toBe('PLAYER');

    // Verify member was created with PLAYER role
    expect(prisma.levelMember.create).toHaveBeenCalledWith({
      data: {
        playerId: mockUser.id,
        levelId: 'test-level-id',
        role: 'PLAYER',
        status: 'ACTIVE'
      }
    });
  });
});