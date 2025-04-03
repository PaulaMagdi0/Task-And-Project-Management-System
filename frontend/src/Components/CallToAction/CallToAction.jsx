import React from "react";
import { Link } from "react-router-dom"; // Import Link from react-router-dom
import ctaBgImage from "../../assets/img/cta-bg.jpg";

const callToActionData = {
  title: "Call To Action",
  description:
    "Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.",
  buttonText: "Call To Action",
  imageUrl: ctaBgImage,
};

const CallToAction = () => {
  const { title, description, buttonText, imageUrl } = callToActionData;

  return (
    <section
      id="call-to-action"
      className="call-to-action section dark-background"
    >
      <img src={imageUrl} alt="Call to Action Background" />
      <div className="container">
        <div
          className="row justify-content-center"
          data-aos="zoom-in"
          data-aos-delay="100"
        >
          <div className="col-xl-10">
            <div className="text-center">
              <h3>{title}</h3>
              <p>{description}</p>
              <Link to="#" className="cta-btn">
                {" "}
                {/* Change <a> to <Link> */}
                {buttonText}
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CallToAction;
