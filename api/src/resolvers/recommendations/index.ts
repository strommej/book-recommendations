import { openSearchClient } from "~/common/opensearch.js";
import type { Book, QueryRecommendationsArgs } from "~/types/__generated__/gqlTypes.js";
import { averageEmbeddings, getLikedEmbeddings } from "./utils.js";
import { likedBooks } from "../likes/index.js";

export async function recommendations(
  parent: unknown,
  { input }: QueryRecommendationsArgs,
  context: { userId: string }
): Promise<Book[]> {
  let bookIds = input.bookIds;
  if (!bookIds || bookIds.length === 0) {
    const liked = await likedBooks(parent, { limit: 20 }, context);
    bookIds = liked.map((b) => b.bookId);
  }
  const limit = typeof input.limit === "number" && input.limit > 0 ? input.limit : 5;
  const avgEmbedding = averageEmbeddings(await getLikedEmbeddings(bookIds));
  const knnRes = await openSearchClient.search({
    index: "books",
    size: limit,
    body: {
      query: {
        bool: {
          must_not: [{ ids: { values: bookIds } }],
          must: avgEmbedding.length
            ? [
                {
                  knn: {
                    summaryEmbedding: {
                      vector: avgEmbedding,
                      k: Number(limit) * 2
                    }
                  }
                }
              ]
            : undefined
        }
      }
    }
  });
  return knnRes.body.hits.hits.map((hit: any) => ({
    id: hit._id,
    title: hit._source.title,
    authors: hit._source.authors,
    summaries: hit._source.summaries
  }));
}

export const recommendationsResolvers = {
  Query: {
    recommendations
  }
};
