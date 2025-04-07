import React from "react";
import { Link } from "react-router-dom";
import useCustomScripts from "../../Hooks/useCustomScripts";

// Import portfolio images
import portfolio1 from "../../assets/img/masonry-portfolio/masonry-portfolio-1.jpg";
import portfolio2 from "../../assets/img/masonry-portfolio/masonry-portfolio-2.jpg";
import portfolio3 from "../../assets/img/masonry-portfolio/masonry-portfolio-3.jpg";
import portfolio4 from "../../assets/img/masonry-portfolio/masonry-portfolio-4.jpg";
import portfolio5 from "../../assets/img/masonry-portfolio/masonry-portfolio-5.jpg";
import portfolio6 from "../../assets/img/masonry-portfolio/masonry-portfolio-6.jpg";
import portfolio7 from "../../assets/img/masonry-portfolio/masonry-portfolio-7.jpg";
import portfolio8 from "../../assets/img/masonry-portfolio/masonry-portfolio-8.jpg";
import portfolio9 from "../../assets/img/masonry-portfolio/masonry-portfolio-9.jpg";

const portfolioItems = [
  {
    image: portfolio1,
    title: "Project Dashboard",
    description: "Track tasks, progress, and deadlines all in one place.",
    category: "filter-app",
    detailsLink: "/portfolio-details/1",
  },
  {
    image: portfolio2,
    title: "Team Collaboration",
    description: "Chat, share files, and assign roles in real time.",
    category: "filter-product",
    detailsLink: "/portfolio-details/2",
  },
  {
    image: portfolio3,
    title: "Custom Workflows",
    description: "Design workflows that fit your team’s unique needs.",
    category: "filter-branding",
    detailsLink: "/portfolio-details/3",
  },
  {
    image: portfolio4,
    title: "Task Templates",
    description: "Quick-start your projects with pre-built templates.",
    category: "filter-app",
    detailsLink: "/portfolio-details/4",
  },
  {
    image: portfolio5,
    title: "Progress Tracking",
    description: "Visualize your progress with Gantt and Kanban views.",
    category: "filter-product",
    detailsLink: "/portfolio-details/5",
  },
  {
    image: portfolio6,
    title: "Role Management",
    description: "Control who can view, edit, and assign tasks.",
    category: "filter-branding",
    detailsLink: "/portfolio-details/6",
  },
  {
    image: portfolio7,
    title: "Deadline Reminders",
    description: "Never miss a task with smart reminders and alerts.",
    category: "filter-app",
    detailsLink: "/portfolio-details/7",
  },
  {
    image: portfolio8,
    title: "Analytics & Reports",
    description: "Gain insights into productivity and project health.",
    category: "filter-product",
    detailsLink: "/portfolio-details/8",
  },
  {
    image: portfolio9,
    title: "Client Portal",
    description: "Share progress and get feedback from clients easily.",
    category: "filter-branding",
    detailsLink: "/portfolio-details/9",
  },
];

const Portfolio = () => {
  useCustomScripts();
  return (
    <section id="portfolio" className="portfolio section">
      <div className="container section-title" data-aos="fade-up">
        <span>Features</span>
        <h2>Platform Highlights</h2>
        <p>
          Explore how Task Flow can streamline your work, boost team
          collaboration, and keep every project on track.
        </p>
      </div>

      <div className="container">
        <div
          className="isotope-layout"
          data-default-filter="*"
          data-layout="masonry"
          data-sort="original-order"
        >
          <ul
            className="portfolio-filters isotope-filters gap-5"
            data-aos="fade-up"
            data-aos-delay="100"
          >
            <li data-filter="*" className="filter-active">
              All
            </li>
            <li data-filter=".filter-app">Task Tools</li>
            <li data-filter=".filter-product">Team Features</li>
            <li data-filter=".filter-branding">Customization</li>
          </ul>

          <div
            className="row gy-4 isotope-container"
            data-aos="fade-up"
            data-aos-delay="200"
          >
            {portfolioItems.map((item, index) => (
              <div
                key={index}
                className={`col-lg-4 col-md-6 portfolio-item isotope-item ${item.category}`}
              >
                <img src={item.image} className="img-fluid" alt={item.title} />
                <div className="portfolio-info">
                  <h4>{item.title}</h4>
                  <p>{item.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default Portfolio;
