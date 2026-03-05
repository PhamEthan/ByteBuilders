import "../css/About.css"
import caregiverImg from "../assets/caregiver.JPG"
import missionImg from "../assets/mission.jpeg"
import walkImg from "../assets/walk.jpg"

function About(){
    return <div className="about">
       
        <div className="hero">
            <div className="hero-content">
                <div className="hero-title">
                    <h1>About Because We Care</h1>
                </div>
                <div className="hero-buttons">
                    <button className="hero-btn primary">Book a Consultation</button>
                    <button className="hero-btn primary">Contact Us</button>
                </div>
            </div>
        </div>
        <section className="about-section">
            <div className="about-content">
            <h2>Our Mission</h2>
            <p>Because We Care exists to help people stay safe, comfortable, and 
                independent in the place they know best, their home. We provide 
                dependable in home support that is personal, respectful, and built 
                around each client's needs and routine. We understand that every 
                individual and every family is different, which is why we take time 
                to listen and tailor our care with thoughtfulness and intention. Our 
                goal is to bring peace of mind to families by showing up with patience, 
                compassion, and consistent care every day, building trust through 
                reliability and genuine connection.
            </p>
            </div>
            <div className="about-media">
                <img src={missionImg} alt="Caregiver with patient"/>
            </div>
        </section>
        <section className="about-section">
            <div className="about-media alt">
                <img src={caregiverImg} alt="Staff standing together"/>
            </div>
            <div className="about-content">
                <h2>Services</h2>
                <ul>
                    <li>Personal Care</li>
                    <li>Medication Assistance</li>
                    <li>Light Housekeeping</li>
                    <li>Companionship</li>
                </ul>
            </div>

        </section>

        <section className="about-section">
            <div className="about-content">
                <h2>Why Families Choose Us</h2>
                <p>Families choose Because We Care because they want more than a service. 
                    They want a team that truly listens and treats their loved ones with 
                    dignity and compassion. We take time to understand what matters most, 
                    carefully match families with caregivers who lead with empathy, and 
                    adjust care as needs change. As a locally owned business serving 
                    Lewisville and nearby communities, we are personally invested in the 
                    people we support. Our involvement in community events, including efforts 
                    to raise awareness and funds for Alzheimer's, reflects what guides us 
                    every day. Caring for people is not just our work. It is our commitment.
                </p>
            </div>
            <div className="about-media">
                <img src={walkImg} alt="Staff walking at alzheimers fundraiser walk"/>
            </div>
        </section>
    </div>
}

export default About;