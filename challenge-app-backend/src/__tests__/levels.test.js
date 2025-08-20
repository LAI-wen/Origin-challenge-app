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
    update: jest.fn(),
  },
  levelMember: {
    create: jest.fn(),
    findMany: jest.fn(),
    findFirst: jest.fn(),
    update: jest.fn(),
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
      updatedAt: new Date(),
      _count: {
        levelMembers: 2
      }
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
      where: { id: 'test-level-id' },
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
      updatedAt: new Date(),
      _count: {
        levelMembers: 1
      }
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

describe('PUT /api/levels/:id/members/:memberId', () => {
  let app;
  let validToken;
  const mockUser = {
    id: 'creator-user-id',
    email: 'creator@example.com',
    name: 'Creator User'
  };

  beforeEach(() => {
    app = createTestApp();
    validToken = jwt.sign(mockUser, process.env.JWT_SECRET || 'your-default-secret-change-this');
    jest.clearAllMocks();
  });

  it('should return 401 when no authorization token is provided', async () => {
    const response = await request(app)
      .put('/api/levels/test-level-id/members/member-id')
      .send({ role: 'AUDIENCE' });

    expect(response.status).toBe(401);
    expect(response.body.error).toBe('Access token is required');
  });

  it('should return 401 when invalid token is provided', async () => {
    const response = await request(app)
      .put('/api/levels/test-level-id/members/member-id')
      .set('Authorization', 'Bearer invalid-token')
      .send({ role: 'AUDIENCE' });

    expect(response.status).toBe(401);
    expect(response.body.error).toBe('Invalid token');
  });

  it('should return 400 when role is missing', async () => {
    prisma.player.findUnique.mockResolvedValue(mockUser);

    const response = await request(app)
      .put('/api/levels/test-level-id/members/member-id')
      .set('Authorization', `Bearer ${validToken}`)
      .send({});

    expect(response.status).toBe(400);
    expect(response.body.error).toBe('Role is required');
  });

  it('should return 400 when role is invalid', async () => {
    prisma.player.findUnique.mockResolvedValue(mockUser);

    const response = await request(app)
      .put('/api/levels/test-level-id/members/member-id')
      .set('Authorization', `Bearer ${validToken}`)
      .send({ role: 'INVALID_ROLE' });

    expect(response.status).toBe(400);
    expect(response.body.error).toBe('Role must be either PLAYER or AUDIENCE');
  });

  it('should return 404 when level is not found', async () => {
    prisma.player.findUnique.mockResolvedValue(mockUser);
    prisma.level.findUnique.mockResolvedValue(null);

    const response = await request(app)
      .put('/api/levels/non-existent-level/members/member-id')
      .set('Authorization', `Bearer ${validToken}`)
      .send({ role: 'AUDIENCE' });

    expect(response.status).toBe(404);
    expect(response.body.error).toBe('Level not found');
  });

  it('should return 403 when user is not the CREATOR', async () => {
    const mockLevel = {
      id: 'test-level-id',
      ownerId: 'other-user-id',
      isActive: true
    };

    const mockUserMember = {
      id: 'user-member-id',
      playerId: mockUser.id,
      levelId: 'test-level-id',
      role: 'PLAYER',
      status: 'ACTIVE'
    };

    prisma.player.findUnique.mockResolvedValue(mockUser);
    prisma.level.findUnique.mockResolvedValue(mockLevel);
    prisma.levelMember.findFirst.mockResolvedValue(mockUserMember);

    const response = await request(app)
      .put('/api/levels/test-level-id/members/member-id')
      .set('Authorization', `Bearer ${validToken}`)
      .send({ role: 'AUDIENCE' });

    expect(response.status).toBe(403);
    expect(response.body.error).toBe('Only the level creator can manage members');
  });

  it('should return 404 when target member is not found', async () => {
    const mockLevel = {
      id: 'test-level-id',
      ownerId: mockUser.id,
      isActive: true
    };

    const mockUserMember = {
      id: 'user-member-id',
      playerId: mockUser.id,
      levelId: 'test-level-id',
      role: 'CREATOR',
      status: 'ACTIVE'
    };

    prisma.player.findUnique.mockResolvedValue(mockUser);
    prisma.level.findUnique.mockResolvedValue(mockLevel);
    prisma.levelMember.findFirst
      .mockResolvedValueOnce(mockUserMember) // User membership check
      .mockResolvedValueOnce(null); // Target member check

    const response = await request(app)
      .put('/api/levels/test-level-id/members/non-existent-member')
      .set('Authorization', `Bearer ${validToken}`)
      .send({ role: 'AUDIENCE' });

    expect(response.status).toBe(404);
    expect(response.body.error).toBe('Member not found or not active in this level');
  });

  it('should return 400 when trying to update CREATOR role', async () => {
    const mockLevel = {
      id: 'test-level-id',
      ownerId: mockUser.id,
      isActive: true
    };

    const mockUserMember = {
      id: 'user-member-id',
      playerId: mockUser.id,
      levelId: 'test-level-id',
      role: 'CREATOR',
      status: 'ACTIVE'
    };

    const mockTargetMember = {
      id: 'target-member-id',
      playerId: 'target-player-id',
      levelId: 'test-level-id',
      role: 'CREATOR',
      status: 'ACTIVE'
    };

    prisma.player.findUnique.mockResolvedValue(mockUser);
    prisma.level.findUnique.mockResolvedValue(mockLevel);
    prisma.levelMember.findFirst
      .mockResolvedValueOnce(mockUserMember) // User membership check
      .mockResolvedValueOnce(mockTargetMember); // Target member check

    const response = await request(app)
      .put('/api/levels/test-level-id/members/target-member-id')
      .set('Authorization', `Bearer ${validToken}`)
      .send({ role: 'AUDIENCE' });

    expect(response.status).toBe(400);
    expect(response.body.error).toBe('Cannot modify the creator role');
  });

  it('should successfully update member role from PLAYER to AUDIENCE', async () => {
    const mockLevel = {
      id: 'test-level-id',
      ownerId: mockUser.id,
      isActive: true
    };

    const mockUserMember = {
      id: 'user-member-id',
      playerId: mockUser.id,
      levelId: 'test-level-id',
      role: 'CREATOR',
      status: 'ACTIVE'
    };

    const mockTargetMember = {
      id: 'target-member-id',
      playerId: 'target-player-id',
      levelId: 'test-level-id',
      role: 'PLAYER',
      status: 'ACTIVE'
    };

    const mockUpdatedMember = {
      ...mockTargetMember,
      role: 'AUDIENCE'
    };

    prisma.player.findUnique.mockResolvedValue(mockUser);
    prisma.level.findUnique.mockResolvedValue(mockLevel);
    prisma.levelMember.findFirst
      .mockResolvedValueOnce(mockUserMember) // User membership check
      .mockResolvedValueOnce(mockTargetMember); // Target member check
    prisma.levelMember.update.mockResolvedValue(mockUpdatedMember);

    const response = await request(app)
      .put('/api/levels/test-level-id/members/target-member-id')
      .set('Authorization', `Bearer ${validToken}`)
      .send({ role: 'AUDIENCE' });

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.message).toBe('Member role updated successfully');
    expect(response.body.member.role).toBe('AUDIENCE');

    expect(prisma.levelMember.update).toHaveBeenCalledWith({
      where: { id: 'target-member-id' },
      data: { role: 'AUDIENCE' }
    });
  });

  it('should successfully update member role from AUDIENCE to PLAYER', async () => {
    const mockLevel = {
      id: 'test-level-id',
      ownerId: mockUser.id,
      isActive: true
    };

    const mockUserMember = {
      id: 'user-member-id',
      playerId: mockUser.id,
      levelId: 'test-level-id',
      role: 'CREATOR',
      status: 'ACTIVE'
    };

    const mockTargetMember = {
      id: 'target-member-id',
      playerId: 'target-player-id',
      levelId: 'test-level-id',
      role: 'AUDIENCE',
      status: 'ACTIVE'
    };

    const mockUpdatedMember = {
      ...mockTargetMember,
      role: 'PLAYER'
    };

    prisma.player.findUnique.mockResolvedValue(mockUser);
    prisma.level.findUnique.mockResolvedValue(mockLevel);
    prisma.levelMember.findFirst
      .mockResolvedValueOnce(mockUserMember) // User membership check
      .mockResolvedValueOnce(mockTargetMember); // Target member check
    prisma.levelMember.update.mockResolvedValue(mockUpdatedMember);

    const response = await request(app)
      .put('/api/levels/test-level-id/members/target-member-id')
      .set('Authorization', `Bearer ${validToken}`)
      .send({ role: 'PLAYER' });

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.message).toBe('Member role updated successfully');
    expect(response.body.member.role).toBe('PLAYER');

    expect(prisma.levelMember.update).toHaveBeenCalledWith({
      where: { id: 'target-member-id' },
      data: { role: 'PLAYER' }
    });
  });

  it('should handle database errors gracefully', async () => {
    const mockLevel = {
      id: 'test-level-id',
      ownerId: mockUser.id,
      isActive: true
    };

    const mockUserMember = {
      id: 'user-member-id',
      playerId: mockUser.id,
      levelId: 'test-level-id',
      role: 'CREATOR',
      status: 'ACTIVE'
    };

    const mockTargetMember = {
      id: 'target-member-id',
      playerId: 'target-player-id',
      levelId: 'test-level-id',
      role: 'PLAYER',
      status: 'ACTIVE'
    };

    prisma.player.findUnique.mockResolvedValue(mockUser);
    prisma.level.findUnique.mockResolvedValue(mockLevel);
    prisma.levelMember.findFirst
      .mockResolvedValueOnce(mockUserMember) // User membership check
      .mockResolvedValueOnce(mockTargetMember); // Target member check
    prisma.levelMember.update.mockRejectedValue(new Error('Database connection failed'));

    const response = await request(app)
      .put('/api/levels/test-level-id/members/target-member-id')
      .set('Authorization', `Bearer ${validToken}`)
      .send({ role: 'AUDIENCE' });

    expect(response.status).toBe(500);
    expect(response.body.error).toBe('Failed to update member role');
  });
});

