import React from "react";
import TermsOfService from "../../Components/TermsOfService/TermsOfService";
import useCustomScripts from "../../Hooks/useCustomScripts";

const Home = () => {
  useCustomScripts();
  return (
    <>
      <div className="my-5">
        <TermsOfService />
      </div>
    </>
  );
};

export default Home;
