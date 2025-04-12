// src/pages/Dashboard/DashboardPage.jsx
import React, { useState, useEffect } from 'react';
import { 
  Container, Typography, Grid, Card, CardContent, Box, 
  CircularProgress, Divider, Paper, List, ListItem, 
  ListItemText, ListItemIcon
} from '@mui/material';
import { 
  AccountBalance as AccountIcon, 
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  Psychology as ScenarioIcon,
  Science as SimulationIcon,
  MonetizationOn as GoldIcon
} from '@mui/icons-material';
import { PieChart, Pie, Cell, ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import { useAuth } from '../../context/AuthContext';
import accountService from '../../services/accountService';
import simulationService from '../../services/simulationService';

const DashboardPage = () => {
  const { user } = useAuth();
  const [accounts, setAccounts] = useState([]);
  const [simStats, setSimStats] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  // Mock data for the equity chart - replace with real data
  const equityData = [
    { name: 'Jan', value: 10000 },
    { name: 'Feb', value: 10400 },
    { name: 'Mar', value: 10200 },
    { name: 'Apr', value: 10800 },
    { name: 'May', value: 11200 },
    { name: 'Jun', value: 11500 },
    { name: 'Jul', value: 11300 },
    { name: 'Aug', value: 12000 },
  ];

  // Colors for pie chart
  const COLORS = ['#4CAF50', '#F44336', '#FFC107'];

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        // Fetch accounts
        const accountsData = await accountService.getAccounts();
        setAccounts(accountsData);
        
        // Fetch simulation stats
        const statsData = await simulationService.getSimulationStats();
        setSimStats(statsData);
        
        setError('');
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
        setError('Failed to load some dashboard data');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchData();
  }, []);

  // Calculate total balance across all accounts
  const totalBalance = accounts.reduce((sum, account) => sum + account.current_balance, 0);
  
  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" component="h1
      // Continuing src/pages/Dashboard/DashboardPage.jsx
      <Typography variant="h4" component="h1" gutterBottom>
        Dashboard
      </Typography>

      {error && (
        <Box sx={{ mb: 2 }}>
          <Typography color="error">{error}</Typography>
        </Box>
      )}

      {isLoading ? (
        <Box display="flex" justifyContent="center" my={4}>
          <CircularProgress />
        </Box>
      ) : (
        <>
          {/* Welcome Card */}
          <Card sx={{ mb: 4 }}>
            <CardContent>
              <Typography variant="h5" component="div">
                Welcome back, {user?.username || 'Trader'}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Your Gold Trading Journal dashboard provides an overview of your trading performance.
              </Typography>
            </CardContent>
          </Card>

          {/* Account Summary */}
          <Grid container spacing={3} sx={{ mb: 4 }}>
            <Grid item xs={12} md={4}>
              <Card sx={{ height: '100%' }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Account Summary
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <AccountIcon color="primary" sx={{ mr: 1 }} />
                    <Typography variant="body1">
                      {accounts.length} Trading Account{accounts.length !== 1 ? 's' : ''}
                    </Typography>
                  </Box>
                  <Typography variant="h5" component="div" color="primary">
                    ${totalBalance.toFixed(2)}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Total Balance
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            
            <Grid item xs={12} md={4}>
              <Card sx={{ height: '100%' }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Gold Price
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <GoldIcon color="primary" sx={{ mr: 1 }} />
                    <Typography variant="body1">
                      XAU/USD
                    </Typography>
                  </Box>
                  <Typography variant="h5" component="div" color="primary">
                    $2,087.45
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <TrendingUpIcon color="success" sx={{ mr: 0.5 }} />
                    <Typography variant="body2" color="success.main">
                      +0.75% (24h)
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
            
            <Grid item xs={12} md={4}>
              <Card sx={{ height: '100%' }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Simulation Results
                  </Typography>
                  {simStats ? (
                    <>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                        <Typography variant="body2">Win Rate:</Typography>
                        <Typography variant="body2" fontWeight="bold">
                          {simStats.total_simulations ? 
                            `${((simStats.wins / simStats.total_simulations) * 100).toFixed(1)}%` : 
                            'N/A'}
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                        <Typography variant="body2">Total P/L:</Typography>
                        <Typography 
                          variant="body2" 
                          fontWeight="bold"
                          color={simStats.total_profit_loss > 0 ? 'success.main' : 'error.main'}
                        >
                          ${simStats.total_profit_loss?.toFixed(2) || '0.00'}
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                        <Typography variant="body2">Avg. R/R Ratio:</Typography>
                        <Typography variant="body2" fontWeight="bold">
                          {simStats.avg_risk_reward?.toFixed(2) || 'N/A'}
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="body2">Simulations:</Typography>
                        <Typography variant="body2" fontWeight="bold">
                          {simStats.total_simulations || 0}
                        </Typography>
                      </Box>
                    </>
                  ) : (
                    <Typography variant="body2">No simulation data available</Typography>
                  )}
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {/* Trading Performance Charts */}
          <Grid container spacing={3}>
            <Grid item xs={12} md={8}>
              <Paper sx={{ p: 2, display: 'flex', flexDirection: 'column', height: 300 }}>
                <Typography variant="h6" gutterBottom>
                  Account Equity Curve
                </Typography>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={equityData}
                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip formatter={(value) => [`$${value}`, 'Equity']} />
                    <Legend />
                    <Line type="monotone" dataKey="value" stroke="#FFC107" activeDot={{ r: 8 }} name="Equity" />
                  </LineChart>
                </ResponsiveContainer>
              </Paper>
            </Grid>
            
            <Grid item xs={12} md={4}>
              <Paper sx={{ p: 2, display: 'flex', flexDirection: 'column', height: 300 }}>
                <Typography variant="h6" gutterBottom>
                  Simulation Results
                </Typography>
                {simStats && simStats.total_simulations > 0 ? (
                  <ResponsiveContainer width="100%" height="80%">
                    <PieChart>
                      <Pie
                        data={[
                          { name: 'Wins', value: simStats.wins || 0 },
                          { name: 'Losses', value: simStats.losses || 0 },
                          { name: 'Breakeven', value: simStats.breakevens || 0 }
                        ]}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      >
                        {[
                          { name: 'Wins', value: simStats.wins || 0 },
                          { name: 'Losses', value: simStats.losses || 0 },
                          { name: 'Breakeven', value: simStats.breakevens || 0 }
                        ].map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => [value, 'Count']} />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <Box display="flex" justifyContent="center" alignItems="center" height="80%">
                    <Typography variant="body2" color="text.secondary">
                      No simulation data available
                    </Typography>
                  </Box>
                )}
              </Paper>
            </Grid>
            
            <Grid item xs={12}>
              <Paper sx={{ p: 2, mt: 2 }}>
                <Typography variant="h6" gutterBottom>
                  Recent Activity
                </Typography>
                <List>
                  <ListItem>
                    <ListItemIcon>
                      <SimulationIcon color="primary" />
                    </ListItemIcon>
                    <ListItemText 
                      primary="Gold Breakout Simulation completed" 
                      secondary="Result: Win (+$215.50)" 
                    />
                  </ListItem>
                  <Divider />
                  <ListItem>
                    <ListItemIcon>
                      <ScenarioIcon color="primary" />
                    </ListItemIcon>
                    <ListItemText 
                      primary="New scenario created: Gold Pullback" 
                      secondary="Expected value: +$175.25" 
                    />
                  </ListItem>
                  <Divider />
                  <ListItem>
                    <ListItemIcon>
                      <AccountIcon color="primary" />
                    </ListItemIcon>
                    <ListItemText 
                      primary="Account balance updated" 
                      secondary="New balance: $11,215.75" 
                    />
                  </ListItem>
                </List>
              </Paper>
            </Grid>
          </Grid>
        </>
      )}
    </Container>
  );
};

export default DashboardPage;