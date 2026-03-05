import api from "./axios";

export const register = async (email, password) => {
    try {
        const response = await api.post('/register', {email, password});
        return response.data;
    }
    catch (err) {
        console.log(err.message);
    }
};