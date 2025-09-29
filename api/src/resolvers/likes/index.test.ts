import { vi, describe, it, expect, beforeEach } from "vitest";
import { saveLike, likedBooks } from "./index.js";
import { PutCommand, QueryCommand } from "@aws-sdk/lib-dynamodb";
import { dynamo } from "~/common/dynamo.js";

vi.mock("~/common/dynamo.js", () => ({
  dynamo: {
    send: vi.fn()
  }
}));

describe("likes resolver", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("saveLike writes to DynamoDB and returns true", async () => {
    (dynamo.send as ReturnType<typeof vi.fn>).mockResolvedValue({});
    const context = { userId: "user1" };
    const input = { bookId: "bookA" };
    const result = await saveLike(null, { input }, context);
    expect(dynamo.send).toHaveBeenCalledWith(
      expect.objectContaining({
        input: expect.objectContaining({
          Item: expect.objectContaining({
            userId: "user1",
            bookId: "bookA",
            createdDate: expect.any(String)
          })
        })
      })
    );
    expect(result).toBe(true);
  });

  it("likedBooks queries DynamoDB and returns mapped items", async () => {
    (dynamo.send as ReturnType<typeof vi.fn>).mockResolvedValue({
      Items: [
        { userId: "user1", bookId: "bookA", createdDate: "2025-09-29T00:00:00Z" },
        { userId: "user1", bookId: "bookB", createdDate: "2025-09-29T00:01:00Z" }
      ]
    });
    const result = await likedBooks(null, { limit: 2 }, { userId: "user1" });
    expect(dynamo.send).toHaveBeenCalledWith(
      expect.objectContaining({
        input: expect.objectContaining({
          ExpressionAttributeValues: expect.objectContaining({
            ":uid": "user1"
          }),
          Limit: 2
        })
      })
    );
    expect(result).toEqual([
      { userId: "user1", bookId: "bookA", createdDate: "2025-09-29T00:00:00Z" },
      { userId: "user1", bookId: "bookB", createdDate: "2025-09-29T00:01:00Z" }
    ]);
  });

  it("likedBooks returns empty array if no items", async () => {
    (dynamo.send as ReturnType<typeof vi.fn>).mockResolvedValue({ Items: [] });
    const result = await likedBooks(null, { limit: 2 }, { userId: "user1" });
    expect(result).toEqual([]);
  });
});
