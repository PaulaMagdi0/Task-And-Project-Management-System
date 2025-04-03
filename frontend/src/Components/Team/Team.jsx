import React from "react";
import { Link } from "react-router-dom"; // Import Link from react-router-dom

// Import team images
import team1Image from "../../assets/img/team/team-1.jpg";
import team2Image from "../../assets/img/team/team-2.jpg";
import team3Image from "../../assets/img/team/team-3.jpg";

const teamMembers = [
  {
    id: "walter-white",
    name: "Walter White",
    role: "Web Development",
    description:
      "Magni qui quod omnis unde et eos fuga et exercitationem. Odio veritatis perspiciatis quaerat qui aut aut aut",
    image: team1Image, // Use the imported image here
    socialLinks: {
      twitter: "#",
      facebook: "#",
      instagram: "#",
      linkedin: "#",
    },
  },
  {
    id: "sarah-jhinson",
    name: "Sarah Jhinson",
    role: "Marketing",
    description:
      "Repellat fugiat adipisci nemo illum nesciunt voluptas repellendus. In architecto rerum rerum temporibus",
    image: team2Image, // Use the imported image here
    socialLinks: {
      twitter: "#",
      facebook: "#",
      instagram: "#",
      linkedin: "#",
    },
  },
  {
    id: "william-anderson",
    name: "William Anderson",
    role: "Content",
    description:
      "Voluptas necessitatibus occaecati quia. Earum totam consequuntur qui porro et laborum toro des clara",
    image: team3Image, // Use the imported image here
    socialLinks: {
      twitter: "#",
      facebook: "#",
      instagram: "#",
      linkedin: "#",
    },
  },
];

const Team = () => {
  return (
    <section id="team" className="team section">
      <div className="container section-title" data-aos="fade-up">
        <span>Team</span>
        <h2>Team</h2>
        <p>
          Necessitatibus eius consequatur ex aliquid fuga eum quidem sint
          consectetur velit
        </p>
      </div>
      <div className="container">
        <div className="row">
          {teamMembers.map((member) => (
            <div
              key={member.id}
              className="col-lg-4 col-md-6 d-flex"
              data-aos="fade-up"
              data-aos-delay="100"
            >
              <div className="member">
                <img
                  src={member.image} // Dynamically set image
                  className="img-fluid"
                  alt={member.name}
                />
                <div className="member-content">
                  <h4>{member.name}</h4>
                  <span>{member.role}</span>
                  <p>{member.description}</p>
                  <div className="social">
                    <a href={member.socialLinks.twitter}>
                      <i className="bi bi-twitter-x"></i>
                    </a>
                    <a href={member.socialLinks.facebook}>
                      <i className="bi bi-facebook"></i>
                    </a>
                    <a href={member.socialLinks.instagram}>
                      <i className="bi bi-instagram"></i>
                    </a>
                    <a href={member.socialLinks.linkedin}>
                      <i className="bi bi-linkedin"></i>
                    </a>
                  </div>
                  <Link to={`/team/${member.id}`} className="details-link">
                    <i className="bi bi-link-45deg"></i> View Profile
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Team;