describe('DELETE /api/levels/:id/members/:memberId', () => {
  let app;
  let validToken;
  const mockUser = {
    id: 'creator-user-id',
    email: 'creator@example.com',
    name: 'Creator User'
  };

  beforeEach(() => {
    app = createTestApp();
    validToken = jwt.sign(mockUser, process.env.JWT_SECRET || 'your-default-secret-change-this');
    jest.clearAllMocks();
  });

  it('should return 401 when no authorization token is provided', async () => {
    const response = await request(app)
      .delete('/api/levels/test-level-id/members/member-id');

    expect(response.status).toBe(401);
    expect(response.body.error).toBe('Access token is required');
  });

  it('should return 401 when invalid token is provided', async () => {
    const response = await request(app)
      .delete('/api/levels/test-level-id/members/member-id')
      .set('Authorization', 'Bearer invalid-token');

    expect(response.status).toBe(401);
    expect(response.body.error).toBe('Invalid token');
  });

  it('should return 404 when level is not found', async () => {
    prisma.player.findUnique.mockResolvedValue(mockUser);
    prisma.level.findUnique.mockResolvedValue(null);

    const response = await request(app)
      .delete('/api/levels/non-existent-level/members/member-id')
      .set('Authorization', `Bearer ${validToken}`);

    expect(response.status).toBe(404);
    expect(response.body.error).toBe('Level not found');
  });

  it('should return 403 when user is not the CREATOR', async () => {
    const mockLevel = {
      id: 'test-level-id',
      ownerId: 'other-user-id',
      isActive: true
    };

    const mockUserMember = {
      id: 'user-member-id',
      playerId: mockUser.id,
      levelId: 'test-level-id',
      role: 'PLAYER',
      status: 'ACTIVE'
    };

    prisma.player.findUnique.mockResolvedValue(mockUser);
    prisma.level.findUnique.mockResolvedValue(mockLevel);
    prisma.levelMember.findFirst.mockResolvedValue(mockUserMember);

    const response = await request(app)
      .delete('/api/levels/test-level-id/members/member-id')
      .set('Authorization', `Bearer ${validToken}`);

    expect(response.status).toBe(403);
    expect(response.body.error).toBe('Only the level creator can manage members');
  });

  it('should return 404 when target member is not found', async () => {
    const mockLevel = {
      id: 'test-level-id',
      ownerId: mockUser.id,
      isActive: true
    };

    const mockUserMember = {
      id: 'user-member-id',
      playerId: mockUser.id,
      levelId: 'test-level-id',
      role: 'CREATOR',
      status: 'ACTIVE'
    };

    prisma.player.findUnique.mockResolvedValue(mockUser);
    prisma.level.findUnique.mockResolvedValue(mockLevel);
    prisma.levelMember.findFirst
      .mockResolvedValueOnce(mockUserMember) // User membership check
      .mockResolvedValueOnce(null); // Target member check

    const response = await request(app)
      .delete('/api/levels/test-level-id/members/non-existent-member')
      .set('Authorization', `Bearer ${validToken}`);

    expect(response.status).toBe(404);
    expect(response.body.error).toBe('Member not found or not active in this level');
  });

  it('should return 400 when trying to remove CREATOR', async () => {
    const mockLevel = {
      id: 'test-level-id',
      ownerId: mockUser.id,
      isActive: true
    };

    const mockUserMember = {
      id: 'user-member-id',
      playerId: mockUser.id,
      levelId: 'test-level-id',
      role: 'CREATOR',
      status: 'ACTIVE'
    };

    const mockTargetMember = {
      id: 'target-member-id',
      playerId: 'target-player-id',
      levelId: 'test-level-id',
      role: 'CREATOR',
      status: 'ACTIVE'
    };

    prisma.player.findUnique.mockResolvedValue(mockUser);
    prisma.level.findUnique.mockResolvedValue(mockLevel);
    prisma.levelMember.findFirst
      .mockResolvedValueOnce(mockUserMember) // User membership check
      .mockResolvedValueOnce(mockTargetMember); // Target member check

    const response = await request(app)
      .delete('/api/levels/test-level-id/members/target-member-id')
      .set('Authorization', `Bearer ${validToken}`);

    expect(response.status).toBe(400);
    expect(response.body.error).toBe('Cannot remove the level creator');
  });

  it('should successfully remove a PLAYER member', async () => {
    const mockLevel = {
      id: 'test-level-id',
      ownerId: mockUser.id,
      isActive: true
    };

    const mockUserMember = {
      id: 'user-member-id',
      playerId: mockUser.id,
      levelId: 'test-level-id',
      role: 'CREATOR',
      status: 'ACTIVE'
    };

    const mockTargetMember = {
      id: 'target-member-id',
      playerId: 'target-player-id',
      levelId: 'test-level-id',
      role: 'PLAYER',
      status: 'ACTIVE'
    };

    const mockUpdatedMember = {
      ...mockTargetMember,
      status: 'ELIMINATED'
    };

    prisma.player.findUnique.mockResolvedValue(mockUser);
    prisma.level.findUnique.mockResolvedValue(mockLevel);
    prisma.levelMember.findFirst
      .mockResolvedValueOnce(mockUserMember) // User membership check
      .mockResolvedValueOnce(mockTargetMember); // Target member check
    prisma.levelMember.update.mockResolvedValue(mockUpdatedMember);

    const response = await request(app)
      .delete('/api/levels/test-level-id/members/target-member-id')
      .set('Authorization', `Bearer ${validToken}`);

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.message).toBe('Member removed successfully');

    expect(prisma.levelMember.update).toHaveBeenCalledWith({
      where: { id: 'target-member-id' },
      data: { status: 'ELIMINATED' }
    });
  });

  it('should successfully remove an AUDIENCE member', async () => {
    const mockLevel = {
      id: 'test-level-id',
      ownerId: mockUser.id,
      isActive: true
    };

    const mockUserMember = {
      id: 'user-member-id',
      playerId: mockUser.id,
      levelId: 'test-level-id',
      role: 'CREATOR',
      status: 'ACTIVE'
    };

    const mockTargetMember = {
      id: 'target-member-id',
      playerId: 'target-player-id',
      levelId: 'test-level-id',
      role: 'AUDIENCE',
      status: 'ACTIVE'
    };

    const mockUpdatedMember = {
      ...mockTargetMember,
      status: 'ELIMINATED'
    };

    prisma.player.findUnique.mockResolvedValue(mockUser);
    prisma.level.findUnique.mockResolvedValue(mockLevel);
    prisma.levelMember.findFirst
      .mockResolvedValueOnce(mockUserMember) // User membership check
      .mockResolvedValueOnce(mockTargetMember); // Target member check
    prisma.levelMember.update.mockResolvedValue(mockUpdatedMember);

    const response = await request(app)
      .delete('/api/levels/test-level-id/members/target-member-id')
      .set('Authorization', `Bearer ${validToken}`);

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.message).toBe('Member removed successfully');

    expect(prisma.levelMember.update).toHaveBeenCalledWith({
      where: { id: 'target-member-id' },
      data: { status: 'ELIMINATED' }
    });
  });

  it('should handle database errors gracefully', async () => {
    const mockLevel = {
      id: 'test-level-id',
      ownerId: mockUser.id,
      isActive: true
    };

    const mockUserMember = {
      id: 'user-member-id',
      playerId: mockUser.id,
      levelId: 'test-level-id',
      role: 'CREATOR',
      status: 'ACTIVE'
    };

    const mockTargetMember = {
      id: 'target-member-id',
      playerId: 'target-player-id',
      levelId: 'test-level-id',
      role: 'PLAYER',
      status: 'ACTIVE'
    };

    prisma.player.findUnique.mockResolvedValue(mockUser);
    prisma.level.findUnique.mockResolvedValue(mockLevel);
    prisma.levelMember.findFirst
      .mockResolvedValueOnce(mockUserMember) // User membership check
      .mockResolvedValueOnce(mockTargetMember); // Target member check
    prisma.levelMember.update.mockRejectedValue(new Error('Database connection failed'));

    const response = await request(app)
      .delete('/api/levels/test-level-id/members/target-member-id')
      .set('Authorization', `Bearer ${validToken}`);

    expect(response.status).toBe(500);
    expect(response.body.error).toBe('Failed to remove member');
  });
});

