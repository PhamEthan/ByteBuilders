import "../css/Home.css";
import missionImg from "../assets/mission.jpeg"
import RequestForms from "../Components/RequestForms";
import { useNavigate } from "react-router-dom";

function Home() {
  const navigate=useNavigate();
  return (
    <div className="home">
      <section className="home-hero">
        <div className="home-hero-overlay"></div>
        <div className="home-hero-content">
          
          <h1>Compassionate Care for the People Who Matter Most</h1>
          <p className="hero-text">
            We provide dependable in-home caregiving support designed to help
            clients feel comfortable, respected, and cared for every day
          </p>
          
          <div className="home-request-forms">
            <RequestForms/>
          </div>
        </div>
      </section>

      <section className="home-intro">
        <div className="intro-card">
          <h3>Personalized Support</h3>
          <p>
            Care plans are shaped around each client’s needs, routine, and level
            of support.
          </p>
        </div>

        <div className="intro-card">
          <h3>Trusted Caregivers</h3>
          <p>
            We focus on dependable, compassionate service that families can feel
            confident in.
          </p>
        </div>

        <div className="intro-card">
          <h3>Peace of Mind</h3>
          <p>
            Our goal is to make daily life easier for both clients and their
            loved ones.
          </p>
        </div>
      </section>

      <section className="home-feature">
        <div className="feature-text">
          
          <h2>Care that feels personal, not clinical</h2>
          <p>
            At Because We Care, we believe quality caregiving starts with
            compassion, patience, and connection. We are committed to
            helping individuals remain safe and comfortable at home while giving
            families reassurance that their loved ones are in caring hands.
          </p>
          <button className="home-btn primary" onClick={() => navigate("/about")}>
            Learn More About Us
          </button>
        </div>

        <div className="feature-image">
          <img src={missionImg} alt="A caregiver crouched down talking to a client that's smiling"/>
          
        </div>
      </section>

      <section className="home-services-preview">
        <div className="services-heading">
          <h2>Services designed to support everyday life</h2>
        </div>

        <div className="services-grid">
          <div className="service-card">
            <h3>Personal Care</h3>
            <p>
              Assistance with daily routines while preserving comfort, dignity,
              and independence.
            </p>
          </div>

          <div className="service-card">
            <h3>Companionship</h3>
            <p>
              Friendly, dependable support that helps clients feel connected and
              cared for.
            </p>
          </div>

          <div className="service-card">
            <h3>Medication Reminders</h3>
            <p>
              Extra help staying on schedule with important daily medications.
            </p>
          </div>

          <div className="service-card">
            <h3>Light Housekeeping</h3>
            <p>
              Support with small household tasks that make the home safer and
              more comfortable.
            </p>
          </div>
        </div>
      </section>

      <section className="home-cta">
        <div className="cta-box">
          <h2>Ready to find the right care for your family?</h2>
          <p>
            Reach out today to ask questions, discuss care needs, or schedule a
            consultation.
          </p>
          <div className="cta-buttons">
            <RequestForms
              contactBtnTxt="Get In Touch"  
            />
          </div>
        </div>
      </section>
    </div>
  );
}

export default Home;