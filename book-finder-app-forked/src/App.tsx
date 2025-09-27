import React, { useState, useEffect, KeyboardEvent } from "react";
import "./styles.css";

interface Book {
  title: string;
  author_name?: string[];
  cover_i?: number;
  first_publish_year?: number;
  key: string;
  first_sentence?: { value: string } | string;
  subtitle?: string;
  subject?: string[];
}

const App: React.FC = () => {
  const [searchText, setSearchText] = useState("");
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [darkMode, setDarkMode] = useState(false);
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  const [recommendedBooks, setRecommendedBooks] = useState<Book[]>([]);
  const [loadingRecommendations, setLoadingRecommendations] = useState(false);

  const booksPerPage = 12;
  const indexOfLastBook = currentPage * booksPerPage;
  const indexOfFirstBook = indexOfLastBook - booksPerPage;
  const currentBooks = books.slice(indexOfFirstBook, indexOfLastBook);
  const totalPages = Math.ceil(books.length / booksPerPage);

  const searchBooks = async () => {
    if (!searchText.trim()) return;
    setLoading(true);
    setCurrentPage(1);
    try {
      const response = await fetch(
        `https://openlibrary.org/search.json?title=${encodeURIComponent(
          searchText
        )}`
      );
      const data = await response.json();
      setBooks(data.docs);
    } catch {
      setBooks([]);
    }
    setLoading(false);
  };

  const fetchRecommendedBooks = async (author?: string) => {
    if (!author) {
      setRecommendedBooks([]);
      return;
    }
    setLoadingRecommendations(true);
    try {
      const response = await fetch(
        `https://openlibrary.org/search.json?author=${encodeURIComponent(
          author
        )}&limit=6`
      );
      const data = await response.json();
      const filtered = data.docs.filter(
        (b: Book) => b.key !== selectedBook?.key
      );
      setRecommendedBooks(filtered.slice(0, 6));
    } catch {
      setRecommendedBooks([]);
    }
    setLoadingRecommendations(false);
  };

  const handleKeyPress = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") searchBooks();
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const renderPageNumbers = () => {
    const pages = [];
    const max = 3;
    let start = Math.max(1, currentPage - 1);
    let end = Math.min(totalPages, start + max - 1);

    if (end - start < max - 1) {
      start = Math.max(1, end - max + 1);
    }

    for (let i = start; i <= end; i++) {
      pages.push(
        <button
          key={i}
          onClick={() => handlePageChange(i)}
          className={currentPage === i ? "active" : ""}
        >
          {i}
        </button>
      );
    }

    return pages;
  };

  useEffect(() => {
    if (selectedBook?.author_name?.[0]) {
      fetchRecommendedBooks(selectedBook.author_name[0]);
    } else {
      setRecommendedBooks([]);
    }
  }, [selectedBook]);

  useEffect(() => {
    document.body.classList.toggle("dark-mode", darkMode);
  }, [darkMode]);

  return (
    <div className="container">
      <button
        onClick={() => setDarkMode(!darkMode)}
        className="dark-mode-toggle top-right"
        aria-label="Toggle Dark Mode"
      >
        {darkMode ? "☀️" : "🌙"}
      </button>

      <div className="logo-heading">
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <img
            src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQGBT4N8DxHhqTHSMYsHk4MpJYVIEADDN3xuA&s"
            alt="Logo"
            className="logo"
          />
          <h1 className="fancy-heading">Bookstore</h1>
        </div>
      </div>

      <div className="search-box">
        <input
          type="text"
          placeholder="Search for a book..."
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          onKeyDown={handleKeyPress}
        />
        <button onClick={searchBooks}>Search</button>
      </div>

      {loading && (
        <div className="loading-spinner">
          <div className="spinner" />
        </div>
      )}

      {!loading && currentBooks.length > 0 && (
        <>
          <div className="book-list-wrapper">
            <div className="book-list">
              {currentBooks.map((book, index) => (
                <div
                  key={index}
                  className="book-card"
                  onClick={() => setSelectedBook(book)}
                  title="Click to see details"
                >
                  {book.cover_i ? (
                    <img
                      src={`https://covers.openlibrary.org/b/id/${book.cover_i}-M.jpg`}
                      alt={book.title}
                    />
                  ) : (
                    <div className="no-image">No Image</div>
                  )}
                  <h2>{book.title}</h2>
                  <p>{book.author_name?.[0] || "Unknown Author"}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="pagination">
            {currentPage > 1 && (
              <button onClick={() => handlePageChange(currentPage - 1)}>
                Previous
              </button>
            )}
            {renderPageNumbers()}
            {currentPage < totalPages && (
              <>
                <button onClick={() => handlePageChange(currentPage + 1)}>
                  Next
                </button>
                <button onClick={() => handlePageChange(totalPages)}>
                  Last
                </button>
              </>
            )}
          </div>
        </>
      )}

      {selectedBook && (
        <div className="modal-overlay" onClick={() => setSelectedBook(null)}>
          <div
            className="modal-content"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="modal-title"
          >
            <button
              className="modal-close"
              onClick={() => setSelectedBook(null)}
              aria-label="Close details"
            >
              &times;
            </button>
            <h2 id="modal-title">{selectedBook.title}</h2>
            <p>
              <strong>Author:</strong>{" "}
              {selectedBook.author_name?.join(", ") || "Unknown Author"}
            </p>
            <p>
              <strong>Published:</strong>{" "}
              {selectedBook.first_publish_year || "Unknown"}
            </p>
            <p>
              <strong>Description:</strong>{" "}
              {typeof selectedBook.first_sentence === "string"
                ? selectedBook.first_sentence
                : selectedBook.first_sentence?.value ||
                  selectedBook.subtitle ||
                  "No description available."}
            </p>

            <h3>Recommended Books</h3>
            {loadingRecommendations ? (
              <div className="loading-spinner">
                <div className="spinner" />
              </div>
            ) : recommendedBooks.length > 0 ? (
              <div className="recommended-books">
                {recommendedBooks.map((book, idx) => (
                  <div
                    key={idx}
                    className="recommended-book-card"
                    onClick={() => setSelectedBook(book)}
                  >
                    {book.cover_i ? (
                      <img
                        src={`https://covers.openlibrary.org/b/id/${book.cover_i}-S.jpg`}
                        alt={book.title}
                      />
                    ) : (
                      <div className="no-image small">No Image</div>
                    )}
                    <p>{book.title}</p>
                    <p className="author">
                      {book.author_name?.[0] || "Unknown"}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p>No recommendations found.</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