describe('GET /api/levels/:id', () => {
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
      .get('/api/levels/test-level-id');

    expect(response.status).toBe(401);
    expect(response.body.error).toBe('Access token is required');
  });

  it('should return 401 when invalid token is provided', async () => {
    const response = await request(app)
      .get('/api/levels/test-level-id')
      .set('Authorization', 'Bearer invalid-token');

    expect(response.status).toBe(401);
    expect(response.body.error).toBe('Invalid token');
  });

  it('should return 404 when level is not found', async () => {
    prisma.player.findUnique.mockResolvedValue(mockUser);
    prisma.level.findUnique.mockResolvedValue(null);

    const response = await request(app)
      .get('/api/levels/non-existent-level')
      .set('Authorization', `Bearer ${validToken}`);

    expect(response.status).toBe(404);
    expect(response.body.error).toBe('Level not found');
  });

  it('should return 403 when user is not a member of the level', async () => {
    const mockLevel = {
      id: 'test-level-id',
      name: 'Test Level',
      description: 'A test level',
      inviteCode: 'ABCD1234',
      ownerId: 'other-user-id',
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
      createdAt: new Date(),
      updatedAt: new Date()
    };

    prisma.player.findUnique.mockResolvedValue(mockUser);
    prisma.level.findUnique.mockResolvedValue(mockLevel);
    prisma.levelMember.findFirst.mockResolvedValue(null); // User is not a member

    const response = await request(app)
      .get('/api/levels/test-level-id')
      .set('Authorization', `Bearer ${validToken}`);

    expect(response.status).toBe(403);
    expect(response.body.error).toBe('Access denied: You are not a member of this level');
  });

  it('should return 403 when user membership is not active', async () => {
    const mockLevel = {
      id: 'test-level-id',
      name: 'Test Level',
      ownerId: 'other-user-id',
      isActive: true
    };

    prisma.player.findUnique.mockResolvedValue(mockUser);
    prisma.level.findUnique.mockResolvedValue(mockLevel);
    // Mock findFirst to return null since user only has ELIMINATED membership (not ACTIVE)
    prisma.levelMember.findFirst.mockResolvedValue(null);

    const response = await request(app)
      .get('/api/levels/test-level-id')
      .set('Authorization', `Bearer ${validToken}`);

    expect(response.status).toBe(403);
    expect(response.body.error).toBe('Access denied: You are not a member of this level');
  });

  it('should return level details for CREATOR with full visibility', async () => {
    const mockLevel = {
      id: 'test-level-id',
      name: 'Test Level',
      description: 'A test level',
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
      levelMembers: [
        {
          id: 'member-1',
          playerId: mockUser.id,
          role: 'CREATOR',
          status: 'ACTIVE',
          missedDays: 0,
          joinedAt: new Date('2025-08-16T10:00:00Z'),
          player: {
            id: mockUser.id,
            name: mockUser.name,
            email: mockUser.email,
            avatarUrl: null
          }
        },
        {
          id: 'member-2',
          playerId: 'other-player-id',
          role: 'PLAYER',
          status: 'ACTIVE',
          missedDays: 1,
          joinedAt: new Date('2025-08-17T09:00:00Z'),
          player: {
            id: 'other-player-id',
            name: 'Other Player',
            email: 'other@example.com',
            avatarUrl: null
          }
        }
      ]
    };

    const mockUserMember = {
      id: 'member-1',
      playerId: mockUser.id,
      levelId: 'test-level-id',
      role: 'CREATOR',
      status: 'ACTIVE'
    };

    prisma.player.findUnique.mockResolvedValue(mockUser);
    prisma.level.findUnique.mockResolvedValue(mockLevel);
    prisma.levelMember.findFirst.mockResolvedValue(mockUserMember);

    const response = await request(app)
      .get('/api/levels/test-level-id')
      .set('Authorization', `Bearer ${validToken}`);

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.level).toMatchObject({
      id: 'test-level-id',
      name: 'Test Level',
      description: 'A test level',
      isActive: true,
      userRole: 'CREATOR',
      isOwner: true
    });

    // CREATOR should see invite code
    expect(response.body.level.inviteCode).toBe('ABCD1234');

    // CREATOR should see full member list with all details
    expect(response.body.level.members).toHaveLength(2);
    expect(response.body.level.members[0]).toMatchObject({
      id: 'member-1',
      role: 'CREATOR',
      status: 'ACTIVE',
      missedDays: 0,
      player: {
        id: mockUser.id,
        name: mockUser.name,
        email: mockUser.email
      }
    });
  });

  it('should return level details for PLAYER with limited visibility', async () => {
    const mockLevel = {
      id: 'test-level-id',
      name: 'Test Level',
      description: 'A test level',
      inviteCode: 'ABCD1234',
      ownerId: 'creator-user-id',
      isActive: true,
      rule: {
        startTime: '06:00',
        endTime: '22:00',
        maxMissedDays: 3
      },
      settings: {
        checkinContentVisibility: 'members_only'
      },
      startDate: new Date('2025-08-20T00:00:00Z'),
      endDate: new Date('2025-09-20T00:00:00Z'),
      createdAt: new Date('2025-08-16T10:00:00Z'),
      updatedAt: new Date('2025-08-16T10:00:00Z'),
      levelMembers: [
        {
          id: 'member-1',
          playerId: 'creator-user-id',
          role: 'CREATOR',
          status: 'ACTIVE',
          missedDays: 0,
          joinedAt: new Date('2025-08-16T10:00:00Z'),
          player: {
            id: 'creator-user-id',
            name: 'Creator User',
            email: 'creator@example.com',
            avatarUrl: null
          }
        },
        {
          id: 'member-2',
          playerId: mockUser.id,
          role: 'PLAYER',
          status: 'ACTIVE',
          missedDays: 1,
          joinedAt: new Date('2025-08-17T09:00:00Z'),
          player: {
            id: mockUser.id,
            name: mockUser.name,
            email: mockUser.email,
            avatarUrl: null
          }
        }
      ]
    };

    const mockUserMember = {
      id: 'member-2',
      playerId: mockUser.id,
      levelId: 'test-level-id',
      role: 'PLAYER',
      status: 'ACTIVE'
    };

    prisma.player.findUnique.mockResolvedValue(mockUser);
    prisma.level.findUnique.mockResolvedValue(mockLevel);
    prisma.levelMember.findFirst.mockResolvedValue(mockUserMember);

    const response = await request(app)
      .get('/api/levels/test-level-id')
      .set('Authorization', `Bearer ${validToken}`);

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.level).toMatchObject({
      id: 'test-level-id',
      name: 'Test Level',
      description: 'A test level',
      isActive: true,
      userRole: 'PLAYER',
      isOwner: false
    });

    // PLAYER should NOT see invite code
    expect(response.body.level.inviteCode).toBeUndefined();

    // PLAYER should see member list but with limited details
    expect(response.body.level.members).toHaveLength(2);
    const creatorMember = response.body.level.members.find(m => m.role === 'CREATOR');
    expect(creatorMember.player.email).toBeUndefined(); // Email should be filtered out for PLAYER
  });

  it('should return level details for AUDIENCE with minimal visibility', async () => {
    const mockLevel = {
      id: 'test-level-id',
      name: 'Test Level',
      description: 'A test level',
      inviteCode: 'ABCD1234',
      ownerId: 'creator-user-id',
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
      levelMembers: [
        {
          id: 'member-1',
          playerId: 'creator-user-id',
          role: 'CREATOR',
          status: 'ACTIVE',
          missedDays: 0,
          joinedAt: new Date('2025-08-16T10:00:00Z'),
          player: {
            id: 'creator-user-id',
            name: 'Creator User',
            email: 'creator@example.com',
            avatarUrl: null
          }
        },
        {
          id: 'member-2',
          playerId: mockUser.id,
          role: 'AUDIENCE',
          status: 'ACTIVE',
          missedDays: 0,
          joinedAt: new Date('2025-08-17T09:00:00Z'),
          player: {
            id: mockUser.id,
            name: mockUser.name,
            email: mockUser.email,
            avatarUrl: null
          }
        }
      ]
    };

    const mockUserMember = {
      id: 'member-2',
      playerId: mockUser.id,
      levelId: 'test-level-id',
      role: 'AUDIENCE',
      status: 'ACTIVE'
    };

    prisma.player.findUnique.mockResolvedValue(mockUser);
    prisma.level.findUnique.mockResolvedValue(mockLevel);
    prisma.levelMember.findFirst.mockResolvedValue(mockUserMember);

    const response = await request(app)
      .get('/api/levels/test-level-id')
      .set('Authorization', `Bearer ${validToken}`);

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.level).toMatchObject({
      id: 'test-level-id',
      name: 'Test Level',
      description: 'A test level',
      isActive: true,
      userRole: 'AUDIENCE',
      isOwner: false
    });

    // AUDIENCE should NOT see invite code
    expect(response.body.level.inviteCode).toBeUndefined();

    // AUDIENCE should see member list but with minimal details
    expect(response.body.level.members).toHaveLength(2);
    const creatorMember = response.body.level.members.find(m => m.role === 'CREATOR');
    expect(creatorMember.player.email).toBeUndefined();
    expect(creatorMember.missedDays).toBeUndefined(); // Should not see missed days
  });

  it('should respect privacy settings - private content for non-public visibility', async () => {
    const mockLevel = {
      id: 'test-level-id',
      name: 'Test Level',
      description: 'A test level',
      inviteCode: 'ABCD1234',
      ownerId: 'creator-user-id',
      isActive: true,
      rule: {
        startTime: '06:00',
        endTime: '22:00',
        maxMissedDays: 3
      },
      settings: {
        checkinContentVisibility: 'private' // Private visibility
      },
      startDate: new Date('2025-08-20T00:00:00Z'),
      endDate: new Date('2025-09-20T00:00:00Z'),
      createdAt: new Date('2025-08-16T10:00:00Z'),
      updatedAt: new Date('2025-08-16T10:00:00Z'),
      levelMembers: [
        {
          id: 'member-1',
          playerId: 'creator-user-id',
          role: 'CREATOR',
          status: 'ACTIVE',
          missedDays: 0,
          joinedAt: new Date('2025-08-16T10:00:00Z'),
          player: {
            id: 'creator-user-id',
            name: 'Creator User',
            email: 'creator@example.com',
            avatarUrl: null
          }
        },
        {
          id: 'member-2',
          playerId: mockUser.id,
          role: 'PLAYER',
          status: 'ACTIVE',
          missedDays: 1,
          joinedAt: new Date('2025-08-17T09:00:00Z'),
          player: {
            id: mockUser.id,
            name: mockUser.name,
            email: mockUser.email,
            avatarUrl: null
          }
        }
      ]
    };

    const mockUserMember = {
      id: 'member-2',
      playerId: mockUser.id,
      levelId: 'test-level-id',
      role: 'PLAYER',
      status: 'ACTIVE'
    };

    prisma.player.findUnique.mockResolvedValue(mockUser);
    prisma.level.findUnique.mockResolvedValue(mockLevel);
    prisma.levelMember.findFirst.mockResolvedValue(mockUserMember);

    const response = await request(app)
      .get('/api/levels/test-level-id')
      .set('Authorization', `Bearer ${validToken}`);

    expect(response.status).toBe(200);
    expect(response.body.level.settings.checkinContentVisibility).toBe('private');
    
    // With private visibility, even PLAYER role should have limited access to member details
    const members = response.body.level.members;
    expect(members).toHaveLength(2);
    
    // Should still show basic member info but with privacy considerations
    const otherMember = members.find(m => m.playerId !== mockUser.id);
    expect(otherMember.player.email).toBeUndefined();
  });

  it('should handle database errors gracefully', async () => {
    prisma.player.findUnique.mockResolvedValue(mockUser);
    prisma.level.findUnique.mockRejectedValue(new Error('Database connection failed'));

    const response = await request(app)
      .get('/api/levels/test-level-id')
      .set('Authorization', `Bearer ${validToken}`);

    expect(response.status).toBe(500);
    expect(response.body.error).toBe('Failed to fetch level details');
  });

  it('should filter out eliminated members from member list', async () => {
    const mockLevel = {
      id: 'test-level-id',
      name: 'Test Level',
      ownerId: mockUser.id,
      isActive: true,
      rule: { startTime: '06:00', endTime: '22:00', maxMissedDays: 3 },
      settings: { checkinContentVisibility: 'public' },
      levelMembers: [
        {
          id: 'member-1',
          playerId: mockUser.id,
          role: 'CREATOR',
          status: 'ACTIVE',
          missedDays: 0,
          player: { id: mockUser.id, name: mockUser.name, email: mockUser.email }
        },
        {
          id: 'member-2',
          playerId: 'player-2',
          role: 'PLAYER',
          status: 'ELIMINATED', // This member should be filtered out
          missedDays: 5,
          player: { id: 'player-2', name: 'Eliminated Player', email: 'eliminated@example.com' }
        },
        {
          id: 'member-3',
          playerId: 'player-3',
          role: 'PLAYER',
          status: 'ACTIVE',
          missedDays: 1,
          player: { id: 'player-3', name: 'Active Player', email: 'active@example.com' }
        }
      ]
    };

    const mockUserMember = {
      id: 'member-1',
      playerId: mockUser.id,
      role: 'CREATOR',
      status: 'ACTIVE'
    };

    prisma.player.findUnique.mockResolvedValue(mockUser);
    prisma.level.findUnique.mockResolvedValue(mockLevel);
    prisma.levelMember.findFirst.mockResolvedValue(mockUserMember);

    const response = await request(app)
      .get('/api/levels/test-level-id')
      .set('Authorization', `Bearer ${validToken}`);

    expect(response.status).toBe(200);
    expect(response.body.level.members).toHaveLength(2); // Should only show ACTIVE members
    
    const memberStatuses = response.body.level.members.map(m => m.status);
    expect(memberStatuses).toEqual(['ACTIVE', 'ACTIVE']);
  });
});

