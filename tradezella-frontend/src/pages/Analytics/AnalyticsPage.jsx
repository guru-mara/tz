// src/pages/Analytics/AnalyticsPage.jsx
import React, { useState, useEffect } from 'react';
import { 
  Container, Typography, Grid, Paper, Box, CircularProgress, 
  FormControl, InputLabel, Select, MenuItem, Card, CardContent,
  Divider, Tabs, Tab
} from '@mui/material';
import { 
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  ScatterChart, Scatter, ZAxis
} from 'recharts';
import simulationService from '../../services/simulationService';

const AnalyticsPage = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [simulations, setSimulations] = useState([]);
  const [stats, setStats] = useState(null);
  const [error, setError] = useState('');
  const [tabValue, setTabValue] = useState(0);

  // Colors for charts
  const COLORS = ['#4CAF50', '#F44336', '#FFC107', '#2196F3', '#9C27B0'];
  
  // Fetch data on component mount
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        // Fetch simulations
        const simulationsData = await simulationService.getSimulations();
        setSimulations(simulationsData);
        
        // Fetch simulation stats
        const statsData = await simulationService.getSimulationStats();
        setStats(statsData);
        
        setError('');
      } catch (err) {
        console.error('Error fetching analytics data:', err);
        setError('Failed to load analytics data');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchData();
  }, []);

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  // Format simulation data for charts
  const getWinLossData = () => {
    if (!simulations.length) return [];
    
    const completedSimulations = simulations.filter(sim => sim.simulation_result);
    
    return [
      { name: 'Wins', count: completedSimulations.filter(sim => sim.simulation_result === 'win').length },
      { name: 'Losses', count: completedSimulations.filter(sim => sim.simulation_result === 'loss').length },
      { name: 'Breakeven', count: completedSimulations.filter(sim => sim.simulation_result === 'breakeven').length }
    ];
  };

  // Prepare profit by market data
  const getProfitByMarketData = () => {
    if (!simulations.length) return [];
    
    const marketsMap = {};
    
    simulations.forEach(sim => {
      if (sim.profit_loss === null) return;
      
      const market = sim.market || 'Unknown';
      if (!marketsMap[market]) {
        marketsMap[market] = { profit: 0, loss: 0 };
      }
      
      if (sim.profit_loss > 0) {
        marketsMap[market].profit += sim.profit_loss;
      } else if (sim.profit_loss < 0) {
        marketsMap[market].loss += Math.abs(sim.profit_loss);
      }
    });
    
    return Object.entries(marketsMap).map(([market, data]) => ({
      market,
      profit: parseFloat(data.profit.toFixed(2)),
      loss: parseFloat(data.loss.toFixed(2))
    }));
  };

  // Prepare R/R ratio vs win rate scatter data
  const getRiskRewardVsWinRateData = () => {
    if (!simulations.length) return [];
    
    // Simulate different strategy parameters for this example
    // In a real app, this would come from actual historical data
    return [
      { name: 'Strategy 1', riskRewardRatio: 1.5, winRate: 0.65, profitFactor: 1.95 },
      { name: 'Strategy 2', riskRewardRatio: 2.2, winRate: 0.45, profitFactor: 1.98 },
      { name: 'Strategy 3', riskRewardRatio: 1.2, winRate: 0.72, profitFactor: 2.16 },
      { name: 'Strategy 4', riskRewardRatio: 3.0, winRate: 0.38, profitFactor: 2.28 },
      { name: 'Strategy 5', riskRewardRatio: 1.8, winRate: 0.55, profitFactor: 1.98 },
    ];
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Analytics
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
          {/* Stats Summary Cards */}
          <Grid container spacing={3} sx={{ mb: 4 }}>
            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Win Rate
                  </Typography>
                  <Typography variant="h4" color="primary">
                    {stats && stats.total_simulations ? 
                      `${((stats.wins / stats.total_simulations) * 100).toFixed(1)}%` : 
                      'N/A'}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {stats ? `${stats.wins} / ${stats.total_simulations} trades` : 'No data'}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Profit Factor
                  </Typography>
                  <Typography variant="h4" color="primary">
                    {stats && stats.total_profit && stats.total_loss ? 
                      (stats.total_profit / stats.total_loss).toFixed(2) : 
                      'N/A'}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Gross profit / gross loss
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Average Win
                  </Typography>
                  <Typography variant="h4" color="success.main">
                    ${stats && stats.avg_win ? stats.avg_win.toFixed(2) : '0.00'}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Per winning trade
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Average Loss
                  </Typography>
                  <Typography variant="h4" color="error.main">
                    ${stats && stats.avg_loss ? Math.abs(stats.avg_loss).toFixed(2) : '0.00'}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Per losing trade
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {/* Charts */}
          <Paper sx={{ mb: 4 }}>
            <Tabs
              value={tabValue}
              onChange={handleTabChange}
              indicatorColor="primary"
              textColor="primary"
              centered
            >
              <Tab label="Performance" />
              <Tab label="Win/Loss" />
              <Tab label="Markets" />
              <Tab label="Strategy" />
            </Tabs>
            
            <Box sx={{ p: 3 }}>
              {/* Performance Tab */}
              {tabValue === 0 && (
                <Box sx={{ height: 400 }}>
                  <Typography variant="h6" gutterBottom>
                    Cumulative Profit/Loss
                  </Typography>
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={simulations
                        .filter(sim => sim.simulation_result)
                        .map((sim, index) => {
                          const prevValue = index > 0 ? simulations
                            .filter(s => s.simulation_result)
                            .slice(0, index)
                            .reduce((sum, s) => sum + (s.profit_loss || 0), 0) : 0;
                          
                          return {
                            name: index + 1,
                            value: prevValue + (sim.profit_loss || 0)
                          };
                        })}
                      margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" label={{ value: 'Trade #', position: 'insideBottom', offset: -5 }} />
                      <YAxis label={{ value: 'Cumulative P/L ($)', angle: -90, position: 'insideLeft' }} />
                      <Tooltip formatter={(value) => [`$${value.toFixed(2)}`, 'Profit/Loss']} />
                      <Legend />
                      <Line 
                        type="monotone" 
                        dataKey="value" 
                        stroke="#FFC107" 
                        name="Cumulative P/L" 
                        connectNulls
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </Box>
              )}
              
              {/* Win/Loss Tab */}
              {tabValue === 1 && (
                <Grid container spacing={3}>
                  <Grid item xs={12} md={6}>
                    <Box sx={{ height: 300 }}>
                      <Typography variant="h6" gutterBottom>
                        Win/Loss Distribution
                      </Typography>
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={getWinLossData()}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            outerRadius={80}
                            fill="#8884d8"
                            dataKey="count"
                            label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                          >
                            {getWinLossData().map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip formatter={(value) => [value, 'Trades']} />
                          <Legend />
                        </PieChart>
                      </ResponsiveContainer>
                    </Box>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Box sx={{ height: 300 }}>
                      <Typography variant="h6" gutterBottom>
                        Profit/Loss Distribution
                      </Typography>
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          data={[
                            { name: 'Wins', value: stats?.total_profit || 0 },
                            { name: 'Losses', value: -1 * (stats?.total_loss || 0) }
                          ]}
                          margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="name" />
                          <YAxis />
                          <Tooltip formatter={(value) => [`$${Math.abs(value).toFixed(2)}`, 'Amount']} />
                          <Bar 
                            dataKey="value" 
                            name="P/L" 
                            fill={(data) => data.value >= 0 ? '#4CAF50' : '#F44336'} 
                          >
                            {[
                              { name: 'Wins', value: stats?.total_profit || 0 },
                              { name: 'Losses', value: -1 * (stats?.total_loss || 0) }
                            ].map((entry, index) => (
                              <Cell 
                                key={`cell-${index}`} 
                                fill={entry.value >= 0 ? '#4CAF50' : '#F44336'} 
                              />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </Box>
                  </Grid>
                </Grid>
              )}
              
              {/* Markets Tab */}
              {tabValue === 2 && (
                <Box sx={{ height: 400 }}>
                  <Typography variant="h6" gutterBottom>
                    Profit/Loss by Market
                  </Typography>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={getProfitByMarketData()}
                      margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="market" />
                      <YAxis />
                      <Tooltip formatter={(value) => [`$${value.toFixed(2)}`, 'Amount']} />
                      <Legend />
                      <Bar dataKey="profit" name="Profit" fill="#4CAF50" />
                      <Bar dataKey="loss" name="Loss" fill="#F44336" />
                    </BarChart>
                  </ResponsiveContainer>
                </Box>
              )}
              
              {/* Strategy Tab */}
              {tabValue === 3 && (
                <Box sx={{ height: 400 }}>
                  <Typography variant="h6" gutterBottom>
                    Risk/Reward vs Win Rate
                  </Typography>
                  <ResponsiveContainer width="100%" height="100%">
                    <ScatterChart
                      margin={{ top: 20, right: 30, left: 20, bottom: 10 }}
                    >
                      <CartesianGrid />
                      <XAxis 
                        type="number" 
                        dataKey="riskRewardRatio" 
                        name="Risk/Reward Ratio" 
                        domain={[0, 'dataMax + 0.5']}
                        label={{ value: 'Risk/Reward Ratio', position: 'insideBottom', offset: -5 }}
                      />
                      <YAxis 
                        type="number" 
                        dataKey="winRate" 
                        name="Win Rate" 
                        domain={[0, 1]}
                        tickFormatter={(value) => `${(value * 100).toFixed(0)}%`}
                        label={{ value: 'Win Rate', angle: -90, position: 'insideLeft' }}
                      />
                      <ZAxis 
                        type="number" 
                        dataKey="profitFactor" 
                        range={[50, 400]} 
                        name="Profit Factor" 
                      />
                      <Tooltip 
                        formatter={(value, name) => {
                          if (name === 'Win Rate') return [`${(value * 100).toFixed(0)}%`, name];
                          return [value, name];
                        }}
                        cursor={{ strokeDasharray: '3 3' }}
                      />
                      <Legend />
                      <Scatter 
                        name="Strategy Performance" 
                        data={getRiskRewardVsWinRateData()} 
                        fill="#FFC107"
                      />
                    </ScatterChart>
                  </ResponsiveContainer>
                </Box>
              )}
            </Box>
          </Paper>
        </>
      )}
    </Container>
  );
};

export default AnalyticsPage;