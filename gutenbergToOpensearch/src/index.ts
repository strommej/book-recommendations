import { fetchEnglishNovels, fetchBookText } from './gutenberg.js';
import { indexBooksToOpenSearch } from './opensearch.js';
import { vectorizeSummary } from './vectorize.js';
import { Book } from './types.js';



async function processBook(book: Book): Promise<Book | null> {
  const text = await fetchBookText(book.downloadUrl);
  if (!text) {
    console.warn(`No text found for book ID ${book.id}`);
    return null;
  }
  book.summaryEmbedding = await vectorizeSummary(book);
  return book;
}

async function processBatch(batchSize: number) {
  const books = await fetchEnglishNovels(batchSize);
  const toIndex: Book[] = [];
  for (const book of books) {
    try {
      console.log(`Processing: ${book.title} by ${book.authors.join(', ')}`);
      const processed = await processBook(book);
      if (processed) toIndex.push(processed);
    } catch (err) {
      console.error(`Error processing ${book.title}:`, err);
    }
  }
  if (toIndex.length) {
    await indexBooksToOpenSearch(toIndex);
    console.log(`Indexed ${toIndex.length} books to OpenSearch.`);
  } else {
    console.log('No books to index.');
  }
}

const batchSize = Number(process.argv[2]) || 100;
processBatch(batchSize);