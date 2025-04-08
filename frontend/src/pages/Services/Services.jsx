import React from "react";
import Services from "../../Components/Services/Services";
import useCustomScripts from "../../Hooks/useCustomScripts";

const Home = () => {
  useCustomScripts();
  return (
    <>
      <div className="my-5">
        <Services />
      </div>
    </>
  );
};

export default Home;
