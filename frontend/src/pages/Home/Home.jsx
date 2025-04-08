import React from "react";
import Hero from "../../Components/Hero/Hero";
import Clients from "../../Components/Clients/Clients";
import CallToAction from "../../Components/CallToAction/CallToAction";
import Portfolio from "../../Components/Portfolio/Portfolio";
import Team from "../../Components/Team/Team";
import About from "../../Components/About/About";

const Home = () => {
  return (
    <>
      <Hero />
      {/* <Portfolio /> */}
      {/* <Clients /> */}
      <About />
      <CallToAction />
      <Team />
    </>
  );
};

export default Home;
