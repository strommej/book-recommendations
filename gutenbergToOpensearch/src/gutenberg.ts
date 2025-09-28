import { Book } from "./types";

// Prefer UTF-8, then us-ascii, then any text/plain
function getBestPlainTextUrl(formats: Record<string, string>): string | undefined {
  const keys = Object.keys(formats);
  // Most preferred
  let url = keys.find(k => k.startsWith('text/plain') && k.includes('utf-8'));
  if (url) return formats[url];
  // Next preferred
  url = keys.find(k => k.startsWith('text/plain') && k.includes('us-ascii'));
  if (url) return formats[url];
  // Any text/plain
  url = keys.find(k => k.startsWith('text/plain'));
  if (url) return formats[url];
  return undefined;
}

export async function fetchEnglishNovels(limit = 10): Promise<Book[]> {
  const books: Book[] = [];
  let page = 1;
  while (books.length < limit) {
    const url = `https://gutendex.com/books?languages=en&bookshelves=novel&page=${page}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Failed to fetch Gutendex: ${res.status}`);
    const data = await res.json();
    for (const book of data.results) {
      const txtUrl = getBestPlainTextUrl(book.formats);
      if (txtUrl) {
        books.push({
          id: book.id,
          title: book.title,
          authors: book.authors,
          downloadUrl: txtUrl,
          summaries: book.summaries,
          fullText: ''
        });
      }
      if (books.length >= limit) return books;
    }
    if (!data.next) break;
    page++;
  }
  return books;
}

export async function fetchBookText(gutenbergTextUrl: string): Promise<string | null> {
  const res = await fetch(gutenbergTextUrl);
  if (res.ok) return await res.text();
  return null;
}

// fetchEnglishNovels(5).then(books => {
//   console.log(`Fetched ${books.length} English novels from Gutendex`);
// }).catch(err => {
//   console.error('Error fetching books:', err);
// });