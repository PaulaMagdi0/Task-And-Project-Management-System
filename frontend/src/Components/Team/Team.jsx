import React from "react";
import { Link } from "react-router-dom";
import { Swiper, SwiperSlide } from "swiper/react";
import "swiper/css";
import "swiper/css/autoplay";
import { Autoplay } from "swiper/modules";

// Import team images
import team1Image from "../../assets/img/team/team-1.jpg";
import team2Image from "../../assets/img/team/team-2.jpg";
import team3Image from "../../assets/img/team/team-3.jpg";

const teamMembers = [
  {
    id: "walter-white",
    name: "Walter White",
    role: "Lead Web Developer",
    description:
      "Walter is the backbone of our platform, ensuring that all the front-end and back-end functionalities work seamlessly. He has extensive experience in building scalable systems.",
    image: team1Image,
    socialLinks: { twitter: "#", facebook: "#", instagram: "#", linkedin: "#" },
  },
  {
    id: "sarah-jhinson",
    name: "Sarah Jhinson",
    role: "Project Manager",
    description:
      "Sarah manages the flow of tasks and ensures that deadlines are met. With a strong background in project management, she keeps everything organized and on track.",
    image: team2Image,
    socialLinks: { twitter: "#", facebook: "#", instagram: "#", linkedin: "#" },
  },
  {
    id: "william-anderson",
    name: "William Anderson",
    role: "Content Strategist",
    description:
      "William works closely with the development team to ensure our content is clear, concise, and accessible. He drives the content strategy and ensures its alignment with project goals.",
    image: team3Image,
    socialLinks: { twitter: "#", facebook: "#", instagram: "#", linkedin: "#" },
  },
  {
    id: "jane-doe",
    name: "Jane Doe",
    role: "UI/UX Designer",
    description:
      "Jane is in charge of creating intuitive, user-friendly designs that make our platform easy to use. She focuses on creating beautiful, functional interfaces.",
    image: team3Image,
    socialLinks: { twitter: "#", facebook: "#", instagram: "#", linkedin: "#" },
  },
];

const Team = () => {
  return (
    <section id="team" className="team section">
      <div className="container section-title" data-aos="fade-up">
        <span>Our Team</span>
        <h2>Meet the Team</h2>
        <p>
          Our talented team works together to build and maintain a task and
          project management platform tailored to meet your needs.
        </p>
      </div>
      <div className="container">
        <Swiper
          modules={[Autoplay]}
          spaceBetween={30}
          slidesPerView={1}
          breakpoints={{
            768: { slidesPerView: 2 },
            1024: { slidesPerView: 3 },
          }}
          autoplay={{
            delay: 5000,
            disableOnInteraction: false,
          }}
          loop={true}
        >
          {teamMembers.map((member) => (
            <SwiperSlide key={member.id}>
              <div className="member" data-aos="fade-up" data-aos-delay="100">
                <img
                  src={member.image}
                  className="img-fluid"
                  alt={member.name}
                />
                <div className="member-content">
                  <h4>{member.name}</h4>
                  <span>{member.role}</span>
                  <p>{member.description}</p>
                  <div className="social">
                    <Link to={member.socialLinks.twitter}>
                      <i className="bi bi-twitter"></i>
                    </Link>
                    <Link to={member.socialLinks.facebook}>
                      <i className="bi bi-facebook"></i>
                    </Link>
                    <Link to={member.socialLinks.instagram}>
                      <i className="bi bi-instagram"></i>
                    </Link>
                    <Link to={member.socialLinks.linkedin}>
                      <i className="bi bi-linkedin"></i>
                    </Link>
                  </div>
                  <Link to={`/team/${member.id}`} className="details-link">
                    <i className="bi bi-link-45deg"></i> View Profile
                  </Link>
                </div>
              </div>
            </SwiperSlide>
          ))}
        </Swiper>
      </div>
    </section>
  );
};

export default Team;
