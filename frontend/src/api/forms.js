import api from "./axios";

export const submitContactForm = async (formData) => {
    try{
        const response = await api.post("/contactForm",{
            nameIn: formData.name,
            emailIn: formData.email,
            phoneIn: formData.phone,
            messageIn: formData.message
        })
        return response.data
    } catch (err){
        console.log(err.message)
        throw err;
    }
};

export const submitConsultForm = async (formData) => {
    try{
        const response = await api.post("/consultForm", {
            nameIn:formData.name,
            emailIn: formData.email,
            phoneIn: formData.phone,
            locationIn: formData.location,
            hoursIn: formData.hours,
            messageIn: formData.message

        })
        return response.data
    }catch(err){
        console.log(err.message)
        throw err;
    }
};