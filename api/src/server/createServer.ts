import { ApolloServer } from '@apollo/server';
import { readFileSync } from 'fs';
import { join } from 'path';
import { resolvers } from '../resolvers/index.js';

export function createApolloServer() {
  // Load GraphQL schema from external file
  const typeDefs = readFileSync(join(__dirname, '../schema/schema.graphql'), 'utf8');

  // Create Apollo Server instance
  return new ApolloServer({
    typeDefs,
    resolvers,
    // Disable introspection and playground in production
    introspection: process.env.NODE_ENV !== 'production',
    plugins: [],
  });
}