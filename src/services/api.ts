import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  withCredentials: true, // Pour envoyer les cookies de session
});

export default api;
