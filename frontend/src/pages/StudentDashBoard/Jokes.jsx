import React, { useState, useEffect, useCallback, Component } from 'react';
import { Box, Card, CardHeader, CardContent, Typography, Button, CircularProgress, Alert } from '@mui/material';
import { FiSmile } from 'react-icons/fi';
import './Jokes.css';

// Error Boundary for Jokes
class JokesErrorBoundary extends Component {
  state = { hasError: false, error: null };

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      return (
        <Box textAlign="center" py={4}>
          <Typography variant="h6" color="error">
            Failed to load jokes.
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

// Custom debounce hook
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

const Jokes = () => {
  const [joke, setJoke] = useState('');
  const [setup, setSetup] = useState('');
  const [delivery, setDelivery] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const maxRetries = 3;

  console.log('Jokes Component Rendered'); // Debug log

  const inappropriateWords = ['sex', 'porn', 'explicit', '18+', 'adult', 'nude'];

  const containsInappropriateContent = (text) => {
    return inappropriateWords.some((word) => text.toLowerCase().includes(word));
  };

  const fetchJoke = async (isRetry = false) => {
    if (retryCount >= maxRetries && !isRetry) {
      setError('Maximum retry attempts reached');
      return;
    }
    setLoading(true);
    setError('');

    try {
      console.log('Fetching joke, Retry Count:', retryCount); // Debug log
      const response = await fetch('http://localhost:8000/api/joke/');
      const data = await response.json();
      console.log('Joke API Response:', data); // Debug log

      if (response.ok) {
        if (data.setup && data.delivery) {
          if (containsInappropriateContent(data.setup) || containsInappropriateContent(data.delivery)) {
            if (retryCount < maxRetries) {
              setRetryCount((prev) => prev + 1);
              fetchJoke(true);
            } else {
              setError('Unable to fetch appropriate joke after retries');
            }
          } else {
            setSetup(data.setup);
            setDelivery(data.delivery);
            setJoke('');
            setRetryCount(0);
          }
        } else if (data.joke) {
          if (containsInappropriateContent(data.joke)) {
            if (retryCount < maxRetries) {
              setRetryCount((prev) => prev + 1);
              fetchJoke(true);
            } else {
              setError('Unable to fetch appropriate joke after retries');
            }
          } else {
            setJoke(data.joke);
            setSetup('');
            setDelivery('');
            setRetryCount(0);
          }
        } else {
          setError('Unexpected data format');
        }
      } else {
        setError(`Failed to fetch joke: ${response.statusText}`);
      }
    } catch (err) {
      setError('Error fetching joke: ' + err.message);
      if (retryCount < maxRetries) {
        setTimeout(() => fetchJoke(true), 1000 * (retryCount + 1));
        setRetryCount((prev) => prev + 1);
      }
    } finally {
      setLoading(false);
    }
  };

  const debouncedFetchJoke = useDebounce(fetchJoke, 500);

  useEffect(() => {
    fetchJoke();
  }, []);

  return (
    <JokesErrorBoundary>
      <Card elevation={3} sx={{ borderTop: '4px solid #0288d1', maxWidth: 600, mx: 'auto' }}>
        <CardHeader
          title="Programming Jokes"
          avatar={<FiSmile style={{ color: '#0288d1' }} />}
          subheader="Take a break with a coding laugh!"
        />
        <CardContent>
          <Box textAlign="center">
            {loading ? (
              <Box display="flex" justifyContent="center" my={4}>
                <CircularProgress sx={{ color: '#0288d1' }} />
              </Box>
            ) : error ? (
              <Alert severity="error" sx={{ mb: 2 }}>
                {error}
              </Alert>
            ) : (
              <Box className="joke-container">
                {setup && (
                  <Typography variant="body1" className="setup" sx={{ mb: 2 }}>
                    🃏 <strong>Setup:</strong> {setup}
                  </Typography>
                )}
                {delivery && (
                  <Typography variant="body1" className="delivery" sx={{ mb: 2 }}>
                    🤣 <strong>Delivery:</strong> {delivery}
                  </Typography>
                )}
                {joke && (
                  <Typography variant="body1" className="joke" sx={{ mb: 2 }}>
                    🃏 <strong>Joke:</strong> {joke}
                  </Typography>
                )}
              </Box>
            )}
            <Button
              variant="contained"
              onClick={debouncedFetchJoke}
              disabled={loading}
              startIcon={<FiSmile />}
              sx={{ mt: 2, backgroundColor: '#0288d1', '&:hover': { backgroundColor: '#0277bd' } }}
              aria-label="Get another programming joke"
            >
              {loading ? 'Loading...' : 'Get Another Joke'}
            </Button>
          </Box>
        </CardContent>
      </Card>
    </JokesErrorBoundary>
  );
};

export default Jokes;