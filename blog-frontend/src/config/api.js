const API_BASE_URL = process.env.NODE_ENV === 'production' 
  ? 'https://qalam-blogs-backend.vercel.app' 
  : 'http://localhost:3001';

export default API_BASE_URL;
