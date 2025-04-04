import React from "react";

// Example dynamic data for Privacy Policy
const privacyData = [
  {
    title: "Introduction",
    content:
      "This policy describes how Task Flow collects, uses, and protects your personal information.",
  },
  {
    title: "Information We Collect",
    content:
      "We collect personal information such as your name, email, and payment details for account creation and processing.",
  },
  {
    title: "How We Use Your Data",
    content:
      "We use your data to provide and improve our services, communicate with you, and process payments.",
  },
  {
    title: "Data Protection",
    content:
      "We take necessary security measures to protect your personal information from unauthorized access.",
  },
  {
    title: "Your Rights",
    content:
      "You have the right to access, update, or delete your personal information at any time. Please contact us for any requests.",
  },
];

const PrivacyPolicy = () => {
  return (
    <div
      className="container d-flex pt-5 mt-6rem justify-content-center"
      data-aos="fade-up"
      data-aos-delay="100"
    >
      <div className="card shadow-lg p-4 border-0">
        <h1 className="text-center mb-4 fw-bold" data-aos="fade-up">
          Privacy Policy
        </h1>
        <p
          className="text-muted text-center"
          data-aos="fade-up"
          data-aos-delay="200"
        >
          Last Updated: April 2025
        </p>

        {privacyData.map((section, index) => (
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

export default PrivacyPolicy;
