import React from "react";
import { Link } from "react-router-dom";

const footerInfo = {
  logo: "Task Flow",
  address: "456 Workflow Ave, Productivity City, PC 78910",
  phone: "+1 (800) 123-4567",
  email: "support@taskflowpro.com",
  socialLinks: {
    twitter: "https://twitter.com/",
    facebook: "https://www.facebook.com/",
    instagram: "https://www.instagram.com/",
    linkedin: "https://www.linkedin.com/",
  },
  usefulLinks: [
    { name: "Home", url: "/" },
    { name: "About Us", url: "/about" },
    { name: "Services", url: "/services" },
    { name: "Terms of Service", url: "/terms" },
    { name: "Privacy Policy", url: "/privacy" },
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
          {/* Contact Info */}
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
                <Link
                  to={footerInfo.socialLinks.twitter}
                  className="me-3"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <i className="bi bi-twitter-x"></i>
                </Link>
                <Link
                  to={footerInfo.socialLinks.facebook}
                  className="me-3"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <i className="bi bi-facebook"></i>
                </Link>
                <Link
                  to={footerInfo.socialLinks.instagram}
                  className="me-3"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <i className="bi bi-instagram"></i>
                </Link>
                <Link
                  to={footerInfo.socialLinks.linkedin}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <i className="bi bi-linkedin"></i>
                </Link>
              </div>
            </div>
          </div>

          {/* Useful Links */}
          <div className="col-lg-6 col-md-12 footer-links">
            <h4 className="text-center">Quick Navigation</h4>
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
