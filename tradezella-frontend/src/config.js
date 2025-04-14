// API URL configuration
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

// Auth token management
const getToken = () => localStorage.getItem('token');

const setToken = (token) => {
  if (token) {
    localStorage.setItem('token', token);
  } else {
    localStorage.removeItem('token');
  }
};

// Check if user is authenticated
const isAuthenticated = () => {
  return !!getToken();
};

// Export configuration values
export {
  API_URL,
  getToken,
  setToken,
  isAuthenticated
};

export default {
  API_URL,
  getToken,
  setToken,
  isAuthenticated
};