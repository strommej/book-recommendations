import { ApolloServer } from "@apollo/server";
import { readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { resolvers } from "../resolvers/index.js";

const __dirname = dirname(fileURLToPath(import.meta.url));

export function createApolloServer() {
  const typeDefs = readFileSync(join(__dirname, "../schema/schema.graphql"), "utf8");
  return new ApolloServer({
    typeDefs,
    resolvers,
    introspection: process.env.NODE_ENV !== "production",
    plugins: []
  });
}
