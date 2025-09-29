import { ApolloServer } from '@apollo/server';
import { readFileSync } from 'fs';
import { join } from 'path';
import { resolvers } from '../resolvers/index.js';

export function createApolloServer() {
  const typeDefs = readFileSync(join(__dirname, '../schema/schema.graphql'), 'utf8');
  return new ApolloServer({
    typeDefs,
    resolvers,
    introspection: process.env.NODE_ENV !== 'production',
    plugins: [],
  });
}