import React from "react";
import { Link } from "react-router-dom"; // Ensure you're using React Router for navigation

const footerInfo = {
  logo: "Day",
  address: "A108 Adam Street, New York, NY 535022", // Original location
  phone: "+1 5589 55488 55",
  email: "info@example.com",
  socialLinks: {
    twitter: "#",
    facebook: "#",
    instagram: "#",
    linkedin: "#",
  },
  usefulLinks: [
    { name: "Home", url: "/" },
    { name: "About us", url: "/about" },
    { name: "Services", url: "/services" },
    { name: "Terms of service", url: "/terms" },
    { name: "Privacy policy", url: "/privacy" },
  ],
  services: [
    { name: "Web Design", url: "/web-design" },
    { name: "Web Development", url: "/web-development" },
    { name: "Product Management", url: "/product-management" },
    { name: "Marketing", url: "/marketing" },
    { name: "Graphic Design", url: "/graphic-design" },
  ],
};

const Footer = () => {
  return (
    <footer id="footer" className="footer position-relative dark-background">
      <div className="container footer-top">
        <div className="row gy-4">
          <div className="col-lg-4 col-md-6">
            <div className="footer-about">
              <Link to="/" className="logo sitename">
                {footerInfo.logo}
              </Link>
              <div className="footer-contact pt-3">
                <p>{footerInfo.address}</p>
                <p className="mt-3">
                  <strong>Phone:</strong> <span>{footerInfo.phone}</span>
                </p>
                <p>
                  <strong>Email:</strong> <span>{footerInfo.email}</span>
                </p>
              </div>
              <div className="social-links d-flex mt-4">
                <Link to={footerInfo.socialLinks.twitter}>
                  <i className="bi bi-twitter-x"></i>
                </Link>
                <Link to={footerInfo.socialLinks.facebook}>
                  <i className="bi bi-facebook"></i>
                </Link>
                <Link to={footerInfo.socialLinks.instagram}>
                  <i className="bi bi-instagram"></i>
                </Link>
                <Link to={footerInfo.socialLinks.linkedin}>
                  <i className="bi bi-linkedin"></i>
                </Link>
              </div>
            </div>
          </div>
          <div className="col-lg-2 col-md-3 footer-links">
            <h4>Useful Links</h4>
            <ul>
              {footerInfo.usefulLinks.map((link, index) => (
                <li key={index}>
                  <Link to={link.url}>{link.name}</Link>
                </li>
              ))}
            </ul>
          </div>
          <div className="col-lg-2 col-md-3 footer-links">
            <h4>Our Services</h4>
            <ul>
              {footerInfo.services.map((service, index) => (
                <li key={index}>
                  <Link to={service.url}>{service.name}</Link>
                </li>
              ))}
            </ul>
          </div>
          <div className="col-lg-4 col-md-12 footer-newsletter">
            <h4>Our Newsletter</h4>
            <p>
              Subscribe to our newsletter and receive the latest news about our
              products and services!
            </p>
            <form
              action="forms/newsletter.php"
              method="post"
              className="php-email-form"
            >
              <div className="newsletter-form">
                <input type="email" name="email" />
                <input type="submit" value="Subscribe" />
              </div>
              <div className="loading">Loading</div>
              <div className="error-message"></div>
              <div className="sent-message">
                Your subscription request has been sent. Thank you!
              </div>
            </form>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
