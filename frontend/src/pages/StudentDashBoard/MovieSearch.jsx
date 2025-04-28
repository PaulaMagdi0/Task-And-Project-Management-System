import React, { useState, useEffect, useCallback } from 'react';
import { Box, Card, CardHeader, CardContent, TextField, Button, Grid, Typography, CircularProgress, Alert, Collapse, IconButton } from '@mui/material';
import { FiFilm, FiSearch, FiChevronDown, FiChevronUp } from 'react-icons/fi';
import axios from 'axios';
import './MovieSearch.css';

const genreMap = {
  action: 28,
  adventure: 12,
  animation: 16,
  comedy: 35,
  crime: 80,
  documentary: 99,
  drama: 18,
  fantasy: 14,
  horror: 27,
  mystery: 9648,
  romance: 10749,
  sciencefiction: 878,
  thriller: 53,
  war: 10752,
};

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

const MovieSearch = () => {
  const [trending, setTrending] = useState([]);
  const [genreInput, setGenreInput] = useState('');
  const [genreMovies, setGenreMovies] = useState([]);
  const [trailerTitle, setTrailerTitle] = useState('');
  const [trailerUrl, setTrailerUrl] = useState('');
  const [searchedMovies, setSearchedMovies] = useState([]);
  const [showGenres, setShowGenres] = useState(false);
  const [loading, setLoading] = useState({ trending: false, genre: false, trailer: false, search: false });
  const [error, setError] = useState({ trending: '', genre: '', trailer: '', search: '' });
  const [retryCount, setRetryCount] = useState({ trending: 0, genre: 0, trailer: 0, search: 0 });
  const maxRetries = 3;

  const fetchTrending = async () => {
    if (retryCount.trending >= maxRetries) {
      setError((prev) => ({ ...prev, trending: 'Maximum retry attempts reached' }));
      return;
    }
    setLoading((prev) => ({ ...prev, trending: true }));
    setError((prev) => ({ ...prev, trending: '' }));
    try {
      const res = await axios.get('http://localhost:8000/movie_search/trending/');
      setTrending(res.data || []);
      setRetryCount((prev) => ({ ...prev, trending: 0 }));
    } catch (err) {
      setError((prev) => ({ ...prev, trending: 'Failed to fetch trending movies: ' + err.message }));
      setTimeout(() => {
        setRetryCount((prev) => ({ ...prev, trending: prev.trending + 1 }));
        fetchTrending();
      }, 1000 * (retryCount.trending + 1));
    } finally {
      setLoading((prev) => ({ ...prev, trending: false }));
    }
  };

  const fetchByGenre = async () => {
    if (!genreInput.trim()) return;
    let genreId = genreInput.trim();
    if (isNaN(genreId)) {
      const genreKey = genreInput.toLowerCase().replace(/\s+/g, '');
      genreId = genreMap[genreKey];
      if (!genreId) {
        setError((prev) => ({ ...prev, genre: 'Invalid genre name or ID. Click "Show Genres" for options.' }));
        return;
      }
    }
    if (retryCount.genre >= maxRetries) {
      setError((prev) => ({ ...prev, genre: 'Maximum retry attempts reached' }));
      return;
    }
    setLoading((prev) => ({ ...prev, genre: true }));
    setError((prev) => ({ ...prev, genre: '' }));
    try {
      const res = await axios.get(`http://localhost:8000/movie_search/by_genre/?genre_id=${genreId}`);
      setGenreMovies(res.data || []);
      setRetryCount((prev) => ({ ...prev, genre: 0 }));
    } catch (err) {
      setError((prev) => ({ ...prev, genre: 'Failed to fetch genre movies: ' + err.message }));
      setTimeout(() => {
        setRetryCount((prev) => ({ ...prev, genre: prev.genre + 1 }));
        fetchByGenre();
      }, 1000 * (retryCount.genre + 1));
    } finally {
      setLoading((prev) => ({ ...prev, genre: false }));
    }
  };

  const fetchTrailer = async () => {
    if (!trailerTitle.trim()) return;
    if (retryCount.trailer >= maxRetries) {
      setError((prev) => ({ ...prev, trailer: 'Maximum retry attempts reached' }));
      return;
    }
    setLoading((prev) => ({ ...prev, trailer: true }));
    setError((prev) => ({ ...prev, trailer: '' }));
    try {
      const res = await axios.get(`http://localhost:8000/movie_search/trailer/?title=${encodeURIComponent(trailerTitle)}`);
      setTrailerUrl(res.data.trailer_url || '');
      setRetryCount((prev) => ({ ...prev, trailer: 0 }));
    } catch (err) {
      setError((prev) => ({ ...prev, trailer: 'Failed to fetch trailer: ' + err.message }));
      setTimeout(() => {
        setRetryCount((prev) => ({ ...prev, trailer: prev.trailer + 1 }));
        fetchTrailer();
      }, 1000 * (retryCount.trailer + 1));
    } finally {
      setLoading((prev) => ({ ...prev, trailer: false }));
    }
  };

  const searchMoviesByName = async (title) => {
    if (!title.trim()) return;
    if (retryCount.search >= maxRetries) {
      setError((prev) => ({ ...prev, search: 'Maximum retry attempts reached' }));
      return;
    }
    setLoading((prev) => ({ ...prev, search: true }));
    setError((prev) => ({ ...prev, search: '' }));
    try {
      const res = await axios.get(
        `https://api.themoviedb.org/3/search/movie?api_key=42f35605505847f2e6a5d264ac86227c&query=${encodeURIComponent(title)}`
      );
      const result = res.data.results.map((movie) => ({
        Title: movie.title,
        'Release Date': movie.release_date,
        Description: movie.overview,
        Rating: movie.vote_average,
      }));
      setSearchedMovies(result || []);
      setRetryCount((prev) => ({ ...prev, search: 0 }));
    } catch (err) {
      setError((prev) => ({ ...prev, search: 'Failed to search movies: ' + err.message }));
      setTimeout(() => {
        setRetryCount((prev) => ({ ...prev, search: prev.search + 1 }));
        searchMoviesByName(title);
      }, 1000 * (retryCount.search + 1));
    } finally {
      setLoading((prev) => ({ ...prev, search: false }));
    }
  };

  const debouncedSearchMovies = useDebounce(searchMoviesByName, 500);

  useEffect(() => {
    console.log('MovieSearch Component Rendered'); // Debug log
  }, []);

  return (
    <Box className="movie-search-container">
      <Card elevation={3} sx={{ borderTop: '4px solid #7b1fa2', mb: 4 }}>
        <CardHeader
          title="Movie Search Explorer"
          avatar={<FiFilm style={{ color: '#7b1fa2' }} />}
          subheader="Discover movies and trailers"
        />
        <CardContent>
          {/* Trending Section */}
          <Box mb={4}>
            <Typography variant="h6" gutterBottom>Trending Movies</Typography>
            <Button
              variant="contained"
              startIcon={<FiSearch />}
              onClick={fetchTrending}
              disabled={loading.trending}
              sx={{ mb: 2, backgroundColor: '#7b1fa2', '&:hover': { backgroundColor: '#6a1b9a' } }}
              aria-label="Fetch trending movies"
            >
              {loading.trending ? 'Loading...' : 'Show Trending'}
            </Button>
            {error.trending && <Alert severity="error" sx={{ mb: 2 }}>{error.trending}</Alert>}
            {loading.trending ? (
              <Box display="flex" justifyContent="center" my={4}>
                <CircularProgress sx={{ color: '#7b1fa2' }} />
              </Box>
            ) : (
              <Grid container spacing={2}>
                {trending.map((movie, i) => (
                  <Grid item xs={12} sm={6} md={4} key={i}>
                    <Card className="movie-card">
                      <CardContent>
                        <Typography variant="h6" className="movie-title">{movie.Title}</Typography>
                        <Typography variant="body2" color="text.secondary">
                          <strong>Release:</strong> {movie['Release Date'] || 'N/A'}
                        </Typography>
                        <Typography variant="body2" sx={{ mt: 1, maxHeight: 80, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {movie.Description || 'No description available'}
                        </Typography>
                        <Typography variant="body2" sx={{ mt: 1 }}>
                          <strong>⭐ Rating:</strong> {movie.Rating?.toFixed(1) || 'N/A'}
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            )}
          </Box>

          {/* Genre Section */}
          <Box mb={4}>
            <Typography variant="h6" gutterBottom>Movies By Genre</Typography>
            <Box display="flex" gap={2} mb={2} flexWrap="wrap">
              <TextField
                label="Enter Genre Name or ID"
                variant="outlined"
                value={genreInput}
                onChange={(e) => setGenreInput(e.target.value)}
                sx={{ flex: 1, minWidth: 200 }}
                aria-label="Enter genre name or ID"
              />
              <Button
                variant="contained"
                startIcon={<FiSearch />}
                onClick={fetchByGenre}
                disabled={loading.genre || !genreInput.trim()}
                sx={{ backgroundColor: '#7b1fa2', '&:hover': { backgroundColor: '#6a1b9a' } }}
                aria-label="Search movies by genre"
              >
                {loading.genre ? 'Searching...' : 'Search Genre'}
              </Button>
              <Button
                variant="outlined"
                startIcon={showGenres ? <FiChevronUp /> : <FiChevronDown />}
                onClick={() => setShowGenres(!showGenres)}
                aria-label={showGenres ? 'Hide genre list' : 'Show genre list'}
              >
                {showGenres ? 'Hide Genres' : 'Show Genres'}
              </Button>
            </Box>
            <Collapse in={showGenres}>
              <Box sx={{ mt: 2, p: 2, backgroundColor: '#f5f5f5', borderRadius: 1 }}>
                <Typography variant="subtitle1" gutterBottom>Available Genres:</Typography>
                <Grid container spacing={1}>
                  {Object.entries(genreMap).map(([name, id]) => (
                    <Grid item xs={6} sm={4} key={id}>
                      <Typography variant="body2">
                        <strong>{name.charAt(0).toUpperCase() + name.slice(1)}:</strong> {id}
                      </Typography>
                    </Grid>
                  ))}
                </Grid>
              </Box>
            </Collapse>
            {error.genre && <Alert severity="error" sx={{ mt: 2, mb: 2 }}>{error.genre}</Alert>}
            {loading.genre ? (
              <Box display="flex" justifyContent="center" my={4}>
                <CircularProgress sx={{ color: '#7b1fa2' }} />
              </Box>
            ) : (
              <Grid container spacing={2}>
                {genreMovies.map((movie, i) => (
                  <Grid item xs={12} sm={6} md={4} key={i}>
                    <Card className="movie-card">
                      <CardContent>
                        <Typography variant="h6" className="movie-title">{movie.Title}</Typography>
                        <Typography variant="body2" color="text.secondary">
                          <strong>Release:</strong> {movie['Release Date'] || 'N/A'}
                        </Typography>
                        <Typography variant="body2" sx={{ mt: 1, maxHeight: 80, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {movie.Description || 'No description available'}
                        </Typography>
                        <Typography variant="body2" sx={{ mt: 1 }}>
                          <strong>⭐ Rating:</strong> {movie.Rating?.toFixed(1) || 'N/A'}
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            )}
          </Box>

          {/* Trailer Section */}
          <Box mb={4}>
            <Typography variant="h6" gutterBottom>Get Trailer by Title</Typography>
            <Box display="flex" gap={2} mb={2} flexWrap="wrap">
              <TextField
                label="Enter Movie Title"
                variant="outlined"
                value={trailerTitle}
                onChange={(e) => setTrailerTitle(e.target.value)}
                sx={{ flex: 1, minWidth: 200 }}
                aria-label="Enter movie title for trailer"
              />
              <Button
                variant="contained"
                startIcon={<FiFilm />}
                onClick={fetchTrailer}
                disabled={loading.trailer || !trailerTitle.trim()}
                sx={{ backgroundColor: '#7b1fa2', '&:hover': { backgroundColor: '#6a1b9a' } }}
                aria-label="Get movie trailer"
              >
                {loading.trailer ? 'Loading...' : 'Get Trailer'}
              </Button>
            </Box>
            {error.trailer && <Alert severity="error" sx={{ mb: 2 }}>{error.trailer}</Alert>}
            {loading.trailer ? (
              <Box display="flex" justifyContent="center" my={4}>
                <CircularProgress sx={{ color: '#7b1fa2' }} />
              </Box>
            ) : (
              trailerUrl && (
                <Typography variant="body1">
                  <a href={trailerUrl} target="_blank" rel="noreferrer" className="trailer-link">
                    🎥 Watch Trailer
                  </a>
                </Typography>
              )
            )}
          </Box>

          {/* Movie Search Section */}
          <Box>
            <Typography variant="h6" gutterBottom>Search Movies by Name</Typography>
            <Box display="flex" gap={2} mb={2} flexWrap="wrap">
              <TextField
                label="Enter Movie Title (e.g., Batman)"
                variant="outlined"
                onChange={(e) => debouncedSearchMovies(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && searchMoviesByName(e.target.value)}
                sx={{ flex: 1, minWidth: 200 }}
                aria-label="Search movies by title"
              />
              <Button
                variant="contained"
                startIcon={<FiSearch />}
                onClick={() => {
                  const input = document.querySelector('input[aria-label="Search movies by title"]').value;
                  searchMoviesByName(input);
                }}
                disabled={loading.search}
                sx={{ backgroundColor: '#7b1fa2', '&:hover': { backgroundColor: '#6a1b9a' } }}
                aria-label="Search movies"
              >
                {loading.search ? 'Searching...' : 'Search'}
              </Button>
            </Box>
            {error.search && <Alert severity="error" sx={{ mb: 2 }}>{error.search}</Alert>}
            {loading.search ? (
              <Box display="flex" justifyContent="center" my={4}>
                <CircularProgress sx={{ color: '#7b1fa2' }} />
              </Box>
            ) : (
              <Grid container spacing={2}>
                {searchedMovies.map((movie, i) => (
                  <Grid item xs={12} sm={6} md={4} key={i}>
                    <Card className="movie-card">
                      <CardContent>
                        <Typography variant="h6" className="movie-title">{movie.Title}</Typography>
                        <Typography variant="body2" color="text.secondary">
                          <strong>Release:</strong> {movie['Release Date'] || 'N/A'}
                        </Typography>
                        <Typography variant="body2" sx={{ mt: 1, maxHeight: 80, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {movie.Description || 'No description available'}
                        </Typography>
                        <Typography variant="body2" sx={{ mt: 1 }}>
                          <strong>⭐ Rating:</strong> {movie.Rating?.toFixed(1) || 'N/A'}
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            )}
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
};

export default MovieSearch;