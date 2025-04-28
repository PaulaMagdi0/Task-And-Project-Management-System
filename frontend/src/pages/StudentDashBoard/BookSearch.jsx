import React, { useState, useEffect, useCallback, Component } from 'react';
import { Box, Card, CardHeader, CardContent, TextField, Button, Select, MenuItem, CircularProgress, Alert, Typography, Grid } from '@mui/material';
import { FiBook } from 'react-icons/fi';
import axios from 'axios';
import './BookSearch.css';

// Error Boundary for BookSearch
class BookSearchErrorBoundary extends Component {
  state = { hasError: false, error: null };

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      return (
        <Box textAlign="center" py={4}>
          <Typography variant="h6" color="error">
            Failed to load Book Search.
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Error: {this.state.error?.message || 'Unknown error'}
          </Typography>
        </Box>
      );
    }
    return this.props.children;
  }
}

const useDebounce = (callback, delay) => {
  const [timeoutId, setTimeoutId] = useState(null);
  return useCallback(
    (...args) => {
      if (timeoutId) clearTimeout(timeoutId);
      const id = setTimeout(() => callback(...args), delay);
      setTimeoutId(id);
    },
    [timeoutId, delay]
  );
};

const BookSearch = () => {
  const [query, setQuery] = useState('');
  const [maxResults, setMaxResults] = useState(5);
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [retryCount, setRetryCount] = useState(0);
  const maxRetries = 3;

  console.log('BookSearch Component Rendered'); // Debug log

  const handleSearch = async () => {
    if (!query.trim()) {
      setError('Please enter a search query');
      return;
    }
    if (retryCount >= maxRetries) {
      setError('Maximum retry attempts reached');
      return;
    }
    setLoading(true);
    setError('');
    try {
      console.log('Fetching books:', { query, maxResults }); // Debug log
      const res = await axios.get('http://127.0.0.1:8000/book_search/search/', {
        params: { query, max_results: maxResults },
      });
      console.log('Book API Response:', res.data); // Debug log
      setBooks(res.data || []);
      setRetryCount(0);
    } catch (err) {
      console.error('Book Search Error:', err); // Debug log
      setError('Failed to fetch books: ' + err.message);
      if (retryCount < maxRetries) {
        setTimeout(() => {
          setRetryCount((prev) => prev + 1);
          handleSearch();
        }, 1000 * (retryCount + 1));
      }
    } finally {
      setLoading(false);
    }
  };

  const debouncedHandleSearch = useDebounce(handleSearch, 500);

  useEffect(() => {
    console.log('BookSearch Mounted'); // Debug log
    return () => console.log('BookSearch Unmounted'); // Debug log
  }, []);

  return (
    <BookSearchErrorBoundary>
      <Box className="book-search-container">
        <Card elevation={3} sx={{ borderTop: '4px solid #00897b' }}>
          <CardHeader
            title="Book Search"
            avatar={<FiBook style={{ color: '#00897b' }} />}
            subheader="Find books by title, author, or subject"
          />
          <CardContent>
            <Box display="flex" gap={2} mb={3} flexWrap="wrap">
              <TextField
                label="Enter book name, author, or subject"
                variant="outlined"
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  debouncedHandleSearch();
                }}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                sx={{ flex: 1, minWidth: 200 }}
                aria-label="Search books by title, author, or subject"
              />
              <Select
                value={maxResults}
                onChange={(e) => setMaxResults(Number(e.target.value))}
                sx={{ minWidth: 120 }}
                aria-label="Select maximum number of results"
              >
                <MenuItem value={3}>3 results</MenuItem>
                <MenuItem value={5}>5 results</MenuItem>
                <MenuItem value={10}>10 results</MenuItem>
                <MenuItem value={15}>15 results</MenuItem>
                <MenuItem value={20}>20 results</MenuItem>
              </Select>
              <Button
                variant="contained"
                startIcon={<FiBook />}
                onClick={handleSearch}
                disabled={loading || !query.trim()}
                sx={{ backgroundColor: '#00897b', '&:hover': { backgroundColor: '#00796b' } }}
                aria-label="Search books"
              >
                {loading ? 'Searching...' : 'Search'}
              </Button>
            </Box>
            {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
            {loading ? (
              <Box display="flex" justifyContent="center" my={4}>
                <CircularProgress sx={{ color: '#00897b' }} />
              </Box>
            ) : books.length > 0 ? (
              <Grid container spacing={2}>
                {books.map((book, index) => (
                  <Grid item xs={12} sm={6} md={4} key={index}>
                    <Card className="book-card">
                      <CardContent>
                        <Typography variant="h6" className="book-title">{book.Title || 'Untitled'}</Typography>
                        <Typography variant="body2" color="text.secondary">
                          <strong>Authors:</strong> {book.Authors || 'Unknown'}
                        </Typography>
                        <Typography variant="body2" sx={{ mt: 1, maxHeight: 80, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {book.Description || 'No description available'}
                        </Typography>
                        <Typography variant="body2" sx={{ mt: 1 }}>
                          <a href={book.Link} target="_blank" rel="noopener noreferrer" className="book-link">
                            More Info
                          </a>
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            ) : (
              <Typography variant="body1" color="text.secondary" textAlign="center" my={4}>
                No books found yet. Try searching for a title, author, or subject.
              </Typography>
            )}
          </CardContent>
        </Card>
      </Box>
    </BookSearchErrorBoundary>
  );
};

export default BookSearch;