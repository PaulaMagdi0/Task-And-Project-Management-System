import React from "react";
import About from "../../Components/About/About";
import Cards from "../../Components/Cards/Cards";
import useCustomScripts from "../../Hooks/useCustomScripts";

const Home = () => {
  useCustomScripts();
  return (
    <>
      <div className="my-5">
        <About />
        <Cards />
      </div>
    </>
  );
};

export default Home;
