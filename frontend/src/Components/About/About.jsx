import React from "react";
import { Link, useLocation } from "react-router-dom";
import about from "/src/assets/img/about.jpg";

const About = () => {
  const location = useLocation();
  const isHomePage = location.pathname === "/";

  const aboutData = {
    title: "About Task Flow",
    subtitle: "Empowering teams to achieve more",
    description:
      "Task Flow is a powerful task and project management platform designed to streamline workflows, boost productivity, and simplify collaboration for teams of any size.",
    listItems: [
      "Create, assign, and track tasks across multiple projects effortlessly.",
      "Collaborate with team members in real time through integrated chat and comments.",
      "Visualize progress with Kanban boards, calendar views, and smart dashboards.",
    ],
  };

  const visibleItems = isHomePage
    ? aboutData.listItems.slice(0, 2)
    : aboutData.listItems;

  return (
    <section className="about section">
      <div className="container section-title" data-aos="fade-up">
        <span>{aboutData.title}</span>
        <h2>{aboutData.title}</h2>
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
