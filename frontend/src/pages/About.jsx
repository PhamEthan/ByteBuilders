import "../css/About.css"
import caregiverImg from "../assets/caregiver.JPG"

import walkImg from "../assets/walk.jpg"
import logo from "../assets/becausewecare_logo.jpg"
import {useState} from "react"
import { submitConsultForm, submitContactForm } from "../api/forms"

function About(){
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [modalType, setModalType] = useState("")

    const [formData, setFormData] = useState({
        name: "",
        email:"",
        phone:"",
        location:"",
        hours:"",
        message:""
    })

    const [isSubmitting, setIsSubmitting] = useState(false)
    const[submitMessage, setSubmitMessage] = useState("")

    function openModal(type){
        setModalType(type)
        setIsModalOpen(true)
        setSubmitMessage("")
        setFormData({
            name: "",
            email:"",
            phone:"",
            location:"",
            hours:"",
            message:""
        })
    }
    function closeModal() {
        setIsModalOpen(false)
        setModalType("")
        setSubmitMessage("")
    }

    function handlechange(event) {
        const id = event.target.id
        const value = event.target.value

        setFormData((prev) => ({
            ...prev,
            [id]:value
        }))
    }

    async function handleSubmit(event) {
        event.preventDefault()
        setIsSubmitting(true)
        setSubmitMessage("")

        try {
            if (modalType === "consultation"){
                await submitConsultForm(formData)
                setSubmitMessage("Consultation request sent")
            }
            else if(modalType === "contact") {
                const result = await submitContactForm(formData)
                console.log("contact success:", result)
                setSubmitMessage("Message sent")
            }

            setFormData({
                name: "",
                email:"",
                phone:"",
                location:"",
                hours:"",
                message:""
            })

        }catch (err){
            console.log("submit err",err)
            console.log("submit err response", err.response)
            setSubmitMessage("Something went wrong")
        } finally{
            setIsSubmitting(false)
        }
        
    }
    

    return (<div className="about">
       
        <div className="hero">
            <div className="hero-content">
                <div className="hero-title">
                    <h1>About Because We Care</h1>
                </div>
                <div className="hero-buttons">
                    <button 
                        className="hero-btn primary"
                        onClick={() => {
                            openModal("consultation")
                        }}
                    >Book a Consultation</button>

                    <button 
                        className="hero-btn primary"
                        onClick={() => {
                            openModal("contact")
                        }}
                    >Contact Us</button>

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
                <img src={logo} alt="Logo: a pink bird rising up from open palms"/>
            </div>
        </section>
        <section className="about-section">
            <div className="about-media alt">
                <img src={caregiverImg} alt="A caregiver sitting besides a client engaging in conversation"/>
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
                <img src={walkImg} alt="Staff standing behind a sign that says Welcome to Walk 2 End Alz, an alzheimers fundraiser"/>
            </div>
        </section>
        {isModalOpen ? (
            <div className="modal-overlay" onClick={closeModal}>
                <div className="modal-box" onClick={ (event) => event.stopPropagation()}>
                    <button className="modal-close" onClick={closeModal}>X</button>

                    <h2>
                        {modalType === "consultation" ? "Book a Consultation" : "Contact Us"}
                    </h2>
                    <form className="modal-form" onSubmit={handleSubmit}>
                        <div className="form-section">
                            <label htmlFor="name">Full Name *</label>
                            <input id="name" type="text" required maxLength={100} value={formData.name} onChange={handlechange}/>
                        </div>
                        
                        <div className="form-section">
                            <label htmlFor="email">Email *</label>
                            <input id="email" type="email" required maxLength={254} value={formData.email} onChange={handlechange}/>
                        </div>
                        
                        <div className="form-section">
                            <label htmlFor="phone">Phone Number</label>
                            <input id="phone" type="tel" value={formData.phone} onChange={handlechange}/>
                        </div>
                        {modalType==="consultation" ?(
                            <div className="form-section">
                            <label htmlFor="location">Location</label>
                            <input id="location" type="text" value={formData.location} onChange={handlechange}/>
                            </div>
                            ) : null}
                        {modalType==="consultation" ?(
                            <div className="form-section">
                            <label htmlFor="hours">Hours Required (Per Week)</label>
                            <input id="hours" type="text" value={formData.hours} onChange={handlechange}/>
                            </div>
                            ) : null}
                        <div className="form-section">
                            <label htmlFor="message">
                                {modalType === "consultation" ? "Describe The Care Required *": "Questions/Comments"}
                            </label>
                            <textarea id="message" rows="5" required={modalType === "consultation"} value={formData.message} onChange={handlechange}></textarea>
                        </div>
                        <button type="submit" className="hero-btn primary" disabled={isSubmitting}>
                            {isSubmitting ? "Submitting..." : "Submit"}
                        </button>
                        {submitMessage ? <p>{submitMessage}</p> : null}
                    </form>
                </div>
            </div>
        ) : null }

    </div>
    )
}

export default About;