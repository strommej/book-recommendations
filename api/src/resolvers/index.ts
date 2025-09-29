import { likesResolvers } from "./likes/index.js";
import { recommendationsResolvers } from "./recommendations/index.js";

// Combine all resolvers
export const resolvers = {
  Query: {
    ...recommendationsResolvers.Query,
    ...likesResolvers.Query
  },
  Mutation: {
    ...likesResolvers.Mutation
  }
};
