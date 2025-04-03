import React from "react";
import { Link } from "react-router-dom"; // Import Link from react-router-dom

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
    title: "App 1",
    description: "Lorem ipsum, dolor sit",
    category: "filter-app",
    detailsLink: "/portfolio-details/1",
  },
  {
    image: portfolio2,
    title: "Product 1",
    description: "Lorem ipsum, dolor sit",
    category: "filter-product",
    detailsLink: "/portfolio-details/2",
  },
  {
    image: portfolio3,
    title: "Branding 1",
    description: "Lorem ipsum, dolor sit",
    category: "filter-branding",
    detailsLink: "/portfolio-details/3",
  },
  {
    image: portfolio4,
    title: "App 2",
    description: "Lorem ipsum, dolor sit",
    category: "filter-app",
    detailsLink: "/portfolio-details/4",
  },
  {
    image: portfolio5,
    title: "Product 2",
    description: "Lorem ipsum, dolor sit",
    category: "filter-product",
    detailsLink: "/portfolio-details/5",
  },
  {
    image: portfolio6,
    title: "Branding 2",
    description: "Lorem ipsum, dolor sit",
    category: "filter-branding",
    detailsLink: "/portfolio-details/6",
  },
  {
    image: portfolio7,
    title: "App 3",
    description: "Lorem ipsum, dolor sit",
    category: "filter-app",
    detailsLink: "/portfolio-details/7",
  },
  {
    image: portfolio8,
    title: "Product 3",
    description: "Lorem ipsum, dolor sit",
    category: "filter-product",
    detailsLink: "/portfolio-details/8",
  },
  {
    image: portfolio9,
    title: "Branding 3",
    description: "Lorem ipsum, dolor sit",
    category: "filter-branding",
    detailsLink: "/portfolio-details/9",
  },
];

const Portfolio = () => {
  return (
    <section id="portfolio" className="portfolio section">
      <div className="container section-title" data-aos="fade-up">
        <span>Portfolio</span>
        <h2>Portfolio</h2>
        <p>
          Necessitatibus eius consequatur ex aliquid fuga eum quidem sint
          consectetur velit
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
            className="portfolio-filters isotope-filters"
            data-aos="fade-up"
            data-aos-delay="100"
          >
            <li data-filter="*" className="filter-active">
              All
            </li>
            <li data-filter=".filter-app">App</li>
            <li data-filter=".filter-product">Card</li>
            <li data-filter=".filter-branding">Web</li>
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
                  <Link
                    href={item.image}
                    title={item.title}
                    data-gallery={`portfolio-gallery-${item.category}`}
                    className="glightbox details-link"
                  >
                    <i className="bi bi-zoom-in"></i>
                  </Link>
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
