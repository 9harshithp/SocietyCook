export const swaggerSpec = {
  openapi: '3.0.0',
  info: {
    title: 'SocietyCook Hyperlocal Shared Cook Platform API',
    version: '2.0.0',
    description:
      'Production-oriented community-first cook-sharing and workforce management platform REST API documentation.'
  },
  servers: [
    {
      url: '/api/v1',
      description: 'Local development server'
    }
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT'
      }
    }
  },
  security: [{ bearerAuth: [] }],
  paths: {
    '/health': {
      get: {
        summary: 'Health check and readiness endpoint',
        responses: { 200: { description: 'API is running' } }
      }
    },
    '/auth/register': {
      post: {
        summary: 'Register a new resident, cook or society manager',
        responses: { 201: { description: 'User registered with tokens' } }
      }
    },
    '/auth/login': {
      post: {
        summary: 'Sign in with email and password',
        responses: { 200: { description: 'Authentication tokens' } }
      }
    },
    '/groups': {
      get: {
        summary: 'Discover cook hiring groups in a society',
        responses: { 200: { description: 'List of groups' } }
      },
      post: {
        summary: 'Create a new cook hiring group',
        responses: { 201: { description: 'Group created' } }
      }
    },
    '/groups/{id}/join': {
      post: {
        summary: 'Join an eligible cook group',
        responses: { 200: { description: 'Joined group' } }
      }
    },
    '/groups/{id}/recommendations': {
      get: {
        summary: 'Smart cook matching and weighted recommendations',
        responses: { 200: { description: 'Ranked cook matches with explanations' } }
      }
    },
    '/groups/{id}/activate': {
      post: {
        summary: 'Activate group, run scheduling engine, create subscriptions & sessions',
        responses: { 200: { description: 'Group activated' } }
      }
    },
    '/pricing/calculate': {
      post: {
        summary: 'Dynamic group pricing calculation',
        responses: { 200: { description: 'Tiered pricing and savings breakdown' } }
      }
    },
    '/sessions/{id}/attendance': {
      post: {
        summary: 'Check in / check out with OTP',
        responses: { 200: { description: 'Attendance updated' } }
      }
    }
  }
};
