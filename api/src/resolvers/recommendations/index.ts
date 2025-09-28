import { client } from '~/common/opensearch.js';
import type { QueryResolvers } from '~/types/__generated__/gqlTypes.js';

const getLikedEmbeddings = async (bookIds: string[]) => {
  const likedRes = await client.search({
    index: 'books',
    size: bookIds.length,
    body: {
      query: {
        ids: { values: bookIds }
      },
      _source: ['summaryEmbedding'],
    },
  });
  return likedRes.body.hits.hits
    .map((hit: any) => hit._source.summaryEmbedding)
    .filter((emb: any) => Array.isArray(emb));
}

const averageEmbeddings = (embeddings: number[][]) => {
  return embeddings[0].map((_, i) =>
    embeddings.reduce((sum, emb) => sum + emb[i], 0) / embeddings.length
  );
}

const recommendations: QueryResolvers['recommendations'] = async (parent, { input }, context) => {
  const { bookIds } = input;
  const limit = typeof input.limit === 'number' && input.limit > 0 ? input.limit : 5;
  if (!bookIds || bookIds.length === 0) return [];
  // Fetch and average the embeddings for liked books
  const avgEmbedding = averageEmbeddings(await getLikedEmbeddings(bookIds));
  // k-NN search, excluding liked books
  const knnRes = await client.search({
    index: 'books',
    size: limit,
    body: {
      query: {
        bool: {
          must_not: [
            { ids: { values: bookIds } }
          ],
          must: [
            {
              knn: {
                summaryEmbedding: {
                  vector: avgEmbedding,
                  k: Number(limit) * 2,
                }
              }
            }
          ]
        }
      }
    }
  });
  // Map results to GraphQL type
  return knnRes.body.hits.hits
    .map((hit: any) => ({
      id: hit._id,
      title: hit._source.title,
      authors: hit._source.authors,
      summaries: hit._source.summaries,
    }));
};

export const recommendationsResolvers = {
  Query: {
    recommendations,
  },
};