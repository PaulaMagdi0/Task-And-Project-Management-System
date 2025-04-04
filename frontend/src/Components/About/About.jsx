import React from "react";
import { Link, useLocation } from "react-router-dom";
import about from "/src/assets/img/about.jpg";

const About = () => {
  const location = useLocation();
  const isHomePage = location.pathname === "/";

  const aboutData = {
    title: "About Us",
    subtitle: "Voluptatem dignissimos provident",
    description:
      "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.",
    listItems: [
      "Ullamco laboris nisi ut aliquip ex ea commodo consequat.",
      "Duis aute irure dolor in reprehenderit in voluptate velit.",
      "Ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate trideta storacalaperda mastiro dolore eu fugiat nulla pariatur.",
    ],
  };

  // ✅ Show only 2 items on homepage, else show all
  const visibleItems = isHomePage
    ? aboutData.listItems.slice(0, 2)
    : aboutData.listItems;

  return (
    <section className="about section">
      <div className="container section-title" data-aos="fade-up">
        <span>
          {aboutData.title}
          <br />
        </span>
        <h2>
          {aboutData.title}
          <br />
        </h2>
        <p>{aboutData.description}</p>
      </div>
      <div className="container">
        <div className="row gy-4">
          <div
            className="col-lg-6 order-1 order-lg-2"
            data-aos="fade-up"
            data-aos-delay="100"
          >
            <img src={about} className="img-fluid" alt="About Us" />
          </div>
          <div
            className="col-lg-6 order-2 order-lg-1 content"
            data-aos="fade-up"
            data-aos-delay="200"
          >
            <h3>{aboutData.subtitle}</h3>
            <p className="fst-italic">{aboutData.description}</p>
            <ul>
              {visibleItems.map((item, index) => (
                <li key={index}>
                  <i className="bi bi-check-circle"></i>
                  <span>{item}</span>
                </li>
              ))}
            </ul>

            {/* ✅ Show button only on homepage */}
            {isHomePage && (
              <Link to="/about" className="read-more">
                <span>Read More</span>
                <i className="bi bi-arrow-right"></i>
              </Link>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};

export default About;
