import React, { useState, useEffect } from 'react';
import './Jokes.css'; // Make sure the CSS is imported

const Jokes = () => {
  const [joke, setJoke] = useState("");
  const [setup, setSetup] = useState("");
  const [delivery, setDelivery] = useState("");
  const [error, setError] = useState("");

  // List of inappropriate words or expressions to check
  const inappropriateWords = ["sex", "porn", "explicit", "18+", "adult", "nude"];

  // Function to check if joke contains inappropriate content
  const containsInappropriateContent = (text) => {
    return inappropriateWords.some((word) => text.toLowerCase().includes(word));
  };

  // Fetch a joke from the backend
  const fetchJoke = async () => {
    try {
      const response = await fetch('http://localhost:8000/api/joke/');
      const data = await response.json();

      if (response.ok) {
        if (data.setup && data.delivery) {
          if (containsInappropriateContent(data.setup) || containsInappropriateContent(data.delivery)) {
            fetchJoke(); // Force refresh if inappropriate content is found
          } else {
            setSetup(data.setup);
            setDelivery(data.delivery);
            setJoke(""); // Clear joke for two-part jokes
          }
        } else if (data.joke) {
          if (containsInappropriateContent(data.joke)) {
            fetchJoke(); // Force refresh if inappropriate content is found
          } else {
            setJoke(data.joke);
            setSetup(""); // Clear setup for single-part jokes
            setDelivery(""); // Clear delivery for single-part jokes
          }
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
