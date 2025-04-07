import React from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay } from "swiper/modules";
import "swiper/css";

// Import client images
import client1 from "../../assets/img/clients/client-1.png";
import client2 from "../../assets/img/clients/client-2.png";
import client3 from "../../assets/img/clients/client-3.png";
import client4 from "../../assets/img/clients/client-4.png";
import client5 from "../../assets/img/clients/client-5.png";
import client6 from "../../assets/img/clients/client-6.png";

const clientImages = [client1, client2, client3, client4, client5, client6];

const Clients = () => {
  return (
    <section id="clients" className="clients section light-background py-5">
      <div className="container">
        <Swiper
          modules={[Autoplay]}
          spaceBetween={40}
          slidesPerView={4}
          slidesPerGroup={1} // Explicitly set to 1 to avoid grouping issues
          loop={true} // Infinite loop enabled
          autoplay={{
            delay: 3000,
            disableOnInteraction: false, // Ensure autoplay continues after manual interaction
          }}
          breakpoints={{
            320: { slidesPerView: 2, spaceBetween: 20, slidesPerGroup: 1 },
            480: { slidesPerView: 3, spaceBetween: 30, slidesPerGroup: 1 },
            640: { slidesPerView: 4, spaceBetween: 40, slidesPerGroup: 1 },
            992: { slidesPerView: 5, spaceBetween: 50, slidesPerGroup: 1 }, // Reduced from 6 to 5
          }}
          className="d-flex align-items-center"
        >
          {clientImages.map((img, index) => (
            <SwiperSlide
              key={index}
              className="d-flex align-items-center justify-content-center"
            >
              <img
                src={img}
                alt={`Client ${index + 1}`}
                className="img-fluid"
              />
            </SwiperSlide>
          ))}
        </Swiper>
      </div>
    </section>
  );
};

export default Clients;
