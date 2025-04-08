import React from "react";
import PrivacyPolicy from "../../Components/PrivacyPolicy/PrivacyPolicy";
import useCustomScripts from "../../Hooks/useCustomScripts";

const Home = () => {
  useCustomScripts();
  return (
    <>
      <div className="my-5">
        <PrivacyPolicy />
      </div>
    </>
  );
};

export default Home;
