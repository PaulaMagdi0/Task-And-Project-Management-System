import { FaExclamationCircle } from "react-icons/fa";
import { Link } from "react-router-dom";
import "./NotFound.css";

const NotFound = () => {
  return (
    <section className="py-3 py-md-5 min-vh-100 d-flex justify-content-center align-items-center text-color">
      <div className="container" data-aos="fade-up">
        <div className="row">
          <div className="col-12">
            <div className="text-center">
              <h2
                className="d-flex justify-content-center align-items-center gap-2 mb-4"
                data-aos="zoom-in"
              >
                <span className="display-1 fw-bold">4</span>
                <FaExclamationCircle className="text-danger display-4" />
                <span className="display-1 fw-bold">4</span>
              </h2>
              <h3 className="h2 mb-2" data-aos="fade-up">
                Oops! You&apos;re lost.
              </h3>
              <p className="mb-3" data-aos="fade-up" data-aos-delay="200">
                The page you are looking for was not found.
              </p>
              <Link
                className="btn btn-default rounded-pill px-5 fs-6 m-0"
                to="/"
                data-aos="fade-up"
                data-aos-delay="300"
              >
                Back to Home
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default NotFound;
