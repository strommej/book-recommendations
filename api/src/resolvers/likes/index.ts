import { dynamo } from "~/common/dynamo.js";
import { PutCommand, QueryCommand } from "@aws-sdk/lib-dynamodb";
import type { Like, SaveLikeInput, QueryLikedBooksArgs } from "~/types/__generated__/gqlTypes.js";

const TABLE_NAME = process.env.USER_LIKES_TABLE;
const MAX_LIMIT = 100;

export async function saveLike(
  parent: unknown,
  { input }: { input: SaveLikeInput },
  context: { userId: string }
): Promise<boolean> {
  const userId = context.userId;
  const { bookId } = input;
  const createdDate = new Date().toISOString();
  await dynamo.send(
    new PutCommand({
      TableName: TABLE_NAME,
      Item: {
        userId,
        createdDate,
        bookId
      }
    })
  );
  return true;
}

export async function likedBooks(
  parent: unknown,
  { limit = 10 }: QueryLikedBooksArgs,
  context: { userId: string }
): Promise<Like[]> {
  const safeLimit = Math.min(limit || 10, MAX_LIMIT);
  const res = await dynamo.send(
    new QueryCommand({
      TableName: TABLE_NAME,
      IndexName: "UserLikesByCreatedDate",
      KeyConditionExpression: "userId = :uid",
      ExpressionAttributeValues: { ":uid": context.userId },
      ScanIndexForward: false, // sort by createdDate desc
      Limit: safeLimit
    })
  );
  return (
    res.Items?.map((item) => ({
      userId: item.userId,
      bookId: item.bookId,
      createdDate: item.createdDate
    })) || []
  );
}

export const likesResolvers = {
  Mutation: {
    saveLike
  },
  Query: {
    likedBooks
  }
};
