import { openSearchClient } from "~/common/opensearch.js";
import { recommendations } from "./index.js";
import * as likes from "../likes/index.js";
import * as embeddingUtils from "./utils.js";
import type { Book } from "~/types/__generated__/gqlTypes.js";

vi.mock("~/common/opensearch", () => ({
  openSearchClient: {
    search: vi.fn()
  }
}));

type RecommendationsResolver = (
  parent: unknown,
  args: { input: { bookIds: string[]; limit?: number } },
  context: unknown,
  info?: unknown
) => Promise<Book[]>;

const likedEmbeddings = [
  [1, 1, 1],
  [3, 3, 3]
];
vi.spyOn(embeddingUtils, "getLikedEmbeddings").mockResolvedValue(likedEmbeddings);
vi.spyOn(embeddingUtils, "averageEmbeddings").mockReturnValue([2, 2, 2]);

describe("recommendations resolver", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns recommendations excluding liked bookIds", async () => {
    (openSearchClient.search as ReturnType<typeof vi.fn>).mockResolvedValue({
      body: {
        hits: {
          hits: [
            {
              _id: "bookA",
              _source: {
                title: "Book A",
                authors: ["Author A"],
                summaries: ["Summary A"]
              }
            },
            {
              _id: "bookB",
              _source: {
                title: "Book B",
                authors: ["Author B"],
                summaries: ["Summary B"]
              }
            }
          ]
        }
      }
    });
    const args = { input: { bookIds: ["book1", "book2"], limit: 2 } };
    const result = await recommendations({}, args, { userId: "user1" });
    expect(result).toEqual([
      { id: "bookA", title: "Book A", authors: ["Author A"], summaries: ["Summary A"] },
      { id: "bookB", title: "Book B", authors: ["Author B"], summaries: ["Summary B"] }
    ]);
    const avgEmbedding = [2, 2, 2];
    expect(openSearchClient.search).toHaveBeenCalledWith(
      expect.objectContaining({
        index: "books",
        size: 2,
        body: expect.objectContaining({
          query: expect.objectContaining({
            bool: expect.objectContaining({
              must_not: [{ ids: { values: ["book1", "book2"] } }],
              must: [
                {
                  knn: {
                    summaryEmbedding: {
                      vector: avgEmbedding,
                      k: 4
                    }
                  }
                }
              ]
            })
          })
        })
      })
    );
  });

  it("falls back to likedBooks when bookIds is not provided", async () => {
    // Mock likedBooks to return some liked books
    vi.spyOn(likes, "likedBooks").mockResolvedValue([
      { userId: "user1", bookId: "id1", createdDate: "2025-09-29T00:00:00Z" },
      { userId: "user1", bookId: "id2", createdDate: "2025-09-29T00:00:01Z" }
    ]);
    // Mock getLikedEmbeddings and averageEmbeddings
    const mockAvgEmbedding = [0.1, 0.2, 0.3];
    vi.mocked(embeddingUtils.getLikedEmbeddings).mockResolvedValue([mockAvgEmbedding]);
    vi.mocked(embeddingUtils.averageEmbeddings).mockReturnValue(mockAvgEmbedding);
    (openSearchClient.search as ReturnType<typeof vi.fn>).mockResolvedValue({
      body: {
        hits: {
          hits: [{ _id: "id3", _source: { title: "Book 3", authors: ["A"], summaries: ["S"] } }]
        }
      }
    });

    const result = await recommendations(
      {},
      { input: { bookIds: [], limit: 10 } },
      { userId: "user1" }
    );
    expect(likes.likedBooks).toHaveBeenCalledWith({}, { limit: 20 }, { userId: "user1" });
    expect(result).toEqual([{ id: "id3", title: "Book 3", authors: ["A"], summaries: ["S"] }]);
  });

  it("returns empty array if OpenSearch returns no hits", async () => {
    (openSearchClient.search as ReturnType<typeof vi.fn>).mockResolvedValue({
      body: {
        hits: { hits: [] }
      }
    });
    const args = { input: { bookIds: ["book1"], limit: 2 } };
    const result = await (
      recommendations as (
        parent: unknown,
        args: { input: { bookIds: string[]; limit?: number } },
        context: unknown,
        info?: unknown
      ) => Promise<any>
    )({}, args, {});
    expect(result).toEqual([]);
  });

  it("defaults to limit 5 if not provided", async () => {
    (openSearchClient.search as ReturnType<typeof vi.fn>).mockResolvedValue({
      body: {
        hits: {
          hits: [
            {
              _id: "bookA",
              _source: { title: "Book A", authors: ["Author A"], summaries: ["Summary A"] }
            }
          ]
        }
      }
    });
    const args = { input: { bookIds: ["book1"] } };
    await recommendations({}, args, { userId: "user1" });
    expect((openSearchClient.search as ReturnType<typeof vi.fn>).mock.calls[0][0].size).toBe(5);
  });

  it("handles OpenSearch errors gracefully", async () => {
    (openSearchClient.search as ReturnType<typeof vi.fn>).mockRejectedValue(
      new Error("OpenSearch error")
    );
    const args = { input: { bookIds: ["book1"], limit: 2 } };
    await expect(recommendations({}, args, { userId: "user1" })).rejects.toThrow(
      "OpenSearch error"
    );
  });

  it("must_not excludes all bookIds from results", async () => {
    (openSearchClient.search as ReturnType<typeof vi.fn>).mockResolvedValue({
      body: {
        hits: {
          hits: [
            {
              _id: "bookA",
              _source: { title: "Book A", authors: ["Author A"], summaries: ["Summary A"] }
            },
            {
              _id: "bookB",
              _source: { title: "Book B", authors: ["Author B"], summaries: ["Summary B"] }
            }
          ]
        }
      }
    });
    const args = { input: { bookIds: ["bookA", "bookB"], limit: 2 } };
    await recommendations({}, args, { userId: "user1" });
    // Assert that must_not in the OpenSearch query contains the correct bookIds
    const esCall = (openSearchClient.search as ReturnType<typeof vi.fn>).mock.calls[0][0];
    expect(esCall.body.query.bool.must_not).toEqual([{ ids: { values: ["bookA", "bookB"] } }]);
  });
});
