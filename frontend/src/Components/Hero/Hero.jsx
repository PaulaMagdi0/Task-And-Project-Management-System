import React from "react";
import { Link } from "react-router-dom";
import heroBg from "/src/assets/img/newCapital2.jpeg";

const Hero = () => {
  return (
    <section id="hero" className="hero section dark-background">
      <img src={heroBg} alt="Hero Background" data-aos="fade-in" />
      <div className="container" data-aos="fade-up" data-aos-delay="100">
        <div className="row justify-content-start">
          <div className="col-lg-8">
            <h2>Stay Organized</h2>
            <p>
              Task Flow helps you manage tasks, track projects, and collaborate
              with your team effortlessly and in real time.
            </p>
            <Link to="/signin" className="btn-get-started">
              Get Started
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;