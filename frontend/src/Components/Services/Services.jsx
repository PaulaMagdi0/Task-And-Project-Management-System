import React from "react";
import { Link } from "react-router-dom";

const servicesData = [
  {
    id: 1,
    icon: "bi-activity",
    title: "Nesciunt Mete",
    description:
      "Provident nihil minus qui consequatur non omnis maiores. Eos accusantium minus dolores iure perferendis tempore et consequatur.",
    link: "#",
  },
  {
    id: 2,
    icon: "bi-broadcast",
    title: "Eosle Commodi",
    description:
      "Ut autem aut autem non a. Sint sint sit facilis nam iusto sint. Libero corrupti neque eum hic non ut nesciunt dolorem.",
    link: "#",
  },
  {
    id: 3,
    icon: "bi-easel",
    title: "Ledo Markt",
    description:
      "Ut excepturi voluptatem nisi sed. Quidem fuga consequatur. Minus ea aut. Vel qui id voluptas adipisci eos earum corrupti.",
    link: "#",
  },
  {
    id: 4,
    icon: "bi-bounding-box-circles",
    title: "Asperiores Commodit",
    description:
      "Non et temporibus minus omnis sed dolor esse consequatur. Cupiditate sed error ea fuga sit provident adipisci neque.",
    link: "#",
  },
  {
    id: 5,
    icon: "bi-calendar4-week",
    title: "Velit Doloremque",
    description:
      "Cumque et suscipit saepe. Est maiores autem enim facilis ut aut ipsam corporis aut. Sed animi at autem alias eius labore.",
    link: "#",
  },
  {
    id: 6,
    icon: "bi-chat-square-text",
    title: "Dolori Architecto",
    description:
      "Hic molestias ea quibusdam eos. Fugiat enim doloremque aut neque non et debitis iure. Corrupti recusandae ducimus enim.",
    link: "#",
  },
];

const Services = () => {
  return (
    <section className="services section">
      <div className="container section-title" data-aos="fade-up">
        <span>Services</span>
        <h2>Services</h2>
        <p>
          Necessitatibus eius consequatur ex aliquid fuga eum quidem sint
          consectetur velit
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
                <Link to={service.link} className="stretched-link">
                  <h3>{service.title}</h3>
                </Link>
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
