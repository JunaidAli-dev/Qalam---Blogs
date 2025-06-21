// src/config/api.js
const API_BASE_URL = process.env.REACT_APP_API_URL || 
  (process.env.NODE_ENV === 'production' 
    ? 'https://qalam-blogs-backend.vercel.app'
    : 'http://localhost:3001');

console.log('Environment:', process.env.NODE_ENV);
console.log('REACT_APP_API_URL:', process.env.REACT_APP_API_URL);
console.log('Final API_BASE_URL:', API_BASE_URL);

export default API_BASE_URL;

