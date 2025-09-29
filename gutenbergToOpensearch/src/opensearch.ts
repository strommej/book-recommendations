import { Book } from "./types.js";
import { Client } from "@opensearch-project/opensearch";

export const client = new Client({
  node: process.env.OPENSEARCH_ENDPOINT || "http://localhost:9200",
  auth:
    process.env.OPENSEARCH_USERNAME && process.env.OPENSEARCH_PASSWORD
      ? {
          username: process.env.OPENSEARCH_USERNAME,
          password: process.env.OPENSEARCH_PASSWORD
        }
      : undefined
});
const INDEX_NAME = process.env.OPENSEARCH_INDEX || "books";

export async function indexBooksToOpenSearch(books: Book[]): Promise<void> {
  if (!books.length) return;
  const body: any[] = [];
  for (const book of books) {
    body.push({ index: { _index: INDEX_NAME, _id: book.id } });
    body.push({
      title: book.title,
      authors: book.authors,
      summaries: book.summaries,
      fullText: book.fullText,
      summaryEmbedding: book.summaryEmbedding,
      downloadUrl: book.downloadUrl
    });
  }
  try {
    const result = await client.bulk({ refresh: true, body });
    if (result.body.errors) {
      console.error(
        "Bulk indexing errors:",
        JSON.stringify(result.body.items.filter((item: any) => item.index.error))
      );
    } else {
      console.log(`Successfully indexed ${books.length} books to OpenSearch.`);
    }
  } catch (err) {
    console.error("OpenSearch bulk index error:", err);
    throw err;
  }
}
