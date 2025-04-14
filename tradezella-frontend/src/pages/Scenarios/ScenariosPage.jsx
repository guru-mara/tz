import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  Grid,
  Card,
  CardContent,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Tabs,
  Tab,
  Paper,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Snackbar,
  Alert
} from '@mui/material';
import { useFormik } from 'formik';
import * as yup from 'yup';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import AddIcon from '@mui/icons-material/Add';

// Define validation schemas
const templateValidationSchema = yup.object({
  template_name: yup.string().required('Template name is required'),
  entry_price: yup.number().required('Entry price is required').positive('Must be positive'),
  stop_loss: yup.number().required('Stop loss is required').positive('Must be positive'),
  take_profit: yup.number().required('Take profit is required').positive('Must be positive'),
  risk_reward_ratio: yup.number().positive('Must be positive'),
  position_size: yup.number().positive('Must be positive'),
  trade_direction: yup.string().required('Trade direction is required')
});

// Main component
const ScenariosPage = () => {
  // State for managing tabs
  const [tabValue, setTabValue] = useState(0);
  const [templates, setTemplates] = useState([]);
  const [scenarios, setScenarios] = useState([]);
  const [isTemplateDialogOpen, setIsTemplateDialogOpen] = useState(false);
  const [isScenarioDialogOpen, setIsScenarioDialogOpen] = useState(false);
  const [editingTemplateId, setEditingTemplateId] = useState(null);
  const [editingScenarioId, setEditingScenarioId] = useState(null);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success'
  });

  // Formik for template form
  const templateFormik = useFormik({
    initialValues: {
      template_name: '',
      entry_price: '',
      stop_loss: '',
      take_profit: '',
      risk_reward_ratio: '',
      position_size: '',
      trade_direction: 'long'
    },
    validationSchema: templateValidationSchema,
    onSubmit: (values) => {
      handleTemplateSubmit(values);
    }
  });

  // Scenario validation schema
  const scenarioValidationSchema = yup.object({
    scenario_name: yup.string().required('Scenario name is required'),
    template_id: yup.number().required('Template is required'),
    market_condition: yup.string().required('Market condition is required'),
    entry_notes: yup.string(),
    exit_notes: yup.string(),
    risk_notes: yup.string()
  });

  // Formik for scenario form
  const scenarioFormik = useFormik({
    initialValues: {
      scenario_name: '',
      template_id: '',
      market_condition: '',
      entry_notes: '',
      exit_notes: '',
      risk_notes: ''
    },
    validationSchema: scenarioValidationSchema,
    onSubmit: (values) => {
      handleScenarioSubmit(values);
    }
  });

  // Fetch data on component mount
  useEffect(() => {
    fetchTemplates();
    fetchScenarios();
  }, []);

  // Fetch templates from API
  const fetchTemplates = async () => {
    try {
      // Replace with your actual API call
      const response = await fetch('/api/templates');
      const data = await response.json();
      setTemplates(data);
    } catch (error) {
      console.error('Error fetching templates:', error);
      setSnackbar({
        open: true,
        message: 'Failed to load templates',
        severity: 'error'
      });
    }
  };

  // Fetch scenarios from API
  const fetchScenarios = async () => {
    try {
      // Replace with your actual API call
      const response = await fetch('/api/scenarios');
      const data = await response.json();
      setScenarios(data);
    } catch (error) {
      console.error('Error fetching scenarios:', error);
      setSnackbar({
        open: true,
        message: 'Failed to load scenarios',
        severity: 'error'
      });
    }
  };

  // Handle template form submission
  const handleTemplateSubmit = async (values) => {
    try {
      if (editingTemplateId) {
        // Update existing template
        await fetch(`/api/templates/${editingTemplateId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(values),
        });
        setSnackbar({
          open: true,
          message: 'Template updated successfully',
          severity: 'success'
        });
      } else {
        // Create new template
        await fetch('/api/templates', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(values),
        });
        setSnackbar({
          open: true,
          message: 'Template created successfully',
          severity: 'success'
        });
      }
      
      // Refresh templates and close dialog
      fetchTemplates();
      handleCloseTemplateDialog();
    } catch (error) {
      console.error('Error saving template:', error);
      setSnackbar({
        open: true,
        message: 'Failed to save template',
        severity: 'error'
      });
    }
  };

  // Handle scenario form submission
  const handleScenarioSubmit = async (values) => {
    try {
      if (editingScenarioId) {
        // Update existing scenario
        await fetch(`/api/scenarios/${editingScenarioId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(values),
        });
        setSnackbar({
          open: true,
          message: 'Scenario updated successfully',
          severity: 'success'
        });
      } else {
        // Create new scenario
        await fetch('/api/scenarios', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(values),
        });
        setSnackbar({
          open: true,
          message: 'Scenario created successfully',
          severity: 'success'
        });
      }
      
      // Refresh scenarios and close dialog
      fetchScenarios();
      handleCloseScenarioDialog();
    } catch (error) {
      console.error('Error saving scenario:', error);
      setSnackbar({
        open: true,
        message: 'Failed to save scenario',
        severity: 'error'
      });
    }
  };

  // Open template dialog for editing
  const handleEditTemplate = (template) => {
    setEditingTemplateId(template.id);
    templateFormik.setValues({
      template_name: template.template_name,
      entry_price: template.entry_price,
      stop_loss: template.stop_loss,
      take_profit: template.take_profit,
      risk_reward_ratio: template.risk_reward_ratio,
      position_size: template.position_size,
      trade_direction: template.trade_direction
    });
    setIsTemplateDialogOpen(true);
  };

  // Open template dialog for adding
  const handleAddTemplate = () => {
    setEditingTemplateId(null);
    templateFormik.resetForm();
    setIsTemplateDialogOpen(true);
  };

  // Close template dialog
  const handleCloseTemplateDialog = () => {
    setIsTemplateDialogOpen(false);
  };

  // Open scenario dialog for editing
  const handleEditScenario = (scenario) => {
    setEditingScenarioId(scenario.id);
    scenarioFormik.setValues({
      scenario_name: scenario.scenario_name,
      template_id: scenario.template_id,
      market_condition: scenario.market_condition,
      entry_notes: scenario.entry_notes,
      exit_notes: scenario.exit_notes,
      risk_notes: scenario.risk_notes
    });
    setIsScenarioDialogOpen(true);
  };

  // Open scenario dialog for adding
  const handleAddScenario = () => {
    setEditingScenarioId(null);
    scenarioFormik.resetForm();
    setIsScenarioDialogOpen(true);
  };

  // Close scenario dialog
  const handleCloseScenarioDialog = () => {
    setIsScenarioDialogOpen(false);
  };

  // Delete template
  const handleDeleteTemplate = async (id) => {
    if (window.confirm('Are you sure you want to delete this template?')) {
      try {
        await fetch(`/api/templates/${id}`, { method: 'DELETE' });
        fetchTemplates();
        setSnackbar({
          open: true,
          message: 'Template deleted successfully',
          severity: 'success'
        });
      } catch (error) {
        console.error('Error deleting template:', error);
        setSnackbar({
          open: true,
          message: 'Failed to delete template',
          severity: 'error'
        });
      }
    }
  };

  // Delete scenario
  const handleDeleteScenario = async (id) => {
    if (window.confirm('Are you sure you want to delete this scenario?')) {
      try {
        await fetch(`/api/scenarios/${id}`, { method: 'DELETE' });
        fetchScenarios();
        setSnackbar({
          open: true,
          message: 'Scenario deleted successfully',
          severity: 'success'
        });
      } catch (error) {
        console.error('Error deleting scenario:', error);
        setSnackbar({
          open: true,
          message: 'Failed to delete scenario',
          severity: 'error'
        });
      }
    }
  };

  // Handle tab change
  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  // Close snackbar
  const handleCloseSnackbar = () => {
    setSnackbar({
      ...snackbar,
      open: false
    });
  };

  return (
    <Container maxWidth="lg">
      <Typography variant="h4" component="h1" gutterBottom>
        Trading Scenarios
      </Typography>

      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={tabValue} onChange={handleTabChange}>
          <Tab label="Templates" />
          <Tab label="Scenarios" />
        </Tabs>
      </Box>

      {/* Templates Tab */}
      {tabValue === 0 && (
        <Box>
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={handleAddTemplate}
            >
              Add Template
            </Button>
          </Box>

          <Grid container spacing={3}>
            {templates.map((template) => (
              <Grid item xs={12} md={6} key={template.id}>
                <Card>
                  <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                      <Typography variant="h6">{template.template_name}</Typography>
                      <Box>
                        <IconButton onClick={() => handleEditTemplate(template)}>
                          <EditIcon />
                        </IconButton>
                        <IconButton onClick={() => handleDeleteTemplate(template.id)}>
                          <DeleteIcon />
                        </IconButton>
                      </Box>
                    </Box>
                    <Grid container spacing={2}>
                      <Grid item xs={6}>
                        <Typography variant="body2" color="text.secondary">Direction:</Typography>
                        <Typography variant="body1">{template.trade_direction === 'long' ? 'Long' : 'Short'}</Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="body2" color="text.secondary">Entry Price:</Typography>
                        <Typography variant="body1">${template.entry_price}</Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="body2" color="text.secondary">Stop Loss:</Typography>
                        <Typography variant="body1">${template.stop_loss}</Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="body2" color="text.secondary">Take Profit:</Typography>
                        <Typography variant="body1">${template.take_profit}</Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="body2" color="text.secondary">Risk/Reward:</Typography>
                        <Typography variant="body1">{template.risk_reward_ratio}:1</Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="body2" color="text.secondary">Position Size:</Typography>
                        <Typography variant="body1">{template.position_size} units</Typography>
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>
              </Grid>
            ))}
            {templates.length === 0 && (
              <Grid item xs={12}>
                <Paper sx={{ p: 3, textAlign: 'center' }}>
                  <Typography>No templates found. Create your first template.</Typography>
                </Paper>
              </Grid>
            )}
          </Grid>
        </Box>
      )}

      {/* Scenarios Tab */}
      {tabValue === 1 && (
        <Box>
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={handleAddScenario}
            >
              Add Scenario
            </Button>
          </Box>

          <Grid container spacing={3}>
            {scenarios.map((scenario) => {
              const template = templates.find(t => t.id === scenario.template_id) || {};
              return (
                <Grid item xs={12} key={scenario.id}>
                  <Card>
                    <CardContent>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                        <Typography variant="h6">{scenario.scenario_name}</Typography>
                        <Box>
                          <IconButton onClick={() => handleEditScenario(scenario)}>
                            <EditIcon />
                          </IconButton>
                          <IconButton onClick={() => handleDeleteScenario(scenario.id)}>
                            <DeleteIcon />
                          </IconButton>
                        </Box>
                      </Box>
                      <Grid container spacing={2}>
                        <Grid item xs={12} md={6}>
                          <Typography variant="body2" color="text.secondary">Template:</Typography>
                          <Typography variant="body1">{template.template_name || 'Unknown'}</Typography>
                        </Grid>
                        <Grid item xs={12} md={6}>
                          <Typography variant="body2" color="text.secondary">Market Condition:</Typography>
                          <Typography variant="body1">{scenario.market_condition}</Typography>
                        </Grid>
                        <Grid item xs={12}>
                          <Typography variant="body2" color="text.secondary">Entry Notes:</Typography>
                          <Typography variant="body1">{scenario.entry_notes || 'None'}</Typography>
                        </Grid>
                        <Grid item xs={12}>
                          <Typography variant="body2" color="text.secondary">Exit Notes:</Typography>
                          <Typography variant="body1">{scenario.exit_notes || 'None'}</Typography>
                        </Grid>
                        <Grid item xs={12}>
                          <Typography variant="body2" color="text.secondary">Risk Notes:</Typography>
                          <Typography variant="body1">{scenario.risk_notes || 'None'}</Typography>
                        </Grid>
                      </Grid>
                    </CardContent>
                  </Card>
                </Grid>
              );
            })}
            {scenarios.length === 0 && (
              <Grid item xs={12}>
                <Paper sx={{ p: 3, textAlign: 'center' }}>
                  <Typography>No scenarios found. Create your first scenario.</Typography>
                </Paper>
              </Grid>
            )}
          </Grid>
        </Box>
      )}

      {/* Template Dialog */}
      <Dialog open={isTemplateDialogOpen} onClose={handleCloseTemplateDialog} maxWidth="sm" fullWidth>
        <form onSubmit={templateFormik.handleSubmit}>
          <DialogTitle>
            {editingTemplateId ? 'Edit Template' : 'Create Template'}
          </DialogTitle>
          <DialogContent>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  margin="normal"
                  id="template_name"
                  name="template_name"
                  label="Template Name"
                  value={templateFormik.values.template_name}
                  onChange={templateFormik.handleChange}
                  error={templateFormik.touched.template_name && Boolean(templateFormik.errors.template_name)}
                  helperText={templateFormik.touched.template_name && templateFormik.errors.template_name}
                />
              </Grid>
              <Grid item xs={12}>
                <FormControl fullWidth margin="normal">
                  <InputLabel id="trade-direction-label">Trade Direction</InputLabel>
                  <Select
                    labelId="trade-direction-label"
                    id="trade_direction"
                    name="trade_direction"
                    value={templateFormik.values.trade_direction}
                    onChange={templateFormik.handleChange}
                    label="Trade Direction"
                  >
                    <MenuItem value="long">Long</MenuItem>
                    <MenuItem value="short">Short</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  margin="normal"
                  id="entry_price"
                  name="entry_price"
                  label="Entry Price"
                  type="number"
                  value={templateFormik.values.entry_price}
                  onChange={templateFormik.handleChange}
                  error={templateFormik.touched.entry_price && Boolean(templateFormik.errors.entry_price)}
                  helperText={templateFormik.touched.entry_price && templateFormik.errors.entry_price}
                />
              </Grid>
              <Grid item xs={12} md={6}>
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
              <Grid item xs={12} md={6}>
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
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  margin="normal"
                  id="risk_reward_ratio"
                  name="risk_reward_ratio"
                  label="Risk/Reward Ratio"
                  type="number"
                  value={templateFormik.values.risk_reward_ratio}
                  onChange={templateFormik.handleChange}
                  error={templateFormik.touched.risk_reward_ratio && Boolean(templateFormik.errors.risk_reward_ratio)}
                  helperText={templateFormik.touched.risk_reward_ratio && templateFormik.errors.risk_reward_ratio}
                />
              </Grid>
              <Grid item xs={12}>
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
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseTemplateDialog}>Cancel</Button>
            <Button type="submit" variant="contained">Save</Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Scenario Dialog */}
      <Dialog open={isScenarioDialogOpen} onClose={handleCloseScenarioDialog} maxWidth="md" fullWidth>
        <form onSubmit={scenarioFormik.handleSubmit}>
          <DialogTitle>
            {editingScenarioId ? 'Edit Scenario' : 'Create Scenario'}
          </DialogTitle>
          <DialogContent>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  margin="normal"
                  id="scenario_name"
                  name="scenario_name"
                  label="Scenario Name"
                  value={scenarioFormik.values.scenario_name}
                  onChange={scenarioFormik.handleChange}
                  error={scenarioFormik.touched.scenario_name && Boolean(scenarioFormik.errors.scenario_name)}
                  helperText={scenarioFormik.touched.scenario_name && scenarioFormik.errors.scenario_name}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth margin="normal">
                  <InputLabel id="template-label">Template</InputLabel>
                  <Select
                    labelId="template-label"
                    id="template_id"
                    name="template_id"
                    value={scenarioFormik.values.template_id}
                    onChange={scenarioFormik.handleChange}
                    label="Template"
                    error={scenarioFormik.touched.template_id && Boolean(scenarioFormik.errors.template_id)}
                  >
                    {templates.map((template) => (
                      <MenuItem key={template.id} value={template.id}>
                        {template.template_name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  margin="normal"
                  id="market_condition"
                  name="market_condition"
                  label="Market Condition"
                  value={scenarioFormik.values.market_condition}
                  onChange={scenarioFormik.handleChange}
                  error={scenarioFormik.touched.market_condition && Boolean(scenarioFormik.errors.market_condition)}
                  helperText={scenarioFormik.touched.market_condition && scenarioFormik.errors.market_condition}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  margin="normal"
                  id="entry_notes"
                  name="entry_notes"
                  label="Entry Notes"
                  multiline
                  rows={3}
                  value={scenarioFormik.values.entry_notes}
                  onChange={scenarioFormik.handleChange}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  margin="normal"
                  id="exit_notes"
                  name="exit_notes"
                  label="Exit Notes"
                  multiline
                  rows={3}
                  value={scenarioFormik.values.exit_notes}
                  onChange={scenarioFormik.handleChange}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  margin="normal"
                  id="risk_notes"
                  name="risk_notes"
                  label="Risk Notes"
                  multiline
                  rows={3}
                  value={scenarioFormik.values.risk_notes}
                  onChange={scenarioFormik.handleChange}
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseScenarioDialog}>Cancel</Button>
            <Button type="submit" variant="contained">Save</Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Snackbar for notifications */}
      <Snackbar 
        open={snackbar.open} 
        autoHideDuration={6000} 
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default ScenariosPage;