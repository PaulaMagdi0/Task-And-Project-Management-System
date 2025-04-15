import React, { useState, useEffect } from 'react';
import './Jokes.css'; // Make sure the CSS is imported

const Jokes = () => {
  const [joke, setJoke] = useState("");
  const [setup, setSetup] = useState("");
  const [delivery, setDelivery] = useState("");
  const [error, setError] = useState("");

  // Fetch a joke from the backend
  const fetchJoke = async () => {
    try {
      const response = await fetch('http://localhost:8000/api/joke/');
      const data = await response.json();

      if (response.ok) {
        if (data.setup && data.delivery) {
          setSetup(data.setup);  // Two-part joke setup
          setDelivery(data.delivery);  // Two-part joke delivery
          setJoke("");  // Clear joke for two-part jokes
        } else if (data.joke) {
          setJoke(data.joke);  // Single-part joke
          setSetup("");  // Clear setup for single-part jokes
          setDelivery("");  // Clear delivery for single-part jokes
        } else {
          setError("Unexpected data format");
        }
      } else {
        setError("Failed to fetch joke");
      }
    } catch (err) {
      setError("Error fetching joke");
    }
  };

  useEffect(() => {
    fetchJoke();
  }, []);

  return (
    <div className="jokes-container">
      <h1>Random Programming Joke</h1>
      {error ? (
        <p className="error-message">{error}</p>
      ) : (
        <div className="joke-container">
          {setup && <p className="setup">🃏 Setup: {setup}</p>}
          {delivery && <p className="delivery">🤣 Delivery: {delivery}</p>}
          {joke && <p className="joke">🃏 Joke: {joke}</p>}
        </div>
      )}
      <button onClick={fetchJoke} className="fetch-button">Get Another Joke</button>
    </div>
  );
};

export default Jokes;
