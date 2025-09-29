import { startServerAndCreateLambdaHandler, handlers } from '@as-integrations/aws-lambda';
import { createApolloServer } from './createServer.js';

const server = createApolloServer();
export const graphqlHandler = startServerAndCreateLambdaHandler(
  server,
  handlers.createAPIGatewayProxyEventRequestHandler(),
  {
    middleware: [],
    context: async ({ event, context }) => {
      return {
        requestId: context.awsRequestId
      };
    },
  }
);