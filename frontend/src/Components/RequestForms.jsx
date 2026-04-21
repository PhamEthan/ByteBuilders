import { useState } from "react"
import { submitConsultForm, submitContactForm } from "../api/forms"
import "../css/RequestForms.css"

function RequestForms({
    consultBtnTxt = "Book a Consultation",
    contactBtnTxt = "Contact Us"
}) {
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [modalType, setModalType] = useState("")

    const [formData, setFormData] = useState({
        name: "",
        email: "",
        phone: "",
        location: "",
        hours: "",
        message: ""
    })
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [submitMessage, setSubmitMessage] = useState("")

    function openModal(type) {
        setModalType(type)
        setIsModalOpen(true)
        setSubmitMessage("")
        setFormData({
            name: "",
            email: "",
            phone: "",
            location: "",
            hours: "",
            message: ""
        })
    }

    function closeModal() {
        setIsModalOpen(false)
        setModalType("")
        setSubmitMessage("")
    }

    function handleChange(event) {
        const id = event.target.id
        const value = event.target.value

        setFormData((prev) => ({
            ...prev,
            [id]: value
        }))
    }

    async function handleSubmit(event) {
        event.preventDefault()
        setIsSubmitting(true)
        setSubmitMessage("")

        try {
            if (modalType === "consultation") {

                await submitConsultForm(formData)
                setSubmitMessage("Consultation request sent")
            } 
            else if (modalType === "contact") {

                const result = await submitContactForm(formData)
                console.log("contact success:", result)
                setSubmitMessage("Message sent")
            }

            setFormData({
                name: "",
                email: "",
                phone: "",
                location: "",
                hours: "",
                message: ""
            })
        } catch (err) {
            console.log("submit err", err)
            console.log("submit err response", err.response)
            setSubmitMessage("Something went wrong")
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <div className="request-forms">
            <div className="hero-buttons">
                <button
                    className="hero-btn primary"
                    onClick={() => {
                        openModal("consultation")
                    }}
                >
                    {consultBtnTxt}
                </button>

                <button
                    className="hero-btn primary"
                    onClick={() => {
                        openModal("contact")
                    }}
                >
                    {contactBtnTxt}
                </button>
            </div>

            {isModalOpen ? (
                <div className="modal-overlay" onClick={closeModal}>
                    <div
                        className="modal-box"
                        onClick={(event) => event.stopPropagation()}
                    >
                        <button className="modal-close" onClick={closeModal}>
                            X
                        </button>

                        <h2>
                            {modalType === "consultation"
                                ? "Book a Consultation"
                                : "Contact Us"}
                        </h2>

                        <form className="modal-form" onSubmit={handleSubmit}>
                            <div className="form-section">
                                <label htmlFor="name">Full Name *</label>
                                <input
                                    id="name"
                                    type="text"
                                    required
                                    maxLength={100}
                                    value={formData.name}
                                    onChange={handleChange}
                                />
                            </div>

                            <div className="form-section">
                                <label htmlFor="email">Email *</label>
                                <input
                                    id="email"
                                    type="email"
                                    required
                                    maxLength={254}
                                    value={formData.email}
                                    onChange={handleChange}
                                />
                            </div>

                            <div className="form-section">
                                <label htmlFor="phone">Phone Number</label>
                                <input
                                    id="phone"
                                    type="tel"
                                    value={formData.phone}
                                    onChange={handleChange}
                                />
                            </div>

                            {modalType === "consultation" ? (
                                <div className="form-section">
                                    <label htmlFor="location">Location</label>
                                    <input
                                        id="location"
                                        type="text"
                                        value={formData.location}
                                        onChange={handleChange}
                                    />
                                </div>
                            ) : null}

                            {modalType === "consultation" ? (
                                <div className="form-section">
                                    <label htmlFor="hours">
                                        Hours Required (Per Week)
                                    </label>
                                    <input
                                        id="hours"
                                        type="text"
                                        value={formData.hours}
                                        onChange={handleChange}
                                    />
                                </div>
                            ) : null}

                            <div className="form-section">
                                <label htmlFor="message">
                                    {modalType === "consultation"
                                        ? "Describe The Care Required *"
                                        : "Questions/Comments"}
                                </label>
                                <textarea
                                    id="message"
                                    rows="5"
                                    required={modalType === "consultation"}
                                    value={formData.message}
                                    onChange={handleChange}
                                ></textarea>
                            </div>

                            <button
                                type="submit"
                                className="hero-btn primary"
                                disabled={isSubmitting}
                            >
                                {isSubmitting ? "Submitting..." : "Submit"}
                            </button>

                            {submitMessage ? <p>{submitMessage}</p> : null}
                        </form>
                    </div>
                </div>
            ) : null}
        </div>
    )
}

export default RequestForms