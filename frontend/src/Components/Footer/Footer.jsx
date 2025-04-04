import React from "react";
import { Link } from "react-router-dom"; // Ensure you're using React Router for navigation

const footerInfo = {
  logo: "Task Flow",
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
};

const Footer = () => {
  return (
    <footer
      id="footer"
      className="footer position-relative dark-background py-4"
    >
      <div className="container footer-top">
        <div className="row gy-4">
          {/* Contact Section - Adjusted to take 50% width on large screens */}
          <div className="col-lg-6 col-md-12">
            <div className="footer-about text-center text-lg-start">
              <Link to="/" className="logo sitename fs-3 fw-bold">
                {footerInfo.logo}
              </Link>
              <div className="footer-contact pt-3">
                <p className="mb-1">{footerInfo.address}</p>
                <p className="mb-1">
                  <strong>Phone:</strong> {footerInfo.phone}
                </p>
                <p className="mb-3">
                  <strong>Email:</strong> {footerInfo.email}
                </p>
              </div>
              <div className="social-links d-flex justify-content-center justify-content-lg-start mt-3">
                <Link to={footerInfo.socialLinks.twitter} className="me-3">
                  <i className="bi bi-twitter-x"></i>
                </Link>
                <Link to={footerInfo.socialLinks.facebook} className="me-3">
                  <i className="bi bi-facebook"></i>
                </Link>
                <Link to={footerInfo.socialLinks.instagram} className="me-3">
                  <i className="bi bi-instagram"></i>
                </Link>
                <Link to={footerInfo.socialLinks.linkedin}>
                  <i className="bi bi-linkedin"></i>
                </Link>
              </div>
            </div>
          </div>

          {/* Useful Links Section - Adjusted to take 50% width on large screens */}
          <div className="col-lg-6 col-md-12 footer-links">
            <h4 className="text-center">Useful Links</h4>
            <ul className="list-unstyled text-center text-lg-start">
              {footerInfo.usefulLinks.map((link, index) => (
                <li key={index} className="mb-2 justify-content-center">
                  <Link to={link.url} className="text-decoration-none">
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
