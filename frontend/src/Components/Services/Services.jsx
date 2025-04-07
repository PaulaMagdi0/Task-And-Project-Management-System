import React from "react";
import { Link } from "react-router-dom";

const servicesData = [
  {
    id: 1,
    icon: "bi-kanban",
    title: "Task Management",
    description:
      "Streamline task creation, assignment, and tracking to ensure projects are completed efficiently. Organize tasks with due dates, priorities, and deadlines.",
  },
  {
    id: 2,
    icon: "bi-calendar-check",
    title: "Project Scheduling",
    description:
      "Easily create and manage project timelines with Gantt charts, calendars, and task dependencies to stay on track with deadlines.",
  },
  {
    id: 3,
    icon: "bi-person-circle",
    title: "Team Collaboration",
    description:
      "Facilitate seamless communication between team members through real-time chat, notifications, and file sharing.",
  },
  {
    id: 4,
    icon: "bi-clipboard-data",
    title: "Performance Tracking",
    description:
      "Monitor progress with detailed reports and analytics to track project milestones, completed tasks, and team performance.",
  },
  {
    id: 5,
    icon: "bi-file-earmark-text",
    title: "Document Management",
    description:
      "Store and share important project files and documents securely with easy access for your team members.",
  },
  {
    id: 6,
    icon: "bi-chat-left-text",
    title: "Communication Tools",
    description:
      "Engage with your team and clients using integrated messaging, comments, and notifications to ensure everyone stays aligned.",
  },
];

const Services = () => {
  return (
    <section className="services section">
      <div className="container section-title" data-aos="fade-up">
        <span>Our Services</span>
        <h2>Project & Task Management Solutions</h2>
        <p>
          Discover a comprehensive suite of tools designed to streamline your
          task and project management workflows.
        </p>
      </div>
      <div className="container">
        <div className="row gy-4">
          {servicesData.map((service, index) => (
            <div
              className="col-lg-4 col-md-6"
              data-aos="fade-up"
              data-aos-delay={`${(index + 1) * 100}`}
              key={service.id}
            >
              <div className="service-item position-relative">
                <div className="icon">
                  <i className={`bi ${service.icon}`}></i>
                </div>
                <div className="stretched-link">
                  <h3>{service.title}</h3>
                </div>
                <p>{service.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Services;
