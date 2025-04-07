import React from "react";

const cardData = [
  {
    id: 1,
    number: "01",
    title: "Smart Task Management",
    description:
      "Create, assign, and prioritize tasks effortlessly. Stay organized and in control of your projects from start to finish.",
  },
  {
    id: 2,
    number: "02",
    title: "Real-Time Collaboration",
    description:
      "Work together with your team through instant updates, comments, and activity tracking—no more endless email threads.",
  },
  {
    id: 3,
    number: "03",
    title: "Visual Project Tracking",
    description:
      "Use Kanban boards, calendar views, and timelines to visualize progress and ensure deadlines are met on time.",
  },
  {
    id: 4,
    number: "04",
    title: "Custom Workflows",
    description:
      "Adapt Task Flow to your team’s needs with customizable statuses, labels, and workflows that match your process.",
  },
  {
    id: 5,
    number: "05",
    title: "Progress Insights",
    description:
      "Generate reports and view analytics to gain insights into productivity, task completion rates, and team efficiency.",
  },
  {
    id: 6,
    number: "06",
    title: "Secure & Reliable",
    description:
      "Your data is protected with robust authentication, encryption, and regular backups—so you can focus on what matters.",
  },
];

const Cards = () => {
  return (
    <section className="cards section mb-5">
      <div className="container">
        <div className="row no-gutters">
          {cardData.map(({ id, number, title, description }, index) => (
            <div
              key={id}
              className="col-lg-4 col-md-6 card"
              data-aos="fade-up"
              data-aos-delay={index * 100}
            >
              <span>{number}</span>
              <h4>{title}</h4>
              <p>{description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Cards;
