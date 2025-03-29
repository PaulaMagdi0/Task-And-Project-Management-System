import React from 'react';
import { Link } from 'react-router-dom';
import './Home.css';

const Home = () => {
  return (
    <div className="home-container">
      <header className="home-hero">
        <div className="hero-content">
          <h1>Welcome to TaskManager</h1>
          <p>
            Your comprehensive platform for task and project management, designed to empower ITI students and staff.
          </p>
          <Link to="/signin" className="hero-btn">Get Started</Link>
        </div>
      </header>
      <section className="home-info">
        <div className="info-block">
          <h2>Streamlined Task Management</h2>
          <p>Organize, assign, and track tasks with ease.</p>
        </div>
        <div className="info-block">
          <h2>Collaborative Environment</h2>
          <p>Enhance teamwork and collaboration across projects.</p>
        </div>
        <div className="info-block">
          <h2>Progress Tracking</h2>
          <p>Monitor your progress and achieve your goals.</p>
        </div>
      </section>
    </div>
  );
};

export default Home;
