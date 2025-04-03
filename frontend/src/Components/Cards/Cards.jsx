import React from "react";

const cardData = [
  {
    id: 1,
    number: "01",
    title: "Lorem Ipsum",
    description:
      "Ulamco laboris nisi ut aliquip ex ea commodo consequat. Et consectetur ducimus vero placeat",
  },
  {
    id: 2,
    number: "02",
    title: "Repellat Nihil",
    description:
      "Dolorem est fugiat occaecati voluptate velit esse. Dicta veritatis dolor quod et vel dire leno para dest",
  },
  {
    id: 3,
    number: "03",
    title: "Ad ad velit qui",
    description:
      "Molestiae officiis omnis illo asperiores. Aut doloribus vitae sunt debitis quo vel nam quis",
  },
  {
    id: 4,
    number: "04",
    title: "Repellendus molestiae",
    description:
      "Inventore quo sint a sint rerum. Distinctio blanditiis deserunt quod soluta quod nam mider lando casa",
  },
  {
    id: 5,
    number: "05",
    title: "Sapiente Magnam",
    description:
      "Vitae dolorem in deleniti ipsum omnis tempore voluptatem. Qui possimus est repellendus est quibusdam",
  },
  {
    id: 6,
    number: "06",
    title: "Facilis Impedit",
    description:
      "Quis eum numquam veniam ea voluptatibus voluptas. Excepturi aut nostrum repudiandae voluptatibus corporis sequi",
  },
];

const Cards = () => {
  return (
    <section id="cards" className="cards section">
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
