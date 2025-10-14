const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Raffle Draw API',
      version: '1.0.0',
      description: 'A comprehensive API for managing raffle draw events',
      contact: {
        name: 'API Support',
        email: 'support@raffledraw.com'
      },
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT'
      }
    },
    servers: [
      {
        url: 'http://localhost:5000',
        description: 'Development server'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Enter JWT token'
        }
      },
      schemas: {
        User: {
          type: 'object',
          required: ['username', 'email', 'password', 'firstName', 'lastName'],
          properties: {
            id: {
              type: 'integer',
              description: 'User ID'
            },
            username: {
              type: 'string',
              description: 'Unique username',
              example: 'john_doe'
            },
            email: {
              type: 'string',
              format: 'email',
              description: 'User email address',
              example: 'john@example.com'
            },
            firstName: {
              type: 'string',
              description: 'User first name',
              example: 'John'
            },
            lastName: {
              type: 'string',
              description: 'User last name',
              example: 'Doe'
            },
            role: {
              type: 'string',
              enum: ['admin', 'user'],
              description: 'User role',
              example: 'user'
            },
            isActive: {
              type: 'boolean',
              description: 'Whether user account is active',
              example: true
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              description: 'Account creation timestamp'
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
              description: 'Last update timestamp'
            }
          }
        },
        RaffleDraw: {
          type: 'object',
          required: ['title', 'drawDate'],
          properties: {
            id: {
              type: 'integer',
              description: 'Raffle draw ID'
            },
            title: {
              type: 'string',
              description: 'Raffle draw title',
              example: 'Summer Giveaway 2024'
            },
            description: {
              type: 'string',
              description: 'Raffle draw description',
              example: 'Win amazing prizes this summer!'
            },
            drawDate: {
              type: 'string',
              format: 'date-time',
              description: 'Date and time for the draw',
              example: '2024-07-15T18:00:00Z'
            },
            status: {
              type: 'string',
              enum: ['draft', 'active', 'completed', 'cancelled'],
              description: 'Current status of the raffle draw',
              example: 'active'
            },
            maxParticipants: {
              type: 'integer',
              description: 'Maximum number of participants allowed',
              example: 100
            },
            userId: {
              type: 'integer',
              description: 'ID of the user who created this raffle draw'
            },
            isPublic: {
              type: 'boolean',
              description: 'Whether the raffle draw is public',
              example: true
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              description: 'Creation timestamp'
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
              description: 'Last update timestamp'
            }
          }
        },
        Prize: {
          type: 'object',
          required: ['name', 'position'],
          properties: {
            id: {
              type: 'integer',
              description: 'Prize ID'
            },
            name: {
              type: 'string',
              description: 'Prize name',
              example: 'iPhone 15 Pro'
            },
            description: {
              type: 'string',
              description: 'Prize description',
              example: 'Latest iPhone model with 256GB storage'
            },
            value: {
              type: 'number',
              format: 'decimal',
              description: 'Prize monetary value',
              example: 999.99
            },
            position: {
              type: 'integer',
              description: 'Prize position/rank',
              example: 1
            },
            raffleDrawId: {
              type: 'integer',
              description: 'ID of the raffle draw this prize belongs to'
            },
            winnerId: {
              type: 'integer',
              description: 'ID of the participant who won this prize',
              nullable: true
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              description: 'Creation timestamp'
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
              description: 'Last update timestamp'
            }
          }
        },
        Participant: {
          type: 'object',
          required: ['name'],
          properties: {
            id: {
              type: 'integer',
              description: 'Participant ID'
            },
            name: {
              type: 'string',
              description: 'Participant name',
              example: 'Jane Smith'
            },
            email: {
              type: 'string',
              format: 'email',
              description: 'Participant email address',
              example: 'jane@example.com'
            },
            phone: {
              type: 'string',
              description: 'Participant phone number',
              example: '+1234567890'
            },
            ticketNumber: {
              type: 'string',
              description: 'Unique ticket number',
              example: 'TKT-1703123456789-abc123def'
            },
            raffleDrawId: {
              type: 'integer',
              description: 'ID of the raffle draw this participant is in'
            },
            isWinner: {
              type: 'boolean',
              description: 'Whether this participant won a prize',
              example: false
            },
            prizeId: {
              type: 'integer',
              description: 'ID of the prize won by this participant',
              nullable: true
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              description: 'Creation timestamp'
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
              description: 'Last update timestamp'
            }
          }
        },
        Error: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: false
            },
            message: {
              type: 'string',
              example: 'Error message'
            },
            errors: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  field: {
                    type: 'string'
                  },
                  message: {
                    type: 'string'
                  }
                }
              }
            }
          }
        },
        Success: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: true
            },
            message: {
              type: 'string',
              example: 'Operation successful'
            },
            data: {
              type: 'object',
              description: 'Response data'
            }
          }
        }
      }
    },
    security: [
      {
        bearerAuth: []
      }
    ]
  },
  apis: ['./routes/*.js'], // Path to the API files
};

const specs = swaggerJsdoc(options);

module.exports = {
  swaggerUi,
  specs
};

