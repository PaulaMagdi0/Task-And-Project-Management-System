// // // File: src/components/Navbar.jsx
// // import React from 'react';
// // import { Link, useNavigate } from 'react-router-dom';
// // import { useSelector, useDispatch } from 'react-redux';
// // import './Navbar.css';
// // import { logout } from '../redux/authSlice';

// // const Navbar = () => {
// //   const navigate = useNavigate();
// //   const dispatch = useDispatch();
// //   const { token, username } = useSelector((state) => state.auth);

// //   const handleLogout = () => {
// //     dispatch(logout());
// //     navigate('/signin');
// //   };

// //   return (
// //     <nav className="navbar">
// //       <div className="navbar-logo">
// //         <Link to="/">TaskManager</Link>
// //       </div>
// //       <ul className="navbar-links">
// //         <li><Link to="/">Home</Link></li>
// //         {token ? (
// //           <>
// //             <li className="welcome-message"> {username}</li>
// //             <li>
// //               <button className="logout-button" onClick={handleLogout}>
// //                 Sign Out
// //               </button>
// //             </li>
// //             <li><Link to="/instructor/tasks">Instructor Tasks</Link></li>
// //           </>
// //         ) : (
// //           <>
// //             <li><Link to="/signin">Sign In</Link></li>
// //             <li><Link to="/signup">Sign Up</Link></li>
// //           </>
// //         )}
// //       </ul>
// //     </nav>
// //   );
// // };

// // export default Navbar;
// import React from 'react';
// import { 
//   AppBar, 
//   Box, 
//   Toolbar, 
//   Typography, 
//   InputBase, 
//   IconButton,
//   Badge,
//   styled
// } from '@mui/material';
// import { Search, Bell, Settings, Grid } from 'lucide-react';

// const SearchInput = styled(InputBase)(({ theme }) => ({
//   color: '#666',
//   padding: theme.spacing(1, 1, 1, 5),
//   width: '100%',
//   '& input': {
//     color: '#666',
//   }
// }));

// function Navbar() {
//   return (
//     <nav className="navbar">
//       <div className="navbar-logo">
//         <Link to="/">TaskManager</Link>
//       </div>
//       <ul className="navbar-links">
//         <li><Link to="/">Home</Link></li>
//         {token ? (
//           <>
//             <li className="welcome-message"> {username}</li>
//             <li>
//               <button className="logout-button" onClick={handleLogout}>
//                 Sign Out
//               </button>
//             </li>
//             <li><Link to="/instructor/tasks">Instructor Tasks</Link></li>
//           </>
//         ) : (
//           <>
//             <li><Link to="/signin">Sign In</Link></li>
//             {/* <li><Link to="/signup">Sign Up</Link></li> */}
//           </>
//         )}
//       </ul>
//     </nav>
//   );
// }

// export default Navbar;
import React from 'react';
import {
  AppBar,
  Box,
  Toolbar,
  Typography,
  InputBase,
  IconButton,
  Badge,
  styled
} from '@mui/material';
import { Search, Bell, Settings, Grid } from 'lucide-react';

const SearchInput = styled(InputBase)(({ theme }) => ({
  color: '#666',
  padding: theme.spacing(1, 1, 1, 5),
  width: '100%',
  '& input': {
    color: '#666',
  }
}));

function Navbar() {
  return (
    <AppBar
      position="fixed"
      sx={{
        ml: '260px',
        width: 'calc(100% - 260px)',
        bgcolor: 'background.paper',
        boxShadow: 'none',
        borderBottom: '1px solid rgba(0, 0, 0, 0.12)'
      }}
    >
      <Toolbar>
        <Typography
          variant="h6"
          component="div"
          sx={{ color: 'text.secondary', flexGrow: 0, minWidth: 160 }}
        >
          Dashboard
        </Typography>

        <Box sx={{ flexGrow: 1, position: 'relative' }}>
          <Box sx={{ position: 'relative', maxWidth: 400 }}>
            <Search
              size={20}
              style={{
                position: 'absolute',
                left: 8,
                top: '50%',
                transform: 'translateY(-50%)',
                color: '#666'
              }}
            />
            <SearchInput
              placeholder="Search..."
            />
          </Box>
        </Box>

        <Box sx={{ display: 'flex', gap: 1 }}>
          <IconButton size="large">
            <Grid size={20} color="#666" />
          </IconButton>
          <IconButton size="large">
            <Badge badgeContent={4} color="error">
              <Bell size={20} color="#666" />
            </Badge>
          </IconButton>
          <IconButton size="large">
            <Settings size={20} color="#666" />
          </IconButton>
        </Box>
      </Toolbar>
    </AppBar>
  );
}

export default Navbar;
