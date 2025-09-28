import type { QueryResolvers } from '../../types/__generated__/gqlTypes.js';

const hello: QueryResolvers['hello'] = () => ({
  greeting: 'Hello from Apollo Server!',
  timestamp: new Date().toISOString(),
});

export const helloResolvers = {
  Query: {
    hello,
  },
};