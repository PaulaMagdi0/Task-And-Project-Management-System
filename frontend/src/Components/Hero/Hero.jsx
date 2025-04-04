import React from "react";
import { Link } from "react-router-dom";
import heroBg from "/src/assets/img/hero-bg.jpg";

const Hero = () => {
  return (
    <section id="hero" className="hero section dark-background">
      <img src={heroBg} alt="Hero Background" data-aos="fade-in" />
      <div className="container" data-aos="fade-up" data-aos-delay="100">
        <div className="row justify-content-start">
          <div className="col-lg-8">
            <h2>Welcome to Task Flow</h2>
            <p>We are a team of talented developers making websites.</p>
            <Link to="/register" className="btn-get-started">
              Get Started
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
