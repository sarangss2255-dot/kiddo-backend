import swaggerJSDoc from 'swagger-jsdoc';

export const swaggerSpec = swaggerJSDoc({
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'KidDo API',
      version: '1.0.0',
      description: 'REST API for KidDo mobile and admin applications.',
    },
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
    },
    security: [{ bearerAuth: [] }],
    servers: [{ url: 'http://localhost:4000/api/v1' }],
  },
  apis: [],
});
