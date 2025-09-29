import { openSearchClient } from "~/common/opensearch.js";

export const getLikedEmbeddings = async (bookIds: string[]) => {
  const likedRes = await openSearchClient.search({
    index: "books",
    size: bookIds.length,
    body: {
      query: {
        ids: { values: bookIds }
      },
      _source: ["summaryEmbedding"]
    }
  });
  return likedRes.body.hits.hits
    .map((hit: any) => hit._source.summaryEmbedding)
    .filter((emb: any) => Array.isArray(emb));
};

export const averageEmbeddings = (embeddings: number[][]) => {
  return embeddings.length
    ? embeddings[0].map(
        (_, i) => embeddings.reduce((sum, emb) => sum + emb[i], 0) / embeddings.length
      )
    : [];
};
