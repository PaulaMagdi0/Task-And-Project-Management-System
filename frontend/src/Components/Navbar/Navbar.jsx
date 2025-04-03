import React from "react";
import { Link } from "react-router-dom";

const Navbar = () => {
  const navItems = [
    { name: "Home", href: "#hero", active: true },
    { name: "About", href: "#about" },
    { name: "Services", href: "#services" },
    { name: "Portfolio", href: "#portfolio" },
    { name: "Team", href: "#team" },
    {
      name: "Dropdown",
      href: "#",
      dropdown: [
        { name: "Dropdown 1", href: "#" },
        { name: "Dropdown 2", href: "#" },
        { name: "Dropdown 3", href: "#" },
        { name: "Dropdown 4", href: "#" },
      ],
    },
    { name: "Contact", href: "#contact" },
  ];

  return (
    <header id="header" className="header fixed-top">
      <div className="branding d-flex align-items-center">
        <div className="container position-relative d-flex align-items-center justify-content-between">
          <Link to="/" className="logo d-flex align-items-center">
            <h1 className="sitename">Task Flow</h1>
          </Link>
          <nav id="navmenu" className="navmenu">
            <ul>
              {navItems.map((item, index) => (
                <li key={index} className={item.dropdown ? "dropdown" : ""}>
                  <Link to={item.href} className={item.active ? "active" : ""}>
                    {item.name}
                    {item.dropdown && (
                      <i className="bi bi-chevron-down toggle-dropdown"></i>
                    )}
                  </Link>
                  {item.dropdown && (
                    <ul>
                      {item.dropdown.map((subItem, subIndex) => (
                        <li key={subIndex}>
                          <Link to={subItem.href}>{subItem.name}</Link>
                        </li>
                      ))}
                    </ul>
                  )}
                </li>
              ))}
            </ul>
            <i className="mobile-nav-toggle d-xl-none bi bi-list"></i>
          </nav>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
