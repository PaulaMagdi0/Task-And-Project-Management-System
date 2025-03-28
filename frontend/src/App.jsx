import React from 'react';
import { Routes, Route, BrowserRouter } from 'react-router-dom';
import NotFound from './pages/NotFound';
import Home from './pages/Home';
import Navbar from './pages/Navbar';
import SignIn from './pages/Signin';
import SignUp from './pages/Signup';



function App() {
    return (

        // <BrowserRouter>
        // <Header /> //navbar to be shown in all pages
        <BrowserRouter>
            {/* <Navbar /> */}
            <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/signin" element={<SignIn />} />
                <Route path="/signup" element={<SignUp />} />
                <Route path="*" element={<NotFound />} />
            </Routes>
        </BrowserRouter>

    );
}

export default App;