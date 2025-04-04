import React from "react";

// Example dynamic data for Terms of Service
const termsData = [
  {
    title: "Introduction",
    content:
      "Welcome to Task Flow. By accessing or using our services, you agree to these Terms.",
  },
  {
    title: "User Responsibilities",
    content:
      "As a user of Task Flow, you agree to follow all the rules and guidelines set forth.",
  },
  {
    title: "Content Ownership",
    content:
      "All content uploaded to the platform remains the property of the user, but you grant us a license to display and use it.",
  },
  {
    title: "Limitation of Liability",
    content:
      "We are not responsible for any damages resulting from the use of our services.",
  },
  {
    title: "Termination of Account",
    content:
      "We reserve the right to suspend or terminate your account if you violate any of these terms.",
  },
];

const TermsOfService = () => {
  return (
    <div
      className="container d-flex pt-5 mt-6rem justify-content-center"
      data-aos="fade-up"
      data-aos-delay="100"
    >
      <div className="card shadow-lg p-4 border-0">
        <h1 className="text-center mb-4 fw-bold" data-aos="fade-up">
          Terms of Service
        </h1>
        <p
          className="text-muted text-center"
          data-aos="fade-up"
          data-aos-delay="200"
        >
          Last Updated: April 2025
        </p>

        {termsData.map((section, index) => (
          <div
            key={index}
            className="mt-4"
            data-aos="fade-up"
            data-aos-delay={300 + index * 100}
          >
            <h4 className="fw-semibold term-color">
              {index + 1}. {section.title}
            </h4>
            <p>{section.content}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TermsOfService;
