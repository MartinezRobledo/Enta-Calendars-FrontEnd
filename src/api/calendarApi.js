import axios from 'axios'
import { getEnvVariables } from '../helpers/getEnvVariables'

const { VITE_API_URL } = getEnvVariables()

// In production the backend serves both the frontend and /api, so use a
// same-origin URL. This avoids shipping a developer's localhost URL in the
// static bundle and removes the need for cross-origin API access.
const calendarApi = axios.create({
    baseURL: import.meta.env.PROD ? '/api' : VITE_API_URL
});

// Todo: configurar interceptores
calendarApi.interceptors.request.use( config => {
    config.headers = {
        ...config.headers,
        'x-token': localStorage.getItem('token'),
    }
    return config;
});

export default calendarApi;
