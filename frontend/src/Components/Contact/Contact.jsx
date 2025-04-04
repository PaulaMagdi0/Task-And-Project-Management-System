import React from "react";
import { Link } from "react-router-dom";

// Dynamic data for the contact section
const contactInfo = {
  address: {
    icon: "bi bi-geo-alt",
    title: "Address",
    description: "A108 Adam Street, New York, NY 535022",
  },
  phone: {
    icon: "bi bi-telephone",
    title: "Call Us",
    description: "+1 5589 55488 55",
  },
  email: {
    icon: "bi bi-envelope",
    title: "Email Us",
    description: "info@example.com",
  },
  googleMapSrc:
    "https://www.google.com/maps/embed?pb=!1m14!1m8!1m3!1d48389.78314118045!2d-74.006138!3d40.710059!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x89c25a22a3bda30d%3A0xb89d1fe6bc499443!2sDowntown%20Conference%20Center!5e0!3m2!1sen!2sus!4v1676961268712!5m2!1sen!2sus",
};

const Contact = () => {
  return (
    <section className="contact section">
      <div className="container section-title" data-aos="fade-up">
        <span>Contact</span>
        <h2>Contact</h2>
        <p>
          Necessitatibus eius consequatur ex aliquid fuga eum quidem sint
          consectetur velit
        </p>
      </div>
      <div className="container" data-aos="fade-up" data-aos-delay="100">
        <div className="row gy-4">
          <div className="col-lg-6">
            <div
              className="info-item d-flex flex-column justify-content-center align-items-center"
              data-aos="fade-up"
              data-aos-delay="200"
            >
              <i className={contactInfo.address.icon}></i>
              <h3>{contactInfo.address.title}</h3>
              <p>{contactInfo.address.description}</p>
            </div>
          </div>
          <div className="col-lg-3 col-md-6">
            <div
              className="info-item d-flex flex-column justify-content-center align-items-center"
              data-aos="fade-up"
              data-aos-delay="300"
            >
              <i className={contactInfo.phone.icon}></i>
              <h3>{contactInfo.phone.title}</h3>
              <p>{contactInfo.phone.description}</p>
            </div>
          </div>
          <div className="col-lg-3 col-md-6">
            <div
              className="info-item d-flex flex-column justify-content-center align-items-center"
              data-aos="fade-up"
              data-aos-delay="400"
            >
              <i className={contactInfo.email.icon}></i>
              <h3>{contactInfo.email.title}</h3>
              <p>{contactInfo.email.description}</p>
            </div>
          </div>
        </div>
        <div className="row gy-4 mt-1">
          <div className="col-lg-6" data-aos="fade-up" data-aos-delay="300">
            <iframe
              src={contactInfo.googleMapSrc}
              frameBorder="0"
              style={{ border: 0, width: "100%", height: "400px" }}
              allowFullScreen
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            ></iframe>
          </div>
          <div className="col-lg-6">
            <form
              action="forms/contact.php"
              method="post"
              className="php-email-form"
              data-aos="fade-up"
              data-aos-delay="400"
            >
              <div className="row gy-4">
                <div className="col-md-6">
                  <input
                    type="text"
                    name="name"
                    className="form-control"
                    placeholder="Your Name"
                    required
                  />
                </div>
                <div className="col-md-6">
                  <input
                    type="email"
                    className="form-control"
                    name="email"
                    placeholder="Your Email"
                    required
                  />
                </div>
                <div className="col-md-12">
                  <input
                    type="text"
                    className="form-control"
                    name="subject"
                    placeholder="Subject"
                    required
                  />
                </div>
                <div className="col-md-12">
                  <textarea
                    className="form-control"
                    name="message"
                    rows="6"
                    placeholder="Message"
                    required
                  ></textarea>
                </div>
                <div className="col-md-12 text-center">
                  <div className="loading">Loading</div>
                  <div className="error-message"></div>
                  <div className="sent-message">
                    Your message has been sent. Thank you!
                  </div>
                  <button type="submit">Send Message</button>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Contact;
