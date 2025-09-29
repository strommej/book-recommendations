import { startServerAndCreateLambdaHandler, handlers } from "@as-integrations/aws-lambda";
import { createApolloServer } from "./createServer.js";

const server = createApolloServer();
export const graphqlHandler = startServerAndCreateLambdaHandler(
  // @ts-ignore
  server,
  handlers.createAPIGatewayProxyEventRequestHandler(),
  {
    middleware: [],
    context: async ({ event, context }) => {
      const claims = event?.requestContext?.authorizer?.claims;
      return {
        requestId: context.awsRequestId,
        userId: claims?.email
      };
    }
  }
);
