import axios from "axios";

const api = axios.create({
    baseURL: process.env.REACT_APP_API_BASE || "http://localhost:5003/auth",
    headers: {
        "Content-Type": "application/json"
    }
});

export default api;