import React, { Fragment } from "react";
import Navbar from "./Components/Navbar/Navbar";
import Hero from "./Components/Hero/Hero";
import About from "./Components/About/About";
import Cards from "./Components/Cards/Cards";
import Clients from "./Components/Clients/Clients";
import Services from "./Components/Services/Services";
import CallToAction from "./Components/CallToAction/CallToAction";
import Portfolio from "./Components/Portfolio/Portfolio";
import Team from "./Components/Team/Team";
import Contact from "./Components/Contact/Contact";
import Footer from "./Components/Footer/Footer";

const App = () => {
  return (
    <Fragment>
      <Navbar />
      {/* <main className="main"> */}
      <Hero />
      <About />
      <Cards />
      <Clients />
      <Services />
      <CallToAction />
      <Portfolio />
      <Team />
      <Contact />
      {/* </main> */}
      <Footer />
    </Fragment>
  );
};

export default App;
