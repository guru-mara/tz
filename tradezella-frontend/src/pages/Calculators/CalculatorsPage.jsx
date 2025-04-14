// src/pages/Calculators/CalculatorsPage.jsx
import React, { useState, useEffect } from 'react';
import { 
  Container, Typography, Paper, Grid, TextField, Button, Box, 
  CircularProgress, Divider, FormControl, InputLabel, Select, MenuItem,
  Card, CardContent, Tabs, Tab, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow
} from '@mui/material';
import { 
  CalculateOutlined as CalculateIcon,
  MonetizationOn as MoneyIcon,
  ShowChart as ChartIcon,
  Loop as MonteCarloIcon
} from '@mui/icons-material';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  BarChart, Bar, Cell
} from 'recharts';
import calculatorService from '../../services/calculatorService';
import accountService from '../../services/accountService';

const CalculatorsPage = () => {
  const [accounts, setAccounts] = useState([]);
  const [selectedTab, setSelectedTab] = useState(0);
  const [positionSizeResult, setPositionSizeResult] = useState(null);
  const [tradeAnalyticsResult, setTradeAnalyticsResult] = useState(null);
  const [monteCarloResult, setMonteCarloResult] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // Fetch accounts on component mount
  useEffect(() => {
    fetchAccounts();
  }, []);

  const fetchAccounts = async () => {
    try {
      const data = await accountService.getAccounts();
      setAccounts(data);
    } catch (err) {
      console.error('Failed to fetch accounts:', err);
    }
  };

  // Position Size Calculator Formik
  const positionSizeFormik = useFormik({
    initialValues: {
      account_id: '',
      risk_percentage: 2,
      entry_price: '',
      stop_loss: ''
    },
    validationSchema: Yup.object({
      account_id: Yup.number().required('Account is required'),
      risk_percentage: Yup.number().required('Risk percentage is required').min(0.1, 'Min 0.1%').max(10, 'Max 10%'),
      entry_price: Yup.number().required('Entry price is required').positive('Must be positive'),
      stop_loss: Yup.number().required('Stop loss is required').positive('Must be positive')
    }),
    onSubmit: async (values) => {
      setIsLoading(true);
      setError('');
      try {
        const result = await calculatorService.calculatePositionSize(values);
        setPositionSizeResult(result);
      } catch (err) {
        setError(err.message || 'Failed to calculate position size');
        setPositionSizeResult(null);
      } finally {
        setIsLoading(false);
      }
    }
  });

  // Trade Analytics Calculator Formik
  const tradeAnalyticsFormik = useFormik({
    initialValues: {
      account_id: '',
      entry_price: '',
      stop_loss: '',
      take_profit: '',
      position_size: '',
      win_probability: 0.5
    },
    validationSchema: Yup.object({
      account_id: Yup.number().nullable(),
      entry_price: Yup.number().required('Entry price is required').positive('Must be positive'),
      stop_loss: Yup.number().required('Stop loss is required').positive('Must be positive'),
      take_profit: Yup.number().required('Take profit is required').positive('Must be positive'),
      position_size: Yup.number().required('Position size is required').positive('Must be positive'),
      win_probability: Yup.number().min(0).max(1, 'Must be between 0 and 1')
    }),
    onSubmit: async (values) => {
      setIsLoading(true);
      setError('');
      try {
        const result = await calculatorService.calculateTradeAnalytics(values);
        setTradeAnalyticsResult(result);
      } catch (err) {
        setError(err.message || 'Failed to calculate trade analytics');
        setTradeAnalyticsResult(null);
      } finally {
        setIsLoading(false);
      }
    }
  });

  // Monte Carlo Simulation Formik
  const monteCarloFormik = useFormik({
    initialValues: {
      initialBalance: 10000,
      winRate: 0.5,
      averageWin: 200,
      averageLoss: 100,
      numberOfTrades: 50,
      numberOfSimulations: 500
    },
    validationSchema: Yup.object({
      initialBalance: Yup.number().required('Initial balance is required').positive('Must be positive'),
      winRate: Yup.number().required('Win rate is required').min(0).max(1, 'Must be between 0 and 1'),
      averageWin: Yup.number().required('Average win is required').positive('Must be positive'),
      averageLoss: Yup.number().required('Average loss is required').positive('Must be positive'),
      numberOfTrades: Yup.number().required('Number of trades is required').positive('Must be positive').integer('Must be an integer'),
      numberOfSimulations: Yup.number().required('Number of simulations is required').positive('Must be positive').integer('Must be an integer')
    }),
    onSubmit: async (values) => {
      setIsLoading(true);
      setError('');
      try {
        const result = await calculatorService.runMonteCarloSimulation(values);
        setMonteCarloResult(result);
      } catch (err) {
        setError(err.message || 'Failed to run Monte Carlo simulation');
        setMonteCarloResult(null);
      } finally {
        setIsLoading(false);
      }
    }
  });

  const handleTabChange = (event, newValue) => {
    setSelectedTab(newValue);
  };

  // Prepare Monte Carlo percentile data for chart
  const getPercentileData = () => {
    if (!monteCarloResult) return [];

    return [
      { name: '5%', value: monteCarloResult.percentile5 },
      { name: '25%', value: monteCarloResult.percentile25 },
      { name: '50%', value: monteCarloResult.percentile50 },
      { name: '75%', value: monteCarloResult.percentile75 },
      { name: '95%', value: monteCarloResult.percentile95 }
    ];
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Trading Calculators
      </Typography>

      {error && (
        <Box sx={{ mb: 2 }}>
          <Typography color="error">{error}</Typography>
        </Box>
      )}

      <Paper sx={{ width: '100%', mb: 2 }}>
        <Tabs
          value={selectedTab}
          onChange={handleTabChange}
          indicatorColor="primary"
          textColor="primary"
          centered
        >
          <Tab icon={<MoneyIcon />} label="Position Size" />
          <Tab icon={<CalculateIcon />} label="Trade Analytics" />
          <Tab icon={<MonteCarloIcon />} label="Monte Carlo" />
        </Tabs>

        <Box sx={{ p: 3 }}>
          {/* Position Size Calculator */}
          {selectedTab === 0 && (
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <form onSubmit={positionSizeFormik.handleSubmit}>
                  <Typography variant="h6" gutterBottom>
                    Position Size Calculator
                  </Typography>
                  <FormControl fullWidth margin="normal">
                    <InputLabel id="account-label">Trading Account</InputLabel>
                    <Select
                      labelId="account-label"
                      id="account_id"
                      name="account_id"
                      value={positionSizeFormik.values.account_id}
                      onChange={positionSizeFormik.handleChange}
                      label="Trading Account"
                      error={positionSizeFormik.touched.account_id && Boolean(positionSizeFormik.errors.account_id)}
                    >
                      <MenuItem value="">
                        <em>Select an account</em>
                      </MenuItem>
                      {accounts.map((account) => (
                        <MenuItem key={account.account_id} value={account.account_id}>
                          {account.account_name} (${account.current_balance.toFixed(2)})
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                  <TextField
                    fullWidth
                    margin="normal"
                    id="risk_percentage"
                    name="risk_percentage"
                    label="Risk Percentage (%)"
                    type="number"
                    inputProps={{ step: 0.1 }}
                    value={positionSizeFormik.values.risk_percentage}
                    onChange={positionSizeFormik.handleChange}
                    error={positionSizeFormik.touched.risk_percentage && Boolean(positionSizeFormik.errors.risk_percentage)}
                    helperText={positionSizeFormik.touched.risk_percentage && positionSizeFormik.errors.risk_percentage}
                  />
                  <TextField
                    fullWidth
                    margin="normal"
                    id="entry_price"
                    name="entry_price"
                    label="Entry Price"
                    type="number"
                    value={positionSizeFormik.values.entry_price}
                    onChange={positionSizeFormik.handleChange}
                    error={positionSizeFormik.touched.entry_price && Boolean(positionSizeFormik.errors.entry_price)}
                    helperText={positionSizeFormik.touched.entry_price && positionSizeFormik.errors.entry_price}
                  />
                  <TextField
                    fullWidth
                    margin="normal"
                    id="stop_loss"
                    name="stop_loss"
                    label="Stop Loss Price"
                    type="number"
                    value={positionSizeFormik.values.stop_loss}
                    onChange={positionSizeFormik.handleChange}
                    error={positionSizeFormik.touched.stop_loss && Boolean(positionSizeFormik.errors.stop_loss)}
                    helperText={positionSizeFormik.touched.stop_loss && positionSizeFormik.errors.stop_loss}
                  />
                  <Button
                    type="submit"
                    variant="contained"
                    color="primary"
                    fullWidth
                    sx={{ mt: 3 }}
                    disabled={isLoading}
                  >
                    {isLoading ? <CircularProgress size={24} /> : 'Calculate'}
                  </Button>
                </form>
              </Grid>
              <Grid item xs={12} md={6}>
                {positionSizeResult && (
                  <Card elevation={3}>
                    <CardContent>
                      <Typography variant="h6" gutterBottom>Results</Typography>
                      <Divider sx={{ mb: 2 }} />
                      <Grid container spacing={2}>
                        <Grid item xs={6}>
                          <Typography variant="subtitle2" color="textSecondary">Account Balance</Typography>
                          <Typography variant="body1">${positionSizeResult.accountBalance.toFixed(2)}</Typography>
                        </Grid>
                        <Grid item xs={6}>
                          <Typography variant="subtitle2" color="textSecondary">Risk Percentage</Typography>
                          <Typography variant="body1">{positionSizeResult.riskPercentage}%</Typography>
                        </Grid>
                        <Grid item xs={6}>
                          <Typography variant="subtitle2" color="textSecondary">Risk Amount</Typography>
                          <Typography variant="body1">${positionSizeResult.riskAmount.toFixed(2)}</Typography>
                        </Grid>
                        <Grid item xs={6}>
                          <Typography variant="subtitle2" color="textSecondary">Price Difference</Typography>
                          <Typography variant="body1">${positionSizeResult.priceDifference.toFixed(2)}</Typography>
                        </Grid>
                        <Grid item xs={12}>
                          <Box sx={{ mt: 2, mb: 2 }}>
                            <Typography variant="h5" align="center" color="primary">
                              Position Size: {positionSizeResult.positionSize.toFixed(3)}
                            </Typography>
                          </Box>
                        </Grid>
                        <Grid item xs={12}>
                          <Typography variant="subtitle2" color="textSecondary">Maximum Loss</Typography>
                          <Typography variant="body1" color="error">${positionSizeResult.maxLoss.toFixed(2)}</Typography>
                        </Grid>
                      </Grid>
                    </CardContent>
                  </Card>
                )}
              </Grid>
            </Grid>
          )}

          {/* Trade Analytics Calculator */}
          {selectedTab === 1 && (
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <form onSubmit={tradeAnalyticsFormik.handleSubmit}>
                  <Typography variant="h6" gutterBottom>
                    Trade Analytics Calculator
                  </Typography>
                  <FormControl fullWidth margin="normal">
                    <InputLabel id="account-analytics-label">Trading Account (Optional)</InputLabel>
                    <Select
                      labelId="account-analytics-label"
                      id="account_id"
                      name="account_id"
                      value={tradeAnalyticsFormik.values.account_id}
                      onChange={tradeAnalyticsFormik.handleChange}
                      label="Trading Account (Optional)"
                      error={tradeAnalyticsFormik.touched.account_id && Boolean(tradeAnalyticsFormik.errors.account_id)}
                    >
                      <MenuItem value="">
                        <em>None</em>
                      </MenuItem>
                      {accounts.map((account) => (
                        <MenuItem key={account.account_id} value={account.account_id}>
                          {account.account_name}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                  <TextField
                    fullWidth
                    margin="normal"
                    id="entry_price"
                    name="entry_price"
                    label="Entry Price"
                    type="number"
                    value={tradeAnalyticsFormik.values.entry_price}
                    onChange={tradeAnalyticsFormik.handleChange}
                    error={tradeAnalyticsFormik.touched.entry_price && Boolean(tradeAnalyticsFormik.errors.entry_price)}
                    helperText={tradeAnalyticsFormik.touched.entry_price && tradeAnalyticsFormik.errors.entry_price}
                  />
                  <TextField
                    fullWidth
                    margin="normal"
                    id="stop_loss"
                    name="stop_loss"
                    label="Stop Loss Price"
                    type="number"
                    value={tradeAnalyticsFormik.values.stop_loss}
                    onChange={tradeAnalyticsFormik.handleChange}
                    error={tradeAnalyticsFormik.touched.stop_loss && Boolean(tradeAnalyticsFormik.errors.stop_loss)}
                    helperText={tradeAnalyticsFormik.touched.stop_loss && tradeAnalyticsFormik.errors.stop_loss}
                  />
                  <TextField
                    fullWidth
                    margin="normal"
                    id="take_profit"
                    name="take_profit"
                    label="Take Profit Price"
                    type="number"
                    value={tradeAnalyticsFormik.values.take_profit}
                    onChange={tradeAnalyticsFormik.handleChange}
                    error={tradeAnalyticsFormik.touched.take_profit && Boolean(tradeAnalyticsFormik.errors.take_profit)}
                    helperText={tradeAnalyticsFormik.touched.take_profit && tradeAnalyticsFormik.errors.take_profit}
                  />
                  <TextField
                    fullWidth
                    margin="normal"
                    id="position_size"
                    name="position_size"
                    label="Position Size"
                    type="number"
                    value={tradeAnalyticsFormik.values.position_size}
                    onChange={tradeAnalyticsFormik.handleChange}
                    error={tradeAnalyticsFormik.touched.position_size && Boolean(tradeAnalyticsFormik.errors.position_size)}
                    helperText={tradeAnalyticsFormik.touched.position_size && tradeAnalyticsFormik.errors.position_size}
                  />
                  <TextField
                    fullWidth
                    margin="normal"
                    id="win_probability"
                    name="win_probability"
                    label="Win Probability (0-1)"
                    type="number"
                    inputProps={{ min: 0, max: 1, step: 0.05 }}
                    value={tradeAnalyticsFormik.values.win_probability}
                    onChange={tradeAnalyticsFormik.handleChange}
                    error={tradeAnalyticsFormik.touched.win_probability && Boolean(tradeAnalyticsFormik.errors.win_probability)}
                    helperText={tradeAnalyticsFormik.touched.win_probability && tradeAnalyticsFormik.errors.win_probability}
                  />
                  <Button
                    type="submit"
                    variant="contained"
                    color="primary"
                    fullWidth
                    sx={{ mt: 3 }}
                    disabled={isLoading}
                  >
                    {isLoading ? <CircularProgress size={24} /> : 'Calculate Analytics'}
                  </Button>
                </form>
              </Grid>
              <Grid item xs={12} md={6}>
                {tradeAnalyticsResult && (
                  <Card elevation={3}>
                    <CardContent>
                      <Typography variant="h6" gutterBottom>Trade Analytics</Typography>
                      <Divider sx={{ mb: 2 }} />
                      <Grid container spacing={2}>
                        <Grid item xs={6}>
                          <Typography variant="subtitle2" color="textSecondary">Risk Amount</Typography>
                          <Typography variant="body1" color="error">${tradeAnalyticsResult.riskAmount.toFixed(2)}</Typography>
                        </Grid>
                        <Grid item xs={6}>
                          <Typography variant="subtitle2" color="textSecondary">Potential Profit</Typography>
                          <Typography variant="body1" color="success.main">${tradeAnalyticsResult.potentialProfit.toFixed(2)}</Typography>
                        </Grid>
                        <Grid item xs={6}>
                          <Typography variant="subtitle2" color="textSecondary">Risk/Reward Ratio</Typography>
                          <Typography variant="body1">{tradeAnalyticsResult.riskRewardRatio.toFixed(2)}</Typography>
                        </Grid>
                        <Grid item xs={6}>
                          <Typography variant="subtitle2" color="textSecondary">Win Probability</Typography>
                          <Typography variant="body1">{(tradeAnalyticsResult.win_probability * 100).toFixed(0)}%</Typography>
                        </Grid>
                        <Grid item xs={6}>
                          <Typography variant="subtitle2" color="textSecondary">Expected Value</Typography>
                          <Typography 
                            variant="body1" 
                            color={tradeAnalyticsResult.expectedValue > 0 ? 'success.main' : 'error.main'}
                          >
                            ${tradeAnalyticsResult.expectedValue.toFixed(2)}
                          </Typography>
                        </Grid>
                        {tradeAnalyticsResult.riskPercentage && (
                          <Grid item xs={6}>
                            <Typography variant="subtitle2" color="textSecondary">Risk % of Account</Typography>
                            <Typography variant="body1">{tradeAnalyticsResult.riskPercentage.toFixed(2)}%</Typography>
                          </Grid>
                        )}
                        
                        <Grid item xs={12}>
                          <Divider sx={{ my: 2 }} />
                          <Typography variant="subtitle1">Kelly Criterion Analysis</Typography>
                        </Grid>
                        <Grid item xs={6}>
                          <Typography variant="subtitle2" color="textSecondary">Kelly %</Typography>
                          <Typography variant="body1">{(tradeAnalyticsResult.kellyCriterion * 100).toFixed(2)}%</Typography>
                        </Grid>
                        {tradeAnalyticsResult.recommendedPositionSize && (
                          <>
                            <Grid item xs={6}>
                              <Typography variant="subtitle2" color="textSecondary">Recommended Size (Half-Kelly)</Typography>
                              <Typography variant="body1">{tradeAnalyticsResult.recommendedPositionSize.toFixed(3)}</Typography>
                            </Grid>
                            <Grid item xs={6}>
                              <Typography variant="subtitle2" color="textSecondary">Conservative Size (Quarter-Kelly)</Typography>
                              <Typography variant="body1">{tradeAnalyticsResult.conservativePositionSize.toFixed(3)}</Typography>
                            </Grid>
                            <Grid item xs={6}>
                              <Typography variant="subtitle2" color="textSecondary">Aggressive Size (3/4-Kelly)</Typography>
                              <Typography variant="body1">{tradeAnalyticsResult.aggressivePositionSize.toFixed(3)}</Typography>
                            </Grid>
                          </>
                        )}
                      </Grid>
                    </CardContent>
                  </Card>
                )}
              </Grid>
            </Grid>
          )}

          {/* Monte Carlo Simulation */}
          {selectedTab === 2 && (
            <Grid container spacing={3}>
              <Grid item xs={12} md={5}>
                <form onSubmit={monteCarloFormik.handleSubmit}>
                  <Typography variant="h6" gutterBottom>
                    Monte Carlo Simulation
                  </Typography>
                  <TextField
                    fullWidth
                    margin="normal"
                    id="initialBalance"
                    name="initialBalance"
                    label="Initial Balance"
                    type="number"
                    value={monteCarloFormik.values.initialBalance}
                    onChange={monteCarloFormik.handleChange}
                    error={monteCarloFormik.touched.initialBalance && Boolean(monteCarloFormik.errors.initialBalance)}
                    helperText={monteCarloFormik.touched.initialBalance && monteCarloFormik.errors.initialBalance}
                  />
                  <TextField
                    fullWidth
                    margin="normal"
                    id="winRate"
                    name="winRate"
                    label="Win Rate (0-1)"
                    type="number"
                    inputProps={{ min: 0, max: 1, step: 0.05 }}
                    value={monteCarloFormik.values.winRate}
                    onChange={monteCarloFormik.handleChange}
                    error={monteCarloFormik.touched.winRate && Boolean(monteCarloFormik.errors.winRate)}
                    helperText={monteCarloFormik.touched.winRate && monteCarloFormik.errors.winRate}
                  />
                  <TextField
                    fullWidth
                    margin="normal"
                    id="averageWin"
                    name="averageWin"
                    label="Average Win ($)"
                    type="number"
                    value={monteCarloFormik.values.averageWin}
                    onChange={monteCarloFormik.handleChange}
                    error={monteCarloFormik.touched.averageWin && Boolean(monteCarloFormik.errors.averageWin)}
                    helperText={monteCarloFormik.touched.averageWin && monteCarloFormik.errors.averageWin}
                  />
                  <TextField
                    fullWidth
                    margin="normal"
                    id="averageLoss"
                    name="averageLoss"
                    label="Average Loss ($)"
                    type="number"
                    value={monteCarloFormik.values.averageLoss}
                    onChange={monteCarloFormik.handleChange}
                    error={monteCarloFormik.touched.averageLoss && Boolean(monteCarloFormik.errors.averageLoss)}
                    helperText={monteCarloFormik.touched.averageLoss && monteCarloFormik.errors.averageLoss}
                  />
                  <TextField
                    fullWidth
                    margin="normal"
                    id="numberOfTrades"
                    name="numberOfTrades"
                    label="Number of Trades"
                    type="number"
                    value={monteCarloFormik.values.numberOfTrades}
                    onChange={monteCarloFormik.handleChange}
                    error={monteCarloFormik.touched.numberOfTrades && Boolean(monteCarloFormik.errors.numberOfTrades)}
                    helperText={monteCarloFormik.touched.numberOfTrades && monteCarloFormik.errors.numberOfTrades}
                  />
                  <TextField
                    fullWidth
                    margin="normal"
                    id="numberOfSimulations"
                    name="numberOfSimulations"
                    label="Number of Simulations"
                    type="number"
                    value={monteCarloFormik.values.numberOfSimulations}
                    onChange={monteCarloFormik.handleChange}
                    error={monteCarloFormik.touched.numberOfSimulations && Boolean(monteCarloFormik.errors.numberOfSimulations)}
                    helperText={monteCarloFormik.touched.numberOfSimulations && monteCarloFormik.errors.numberOfSimulations}
                  />
                  <Button
                    type="submit"
                    variant="contained"
                    color="primary"
                    fullWidth
                    sx={{ mt: 3 }}
                    disabled={isLoading}
                  >
                    {isLoading ? <CircularProgress size={24} /> : 'Run Simulation'}
                  </Button>
                </form>
              </Grid>
              <Grid item xs={12} md={7}>
                {monteCarloResult && (
                  <Card elevation={3}>
                    <CardContent>
                      <Typography variant="h6" gutterBottom>Monte Carlo Results</Typography>
                      <Divider sx={{ mb: 2 }} />
                      
                      <Grid container spacing={2}>
                        <Grid item xs={12} md={6}>
                          <Typography variant="subtitle2" color="textSecondary">Average Return</Typography>
                          <Typography variant="body1" color={monteCarloResult.averageReturn > 0 ? 'success.main' : 'error.main'}>
                            {monteCarloResult.averageReturn.toFixed(2)}%
                          </Typography>
                        </Grid>
                        <Grid item xs={12} md={6}>
                          <Typography variant="subtitle2" color="textSecondary">Median Return</Typography>
                          <Typography variant="body1" color={monteCarloResult.medianReturn > 0 ? 'success.main' : 'error.main'}>
                            {monteCarloResult.medianReturn.toFixed(2)}%
                          </Typography>
                        </Grid>
                        <Grid item xs={12} md={6}>
                          <Typography variant="subtitle2" color="textSecondary">Max Return</Typography>
                          <Typography variant="body1" color="success.main">
                            {monteCarloResult.maxReturn.toFixed(2)}%
                          </Typography>
                        </Grid>
                        <Grid item xs={12} md={6}>
                          <Typography variant="subtitle2" color="textSecondary">Min Return</Typography>
                          <Typography variant="body1" color="error.main">
                            {monteCarloResult.minReturn.toFixed(2)}%
                          </Typography>
                        </Grid>
                        <Grid item xs={12} md={6}>
                          <Typography variant="subtitle2" color="textSecondary">Failure Rate</Typography>
                          <Typography variant="body1">
                            {(monteCarloResult.failureRate * 100).toFixed(2)}%
                          </Typography>
                        </Grid>
                        <Grid item xs={12} md={6}>
                          <Typography variant="subtitle2" color="textSecondary">Average Max Drawdown</Typography>
                          <Typography variant="body1" color="error.main">
                            {monteCarloResult.averageMaxDrawdown.toFixed(2)}%
                          </Typography>
                        </Grid>
                      </Grid>
                      
                      <Typography variant="subtitle1" sx={{ mt: 3, mb: 1 }}>Equity Distribution</Typography>
                      <Box sx={{ height: 300 }}>
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart
                            data={getPercentileData()}
                            margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                          >
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="name" />
                            <YAxis />
                            <Tooltip formatter={(value) => [`$${value.toFixed(2)}`, 'Account Value']} />
                            <Bar dataKey="value" fill="#FFC107" name="Account Value" />
                          </BarChart>
                        </ResponsiveContainer>
                      </Box>
                      
                      <Typography variant="subtitle1" sx={{ mt: 3, mb: 1 }}>Percentiles</Typography>
                      <TableContainer>
                        <Table size="small">
                          <TableHead>
                            <TableRow>
                              <TableCell>Percentile</TableCell>
                              <TableCell align="right">Account Value</TableCell>
                              <TableCell align="right">Return</TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            <TableRow>
                              <TableCell>5%</TableCell>
                              <TableCell align="right">${monteCarloResult.percentile5.toFixed(2)}</TableCell>
                              <TableCell align="right" sx={{ color: monteCarloResult.percentile5 >= monteCarloFormik.values.initialBalance ? 'success.main' : 'error.main' }}>
                                {((monteCarloResult.percentile5 / monteCarloFormik.values.initialBalance - 1) * 100).toFixed(2)}%
                              </TableCell>
                            </TableRow>
                            <TableRow>
                              <TableCell>25%</TableCell>
                              <TableCell align="right">${monteCarloResult.percentile25.toFixed(2)}</TableCell>
                              <TableCell align="right" sx={{ color: monteCarloResult.percentile25 >= monteCarloFormik.values.initialBalance ? 'success.main' : 'error.main' }}>
                                {((monteCarloResult.percentile25 / monteCarloFormik.values.initialBalance - 1) * 100).toFixed(2)}%
                              </TableCell>
                            </TableRow>
                            <TableRow>
                              <TableCell>50% (Median)</TableCell>
                              <TableCell align="right">${monteCarloResult.percentile50.toFixed(2)}</TableCell>
                              <TableCell align="right" sx={{ color: monteCarloResult.percentile50 >= monteCarloFormik.values.initialBalance ? 'success.main' : 'error.main' }}>
                                {((monteCarloResult.percentile50 / monteCarloFormik.values.initialBalance - 1) * 100).toFixed(2)}%
                              </TableCell>
                            </TableRow>
                            <TableRow>
                              <TableCell>75%</TableCell>
                              <TableCell align="right">${monteCarloResult.percentile75.toFixed(2)}</TableCell>
                              <TableCell align="right" sx={{ color: monteCarloResult.percentile75 >= monteCarloFormik.values.initialBalance ? 'success.main' : 'error.main' }}>
                                {((monteCarloResult.percentile75 / monteCarloFormik.values.initialBalance - 1) * 100).toFixed(2)}%
                              </TableCell>
                            </TableRow>
                            <TableRow>
                              <TableCell>95%</TableCell>
                              <TableCell align="right">${monteCarloResult.percentile95.toFixed(2)}</TableCell>
                              <TableCell align="right" sx={{ color: monteCarloResult.percentile95 >= monteCarloFormik.values.initialBalance ? 'success.main' : 'error.main' }}>
                                {((monteCarloResult.percentile95 / monteCarloFormik.values.initialBalance - 1) * 100).toFixed(2)}%
                              </TableCell>
                            </TableRow>
                          </TableBody>
                        </Table>
                      </TableContainer>
                    </CardContent>
                  </Card>
                )}
              </Grid>
            </Grid>
          )}
        </Box>
      </Paper>
    </Container>
  );
};

export default CalculatorsPage;