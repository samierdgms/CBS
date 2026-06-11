import axios from 'axios';

const api = axios.create({
    baseURL: "http://localhost:5154/api"
});

api.interceptors.request.use((config) => {
    const token = localStorage.getItem('geo_token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
}, (error) => Promise.reject(error));

api.interceptors.response.use(
    (response) => response,
    (error) => {
        
        const isAuthRequest = error.config.url.includes('/Auth/login') || error.config.url.includes('/Auth/register');

        if (error.response && error.response.status === 401 && !isAuthRequest) {
            localStorage.removeItem('geo_token');
            window.location.reload();
        }
        return Promise.reject(error);
    }
);

export default api;