describe('PUT /api/levels/:id', () => {
  let app;
  let validToken;
  const mockUser = {
    id: 'creator-user-id',
    email: 'creator@example.com',
    name: 'Creator User'
  };

  beforeEach(() => {
    app = createTestApp();
    validToken = jwt.sign(mockUser, process.env.JWT_SECRET || 'your-default-secret-change-this');
    jest.clearAllMocks();
  });

  it('should return 401 when no authorization token is provided', async () => {
    const updateData = {
      name: 'Updated Level Name',
      description: 'Updated description'
    };

    const response = await request(app)
      .put('/api/levels/test-level-id')
      .send(updateData);

    expect(response.status).toBe(401);
    expect(response.body.error).toBe('Access token is required');
  });

  it('should return 401 when invalid token is provided', async () => {
    const updateData = {
      name: 'Updated Level Name'
    };

    const response = await request(app)
      .put('/api/levels/test-level-id')
      .set('Authorization', 'Bearer invalid-token')
      .send(updateData);

    expect(response.status).toBe(401);
    expect(response.body.error).toBe('Invalid token');
  });

  it('should return 404 when level is not found', async () => {
    const updateData = {
      name: 'Updated Level Name'
    };

    prisma.player.findUnique.mockResolvedValue(mockUser);
    prisma.level.findUnique.mockResolvedValue(null);

    const response = await request(app)
      .put('/api/levels/non-existent-level')
      .set('Authorization', `Bearer ${validToken}`)
      .send(updateData);

    expect(response.status).toBe(404);
    expect(response.body.error).toBe('Level not found');
  });

  it('should return 403 when user is not the CREATOR', async () => {
    const mockLevel = {
      id: 'test-level-id',
      ownerId: 'other-user-id',
      isActive: true,
      endDate: new Date('2025-09-20T00:00:00Z')
    };

    const mockUserMember = {
      id: 'user-member-id',
      playerId: mockUser.id,
      levelId: 'test-level-id',
      role: 'PLAYER',
      status: 'ACTIVE'
    };

    const updateData = {
      name: 'Updated Level Name'
    };

    prisma.player.findUnique.mockResolvedValue(mockUser);
    prisma.level.findUnique.mockResolvedValue(mockLevel);
    prisma.levelMember.findFirst.mockResolvedValue(mockUserMember);

    const response = await request(app)
      .put('/api/levels/test-level-id')
      .set('Authorization', `Bearer ${validToken}`)
      .send(updateData);

    expect(response.status).toBe(403);
    expect(response.body.error).toBe('Only the level creator can update level settings');
  });

  it('should return 409 when trying to update a completed level', async () => {
    const mockLevel = {
      id: 'test-level-id',
      ownerId: mockUser.id,
      isActive: false,
      endDate: new Date('2025-08-01T00:00:00Z') // Past date
    };

    const mockUserMember = {
      id: 'user-member-id',
      playerId: mockUser.id,
      levelId: 'test-level-id',
      role: 'CREATOR',
      status: 'ACTIVE'
    };

    const updateData = {
      name: 'Updated Level Name'
    };

    prisma.player.findUnique.mockResolvedValue(mockUser);
    prisma.level.findUnique.mockResolvedValue(mockLevel);
    prisma.levelMember.findFirst.mockResolvedValue(mockUserMember);

    const response = await request(app)
      .put('/api/levels/test-level-id')
      .set('Authorization', `Bearer ${validToken}`)
      .send(updateData);

    expect(response.status).toBe(409);
    expect(response.body.error).toBe('Cannot modify completed or inactive level');
  });

  it('should return 400 when rule has invalid time format', async () => {
    const mockLevel = {
      id: 'test-level-id',
      ownerId: mockUser.id,
      isActive: true,
      endDate: new Date('2025-09-20T00:00:00Z')
    };

    const mockUserMember = {
      id: 'user-member-id',
      playerId: mockUser.id,
      levelId: 'test-level-id',
      role: 'CREATOR',
      status: 'ACTIVE'
    };

    const updateData = {
      name: 'Updated Level Name',
      rule: {
        startTime: '25:00', // Invalid time
        endTime: '22:00',
        maxMissedDays: 3
      }
    };

    prisma.player.findUnique.mockResolvedValue(mockUser);
    prisma.level.findUnique.mockResolvedValue(mockLevel);
    prisma.levelMember.findFirst.mockResolvedValue(mockUserMember);

    const response = await request(app)
      .put('/api/levels/test-level-id')
      .set('Authorization', `Bearer ${validToken}`)
      .send(updateData);

    expect(response.status).toBe(400);
    expect(response.body.error).toBe('Invalid time format. Use HH:MM format (00:00-23:59)');
  });

  it('should return 400 when end time is before start time', async () => {
    const mockLevel = {
      id: 'test-level-id',
      ownerId: mockUser.id,
      isActive: true,
      endDate: new Date('2025-09-20T00:00:00Z')
    };

    const mockUserMember = {
      id: 'user-member-id',
      playerId: mockUser.id,
      levelId: 'test-level-id',
      role: 'CREATOR',
      status: 'ACTIVE'
    };

    const updateData = {
      name: 'Updated Level Name',
      rule: {
        startTime: '22:00',
        endTime: '06:00', // End time before start time
        maxMissedDays: 3
      }
    };

    prisma.player.findUnique.mockResolvedValue(mockUser);
    prisma.level.findUnique.mockResolvedValue(mockLevel);
    prisma.levelMember.findFirst.mockResolvedValue(mockUserMember);

    const response = await request(app)
      .put('/api/levels/test-level-id')
      .set('Authorization', `Bearer ${validToken}`)
      .send(updateData);

    expect(response.status).toBe(400);
    expect(response.body.error).toBe('End time must be after start time');
  });

  it('should return 400 when maxMissedDays is not a positive integer', async () => {
    const mockLevel = {
      id: 'test-level-id',
      ownerId: mockUser.id,
      isActive: true,
      endDate: new Date('2025-09-20T00:00:00Z')
    };

    const mockUserMember = {
      id: 'user-member-id',
      playerId: mockUser.id,
      levelId: 'test-level-id',
      role: 'CREATOR',
      status: 'ACTIVE'
    };

    const updateData = {
      name: 'Updated Level Name',
      rule: {
        startTime: '06:00',
        endTime: '22:00',
        maxMissedDays: -1 // Invalid value
      }
    };

    prisma.player.findUnique.mockResolvedValue(mockUser);
    prisma.level.findUnique.mockResolvedValue(mockLevel);
    prisma.levelMember.findFirst.mockResolvedValue(mockUserMember);

    const response = await request(app)
      .put('/api/levels/test-level-id')
      .set('Authorization', `Bearer ${validToken}`)
      .send(updateData);

    expect(response.status).toBe(400);
    expect(response.body.error).toBe('Max missed days must be a positive integer');
  });

  it('should return 400 when checkinContentVisibility is invalid', async () => {
    const mockLevel = {
      id: 'test-level-id',
      ownerId: mockUser.id,
      isActive: true,
      endDate: new Date('2025-09-20T00:00:00Z')
    };

    const mockUserMember = {
      id: 'user-member-id',
      playerId: mockUser.id,
      levelId: 'test-level-id',
      role: 'CREATOR',
      status: 'ACTIVE'
    };

    const updateData = {
      name: 'Updated Level Name',
      settings: {
        checkinContentVisibility: 'invalid_value'
      }
    };

    prisma.player.findUnique.mockResolvedValue(mockUser);
    prisma.level.findUnique.mockResolvedValue(mockLevel);
    prisma.levelMember.findFirst.mockResolvedValue(mockUserMember);

    const response = await request(app)
      .put('/api/levels/test-level-id')
      .set('Authorization', `Bearer ${validToken}`)
      .send(updateData);

    expect(response.status).toBe(400);
    expect(response.body.error).toBe('Checkin content visibility must be: public, private, or creatorOnly');
  });

  it('should successfully update level with basic information only', async () => {
    const mockLevel = {
      id: 'test-level-id',
      name: 'Original Level',
      description: 'Original description',
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
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const mockUserMember = {
      id: 'user-member-id',
      playerId: mockUser.id,
      levelId: 'test-level-id',
      role: 'CREATOR',
      status: 'ACTIVE'
    };

    const updateData = {
      name: 'Updated Level Name',
      description: 'Updated description'
    };

    const mockUpdatedLevel = {
      ...mockLevel,
      name: updateData.name,
      description: updateData.description,
      updatedAt: new Date()
    };

    prisma.player.findUnique.mockResolvedValue(mockUser);
    prisma.level.findUnique.mockResolvedValue(mockLevel);
    prisma.levelMember.findFirst.mockResolvedValue(mockUserMember);
    prisma.level.update.mockResolvedValue(mockUpdatedLevel);

    const response = await request(app)
      .put('/api/levels/test-level-id')
      .set('Authorization', `Bearer ${validToken}`)
      .send(updateData);

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.message).toBe('Level settings updated successfully');
    expect(response.body.level.name).toBe(updateData.name);
    expect(response.body.level.description).toBe(updateData.description);

    expect(prisma.level.update).toHaveBeenCalledWith({
      where: { id: 'test-level-id' },
      data: {
        name: updateData.name,
        description: updateData.description
      }
    });
  });

  it('should successfully update level with rule settings', async () => {
    const mockLevel = {
      id: 'test-level-id',
      name: 'Test Level',
      description: 'Test description',
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
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const mockUserMember = {
      id: 'user-member-id',
      playerId: mockUser.id,
      levelId: 'test-level-id',
      role: 'CREATOR',
      status: 'ACTIVE'
    };

    const updateData = {
      name: 'Updated Level Name',
      rule: {
        startTime: '05:00',
        endTime: '23:00',
        maxMissedDays: 5
      }
    };

    const mockUpdatedLevel = {
      ...mockLevel,
      name: updateData.name,
      rule: updateData.rule,
      updatedAt: new Date()
    };

    prisma.player.findUnique.mockResolvedValue(mockUser);
    prisma.level.findUnique.mockResolvedValue(mockLevel);
    prisma.levelMember.findFirst.mockResolvedValue(mockUserMember);
    prisma.level.update.mockResolvedValue(mockUpdatedLevel);

    const response = await request(app)
      .put('/api/levels/test-level-id')
      .set('Authorization', `Bearer ${validToken}`)
      .send(updateData);

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.level.rule.startTime).toBe('05:00');
    expect(response.body.level.rule.endTime).toBe('23:00');
    expect(response.body.level.rule.maxMissedDays).toBe(5);

    expect(prisma.level.update).toHaveBeenCalledWith({
      where: { id: 'test-level-id' },
      data: {
        name: updateData.name,
        rule: updateData.rule
      }
    });
  });

  it('should successfully update level with privacy settings', async () => {
    const mockLevel = {
      id: 'test-level-id',
      name: 'Test Level',
      description: 'Test description',
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
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const mockUserMember = {
      id: 'user-member-id',
      playerId: mockUser.id,
      levelId: 'test-level-id',
      role: 'CREATOR',
      status: 'ACTIVE'
    };

    const updateData = {
      name: 'Updated Level Name',
      settings: {
        checkinContentVisibility: 'private'
      }
    };

    const mockUpdatedLevel = {
      ...mockLevel,
      name: updateData.name,
      settings: updateData.settings,
      updatedAt: new Date()
    };

    prisma.player.findUnique.mockResolvedValue(mockUser);
    prisma.level.findUnique.mockResolvedValue(mockLevel);
    prisma.levelMember.findFirst.mockResolvedValue(mockUserMember);
    prisma.level.update.mockResolvedValue(mockUpdatedLevel);

    const response = await request(app)
      .put('/api/levels/test-level-id')
      .set('Authorization', `Bearer ${validToken}`)
      .send(updateData);

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.level.settings.checkinContentVisibility).toBe('private');

    expect(prisma.level.update).toHaveBeenCalledWith({
      where: { id: 'test-level-id' },
      data: {
        name: updateData.name,
        settings: updateData.settings
      }
    });
  });

  it('should successfully update level with date settings', async () => {
    const mockLevel = {
      id: 'test-level-id',
      name: 'Test Level',
      description: 'Test description',
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
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const mockUserMember = {
      id: 'user-member-id',
      playerId: mockUser.id,
      levelId: 'test-level-id',
      role: 'CREATOR',
      status: 'ACTIVE'
    };

    const updateData = {
      name: 'Updated Level Name',
      startDate: '2025-08-25T00:00:00Z',
      endDate: '2025-10-25T00:00:00Z'
    };

    const mockUpdatedLevel = {
      ...mockLevel,
      name: updateData.name,
      startDate: new Date(updateData.startDate),
      endDate: new Date(updateData.endDate),
      updatedAt: new Date()
    };

    prisma.player.findUnique.mockResolvedValue(mockUser);
    prisma.level.findUnique.mockResolvedValue(mockLevel);
    prisma.levelMember.findFirst.mockResolvedValue(mockUserMember);
    prisma.level.update.mockResolvedValue(mockUpdatedLevel);

    const response = await request(app)
      .put('/api/levels/test-level-id')
      .set('Authorization', `Bearer ${validToken}`)
      .send(updateData);

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(new Date(response.body.level.startDate)).toEqual(new Date(updateData.startDate));
    expect(new Date(response.body.level.endDate)).toEqual(new Date(updateData.endDate));

    expect(prisma.level.update).toHaveBeenCalledWith({
      where: { id: 'test-level-id' },
      data: {
        name: updateData.name,
        startDate: new Date(updateData.startDate),
        endDate: new Date(updateData.endDate)
      }
    });
  });

  it('should successfully update level with all settings combined', async () => {
    const mockLevel = {
      id: 'test-level-id',
      name: 'Test Level',
      description: 'Test description',
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
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const mockUserMember = {
      id: 'user-member-id',
      playerId: mockUser.id,
      levelId: 'test-level-id',
      role: 'CREATOR',
      status: 'ACTIVE'
    };

    const updateData = {
      name: 'Completely Updated Level',
      description: 'Completely updated description',
      rule: {
        startTime: '07:00',
        endTime: '21:00',
        maxMissedDays: 2
      },
      settings: {
        checkinContentVisibility: 'creatorOnly'
      },
      startDate: '2025-08-30T00:00:00Z',
      endDate: '2025-11-30T00:00:00Z'
    };

    const mockUpdatedLevel = {
      ...mockLevel,
      name: updateData.name,
      description: updateData.description,
      rule: updateData.rule,
      settings: updateData.settings,
      startDate: new Date(updateData.startDate),
      endDate: new Date(updateData.endDate),
      updatedAt: new Date()
    };

    prisma.player.findUnique.mockResolvedValue(mockUser);
    prisma.level.findUnique.mockResolvedValue(mockLevel);
    prisma.levelMember.findFirst.mockResolvedValue(mockUserMember);
    prisma.level.update.mockResolvedValue(mockUpdatedLevel);

    const response = await request(app)
      .put('/api/levels/test-level-id')
      .set('Authorization', `Bearer ${validToken}`)
      .send(updateData);

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.level.name).toBe(updateData.name);
    expect(response.body.level.description).toBe(updateData.description);
    expect(response.body.level.rule).toEqual(updateData.rule);
    expect(response.body.level.settings).toEqual(updateData.settings);
    expect(new Date(response.body.level.startDate)).toEqual(new Date(updateData.startDate));
    expect(new Date(response.body.level.endDate)).toEqual(new Date(updateData.endDate));

    expect(prisma.level.update).toHaveBeenCalledWith({
      where: { id: 'test-level-id' },
      data: {
        name: updateData.name,
        description: updateData.description,
        rule: updateData.rule,
        settings: updateData.settings,
        startDate: new Date(updateData.startDate),
        endDate: new Date(updateData.endDate)
      }
    });
  });

  it('should handle database errors gracefully', async () => {
    const mockLevel = {
      id: 'test-level-id',
      ownerId: mockUser.id,
      isActive: true,
      endDate: new Date('2025-09-20T00:00:00Z')
    };

    const mockUserMember = {
      id: 'user-member-id',
      playerId: mockUser.id,
      levelId: 'test-level-id',
      role: 'CREATOR',
      status: 'ACTIVE'
    };

    const updateData = {
      name: 'Updated Level Name'
    };

    prisma.player.findUnique.mockResolvedValue(mockUser);
    prisma.level.findUnique.mockResolvedValue(mockLevel);
    prisma.levelMember.findFirst.mockResolvedValue(mockUserMember);
    prisma.level.update.mockRejectedValue(new Error('Database connection failed'));

    const response = await request(app)
      .put('/api/levels/test-level-id')
      .set('Authorization', `Bearer ${validToken}`)
      .send(updateData);

    expect(response.status).toBe(500);
    expect(response.body.error).toBe('Failed to update level settings');
  });
});

describe('PUT /api/levels/:id/status', () => {
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

  it('should successfully update level status to inactive (completed) by CREATOR', async () => {
    const mockLevel = {
      id: 'test-level-id',
      name: 'Test Level',
      description: 'Test description',
      ownerId: mockUser.id,
      isActive: true,
      rule: {
        startTime: '05:00',
        endTime: '23:00',
        maxMissedDays: 3
      },
      settings: {
        checkinContentVisibility: 'public'
      },
      startDate: new Date('2025-01-01T00:00:00Z'),
      endDate: new Date('2025-12-31T00:00:00Z'),
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const mockUserMember = {
      id: 'user-member-id',
      playerId: mockUser.id,
      levelId: 'test-level-id',
      role: 'CREATOR',
      status: 'ACTIVE'
    };

    const mockUpdatedLevel = {
      ...mockLevel,
      isActive: false,
      updatedAt: new Date()
    };

    prisma.player.findUnique.mockResolvedValue(mockUser);
    prisma.level.findUnique.mockResolvedValue(mockLevel);
    prisma.levelMember.findFirst.mockResolvedValue(mockUserMember);
    prisma.level.update.mockResolvedValue(mockUpdatedLevel);

    const response = await request(app)
      .put('/api/levels/test-level-id/status')
      .set('Authorization', `Bearer ${validToken}`)
      .send({ isActive: false });

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.message).toBe('Level status updated successfully');
    expect(response.body.level.isActive).toBe(false);
    expect(response.body.level.id).toBe('test-level-id');

    expect(prisma.level.update).toHaveBeenCalledWith({
      where: { id: 'test-level-id' },
      data: { isActive: false }
    });
  });

  it('should successfully reactivate level by CREATOR', async () => {
    const mockLevel = {
      id: 'test-level-id',
      name: 'Test Level',
      description: 'Test description',
      ownerId: mockUser.id,
      isActive: false,
      rule: {
        startTime: '05:00',
        endTime: '23:00',
        maxMissedDays: 3
      },
      settings: {
        checkinContentVisibility: 'public'
      },
      startDate: new Date('2025-01-01T00:00:00Z'),
      endDate: new Date('2025-12-31T00:00:00Z'),
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const mockUserMember = {
      id: 'user-member-id',
      playerId: mockUser.id,
      levelId: 'test-level-id',
      role: 'CREATOR',
      status: 'ACTIVE'
    };

    const mockUpdatedLevel = {
      ...mockLevel,
      isActive: true,
      updatedAt: new Date()
    };

    prisma.player.findUnique.mockResolvedValue(mockUser);
    prisma.level.findUnique.mockResolvedValue(mockLevel);
    prisma.levelMember.findFirst.mockResolvedValue(mockUserMember);
    prisma.level.update.mockResolvedValue(mockUpdatedLevel);

    const response = await request(app)
      .put('/api/levels/test-level-id/status')
      .set('Authorization', `Bearer ${validToken}`)
      .send({ isActive: true });

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.message).toBe('Level status updated successfully');
    expect(response.body.level.isActive).toBe(true);
    expect(response.body.level.id).toBe('test-level-id');

    expect(prisma.level.update).toHaveBeenCalledWith({
      where: { id: 'test-level-id' },
      data: { isActive: true }
    });
  });

  it('should reject status update when user is not CREATOR (403)', async () => {
    const mockLevel = {
      id: 'test-level-id',
      name: 'Test Level',
      ownerId: 'other-user-id',
      isActive: true
    };

    const mockUserMember = {
      id: 'user-member-id',
      playerId: mockUser.id,
      levelId: 'test-level-id',
      role: 'PLAYER',
      status: 'ACTIVE'
    };

    prisma.player.findUnique.mockResolvedValue(mockUser);
    prisma.level.findUnique.mockResolvedValue(mockLevel);
    prisma.levelMember.findFirst.mockResolvedValue(mockUserMember);

    const response = await request(app)
      .put('/api/levels/test-level-id/status')
      .set('Authorization', `Bearer ${validToken}`)
      .send({ isActive: false });

    expect(response.status).toBe(403);
    expect(response.body.error).toBe('Only the level creator can manage level status');

    expect(prisma.level.update).not.toHaveBeenCalled();
  });

  it('should reject status update when user is not a member (403)', async () => {
    const mockLevel = {
      id: 'test-level-id',
      name: 'Test Level',
      ownerId: 'other-user-id',
      isActive: true
    };

    prisma.player.findUnique.mockResolvedValue(mockUser);
    prisma.level.findUnique.mockResolvedValue(mockLevel);
    prisma.levelMember.findFirst.mockResolvedValue(null);

    const response = await request(app)
      .put('/api/levels/test-level-id/status')
      .set('Authorization', `Bearer ${validToken}`)
      .send({ isActive: false });

    expect(response.status).toBe(403);
    expect(response.body.error).toBe('Only the level creator can manage level status');

    expect(prisma.level.update).not.toHaveBeenCalled();
  });

  it('should return 404 when level does not exist', async () => {
    prisma.player.findUnique.mockResolvedValue(mockUser);
    prisma.level.findUnique.mockResolvedValue(null);

    const response = await request(app)
      .put('/api/levels/non-existent-id/status')
      .set('Authorization', `Bearer ${validToken}`)
      .send({ isActive: false });

    expect(response.status).toBe(404);
    expect(response.body.error).toBe('Level not found');

    expect(prisma.level.update).not.toHaveBeenCalled();
  });

  it('should validate isActive field is required (400)', async () => {
    const mockLevel = {
      id: 'test-level-id',
      name: 'Test Level',
      ownerId: mockUser.id,
      isActive: true
    };

    const mockUserMember = {
      id: 'user-member-id',
      playerId: mockUser.id,
      levelId: 'test-level-id',
      role: 'CREATOR',
      status: 'ACTIVE'
    };

    prisma.player.findUnique.mockResolvedValue(mockUser);
    prisma.level.findUnique.mockResolvedValue(mockLevel);
    prisma.levelMember.findFirst.mockResolvedValue(mockUserMember);

    const response = await request(app)
      .put('/api/levels/test-level-id/status')
      .set('Authorization', `Bearer ${validToken}`)
      .send({});

    expect(response.status).toBe(400);
    expect(response.body.error).toBe('isActive field is required');

    expect(prisma.level.update).not.toHaveBeenCalled();
  });

  it('should validate isActive field must be boolean (400)', async () => {
    const mockLevel = {
      id: 'test-level-id',
      name: 'Test Level',
      ownerId: mockUser.id,
      isActive: true
    };

    const mockUserMember = {
      id: 'user-member-id',
      playerId: mockUser.id,
      levelId: 'test-level-id',
      role: 'CREATOR',
      status: 'ACTIVE'
    };

    prisma.player.findUnique.mockResolvedValue(mockUser);
    prisma.level.findUnique.mockResolvedValue(mockLevel);
    prisma.levelMember.findFirst.mockResolvedValue(mockUserMember);

    const response = await request(app)
      .put('/api/levels/test-level-id/status')
      .set('Authorization', `Bearer ${validToken}`)
      .send({ isActive: 'invalid' });

    expect(response.status).toBe(400);
    expect(response.body.error).toBe('isActive must be a boolean value');

    expect(prisma.level.update).not.toHaveBeenCalled();
  });

  it('should prevent status change conflict when no actual change (409)', async () => {
    const mockLevel = {
      id: 'test-level-id',
      name: 'Test Level',
      ownerId: mockUser.id,
      isActive: true
    };

    const mockUserMember = {
      id: 'user-member-id',
      playerId: mockUser.id,
      levelId: 'test-level-id',
      role: 'CREATOR',
      status: 'ACTIVE'
    };

    prisma.player.findUnique.mockResolvedValue(mockUser);
    prisma.level.findUnique.mockResolvedValue(mockLevel);
    prisma.levelMember.findFirst.mockResolvedValue(mockUserMember);

    const response = await request(app)
      .put('/api/levels/test-level-id/status')
      .set('Authorization', `Bearer ${validToken}`)
      .send({ isActive: true });

    expect(response.status).toBe(409);
    expect(response.body.error).toBe('Level is already in the requested status');

    expect(prisma.level.update).not.toHaveBeenCalled();
  });

  it('should handle database errors gracefully', async () => {
    const mockLevel = {
      id: 'test-level-id',
      name: 'Test Level',
      ownerId: mockUser.id,
      isActive: true
    };

    const mockUserMember = {
      id: 'user-member-id',
      playerId: mockUser.id,
      levelId: 'test-level-id',
      role: 'CREATOR',
      status: 'ACTIVE'
    };

    prisma.player.findUnique.mockResolvedValue(mockUser);
    prisma.level.findUnique.mockResolvedValue(mockLevel);
    prisma.levelMember.findFirst.mockResolvedValue(mockUserMember);
    prisma.level.update.mockRejectedValue(new Error('Database connection failed'));

    const response = await request(app)
      .put('/api/levels/test-level-id/status')
      .set('Authorization', `Bearer ${validToken}`)
      .send({ isActive: false });

    expect(response.status).toBe(500);
    expect(response.body.error).toBe('Failed to update level status');
  });
});