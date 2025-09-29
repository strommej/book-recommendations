import { startStandaloneServer } from "@apollo/server/standalone";
import { createApolloServer } from "./createServer.js";

export async function startDevServer() {
  const server = createApolloServer();
  const { url } = await startStandaloneServer(server, {
    listen: { port: 4000 },
    context: async ({ req }) => ({
      requestId: `dev-${Date.now()}`,
      userId: "local-dev-user" // Mock userId for local development
    })
  });

  console.log(`🚀 Apollo Server ready at ${url}`);
  console.log(`📊 GraphQL Playground available at ${url}`);
}

startDevServer().catch((error) => {
  console.error("Failed to start development server:", error);
  process.exit(1);
});
