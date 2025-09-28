import { startServerAndCreateLambdaHandler, handlers } from '@as-integrations/aws-lambda';
import { createApolloServer } from './createServer.js';

// Create Apollo Server instance
const server = createApolloServer();

// Lambda handler for API Gateway
export const graphqlHandler = startServerAndCreateLambdaHandler(
  server,
  // Transform the event and context
  handlers.createAPIGatewayProxyEventV2RequestHandler(),
  {
    middleware: [
      // Add any middleware here
    ],
    context: async ({ event, context }) => {
      // Add custom context
      return {
        requestId: context.awsRequestId,
        // Add your services here later
        // bookIndexer: new BookIndexer(),
      };
    },
  }
);

// Health check handler for API Gateway health checks
export const healthHandler = async () => {
  return {
    statusCode: 200,
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      status: 'healthy',
      timestamp: new Date().toISOString(),
    }),
  };
};

