// File: src/components/Navbar.jsx
import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import './Navbar.css';
import { logout } from '../redux/authSlice';

const Navbar = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { token, username } = useSelector((state) => state.auth);

  const handleLogout = () => {
    dispatch(logout());
    navigate('/signin');
  };

  return (
    <nav className="navbar">
      <div className="navbar-logo">
        <Link to="/">TaskManager</Link>
      </div>
      <ul className="navbar-links">
        <li><Link to="/">Home</Link></li>
        {token ? (
          <>
            <li className="welcome-message"> {username}</li>
            <li>
              <button className="logout-button" onClick={handleLogout}>
                Sign Out
              </button>
            </li>
            <li><Link to="/instructor/tasks">Instructor Tasks</Link></li>
          </>
        ) : (
          <>
            <li><Link to="/signin">Sign In</Link></li>
            {/* <li><Link to="/signup">Sign Up</Link></li> */}
          </>
        )}
      </ul>
    </nav>
  );
};

export default Navbar;
