// src/pages/Scenarios/ScenariosPage.jsx
import React, { useState, useEffect } from 'react';
import { 
  Container, Typography, Button, Grid, Card, CardContent, 
  CardActions, IconButton, Dialog, DialogTitle, DialogContent, 
  DialogActions, TextField, Box, CircularProgress, Chip, Paper,
  FormControl, InputLabel, Select, MenuItem, Tab, Tabs
} from '@mui/material';
import { 
  Add as AddIcon, 
  Edit as EditIcon, 
  Delete as DeleteIcon, 
  Psychology as ScenarioIcon,
  PlayArrow as PlayIcon,
  TrendingUp as TrendingIcon
} from '@mui/icons-material';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import scenarioService from '../../services/scenarioService';
import accountService from '../../services/accountService';
import templateService from '../../services/templateService';
import calculatorService from '../../services/calculatorService';

const ScenariosPage = () => {
  const [scenarios, setScenarios] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [templateDialogOpen, setTemplateDialogOpen] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState('');
  const [editingScenario, setEditingScenario] = useState(null);
  const [error, setError] = useState('');
  const [tabValue, setTabValue] = useState(0);

  // Fetch data on component mount
  useEffect(() => {
    fetchScenarios();
    fetchAccounts();
    fetchTemplates();
  }, []);

  const fetchScenarios = async () => {
    setIsLoading(true);
    try {
      const data = await scenarioService.getScenarios();
      setScenarios(data);
      setError('');
    } catch (err) {
      setError(err.message || 'Failed to fetch scenarios');
    } finally {
      setIsLoading(false);
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

  const fetchTemplates = async () => {
    try {
      const data = await templateService.getTemplates();
      setTemplates(data);
    } catch (err) {
      console.error('Failed to fetch templates:', err);
    }
  };

  // Form validation schema for creating a scenario directly
  const validationSchema = Yup.object({
    scenario_name: Yup.string().required('Scenario name is required'),
    account_id: Yup.number().nullable(),
    market_condition: Yup.string(),
    initial_price: Yup.number().positive('Must be positive'),
    stop_loss: Yup.number().positive('Must be positive'),
    take_profit: Yup.number().positive('Must be positive'),
    position_size: Yup.number().positive('Must be positive'),
    entry_price: Yup.number().positive('Must be positive'),
    risk_amount: Yup.number().positive('Must be positive'),
    potential_profit: Yup.number(),
    risk_reward_ratio: Yup.number().positive('Must be positive'),
    win_probability: Yup.number().min(0).max(1, 'Must be between 0 and 1'),
    notes: Yup.string()
  });

  // Form validation schema for creating from template
  const templateFormValidation = Yup.object({
    templateId: Yup.number().required('Template is required'),
    accountId: Yup.number().required('Account is required'),
    market_condition: Yup.string(),
    initial_price: Yup.number().required('Initial price is required').positive('Must be positive'),
    stop_loss: Yup.number().required('Stop loss is required').positive('Must be positive'),
    take_profit: Yup.number().required('Take profit is required').positive('Must be positive'),
    position_size: Yup.number().required('Position size is required').positive('Must be positive'),
    win_probability: Yup.number().min(0).max(1, 'Must be between 0 and 1')
  });

  // Initial values for direct scenario creation
  const initialValues = {
    scenario_name: '',
    account_id: '',
    market_condition: 'Bullish',
    initial_price: '',
    stop_loss: '',
    take_profit: '',
    position_size: '',
    entry_price: '',
    risk_amount: '',
    potential_profit: '',
    risk_reward_ratio: '',
    win_probability: 0.5,
    notes: ''
  };

  // Formik for direct scenario creation
  const formik = useFormik({
    initialValues,
    validationSchema,
    onSubmit: async (values, { resetForm }) => {
      try {
        if (editingScenario) {
          await scenarioService.updateScenario(editingScenario.scenario_id, values);
        } else {
          await scenarioService.createScenario(values);
        }
        resetForm();
        setDialogOpen(false);
        setEditingScenario(null);
        fetchScenarios();
      } catch (err) {
        setError(err.message || 'Failed to save scenario');
      }
    }
  });

  // Formik for template-based scenario creation
  const templateFormik = useFormik({
    initialValues: {
      templateId: '',
      accountId: '',
      market_condition: 'Bullish',
      initial_price: '',
      entry_price: '',
      stop_loss: '',
      take_profit: '',
      position_size: '',
      risk_amount: '',
      potential_profit: '',
      win_probability: 0.5
    },
    validationSchema: templateFormValidation,
    onSubmit: async (values, { resetForm }) => {
      try {
        await scenarioService.createFromTemplate(
          values.templateId,
          values.accountId,
          {
            market_condition: values.market_condition,
            initial_price: values.initial_price,
            entry_price: values.entry_price || values.initial_price,
            stop_loss: values.stop_loss,
            take_profit: values.take_profit,
            position_size: values.position_size,
            risk_amount: values.risk_amount,
            potential_profit: values.potential_profit,
            win_probability: values.win_probability
          }
        );
        resetForm();
        setTemplateDialogOpen(false);
        fetchScenarios();
      } catch (err) {
        setError(err.message || 'Failed to create scenario from template');
      }
    }
  });

  // Handle adding new scenario
  const handleAddScenario = () => {
    formik.resetForm();
    setEditingScenario(null);
    setDialogOpen(true);
  };

  // Handle creating scenario from template
  const handleCreateFromTemplate = () => {
    templateFormik.resetForm();
    setTemplateDialogOpen(true);
  };

  // Handle editing an existing scenario
  const handleEditScenario = (scenario) => {
    const formValues = {
      scenario_name: scenario.scenario_name,
      account_id: scenario.account_id || '',
      market_condition: scenario.market_condition || 'Bullish',
      initial_price: scenario.initial_price || '',
      stop_loss: scenario.stop_loss || '',
      take_profit: scenario.take_profit || '',
      position_size: scenario.position_size || '',
      entry_price: scenario.entry_price || '',
      risk_amount: scenario.risk_amount || '',
      potential_profit: scenario.potential_profit || '',
      risk_reward_ratio: scenario.risk_reward_ratio || '',
      win_probability: scenario.win_probability || 0.5,
      notes: scenario.notes || ''
    };
    
    formik.setValues(formValues);
    setEditingScenario(scenario);
    setDialogOpen(true);
  };

  // Calculate trade analytics based on form values
  const calculateTradeAnalytics = async () => {
    if (templateFormik.values.initial_price && templateFormik.values.stop_loss && 
        templateFormik.values.take_profit && templateFormik.values.position_size) {
      try {
        const analytics = await calculatorService.calculateTradeAnalytics({
          entry_price: Number(templateFormik.values.initial_price),
          stop_loss: Number(templateFormik.values.stop_loss),
          take_profit: Number(templateFormik.values.take_profit),
          position_size: Number(templateFormik.values.position_size),
          win_probability: Number(templateFormik.values.win_probability)
        });

        templateFormik.setFieldValue('risk_amount', analytics.riskAmount);
        templateFormik.setFieldValue('potential_profit', analytics.potentialProfit);
      } catch (err) {
        console.error('Failed to calculate analytics:', err);
      }
    }
  };

  // Watch for changes in key fields to auto-calculate analytics
  useEffect(() => {
    if (templateDialogOpen) {
      calculateTradeAnalytics();
    }
  }, [
    templateFormik.values.initial_price,
    templateFormik.values.stop_loss,
    templateFormik.values.take_profit,
    templateFormik.values.position_size,
    templateFormik.values.win_probability
  ]);

  // Handle deleting a scenario
  const handleDeleteScenario = async (id) => {
    if (window.confirm('Are you sure you want to delete this scenario?')) {
      try {
        await scenarioService.deleteScenario(id);
        fetchScenarios();
      } catch (err) {
        setError(err.message || 'Failed to delete scenario');
      }
    }
  };

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" component="h1" gutterBottom>
          Scenario Planning
        </Typography>
        <Box>
          <Button 
            variant="contained" 
            color="secondary" 
            startIcon={<TrendingIcon />}
            onClick={handleCreateFromTemplate}
            sx={{ mr: 2 }}
          >
            From Template
          </Button>
          <Button 
            variant="contained" 
            color="primary" 
            startIcon={<AddIcon />}
            onClick={handleAddScenario}
          >
            New Scenario
          </Button>
        </Box>
      </Box>

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
        <Grid container spacing={3}>
          {scenarios.length === 0 ? (
            <Grid item xs={12}>
              <Typography variant="body1">No scenarios found. Create your first trading scenario.</Typography>
            </Grid>
          ) : (
            scenarios.map((scenario) => (
              <Grid item xs={12} sm={6} md={4} key={scenario.scenario_id}>
                <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                  <CardContent sx={{ flexGrow: 1 }}>
                    <Box display="flex" alignItems="center" mb={2}>
                      <ScenarioIcon color="primary" sx={{ mr: 1 }} />
                      <Typography variant="h6" component="h2">
                        {scenario.scenario_name}
                      </Typography>
                    </Box>
                    {scenario.account_name && (
                      <Typography color="textSecondary" gutterBottom>
                        Account: {scenario.account_name}
                      </Typography>
                    )}
                    <Box mb={2}>
                      <Chip 
                        label={scenario.market_condition || 'Unknown'} 
                        size="small" 
                        color="primary" 
                        sx={{ mr: 1 }} 
                      />
                    </Box>
                    <Grid container spacing={1}>
                      <Grid item xs={6}>
                        <Typography variant="body2">
                          Entry: ${scenario.entry_price?.toFixed(2) || 'N/A'}
                        </Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="body2">
                          Stop: ${scenario.stop_loss?.toFixed(2) || 'N/A'}
                        </Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="body2">
                          Target: ${scenario.take_profit?.toFixed(2) || 'N/A'}
                        </Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="body2">
                          Size: {scenario.position_size || 'N/A'}
                        </Typography>
                      </Grid>
                    </Grid>
                    <Typography variant="body2" sx={{ mt: 1 }}>
                      Risk: ${scenario.risk_amount?.toFixed(2) || 'N/A'}
                    </Typography>
                    <Typography variant="body2">
                      Potential Profit: ${scenario.potential_profit?.toFixed(2) || 'N/A'}
                    </Typography>
                    <Typography variant="body2">
                      R/R Ratio: {scenario.risk_reward_ratio?.toFixed(2) || 'N/A'}
                    </Typography>
                    <Typography variant="body2">
                      Win Probability: {(scenario.win_probability * 100)?.toFixed(0)}%
                    </Typography>
                    {scenario.expected_value && (
                      <Typography variant="body2" fontWeight="bold">
                        Expected Value: ${scenario.expected_value.toFixed(2)}
                      </Typography>
                    )}
                  </CardContent>
                  <CardActions>
                    <IconButton 
                      color="primary" 
                      onClick={() => handleEditScenario(scenario)}
                      aria-label="edit scenario"
                    >
                      <EditIcon />
                    </IconButton>
                    <IconButton 
                      color="error" 
                      onClick={() => handleDeleteScenario(scenario.scenario_id)}
                      aria-label="delete scenario"
                    >
                      <DeleteIcon />
                    </IconButton>
                    <IconButton 
                      color="success" 
                      aria-label="simulate scenario"
                      onClick={() => {
                        // This function would be implemented for creating simulation from scenario
                        // simulationService.createFromScenario(scenario.scenario_id);
                      }}
                    >
                      <PlayIcon />
                    </IconButton>
                  </CardActions>
                </Card>
              </Grid>
            ))
          )}
        </Grid>
      )}

      {/* Create/Edit Scenario Dialog */}
      <Dialog 
        open={dialogOpen} 
        onClose={() => setDialogOpen(false)} 
        maxWidth="md" 
        fullWidth
      >
        <DialogTitle>
          {editingScenario ? 'Edit Trading Scenario' : 'Create Trading Scenario'}
        </DialogTitle>
        <form onSubmit={formik.handleSubmit}>
          <DialogContent>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  margin="normal"
                  id="scenario_name"
                  name="scenario_name"
                  label="Scenario Name"
                  value={formik.values.scenario_name}
                  onChange={formik.handleChange}
                  error={formik.touched.scenario_name && Boolean(formik.errors.scenario_name)}
                  helperText={formik.touched.scenario_name && formik.errors.scenario_name}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth margin="normal">
                  <InputLabel id="account-label">Trading Account</InputLabel>
                  <Select
                    labelId="account-label"
                    id="account_id"
                    name="account_id"
                    value={formik.values.account_id}
                    onChange={formik.handleChange}
                    label="Trading Account"
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
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  margin="normal"
                  id="market_condition"
                  name="market_condition"
                  label="Market Condition"
                  value={formik.values.market_condition}
                  onChange={formik.handleChange}
                  error={formik.touched.market_condition && Boolean(formik.errors.market_condition)}
                  helperText={formik.touched.market_condition && formik.errors.market_condition}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  margin="normal"
                  id="initial_price"
                  name="initial_price"
                  label="Initial Price"
                  type="number"
                  value={formik.values.initial_price}
                  onChange={formik.handleChange}
                  error={formik.touched.initial_price && Boolean(formik.errors.initial_price)}
                  helperText={formik.touched.initial_price && formik.errors.initial_price}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  margin="normal"
                  id="entry_price"
                  name="entry_price"
                  label="Entry Price"
                  type="number"
                  value={formik.values.entry_price}
                  onChange={formik.handleChange}
                  error={formik.touched.entry_price && Boolean(formik.errors.entry_price)}
                  helperText={formik.touched.entry_price && formik.errors.entry_price}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  margin="normal"
                  id="stop_loss"
                  name="stop_loss"
                  label="Stop Loss"
                  type="number"
                  value={formik.values.stop_loss}
                  onChange={formik.handleChange}
                  error={formik.touched.stop_loss && Boolean(formik.errors.stop_loss)}
                  helperText={formik.touched.stop_loss && formik.errors.stop_loss}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  margin="normal"
                  id="take_profit"
                  name="take_profit"
                  label="Take Profit"
                  type="number"
                  value={formik.values.take_profit}
                  onChange={formik.handleChange}
                  error={formik.touched.take_profit && Boolean(formik.errors.take_profit)}
                  helperText={formik.touched.take_profit && formik.errors.take_profit}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  margin="normal"
                  id="position_size"
                  name="position_size"
                  label="Position Size"
                  type="number"
                  value={formik.values.position_size}
                  onChange={formik.handleChange}
                  error={formik.touched.position_size && Boolean(formik.errors.position_size)}
                  helperText={formik.touched.position_size && formik.errors.position_size}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  margin="normal"
                  id="risk_amount"
                  name="risk_amount"
                  label="Risk Amount"
                  type="number"
                  value={formik.values.risk_amount}
                  onChange={formik.handleChange}
                  error={formik.touched.risk_amount && Boolean(formik.errors.risk_amount)}
                  helperText={formik.touched.risk_amount && formik.errors.risk_amount}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  margin="normal"
                  id="potential_profit"
                  name="potential_profit"
                  label="Potential Profit"
                  type="number"
                  value={formik.values.potential_profit}
                  onChange={formik.handleChange}
                  error={formik.touched.potential_profit && Boolean(formik.errors.potential_profit)}
                  helperText={formik.touched.potential_profit && formik.errors.potential_profit}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  margin="normal"
                  id="risk_reward_ratio"
                  name="risk_reward_ratio"
                  label="Risk/Reward Ratio"
                  type="number"
                  value={formik.values.risk_reward_ratio}
                  onChange={formik.handleChange}
                  error={formik.touched.risk_reward_ratio && Boolean(formik.errors.risk_reward_ratio)}
                  helperText={formik.touched.risk_reward_ratio && formik.errors.risk_reward_ratio}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  margin="normal"
                  id="win_probability"
                  name="win_probability"
                  label="Win Probability (0-1)"
                  type="number"
                  inputProps={{ min: 0, max: 1, step: 0.05 }}
                  value={formik.values.win_probability}
                  onChange={formik.handleChange}
                  error={formik.touched.win_probability && Boolean(formik.errors.win_probability)}
                  helperText={formik.touched.win_probability && formik.errors.win_probability}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  margin="normal"
                  id="notes"
                  name="notes"
                  label="Notes"
                  multiline
                  rows={4}
                  value={formik.values.notes}
                  onChange={formik.handleChange}
                  error={formik.touched.notes && Boolean(formik.errors.notes)}
                  helperText={formik.touched.notes && formik.errors.notes}
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button 
              type="submit" 
              variant="contained" 
              color="primary" 
              disabled={formik.isSubmitting || !formik.isValid}
            >
              {formik.isSubmitting ? <CircularProgress size={24} /> : 'Save Scenario'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Create from Template Dialog */}
      <Dialog 
        open={templateDialogOpen} 
        onClose={() => setTemplateDialogOpen(false)} 
        maxWidth="md" 
        fullWidth
      >
        <DialogTitle>Create Scenario from Template</DialogTitle>
        <form onSubmit={templateFormik.handleSubmit}>
          <DialogContent>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth margin="normal">
                  <InputLabel id="template-label">Trade Template</InputLabel>
                  <Select
                    labelId="template-label"
                    id="templateId"
                    name="templateId"
                    value={templateFormik.values.templateId}
                    onChange={templateFormik.handleChange}
                    label="Trade Template"
                    error={templateFormik.touched.templateId && Boolean(templateFormik.errors.templateId)}
                  >
                    <MenuItem value="">
                      <em>Select a template</em>
                    </MenuItem>
                    {templates.map((template) => (
                      <MenuItem key={template.template_id} value={template.template_id}>
                        {template.template_name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth margin="normal">
                  <InputLabel id="account-template-label">Trading Account</InputLabel>
                  <Select
                    labelId="account-template-label"
                    id="accountId"
                    name="accountId"
                    value={templateFormik.values.accountId}
                    onChange={templateFormik.handleChange}
                    label="Trading Account"
                    error={templateFormik.touched.accountId && Boolean(templateFormik.errors.accountId)}
                  >
                    <MenuItem value="">
                      <em>Select an account</em>
                    </MenuItem>
                    {accounts.map((account) => (
                      <MenuItem key={account.account_id} value={account.account_id}>
                        {account.account_name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  margin="normal"
                  id="market_condition"
                  name="market_condition"
                  label="Market Condition"
                  value={templateFormik.values.market_condition}
                  onChange={templateFormik.handleChange}
                  error={templateFormik.touched.market_condition && Boolean(templateFormik.errors.market_condition)}
                  helperText={templateFormik.touched.market_condition && templateFormik.errors.market_condition}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  margin="normal"
                  id="initial_price"
                  name="initial_price"
                  label="Initial Price"
                  type="number"
                  value={templateFormik.values.initial_price}
                  onChange={templateFormik.handleChange}
                  error={templateFormik.touched.initial_price && Boolean(templateFormik.errors.initial_price)}
                  helperText={templateFormik.touched.initial_price && templateFormik.errors.initial_price}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  margin="normal"
                  id="stop_loss"
                  name="stop_loss"
                  label="Stop Loss"
                  type="number"
                  value={templateFormik.values.stop_loss}
                  onChange={templateFormik.handleChange}
                  error={templateFormik.touched.stop_loss && Boolean(templateFormik.errors.stop_loss)}
                  helperText={templateFormik.touched.stop_loss && templateFormik.errors.stop_loss}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  margin="normal"
                  id="take_profit"
                  name="take_
                  // Continuing src/pages/Scenarios/ScenariosPage.jsx
                <TextField
                  fullWidth
                  margin="normal"
                  id="take_profit"
                  name="take_profit"
                  label="Take Profit"
                  type="number"
                  value={templateFormik.values.take_profit}
                  onChange={templateFormik.handleChange}
                  error={templateFormik.touched.take_profit && Boolean(templateFormik.errors.take_profit)}
                  helperText={templateFormik.touched.take_profit && templateFormik.errors.take_profit}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  margin="normal"
                  id="position_size"
                  name="position_size"
                  label="Position Size"
                  type="number"
                  value={templateFormik.values.position_size}
                  onChange={templateFormik.handleChange}
                  error={templateFormik.touched.position_size && Boolean(templateFormik.errors.position_size)}
                  helperText={templateFormik.touched.position_size && templateFormik.errors.position_size}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  margin="normal"
                  id="win_probability"
                  name="win_probability"
                  label="Win Probability (0-1)"
                  type="number"
                  inputProps={{ min: 0, max: 1, step: 0.05 }}
                  value={templateFormik.values.win_probability}
                  onChange={templateFormik.handleChange}
                  error={templateFormik.touched.win_probability && Boolean(templateFormik.errors.win_probability)}
                  helperText={templateFormik.touched.win_probability && templateFormik.errors.win_probability}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  margin="normal"
                  id="risk_amount"
                  name="risk_amount"
                  label="Risk Amount"
                  type="number"
                  value={templateFormik.values.risk_amount}
                  onChange={templateFormik.handleChange}
                  error={templateFormik.touched.risk_amount && Boolean(templateFormik.errors.risk_amount)}
                  helperText={templateFormik.touched.risk_amount && templateFormik.errors.risk_amount}
                  disabled
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  margin="normal"
                  id="potential_profit"
                  name="potential_profit"
                  label="Potential Profit"
                  type="number"
                  value={templateFormik.values.potential_profit}
                  onChange={templateFormik.handleChange}
                  error={templateFormik.touched.potential_profit && Boolean(templateFormik.errors.potential_profit)}
                  helperText={templateFormik.touched.potential_profit && templateFormik.errors.potential_profit}
                  disabled
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setTemplateDialogOpen(false)}>Cancel</Button>
            <Button 
              type="submit" 
              variant="contained" 
              color="primary" 
              disabled={templateFormik.isSubmitting || !templateFormik.isValid}
            >
              {templateFormik.isSubmitting ? <CircularProgress size={24} /> : 'Create Scenario'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Container>
  );
};

export default ScenariosPage;