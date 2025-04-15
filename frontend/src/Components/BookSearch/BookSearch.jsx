import React, { useState } from 'react';
import axios from 'axios';
import './BookSearch.css';

const BookSearch = () => {
    const [query, setQuery] = useState('');
    const [maxResults, setMaxResults] = useState(5);
    const [books, setBooks] = useState([]);
    const [loading, setLoading] = useState(false);

    const handleSearch = async () => {
        if (!query.trim()) return;

        setLoading(true);
        try {
            const res = await axios.get('http://127.0.0.1:8000/book_search/search/', {
                params: { query, max_results: maxResults }
            });
            setBooks(res.data);
        } catch (err) {
            console.error('Error:', err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="book-search-container">
            <h2>Search for Books</h2>
            <input
                type="text"
                placeholder="Enter book name, author, or subject"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
            />
            <select value={maxResults} onChange={(e) => setMaxResults(Number(e.target.value))}>
                <option value={3}>3 results</option>
                <option value={5}>5 results</option>
                <option value={10}>10 results</option>
                <option value={15}>15 results</option>
                <option value={20}>20 results</option>
            </select>
            <button onClick={handleSearch} disabled={loading}>
                {loading ? 'Searching...' : 'Search'}
            </button>

            {books.length > 0 && (
                <ul>
                    {books.map((book, index) => (
                        <li key={index}>
                            <h3>{book.Title}</h3>
                            <p><strong>Authors:</strong> {book.Authors}</p>
                            <p>{book.Description}</p>
                            <a href={book.Link} target="_blank" rel="noopener noreferrer">More Info</a>
                        </li>
                    ))}
                </ul>
            )}

            {!loading && books.length === 0 && <p>No books found yet.</p>}
        </div>
    );
};

export default BookSearch;
