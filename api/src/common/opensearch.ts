import { Client } from "@opensearch-project/opensearch";
export const openSearchClient = new Client({
  node: process.env.OPENSEARCH_ENDPOINT || "http://localhost:9200",
  auth:
    process.env.OPENSEARCH_USERNAME && process.env.OPENSEARCH_PASSWORD
      ? {
          username: process.env.OPENSEARCH_USERNAME,
          password: process.env.OPENSEARCH_PASSWORD
        }
      : undefined
});
