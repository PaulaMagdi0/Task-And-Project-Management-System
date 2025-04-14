import React from "react";
import { Link } from "react-router-dom";
import heroBg from "/src/assets/img/newCapital.png";

const callToActionData = {
  title: "Let's Get Things Done",
  description:
    "Ready to boost your team's productivity and keep every task on track? Join Task Flow today and start managing your projects with clarity and confidence.",
  buttonText: "Services",
  imageUrl: heroBg,
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
              <Link to="/services" className="cta-btn">
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
