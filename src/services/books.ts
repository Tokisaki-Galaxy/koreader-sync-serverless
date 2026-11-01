import type { StatisticsBookSummary } from "./statistics";

export type BookStatusFilter = "all" | "completed" | "reading" | "unread";
export type BookSortField = "read_time" | "last_open" | "pages" | "progress";
export type SortOrder = "asc" | "desc";

export interface BookQueryOptions {
  search?: string;
  status?: BookStatusFilter;
  sortBy?: BookSortField;
  sortOrder?: SortOrder;
}

export interface ReadingTotals {
  totalBooks: number;
  totalReadTime: number;
  totalReadPages: number;
  completedBooks: number;
  totalHighlights: number;
  totalNotes: number;
  lastOpenAt: number | null;
}

export function bookProgressPercent(book: StatisticsBookSummary): number {
  const pages = Number(book.pages || 0);
  const readPages = Number(book.total_read_pages || 0);
  if (pages <= 0) return 0;
  return Math.min(100, Math.max(0, (readPages / pages) * 100));
}

export function isBookCompleted(book: StatisticsBookSummary): boolean {
  const pages = Number(book.pages || 0);
  const readPages = Number(book.total_read_pages || 0);
  return pages > 0 && readPages >= pages;
}

// Shared by the web book list and the MCP book tools so both surfaces filter and
// order the same data the same way.
export function queryStatisticsBooks(
  books: StatisticsBookSummary[],
  options: BookQueryOptions = {}
): StatisticsBookSummary[] {
  const query = (options.search ?? "").trim().toLowerCase();
  const status = options.status ?? "all";
  const sortBy = options.sortBy ?? "read_time";
  const sortOrder = options.sortOrder === "asc" ? "asc" : "desc";

  let filtered = books;

  if (query) {
    filtered = filtered.filter(
      (book) =>
        (book.title && book.title.toLowerCase().includes(query)) ||
        (book.authors && book.authors.toLowerCase().includes(query)) ||
        (book.md5 && book.md5.toLowerCase().includes(query))
    );
  }

  if (status === "completed") {
    filtered = filtered.filter(isBookCompleted);
  } else if (status === "reading") {
    filtered = filtered.filter((book) => {
      const readPages = Number(book.total_read_pages || 0);
      return readPages > 0 && !isBookCompleted(book);
    });
  } else if (status === "unread") {
    filtered = filtered.filter((book) => Number(book.total_read_pages || 0) === 0);
  }

  const sorted = filtered.slice().sort((a, b) => {
    let valueA = 0;
    let valueB = 0;
    if (sortBy === "last_open") {
      valueA = Number(a.last_open || 0);
      valueB = Number(b.last_open || 0);
    } else if (sortBy === "pages") {
      valueA = Number(a.pages || 0);
      valueB = Number(b.pages || 0);
    } else if (sortBy === "progress") {
      valueA = bookProgressPercent(a);
      valueB = bookProgressPercent(b);
    } else {
      valueA = Number(a.total_read_time || 0);
      valueB = Number(b.total_read_time || 0);
    }

    if (valueA === valueB) {
      return Number(b.last_open || 0) - Number(a.last_open || 0);
    }
    return sortOrder === "asc" ? valueA - valueB : valueB - valueA;
  });

  return sorted;
}

export function computeReadingTotals(books: StatisticsBookSummary[]): ReadingTotals {
  let totalReadTime = 0;
  let totalReadPages = 0;
  let totalHighlights = 0;
  let totalNotes = 0;
  let completedBooks = 0;
  let lastOpenAt = 0;

  for (const book of books) {
    totalReadTime += Number(book.total_read_time || 0);
    totalReadPages += Number(book.total_read_pages || 0);
    totalHighlights += Number(book.highlights || 0);
    totalNotes += Number(book.notes || 0);
    lastOpenAt = Math.max(lastOpenAt, Number(book.last_open || 0));
    if (isBookCompleted(book)) completedBooks += 1;
  }

  return {
    totalBooks: books.length,
    totalReadTime,
    totalReadPages,
    completedBooks,
    totalHighlights,
    totalNotes,
    lastOpenAt: lastOpenAt > 0 ? lastOpenAt : null,
  };
}
