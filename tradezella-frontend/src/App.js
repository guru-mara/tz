// src/App.js
import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { AuthProvider, useAuth } from './context/AuthContext';
import authService from './services/authService';

// Pages
import LoginPage from './pages/Auth/LoginPage';
import RegisterPage from './pages/Auth/RegisterPage';
import DashboardPage from './pages/Dashboard/DashboardPage';
import AccountsPage from './pages/Accounts/AccountsPage';
import TemplatesPage from './pages/Templates/TemplatesPage';
import ScenariosPage from './pages/Scenarios/ScenariosPage';
import SimulationsPage from './pages/Simulations/SimulationsPage';
import CalculatorsPage from './pages/Calculators/CalculatorsPage';
import AnalyticsPage from './pages/Analytics/AnalyticsPage';

// Layout
import AppLayout from './components/layout/AppLayout';

// Create theme
const theme = createTheme({
  palette: {
    primary: {
      main: '#FFC107', // Gold color
    },
    secondary: {
      main: '#2196F3', // Blue color
    },
  },
  typography: {
    fontFamily: [
      'Roboto',
      'Arial',
      'sans-serif',
    ].join(','),
  }
});

// Protected route component
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();
  
  if (isLoading) {
    return <div>Loading...</div>;
  }
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  return children;
};

const AppRoutes = () => {
  const { isAuthenticated } = useAuth();
  
  // Initialize auth state when app loads
  useEffect(() => {
    authService.initAuth();
  }, []);
  
  return (
    <Routes>
      <Route path="/login" element={isAuthenticated ? <Navigate to="/dashboard" /> : <LoginPage />} />
      <Route path="/register" element={isAuthenticated ? <Navigate to="/dashboard" /> : <RegisterPage />} />
      
      <Route path="/" element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<DashboardPage />} />
        <Route path="accounts" element={<AccountsPage />} />
        <Route path="templates" element={<TemplatesPage />} />
        <Route path="scenarios" element={<ScenariosPage />} />
        <Route path="simulations" element={<SimulationsPage />} />
        <Route path="calculators" element={<CalculatorsPage />} />
        <Route path="analytics" element={<AnalyticsPage />} />
      </Route>
      
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AuthProvider>
        <Router>
          <AppRoutes />
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;