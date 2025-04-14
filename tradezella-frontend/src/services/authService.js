import axios from 'axios';

const API_URL = '/api/auth';

// Get token from localStorage
const getToken = () => localStorage.getItem('token');

// Set token to localStorage
const setToken = (token) => {
  if (token) {
    localStorage.setItem('token', token);
  } else {
    localStorage.removeItem('token');
  }
};

// Initialize authentication state
const initAuth = () => {
  // Set up axios to include the token in all requests
  axios.interceptors.request.use(
    (config) => {
      const token = getToken();
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    },
    (error) => Promise.reject(error)
  );
  
  return getCurrentUser();
};

// Register a new user
const register = async (userData) => {
  try {
    const response = await axios.post(`${API_URL}/register`, userData);
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Registration failed' };
  }
};

// Login a user
const login = async (credentials) => {
  try {
    const response = await axios.post(`${API_URL}/login`, credentials);
    const { token, ...user } = response.data;
    setToken(token);
    return user;
  } catch (error) {
    throw error.response?.data || { message: 'Login failed' };
  }
};

// Logout a user
const logout = () => {
  setToken(null);
  return Promise.resolve();
};

// Get current user from token
const getCurrentUser = async () => {
  const token = getToken();
  if (!token) return null;
  
  try {
    const response = await axios.get(`${API_URL}/me`);
    return response.data;
  } catch (error) {
    setToken(null);
    return null;
  }
};

// Create named object for export
const authService = {
  register,
  login,
  logout,
  getCurrentUser,
  initAuth
};

export default authService;