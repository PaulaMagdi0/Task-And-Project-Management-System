import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import "./Navbar.css"; // Make sure you have the required styles
import useCustomScripts from "../../Hooks/useCustomScripts";

const Navbar = () => {
  useCustomScripts();
  const location = useLocation();

  const [isMenuOpen, setIsMenuOpen] = useState(false); // State for mobile menu toggle
  const [isDropdownOpen, setIsDropdownOpen] = useState(false); // State for dropdown toggle

  const navItems = [
    { name: "Home", href: "/" },
    { name: "About", href: "/about" },
    { name: "Services", href: "/services" },
    { name: "Contact", href: "/contact" },
    {
      name: "User",
      dropdown: [
        { name: "Register", href: "/register" },
        { name: "Login", href: "/login" },
      ],
    },
  ];

  // Toggle mobile menu visibility
  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  // Toggle dropdown menu visibility
  const toggleDropdown = () => {
    setIsDropdownOpen(!isDropdownOpen);
  };

  return (
    <header id="header" className="branding header fixed-top py-3">
      <div className="d-flex align-items-center">
        <div className="container position-relative d-flex align-items-center justify-content-between">
          <Link to="/" className="logo d-flex align-items-center">
            <h1 className="sitename">Task Flow</h1>
          </Link>
          <nav id="navmenu" className={`navmenu ${isMenuOpen ? "active" : ""}`}>
            <ul className="nav-list gap-2">
              {navItems.map((item, index) => (
                <li
                  key={index}
                  className={`nav-item ${item.dropdown ? "dropdown" : ""}`}
                >
                  {item.dropdown ? (
                    <>
                      <span
                        className="fs-4 ms-3 user-icon"
                        onClick={toggleDropdown}
                      >
                        <i className="bi bi-person-circle"></i>
                      </span>
                      {/* Mobile dropdown */}
                      {isDropdownOpen && (
                        <ul className="mt-2 dropdown-menu">
                          {item.dropdown.map((subItem, subIndex) => (
                            <li key={subIndex}>
                              <Link
                                to={subItem.href}
                                className={
                                  location.pathname === subItem.href
                                    ? "active"
                                    : ""
                                }
                              >
                                {subItem.name}
                              </Link>
                            </li>
                          ))}
                        </ul>
                      )}
                    </>
                  ) : (
                    <Link
                      to={item.href}
                      className={
                        location.pathname === item.href ? "active" : ""
                      }
                    >
                      {item.name}
                    </Link>
                  )}
                </li>
              ))}
            </ul>
            <i
              className="mobile-nav-toggle d-xl-none bi bi-list"
              onClick={toggleMenu} // Toggle mobile menu on click
            ></i>
          </nav>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
