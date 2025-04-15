// File: src/pages/MovieSearch.jsx
import React, { useState } from 'react';
import './MovieSearch.css';
import axios from 'axios';

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

const MovieSearch = () => {
  const [trending, setTrending] = useState([]);
  const [genreInput, setGenreInput] = useState('');
  const [genreMovies, setGenreMovies] = useState([]);
  const [trailerTitle, setTrailerTitle] = useState('');
  const [trailerUrl, setTrailerUrl] = useState('');
  const [searchedMovies, setSearchedMovies] = useState([]);
  const [showGenres, setShowGenres] = useState(false);

  const fetchTrending = async () => {
    const res = await axios.get('http://localhost:8000/movie_search/trending/');
    setTrending(res.data);
  };

  const fetchByGenre = async () => {
    let genreId = genreInput.trim();
  
    // If input is not a number, try to map it from name to ID
    if (isNaN(genreId)) {
      const genreKey = genreId.toLowerCase().replace(/\s+/g, '');
      genreId = genreMap[genreKey];
      if (!genreId) {
        alert('Invalid genre name or ID. Click "Show Genres" to see available options.');
        return;
      }
    }

    const res = await axios.get(`http://localhost:8000/movie_search/by_genre/?genre_id=${genreId}`);
    setGenreMovies(res.data);
  };

  const fetchTrailer = async () => {
    if (!trailerTitle) return;
    const res = await axios.get(`http://localhost:8000/movie_search/trailer/?title=${trailerTitle}`);
    setTrailerUrl(res.data.trailer_url);
  };

  const searchMoviesByName = async (title) => {
    if (!title) return;
    const res = await axios.get(`https://api.themoviedb.org/3/search/movie?api_key=42f35605505847f2e6a5d264ac86227c&query=${title}`);
    const result = res.data.results.map((movie) => ({
      Title: movie.title,
      'Release Date': movie.release_date,
      Description: movie.overview,
      Rating: movie.vote_average,
    }));
    setSearchedMovies(result);
  };

  return (
    <div className="movie-search-container">
      <h1 className="title">🎬 Movie Search Explorer</h1>

      {/* Trending Section */}
      <section className="section">
        <h2>Trending Movies</h2>
        <button onClick={fetchTrending}>Show Trending</button>
        <div className="grid">
          {trending.map((movie, i) => (
            <div className="card" key={i}>
              <h3>{movie.Title}</h3>
              <p><strong>Release:</strong> {movie['Release Date']}</p>
              <p>{movie.Description}</p>
              <p><strong>⭐ {movie.Rating}</strong></p>
            </div>
          ))}
        </div>
      </section>

      {/* Genre Section */}
      <section className="section">
        <h2>Movies By Genre</h2>
        <input
          type="text"
          placeholder="Enter Genre Name (e.g., Action)"
          value={genreInput}
          onChange={(e) => setGenreInput(e.target.value)}
        />
        <button onClick={fetchByGenre}>Search Genre</button>
        <button onClick={() => setShowGenres(!showGenres)}>Show Genres</button>
        {showGenres && (
          <ul style={{ marginTop: '1rem', lineHeight: '1.6' }}>
            {Object.entries(genreMap).map(([name, id]) => (
              <li key={id}>
                <strong>{name.charAt(0).toUpperCase() + name.slice(1)}:</strong> {id}
              </li>
            ))}
          </ul>
        )}
        <div className="grid">
          {genreMovies.map((movie, i) => (
            <div className="card" key={i}>
              <h3>{movie.Title}</h3>
              <p><strong>Release:</strong> {movie['Release Date']}</p>
              <p>{movie.Description}</p>
              <p><strong>⭐ {movie.Rating}</strong></p>
            </div>
          ))}
        </div>
      </section>

      {/* Trailer Section */}
      <section className="section">
        <h2>Get Trailer by Title</h2>
        <input
          type="text"
          placeholder="Enter Movie Title"
          value={trailerTitle}
          onChange={(e) => setTrailerTitle(e.target.value)}
        />
        <button onClick={fetchTrailer}>Get Trailer</button>
        {trailerUrl && <p><a href={trailerUrl} target="_blank" rel="noreferrer">🎥 Watch Trailer</a></p>}
      </section>

      {/* Movie Search Section */}
      <section className="section">
        <h2>Search Movies by Name</h2>
        <input
          type="text"
          placeholder="e.g., Batman"
          onKeyDown={(e) => e.key === 'Enter' && searchMoviesByName(e.target.value)}
        />
        <button onClick={() => searchMoviesByName(document.querySelector('input[placeholder="e.g., Batman"]').value)}>
          Search
        </button>
        <div className="grid">
          {searchedMovies.map((movie, i) => (
            <div className="card" key={i}>
              <h3>{movie.Title}</h3>
              <p><strong>Release:</strong> {movie['Release Date']}</p>
              <p>{movie.Description}</p>
              <p><strong>⭐ {movie.Rating}</strong></p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

export default MovieSearch;
