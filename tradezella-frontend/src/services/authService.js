// src/services/authService.js
import axios from 'axios';
import config from '../config';

const { API } = config;
const TOKEN_KEY = 'gold_trading_token';

// Set auth token for axios requests
const setAuthToken = (token) => {
  if (token) {
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  } else {
    delete axios.defaults.headers.common['Authorization'];
  }
};

// Register user
const register = async (userData) => {
  try {
    const response = await axios.post(API.endpoints.auth.register, userData);
    if (response.data.token) {
      localStorage.setItem(TOKEN_KEY, response.data.token);
      setAuthToken(response.data.token);
    }
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Registration failed' };
  }
};

// Login user
const login = async (credentials) => {
  try {
    const response = await axios.post(API.endpoints.auth.login, credentials);
    if (response.data.token) {
      localStorage.setItem(TOKEN_KEY, response.data.token);
      setAuthToken(response.data.token);
    }
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Login failed' };
  }
};

// Logout user
const logout = () => {
  localStorage.removeItem(TOKEN_KEY);
  setAuthToken(null);
};

// Check token & load user
const getCurrentUser = async () => {
  setAuthToken(localStorage.getItem(TOKEN_KEY));
  try {
    const response = await axios.get(API.endpoints.auth.me);
    return response.data;
  } catch (error) {
    localStorage.removeItem(TOKEN_KEY);
    setAuthToken(null);
    throw error;
  }
};

// Check if user is authenticated
const isAuthenticated = () => {
  return localStorage.getItem(TOKEN_KEY) !== null;
};

const authService = {
  register,
  login,
  logout,
  getCurrentUser,
  isAuthenticated,
  setAuthToken
};

export default authService;