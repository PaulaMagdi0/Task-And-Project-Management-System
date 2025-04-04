import React from "react";
import Contact from "../../Components/Contact/Contact";
import useCustomScripts from "../../Hooks/useCustomScripts";

const Home = () => {
  useCustomScripts();
  return (
    <>
      <div className="my-5">
        <Contact />
      </div>
    </>
  );
};

export default Home;
