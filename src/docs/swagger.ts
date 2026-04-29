import swaggerJSDoc from 'swagger-jsdoc';

const serverUrl = 'https://kiddo-backend-l4qf.onrender.com/api/v1';

export const swaggerSpec = swaggerJSDoc({
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'KidDo API',
      version: '1.0.0',
      description: 'REST API for KidDo mobile and admin applications.',
    },
    servers: [{ url: serverUrl }],
    tags: [
      { name: 'Health', description: 'Service health endpoints' },
      { name: 'Auth', description: 'Authentication and account bootstrapping' },
      { name: 'Tasks', description: 'Task management' },
      { name: 'Rewards', description: 'Reward management and redemption' },
      { name: 'Users', description: 'User profile and family member management' },
      { name: 'Leaderboard', description: 'Family leaderboard' },
      { name: 'Admin', description: 'Admin-only moderation endpoints' },
      { name: 'Games', description: 'Game reward claim endpoints' },
      { name: 'Activity', description: 'Family activity feed' },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
      schemas: {
        ErrorResponse: {
          type: 'object',
          properties: {
            message: { type: 'string' },
            details: {},
          },
        },
        AuthTokens: {
          type: 'object',
          properties: {
            accessToken: { type: 'string' },
            refreshToken: { type: 'string' },
          },
        },
        User: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            familyId: { type: 'string', nullable: true },
            role: { type: 'string', enum: ['admin', 'parent', 'child'] },
            firstName: { type: 'string' },
            lastName: { type: 'string' },
            email: { type: 'string', nullable: true },
            username: { type: 'string', nullable: true },
            childLoginCode: { type: 'string', nullable: true },
            avatar: { type: 'string', nullable: true },
            standard: { type: 'number' },
            points: { type: 'number' },
            streak: { type: 'number' },
            chessWins: { type: 'number' },
            chessGamesPlayed: { type: 'number' },
            memoryWins: { type: 'number' },
            memoryGamesPlayed: { type: 'number' },
            mathWins: { type: 'number' },
            mathGamesPlayed: { type: 'number' },
            patternWins: { type: 'number' },
            patternGamesPlayed: { type: 'number' },
            lastChessRewardAt: { type: 'string', format: 'date-time', nullable: true },
          },
        },
        AuthResponse: {
          allOf: [
            { $ref: '#/components/schemas/AuthTokens' },
            {
              type: 'object',
              properties: {
                user: { $ref: '#/components/schemas/User' },
              },
            },
          ],
        },
        ParentRegisterRequest: {
          type: 'object',
          required: ['firstName', 'familyName', 'email', 'password'],
          properties: {
            firstName: { type: 'string' },
            lastName: { type: 'string' },
            familyName: { type: 'string' },
            email: { type: 'string', format: 'email' },
            password: { type: 'string', minLength: 8 },
          },
        },
        LoginRequest: {
          type: 'object',
          required: ['identifier', 'password'],
          properties: {
            identifier: { type: 'string' },
            password: { type: 'string' },
            role: { type: 'string', enum: ['admin', 'parent'] },
          },
        },
        ChildCodeLoginRequest: {
          type: 'object',
          required: ['code'],
          properties: {
            code: { type: 'string' },
          },
        },
        GoogleMobileLoginRequest: {
          type: 'object',
          required: ['idToken'],
          properties: {
            idToken: { type: 'string' },
          },
        },
        CreateChildRequest: {
          type: 'object',
          required: ['firstName', 'standard'],
          properties: {
            firstName: { type: 'string' },
            lastName: { type: 'string' },
            avatar: { type: 'string' },
            standard: { type: 'number', minimum: 1, maximum: 12 },
          },
        },
        Task: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            familyId: { type: 'string' },
            createdBy: { type: 'string' },
            assignedTo: { type: 'string' },
            title: { type: 'string' },
            description: { type: 'string' },
            category: { type: 'string' },
            points: { type: 'number' },
            status: { type: 'string', enum: ['todo', 'in_progress', 'completed', 'approved'] },
            dueDate: { type: 'string', format: 'date-time', nullable: true },
          },
        },
        TaskCreateRequest: {
          type: 'object',
          required: ['assignedTo', 'title', 'points'],
          properties: {
            assignedTo: { type: 'string' },
            title: { type: 'string' },
            description: { type: 'string' },
            category: { type: 'string' },
            points: { type: 'number' },
            dueDate: { type: 'string', format: 'date-time' },
            rewardUnlockThreshold: { type: 'number' },
          },
        },
        TaskUpdateRequest: {
          type: 'object',
          properties: {
            assignedTo: { type: 'string' },
            title: { type: 'string' },
            description: { type: 'string' },
            category: { type: 'string' },
            points: { type: 'number' },
            status: { type: 'string', enum: ['todo', 'in_progress', 'completed', 'approved'] },
            dueDate: { type: 'string', format: 'date-time', nullable: true },
          },
        },
        Reward: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            familyId: { type: 'string' },
            title: { type: 'string' },
            description: { type: 'string' },
            pointsCost: { type: 'number' },
            unlockedAtStreak: { type: 'number' },
            isActive: { type: 'boolean' },
          },
        },
        RewardCreateRequest: {
          type: 'object',
          required: ['title', 'pointsCost'],
          properties: {
            title: { type: 'string' },
            description: { type: 'string' },
            pointsCost: { type: 'number' },
            unlockedAtStreak: { type: 'number' },
          },
        },
        RewardUpdateRequest: {
          type: 'object',
          properties: {
            title: { type: 'string' },
            description: { type: 'string' },
            pointsCost: { type: 'number' },
            unlockedAtStreak: { type: 'number' },
            isActive: { type: 'boolean' },
          },
        },
        UpdateMeRequest: {
          type: 'object',
          properties: {
            avatar: { type: 'string' },
            notificationToken: { type: 'string' },
          },
        },
        NotificationTokenRequest: {
          type: 'object',
          required: ['notificationToken'],
          properties: {
            notificationToken: { type: 'string' },
          },
        },
        UpdateChildRequest: {
          type: 'object',
          properties: {
            firstName: { type: 'string' },
            lastName: { type: 'string' },
            username: { type: 'string' },
            avatar: { type: 'string' },
            standard: { type: 'number', minimum: 1, maximum: 12 },
            isActive: { type: 'boolean' },
          },
        },
      },
    },
    security: [{ bearerAuth: [] }],
    paths: {
      '/health': {
        get: {
          tags: ['Health'],
          summary: 'Check backend health',
          security: [],
          responses: {
            '200': {
              description: 'Backend is healthy',
            },
          },
        },
      },
      '/auth/parent/register': {
        post: {
          tags: ['Auth'],
          summary: 'Register a parent and create a family',
          security: [],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ParentRegisterRequest' },
              },
            },
          },
          responses: {
            '201': {
              description: 'Parent account created',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/AuthResponse' },
                },
              },
            },
          },
        },
      },
      '/auth/login': {
        post: {
          tags: ['Auth'],
          summary: 'Login as admin or parent',
          security: [],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/LoginRequest' },
              },
            },
          },
          responses: {
            '200': {
              description: 'Authenticated successfully',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/AuthResponse' },
                },
              },
            },
          },
        },
      },
      '/auth/children/login': {
        post: {
          tags: ['Auth'],
          summary: 'Login as a child using access code',
          security: [],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ChildCodeLoginRequest' },
              },
            },
          },
          responses: {
            '200': {
              description: 'Authenticated successfully',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/AuthResponse' },
                },
              },
            },
          },
        },
      },
      '/auth/google/mobile': {
        post: {
          tags: ['Auth'],
          summary: 'Login or register a parent via Google mobile token',
          security: [],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/GoogleMobileLoginRequest' },
              },
            },
          },
          responses: {
            '200': {
              description: 'Authenticated successfully',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/AuthResponse' },
                },
              },
            },
          },
        },
      },
      '/auth/me': {
        get: {
          tags: ['Auth'],
          summary: 'Get current authenticated user profile',
          responses: {
            '200': {
              description: 'Current user profile',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/User' },
                },
              },
            },
          },
        },
      },
      '/auth/children': {
        post: {
          tags: ['Auth'],
          summary: 'Create a child account',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/CreateChildRequest' },
              },
            },
          },
          responses: {
            '201': {
              description: 'Child account created',
            },
          },
        },
      },
      '/tasks': {
        get: {
          tags: ['Tasks'],
          summary: 'List tasks for the current family or child',
          responses: {
            '200': {
              description: 'Task list',
              content: {
                'application/json': {
                  schema: {
                    type: 'array',
                    items: { $ref: '#/components/schemas/Task' },
                  },
                },
              },
            },
          },
        },
        post: {
          tags: ['Tasks'],
          summary: 'Create a task',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/TaskCreateRequest' },
              },
            },
          },
          responses: {
            '201': {
              description: 'Task created',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Task' },
                },
              },
            },
          },
        },
      },
      '/tasks/{taskId}': {
        patch: {
          tags: ['Tasks'],
          summary: 'Update a task',
          parameters: [
            {
              in: 'path',
              name: 'taskId',
              required: true,
              schema: { type: 'string' },
            },
          ],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/TaskUpdateRequest' },
              },
            },
          },
          responses: {
            '200': {
              description: 'Task updated',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Task' },
                },
              },
            },
          },
        },
        delete: {
          tags: ['Tasks'],
          summary: 'Delete a task',
          parameters: [
            {
              in: 'path',
              name: 'taskId',
              required: true,
              schema: { type: 'string' },
            },
          ],
          responses: {
            '200': {
              description: 'Task deleted',
            },
          },
        },
      },
      '/rewards': {
        get: {
          tags: ['Rewards'],
          summary: 'List rewards',
          responses: {
            '200': {
              description: 'Reward list',
              content: {
                'application/json': {
                  schema: {
                    type: 'array',
                    items: { $ref: '#/components/schemas/Reward' },
                  },
                },
              },
            },
          },
        },
        post: {
          tags: ['Rewards'],
          summary: 'Create a reward',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/RewardCreateRequest' },
              },
            },
          },
          responses: {
            '201': {
              description: 'Reward created',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Reward' },
                },
              },
            },
          },
        },
      },
      '/rewards/{rewardId}': {
        patch: {
          tags: ['Rewards'],
          summary: 'Update a reward',
          parameters: [
            {
              in: 'path',
              name: 'rewardId',
              required: true,
              schema: { type: 'string' },
            },
          ],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/RewardUpdateRequest' },
              },
            },
          },
          responses: {
            '200': {
              description: 'Reward updated',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Reward' },
                },
              },
            },
          },
        },
        delete: {
          tags: ['Rewards'],
          summary: 'Delete a reward',
          parameters: [
            {
              in: 'path',
              name: 'rewardId',
              required: true,
              schema: { type: 'string' },
            },
          ],
          responses: {
            '200': {
              description: 'Reward deleted',
            },
          },
        },
      },
      '/rewards/{rewardId}/redeem': {
        post: {
          tags: ['Rewards'],
          summary: 'Redeem a reward as a child',
          parameters: [
            {
              in: 'path',
              name: 'rewardId',
              required: true,
              schema: { type: 'string' },
            },
          ],
          responses: {
            '200': {
              description: 'Reward redeemed',
            },
          },
        },
      },
      '/users/me': {
        patch: {
          tags: ['Users'],
          summary: 'Update current user avatar or notification token',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/UpdateMeRequest' },
              },
            },
          },
          responses: {
            '200': {
              description: 'User updated',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/User' },
                },
              },
            },
          },
        },
      },
      '/users/me/notification-token': {
        post: {
          tags: ['Users'],
          summary: 'Register push notification token for current user',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/NotificationTokenRequest' },
              },
            },
          },
          responses: {
            '200': {
              description: 'Notification token saved',
            },
          },
        },
      },
      '/users/family': {
        get: {
          tags: ['Users'],
          summary: 'List users in the current family',
          responses: {
            '200': {
              description: 'Family users',
              content: {
                'application/json': {
                  schema: {
                    type: 'array',
                    items: { $ref: '#/components/schemas/User' },
                  },
                },
              },
            },
          },
        },
      },
      '/users/all': {
        get: {
          tags: ['Users'],
          summary: 'List all users as admin',
          responses: {
            '200': {
              description: 'All users',
              content: {
                'application/json': {
                  schema: {
                    type: 'array',
                    items: { $ref: '#/components/schemas/User' },
                  },
                },
              },
            },
          },
        },
      },
      '/users/{userId}': {
        patch: {
          tags: ['Users'],
          summary: 'Update a child user',
          parameters: [
            {
              in: 'path',
              name: 'userId',
              required: true,
              schema: { type: 'string' },
            },
          ],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/UpdateChildRequest' },
              },
            },
          },
          responses: {
            '200': {
              description: 'Child updated',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/User' },
                },
              },
            },
          },
        },
      },
      '/users/{userId}/regenerate-code': {
        post: {
          tags: ['Users'],
          summary: 'Regenerate child login code',
          parameters: [
            {
              in: 'path',
              name: 'userId',
              required: true,
              schema: { type: 'string' },
            },
          ],
          responses: {
            '200': {
              description: 'Child code regenerated',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/User' },
                },
              },
            },
          },
        },
      },
      '/leaderboard': {
        get: {
          tags: ['Leaderboard'],
          summary: 'Get family leaderboard',
          responses: {
            '200': {
              description: 'Leaderboard response',
            },
          },
        },
      },
      '/admin/dashboard': {
        get: {
          tags: ['Admin'],
          summary: 'Get admin dashboard data',
          responses: {
            '200': {
              description: 'Dashboard response',
            },
          },
        },
      },
      '/admin/tasks': {
        get: {
          tags: ['Admin'],
          summary: 'Moderate tasks as admin',
          responses: {
            '200': {
              description: 'Admin task moderation response',
            },
          },
        },
      },
      '/admin/rewards': {
        get: {
          tags: ['Admin'],
          summary: 'Moderate rewards as admin',
          responses: {
            '200': {
              description: 'Admin reward moderation response',
            },
          },
        },
      },
      '/games/chess/reward': {
        post: {
          tags: ['Games'],
          summary: 'Claim chess game reward',
          responses: {
            '200': {
              description: 'Reward claimed',
            },
          },
        },
      },
      '/games/memory/reward': {
        post: {
          tags: ['Games'],
          summary: 'Claim memory game reward',
          responses: {
            '200': {
              description: 'Reward claimed',
            },
          },
        },
      },
      '/games/math/reward': {
        post: {
          tags: ['Games'],
          summary: 'Claim math game reward',
          responses: {
            '200': {
              description: 'Reward claimed',
            },
          },
        },
      },
      '/games/pattern/reward': {
        post: {
          tags: ['Games'],
          summary: 'Claim pattern game reward',
          responses: {
            '200': {
              description: 'Reward claimed',
            },
          },
        },
      },
      '/games/puzzle/reward': {
        post: {
          tags: ['Games'],
          summary: 'Claim jigsaw puzzle game reward',
          responses: {
            '200': {
              description: 'Reward claimed',
            },
          },
        },
      },
      '/activity': {
        get: {
          tags: ['Activity'],
          summary: 'List family activity feed',
          responses: {
            '200': {
              description: 'Activity feed response',
            },
          },
        },
      },
    },
  },
  apis: [],
});
