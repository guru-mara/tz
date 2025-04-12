// src/pages/Simulations/SimulationsPage.jsx
import React, { useState, useEffect } from 'react';
import { 
  Container, Typography, Button, Grid, Card, CardContent, 
  CardActions, IconButton, Dialog, DialogTitle, DialogContent, 
  DialogActions, TextField, Box, CircularProgress, Chip, Paper,
  FormControl, InputLabel, Select, MenuItem, Tab, Tabs, Table,
  TableBody, TableCell, TableContainer, TableHead, TableRow
} from '@mui/material';
import { 
  Add as AddIcon, 
  Delete as DeleteIcon, 
  Science as SimulationIcon,
  PlayArrow as PlayIcon,
  Check as WinIcon,
  Close as LossIcon,
  Remove as BreakevenIcon,
  Psychology as ScenarioIcon
} from '@mui/icons-material';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import simulationService from '../../services/simulationService';
import scenarioService from '../../services/scenarioService';
import accountService from '../../services/accountService';

const SimulationsPage = () => {
  const [simulations, setSimulations] = useState([]);
  const [scenarios, setScenarios] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [stats, setStats] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isStatsLoading, setIsStatsLoading] = useState(true);
  const [scenarioDialogOpen, setScenarioDialogOpen] = useState(false);
  const [executeDialogOpen, setExecuteDialogOpen] = useState(false);
  const [selectedSimulation, setSelectedSimulation] = useState(null);
  const [error, setError] = useState('');

  // Fetch data on component mount
  useEffect(() => {
    fetchSimulations();
    fetchScenarios();
    fetchAccounts();
    fetchStats();
  }, []);

  const fetchSimulations = async () => {
    setIsLoading(true);
    try {
      const data = await simulationService.getSimulations();
      setSimulations(data);
      setError('');
    } catch (err) {
      setError(err.message || 'Failed to fetch simulations');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchScenarios = async () => {
    try {
      const data = await scenarioService.getScenarios();
      setScenarios(data);
    } catch (err) {
      console.error('Failed to fetch scenarios:', err);
    }
  };

  const fetchAccounts = async () => {
    try {
      const data = await accountService.getAccounts();
      setAccounts(data);
    } catch (err) {
      console.error('Failed to fetch accounts:', err);
    }
  };

  const fetchStats = async () => {
    setIsStatsLoading(true);
    try {
      const data = await simulationService.getSimulationStats();
      setStats(data);
    } catch (err) {
      console.error('Failed to fetch simulation stats:', err);
    } finally {
      setIsStatsLoading(false);
    }
  };

  // Form validation schema for creating from scenario
  const scenarioFormValidation = Yup.object({
    scenarioId: Yup.number().required('Scenario is required')
  });

  // Form validation schema for executing a simulation
  const executeFormValidation = Yup.object({
    exit_price: Yup.number().required('Exit price is required').positive('Must be positive'),
    simulation_result: Yup.string().required('Result is required'),
    notes: Yup.string()
  });

  // Formik for scenario-based simulation creation
  const scenarioFormik = useFormik({
    initialValues: {
      scenarioId: ''
    },
    validationSchema: scenarioFormValidation,
    onSubmit: async (values, { resetForm }) => {
      try {
        await simulationService.createFromScenario(values.scenarioId);
        resetForm();
        setScenarioDialogOpen(false);
        fetchSimulations();
      } catch (err) {
        setError(err.message || 'Failed to create simulation from scenario');
      }
    }
  });

  // Formik for executing a simulation
  const executeFormik = useFormik({
    initialValues: {
      exit_price: '',
      simulation_result: '',
      notes: ''
    },
    validationSchema: executeFormValidation,
    onSubmit: async (values, { resetForm }) => {
      try {
        if (!selectedSimulation) return;
        
        await simulationService.executeSimulation(selectedSimulation.simulation_id, values);
        resetForm();
        setExecuteDialogOpen(false);
        setSelectedSimulation(null);
        fetchSimulations();
        fetchStats();
      } catch (err) {
        setError(err.message || 'Failed to execute simulation');
      }
    }
  });

  // Handle creating simulation from scenario
  const handleCreateFromScenario = () => {
    scenarioFormik.resetForm();
    setScenarioDialogOpen(true);
  };

  // Handle executing a simulation
  const handleExecuteSimulation = (simulation) => {
    setSelectedSimulation(simulation);
    executeFormik.resetForm();
    setExecuteDialogOpen(true);
  };

  // Handle deleting a simulation
  const handleDeleteSimulation = async (id) => {
    if (window.confirm('Are you sure you want to delete this simulation?')) {
      try {
        await simulationService.deleteSimulation(id);
        fetchSimulations();
        fetchStats();
      } catch (err) {
        setError(err.message || 'Failed to delete simulation');
      }
    }
  };

  // Helper function to get result color
  const getResultColor = (result) => {
    switch (result) {
      case 'win': return 'success';
      case 'loss': return 'error';
      case 'breakeven': return 'warning';
      default: return 'default';
    }
  };

  // Helper function to get result icon
  const getResultIcon = (result) => {
    switch (result) {
      case 'win': return <WinIcon />;
      case 'loss': return <LossIcon />;
      case 'breakeven': return <BreakevenIcon />;
      default: return null;
    }
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" component="h1" gutterBottom>
          Trade Simulations
        </Typography>
        <Button 
          variant="contained" 
          color="primary" 
          startIcon={<ScenarioIcon />}
          onClick={handleCreateFromScenario}
        >
          From Scenario
        </Button>
      </Box>

      {error && (
        <Box sx={{ mb: 2 }}>
          <Typography color="error">{error}</Typography>
        </Box>
      )}

      {/* Simulation Stats */}
      {!isStatsLoading && stats && (
        <Paper elevation={2} sx={{ p: 3, mb: 4 }}>
          <Typography variant="h6" gutterBottom>Simulation Statistics</Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6} md={3}>
              <Box>
                <Typography variant="subtitle2" color="textSecondary">Total Simulations</Typography>
                <Typography variant="h5">{stats.total_simulations || 0}</Typography>
              </Box>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Box>
                <Typography variant="subtitle2" color="textSecondary">Win Rate</Typography>
                <Typography variant="h5">
                  {stats.total_simulations ? 
                    `${((stats.wins / stats.total_simulations) * 100).toFixed(1)}%` : 
                    'N/A'}
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Box>
                <Typography variant="subtitle2" color="textSecondary">Avg. Win</Typography>
                <Typography variant="h5" color="success.main">
                  {stats.avg_win ? `$${stats.avg_win.toFixed(2)}` : 'N/A'}
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Box>
                <Typography variant="subtitle2" color="textSecondary">Avg. Loss</Typography>
                <Typography variant="h5" color="error.main">
                  {stats.avg_loss ? `$${Math.abs(stats.avg_loss).toFixed(2)}` : 'N/A'}
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Box>
                <Typography variant="subtitle2" color="textSecondary">Profit/Loss</Typography>
                <Typography variant="h5" color={stats.total_profit_loss > 0 ? 'success.main' : 'error.main'}>
                  {stats.total_profit_loss ? `$${stats.total_profit_loss.toFixed(2)}` : '$0.00'}
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Box>
                <Typography variant="subtitle2" color="textSecondary">Avg. R/R Ratio</Typography>
                <Typography variant="h5">
                  {stats.avg_risk_reward ? stats.avg_risk_reward.toFixed(2) : 'N/A'}
                </Typography>
              </Box>
            </Grid>
          </Grid>
        </Paper>
      )}

      {isLoading ? (
        <Box display="flex" justifyContent="center" my={4}>
          <CircularProgress />
        </Box>
      ) : (
        <TableContainer component={Paper}>
          <Table aria-label="simulations table">
            <TableHead>
              <TableRow>
                <TableCell>Name</TableCell>
                <TableCell>Market</TableCell>
                <TableCell>Entry</TableCell>
                <TableCell>Exit</TableCell>
                <TableCell>Size</TableCell>
                <TableCell>Risk</TableCell>
                <TableCell>Result</TableCell>
                <TableCell>P/L</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {simulations.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} align="center">
                    <Typography variant="body1">No simulations found. Create your first trade simulation.</Typography>
                  </TableCell>
                </TableRow>
              ) : (
                simulations.map((simulation) => (
                  <TableRow key={simulation.simulation_id}>
                    <TableCell>{simulation.simulation_name}</TableCell>
                    <TableCell>{simulation.market}</TableCell>
                    <TableCell>${simulation.entry_price?.toFixed(2) || 'N/A'}</TableCell>
                    <TableCell>
                      {simulation.exit_price ? 
                        `$${simulation.exit_price.toFixed(2)}` : 
                        <Chip size="small" label="Pending" />
                      }
                    </TableCell>
                    <TableCell>{simulation.position_size || 'N/A'}</TableCell>
                    <TableCell>${simulation.risk_amount?.toFixed(2) || 'N/A'}</TableCell>
                    <TableCell>
                      {simulation.simulation_result ? (
                        <Chip 
                          size="small" 
                          label={simulation.simulation_result.toUpperCase()} 
                          color={getResultColor(simulation.simulation_result)}
                          icon={getResultIcon(simulation.simulation_result)}
                        />
                      ) : (
                        <Chip size="small" label="PENDING" variant="outlined" />
                      )}
                    </TableCell>
                    <TableCell>
                      {simulation.profit_loss !== null ? (
                        <Typography 
                          color={simulation.profit_loss > 0 ? 'success.main' : (
                            simulation.profit_loss < 0 ? 'error.main' : 'text.primary'
                          )}
                        >
                          ${simulation.profit_loss.toFixed(2)}
                        </Typography>
                      ) : (
                        'N/A'
                      )}
                    </TableCell>
                    <TableCell>
                      {simulation.simulation_result === 'pending' && (
                        <IconButton 
                          color="primary" 
                          onClick={() => handleExecuteSimulation(simulation)}
                          aria-label="execute simulation"
                          size="small"
                        >
                          <PlayIcon />
                        </IconButton>
                      )}
                      <IconButton 
                        color="error" 
                        onClick={() => handleDeleteSimulation(simulation.simulation_id)}
                        aria-label="delete simulation"
                        size="small"
                      >
                        <DeleteIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Create from Scenario Dialog */}
      <Dialog 
        open={scenarioDialogOpen} 
        onClose={() => setScenarioDialogOpen(false)} 
        maxWidth="sm" 
        fullWidth
      >
        <DialogTitle>Create Simulation from Scenario</DialogTitle>
        <form onSubmit={scenarioFormik.handleSubmit}>
          <DialogContent>
            <FormControl fullWidth margin="normal">
              <InputLabel id="scenario-label">Select Scenario</InputLabel>
              <Select
                labelId="scenario-label"
                id="scenarioId"
                name="scenarioId"
                value={scenarioFormik.values.scenarioId}
                onChange={scenarioFormik.handleChange}
                label="Select Scenario"
                error={scenarioFormik.touched.scenarioId && Boolean(scenarioFormik.errors.scenarioId)}
              >
                <MenuItem value="">
                  <em>Select a scenario</em>
                </MenuItem>
                {scenarios.map((scenario) => (
                  <MenuItem key={scenario.scenario_id} value={scenario.scenario_id}>
                    {scenario.scenario_name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setScenarioDialogOpen(false)}>Cancel</Button>
            <Button 
              type="submit" 
              variant="contained" 
              color="primary" 
              disabled={scenarioFormik.isSubmitting || !scenarioFormik.isValid}
            >
              {scenarioFormik.isSubmitting ? <CircularProgress size={24} /> : 'Create Simulation'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Execute Simulation Dialog */}
      <Dialog 
        open={executeDialogOpen} 
        onClose={() => setExecuteDialogOpen(false)} 
        maxWidth="sm" 
        fullWidth
      >
        <DialogTitle>Execute Simulation</DialogTitle>
        <form onSubmit={executeFormik.handleSubmit}>
          <DialogContent>
            {selectedSimulation && (
              <Box mb={3}>
                <Typography variant="subtitle1">
                  {selectedSimulation.simulation_name}
                </Typography>
                <Typography variant="body2">
                  Entry Price: ${selectedSimulation.entry_price?.toFixed(2)}
                </Typography>
                <Typography variant="body2">
                  Stop Loss: ${selectedSimulation.stop_loss?.toFixed(2)}
                </Typography>
                <Typography variant="body2">
                  Take Profit: ${selectedSimulation.take_profit?.toFixed(2)}
                </Typography>
              </Box>
            )}
            <TextField
              fullWidth
              margin="normal"
              id="exit_price"
              name="exit_price"
              label="Exit Price"
              type="number"
              value={executeFormik.values.exit_price}
              onChange={executeFormik.handleChange}
              error={executeFormik.touched.exit_price && Boolean(executeFormik.errors.exit_price)}
              helperText={executeFormik.touched.exit_price && executeFormik.errors.exit_price}
            />
            <FormControl fullWidth margin="normal">
              <InputLabel id="result-label">Result</InputLabel>
              <Select
                labelId="result-label"
                id="simulation_result"
                name="simulation_result"
                value={executeFormik.values.simulation_result}
                onChange={executeFormik.handleChange}
                label="Result"
                error={executeFormik.touched.simulation_result && Boolean(executeFormik.errors.simulation_result)}
              >
                <MenuItem value="">
                  <em>Select result</em>
                </MenuItem>
                <MenuItem value="win">Win</MenuItem>
                <MenuItem value="loss">Loss</MenuItem>
                <MenuItem value="breakeven">Breakeven</MenuItem>
              </Select>
            </FormControl>
            <TextField
              fullWidth
              margin="normal"
              id="notes"
              name="notes"
              label="Execution Notes"
              multiline
              rows={3}
              value={executeFormik.values.notes}
              onChange={executeFormik.handleChange}
              error={executeFormik.touched.notes && Boolean(executeFormik.errors.notes)}
              helperText={executeFormik.touched.notes && executeFormik.errors.notes}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setExecuteDialogOpen(false)}>Cancel</Button>
            <Button 
              type="submit" 
              variant="contained" 
              color="primary" 
              disabled={executeFormik.isSubmitting || !executeFormik.isValid}
            >
              {executeFormik.isSubmitting ? <CircularProgress size={24} /> : 'Execute Simulation'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Container>
  );
};

export default SimulationsPage;