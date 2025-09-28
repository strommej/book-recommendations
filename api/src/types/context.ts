// GraphQL context type for resolvers
export interface GraphQLContext {
  requestId: string;
  // Add future services here:
  // bookIndexer?: BookIndexer;
  // opensearchClient?: Client;
}