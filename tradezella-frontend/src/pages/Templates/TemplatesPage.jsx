// src/pages/Templates/TemplatesPage.jsx
import React, { useState, useEffect } from 'react';
import { 
  Container, Typography, Button, Grid, Card, CardContent, 
  CardActions, IconButton, Dialog, DialogTitle, DialogContent, 
  DialogActions, TextField, Box, CircularProgress, Chip, Paper
} from '@mui/material';
import { 
  Add as AddIcon, 
  Edit as EditIcon, 
  Delete as DeleteIcon, 
  Description as TemplateIcon 
} from '@mui/icons-material';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import templateService from '../../services/templateService';

const TemplatesPage = () => {
  const [templates, setTemplates] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    setIsLoading(true);
    try {
      const data = await templateService.getTemplates();
      setTemplates(data);
      setError('');
    } catch (err) {
      setError(err.message || 'Failed to fetch templates');
    } finally {
      setIsLoading(false);
    }
  };

  const validationSchema = Yup.object({
    template_name: Yup.string().required('Template name is required'),
    market: Yup.string().required('Market is required'),
    setup_type: Yup.string(),
    entry_criteria: Yup.string(),
    exit_criteria: Yup.string(),
    risk_reward_ratio: Yup.number().positive('Must be positive'),
    position_size_rule: Yup.string(),
    notes: Yup.string(),
    tags: Yup.string()
  });

  const formik = useFormik({
    initialValues: {
      template_name: '',
      market: 'Gold',
      setup_type: '',
      entry_criteria: '',
      exit_criteria: '',
      risk_reward_ratio: '',
      position_size_rule: '',
      notes: '',
      tags: ''
    },
    validationSchema,
    onSubmit: async (values, { resetForm }) => {
      try {
        if (editingTemplate) {
          await templateService.updateTemplate(editingTemplate.template_id, values);
        } else {
          await templateService.createTemplate(values);
        }
        resetForm();
        setDialogOpen(false);
        setEditingTemplate(null);
        fetchTemplates();
      } catch (err) {
        setError(err.message || 'Failed to save template');
      }
    }
  });

  const handleAddTemplate = () => {
    formik.resetForm();
    setEditingTemplate(null);
    setDialogOpen(true);
  };

  const handleEditTemplate = (template) => {
    const formValues = {
      template_name: template.template_name,
      market: template.market,
      setup_type: template.setup_type || '',
      entry_criteria: template.entry_criteria || '',
      exit_criteria: template.exit_criteria || '',
      risk_reward_ratio: template.risk_reward_ratio || '',
      position_size_rule: template.position_size_rule || '',
      notes: template.notes || '',
      tags: template.tags || ''
    };
    
    formik.setValues(formValues);
    setEditingTemplate(template);
    setDialogOpen(true);
  };

  const handleDeleteTemplate = async (id) => {
    if (window.confirm('Are you sure you want to delete this template?')) {
      try {
        await templateService.deleteTemplate(id);
        fetchTemplates();
      } catch (err) {
        setError(err.message || 'Failed to delete template');
      }
    }
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" component="h1" gutterBottom>
          Trade Templates
        </Typography>
        <Button 
          variant="contained" 
          color="primary" 
          startIcon={<AddIcon />}
          onClick={handleAddTemplate}
        >
          Add Template
        </Button>
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
          {templates.length === 0 ? (
            <Grid item xs={12}>
              <Typography variant="body1">No templates found. Create your first trade template.</Typography>
            </Grid>
          ) : (
            templates.map((template) => (
              <Grid item xs={12} sm={6} md={4} key={template.template_id}>
                <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                  <CardContent sx={{ flexGrow: 1 }}>
                    <Box display="flex" alignItems="center" mb={2}>
                      <TemplateIcon color="primary" sx={{ mr: 1 }} />
                      <Typography variant="h6" component="h2">
                        {template.template_name}
                      </Typography>
                    </Box>
                    <Box mb={2}>
                      <Chip label={template.market} size="small" color="primary" sx={{ mr: 1 }} />
                      {template.setup_type && (
                        <Chip label={template.setup_type} size="small" sx={{ mr: 1 }} />
                      )}
                    </Box>
                    {template.risk_reward_ratio && (
                      <Typography variant="body2">
                        Risk/Reward: {template.risk_reward_ratio}
                      </Typography>
                    )}
                    {template.position_size_rule && (
                      <Typography variant="body2">
                        Position Size: {template.position_size_rule}
                      </Typography>
                    )}
                    {template.entry_criteria && (
                      <Typography variant="body2" sx={{ mt: 1 }}>
                        <b>Entry:</b> {template.entry_criteria.substring(0, 100)}
                        {template.entry_criteria.length > 100 ? '...' : ''}
                      </Typography>
                    )}
                    {template.tags && (
                      <Box mt={2}>
                        {template.tags.split(',').map((tag, index) => (
                          <Chip 
                            key={index} 
                            label={tag.trim()} 
                            size="small" 
                            variant="outlined"
                            sx={{ mr: 0.5, mb: 0.5 }}
                          />
                        ))}
                      </Box>
                    )}
                  </CardContent>
                  <CardActions>
                    <IconButton 
                      color="primary" 
                      onClick={() => handleEditTemplate(template)}
                      aria-label="edit template"
                    >
                      <EditIcon />
                    </IconButton>
                    <IconButton 
                      color="error" 
                      onClick={() => handleDeleteTemplate(template.template_id)}
                      aria-label="delete template"
                    >
                      <DeleteIcon />
                    </IconButton>
                  </CardActions>
                </Card>
              </Grid>
            ))
          )}
        </Grid>
      )}

      {/* Template Dialog */}
      <Dialog 
        open={dialogOpen} 
        onClose={() => setDialogOpen(false)} 
        maxWidth="md" 
        fullWidth
      >
        <DialogTitle>
          {editingTemplate ? 'Edit Trade Template' : 'Create Trade Template'}
        </DialogTitle>
        <form onSubmit={formik.handleSubmit}>
          <DialogContent>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  margin="normal"
                  id="template_name"
                  name="template_name"
                  label="Template Name"
                  value={formik.values.template_name}
                  onChange={formik.handleChange}
                  error={formik.touched.template_name && Boolean(formik.errors.template_name)}
                  helperText={formik.touched.template_name && formik.errors.template_name}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  margin="normal"
                  id="market"
                  name="market"
                  label="Market"
                  value={formik.values.market}
                  onChange={formik.handleChange}
                  error={formik.touched.market && Boolean(formik.errors.market)}
                  helperText={formik.touched.market && formik.errors.market}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  margin="normal"
                  id="setup_type"
                  name="setup_type"
                  label="Setup Type"
                  value={formik.values.setup_type}
                  onChange={formik.handleChange}
                  error={formik.touched.setup_type && Boolean(formik.errors.setup_type)}
                  helperText={formik.touched.setup_type && formik.errors.setup_type}
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
              // Continuing src/pages/Templates/TemplatesPage.jsx
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  margin="normal"
                  id="position_size_rule"
                  name="position_size_rule"
                  label="Position Size Rule"
                  value={formik.values.position_size_rule}
                  onChange={formik.handleChange}
                  error={formik.touched.position_size_rule && Boolean(formik.errors.position_size_rule)}
                  helperText={formik.touched.position_size_rule && formik.errors.position_size_rule}
                  placeholder="e.g., 2% of account balance"
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  margin="normal"
                  id="entry_criteria"
                  name="entry_criteria"
                  label="Entry Criteria"
                  multiline
                  rows={3}
                  value={formik.values.entry_criteria}
                  onChange={formik.handleChange}
                  error={formik.touched.entry_criteria && Boolean(formik.errors.entry_criteria)}
                  helperText={formik.touched.entry_criteria && formik.errors.entry_criteria}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  margin="normal"
                  id="exit_criteria"
                  name="exit_criteria"
                  label="Exit Criteria"
                  multiline
                  rows={3}
                  value={formik.values.exit_criteria}
                  onChange={formik.handleChange}
                  error={formik.touched.exit_criteria && Boolean(formik.errors.exit_criteria)}
                  helperText={formik.touched.exit_criteria && formik.errors.exit_criteria}
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
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  margin="normal"
                  id="tags"
                  name="tags"
                  label="Tags"
                  value={formik.values.tags}
                  onChange={formik.handleChange}
                  error={formik.touched.tags && Boolean(formik.errors.tags)}
                  helperText={(formik.touched.tags && formik.errors.tags) || "Separate tags with commas"}
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
              {formik.isSubmitting ? <CircularProgress size={24} /> : 'Save Template'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Container>
  );
};

export default TemplatesPage;