import React from "react";
import { Link } from "react-router-dom";
import { Swiper, SwiperSlide } from "swiper/react";
import "swiper/css";
import "swiper/css/autoplay";
import { Autoplay } from "swiper/modules";

// Import team images
import zalabany from "../../assets/img/team/zalabany.jpg"; // 7ot sortk hna ya zalabany
import mano from "../../assets/img/team/mano.png";
import hossam from "../../assets/img/team/hossam.jpg";
import khaled from "../../assets/img/team/khaled.jpg";
import pola from "../../assets/img/team/pola.jpg";

const teamMembers = [
  {
    portfolio: "1",
    name: "Mahmoud Nasr",
    role: "Full Stack Developer",
    description:
      "Mahmoud is the backbone of our platform, ensuring that all the front-end and back-end functionalities work seamlessly. He has extensive experience in building scalable systems.",
    image: zalabany,
    socialLinks: {
      linkedin: "https://www.linkedin.com/in/mahmoud-nasr-82aa822a9/",
      github: "https://github.com/MahmoudNasrZ",
      facebook: "https://www.facebook.com/mahmoud.nasr.9803",
    },
  },
  {
    portfolio: "2",
    name: "Hossam Zakaria",
    role: "Full Stack Developer",
    description:
      "Hossam manages the flow of tasks and ensures that deadlines are met. With a strong background in project management, he keeps everything organized and on track.",
    image: hossam,
    socialLinks: {
      linkedin: "https://www.linkedin.com/in/hossam-zakaria-s/",
      github: "https://github.com/HossamZakariaSannad",
      facebook: "https://www.facebook.com/hosam.zico.9",
    },
  },
  {
    portfolio: "3",
    name: "Khaled Sherif",
    role: "Full Stack Developer",
    description:
      "Khaled works closely with the development team to ensure our content is clear, concise, and accessible. He drives the content strategy and ensures its alignment with project goals.",
    image: khaled,
    socialLinks: {
      linkedin: "https://www.linkedin.com/in/khaled-sherif1/",
      github: "https://github.com/khaled-101",
      facebook: "https://www.facebook.com/khaled7451",
    },
  },
  {
    portfolio: "https://abdelrahmanebeid.framer.website/",
    name: "Abdelrahman Ebeid",
    role: "Full Stack Developer",
    description:
      "Abdelrahman is in charge of creating intuitive, user-friendly designs that make our platform easy to use. He focuses on creating beautiful, functional interfaces.",
    image: mano,
    socialLinks: {
      linkedin: "https://www.linkedin.com/in/abdelrahman-ebied22/",
      github: "https://github.com/MaNn0",
      facebook: "https://www.facebook.com/abdelrahman.ramadann",
    },
  },
  {
    portfolio: "5",
    name: "Pola Magdy",
    role: "Full Stack Developer",
    description:
      "Pola is in charge of creating unit testing, UI/UX that make our platform modern.",
    image: pola,
    socialLinks: {
      linkedin: "https://www.linkedin.com/in/paula-magdy/",
      github: "https://github.com/PaulaMagdi0",
      facebook: "https://www.facebook.com/elneamer.pop",
    },
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
            <SwiperSlide key={member.portfolio}>
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
                    <Link to={member.socialLinks.linkedin}>
                      <i className="bi bi-linkedin"></i>
                    </Link>
                    <Link to={member.socialLinks.github}>
                      <i className="bi bi-github"></i>
                    </Link>
                    <Link to={member.socialLinks.facebook}>
                      <i className="bi bi-facebook"></i>
                    </Link>
                  </div>
                  <a
                    href={member.portfolio}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="details-link"
                  >
                    <i className="bi bi-link-45deg"></i> View Portfolio
                  </a>
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
