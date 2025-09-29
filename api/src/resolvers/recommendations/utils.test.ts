import { getLikedEmbeddings, averageEmbeddings } from "./utils.js";
import { openSearchClient } from "~/common/opensearch.js";

vi.mock("~/common/opensearch", () => ({
  openSearchClient: {
    search: vi.fn()
  }
}));

describe("getLikedEmbeddings", () => {
  it("returns embeddings from OpenSearch hits", async () => {
    (openSearchClient.search as ReturnType<typeof vi.fn>).mockResolvedValue({
      body: {
        hits: {
          hits: [
            { _source: { summaryEmbedding: [1, 2, 3] } },
            { _source: { summaryEmbedding: [4, 5, 6] } }
          ]
        }
      }
    });
    const result = await getLikedEmbeddings(["id1", "id2"]);
    expect(result).toEqual([
      [1, 2, 3],
      [4, 5, 6]
    ]);
  });

  it("filters out non-array embeddings", async () => {
    (openSearchClient.search as ReturnType<typeof vi.fn>).mockResolvedValue({
      body: {
        hits: {
          hits: [
            { _source: { summaryEmbedding: [1, 2, 3] } },
            { _source: { summaryEmbedding: null } },
            { _source: { summaryEmbedding: "not-an-array" } }
          ]
        }
      }
    });
    const result = await getLikedEmbeddings(["id1", "id2"]);
    expect(result).toEqual([[1, 2, 3]]);
  });
});

describe("averageEmbeddings", () => {
  it("returns average of embeddings", () => {
    const embeddings = [
      [1, 2, 3],
      [4, 5, 6]
    ];
    const result = averageEmbeddings(embeddings);
    expect(result).toEqual([2.5, 3.5, 4.5]);
  });

  it("returns empty array if no embeddings", () => {
    const result = averageEmbeddings([]);
    expect(result).toEqual([]);
  });
});
