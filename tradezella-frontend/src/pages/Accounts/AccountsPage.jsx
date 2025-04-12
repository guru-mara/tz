// src/pages/Accounts/AccountsPage.jsx
import React, { useState, useEffect } from 'react';
import { 
  Container, Typography, Button, Grid, Card, CardContent, 
  CardActions, IconButton, Dialog, DialogTitle, DialogContent, 
  DialogActions, TextField, Box, CircularProgress
} from '@mui/material';
import { Add as AddIcon, Delete as DeleteIcon, AccountBalance as AccountIcon } from '@mui/icons-material';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import accountService from '../../services/accountService';

const AccountsPage = () => {
  const [accounts, setAccounts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [error, setError] = useState('');

  // Fetch accounts on component mount
  useEffect(() => {
    fetchAccounts();
  }, []);

  const fetchAccounts = async () => {
    setIsLoading(true);
    try {
      const data = await accountService.getAccounts();
      setAccounts(data);
      setError('');
    } catch (err) {
      setError(err.message || 'Failed to fetch accounts');
    } finally {
      setIsLoading(false);
    }
  };

  // Form validation schema
  const validationSchema = Yup.object({
    account_name: Yup.string().required('Account name is required'),
    broker_name: Yup.string().required('Broker name is required'),
    initial_balance: Yup.number()
      .required('Initial balance is required')
      .positive('Balance must be positive'),
    account_type: Yup.string().required('Account type is required')
  });

  // Form handling with formik
  const formik = useFormik({
    initialValues: {
      account_name: '',
      broker_name: '',
      initial_balance: '',
      account_type: 'Gold Trading'
    },
    validationSchema,
    onSubmit: async (values, { resetForm }) => {
      try {
        await accountService.createAccount(values);
        resetForm();
        setIsDialogOpen(false);
        fetchAccounts();
      } catch (err) {
        setError(err.message || 'Failed to create account');
      }
    }
  });

  // Delete account handler
  const handleDeleteAccount = async (id) => {
    if (window.confirm('Are you sure you want to delete this account?')) {
      try {
        await accountService.deleteAccount(id);
        fetchAccounts();
      } catch (err) {
        setError(err.message || 'Failed to delete account');
      }
    }
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" component="h1" gutterBottom>
          Trading Accounts
        </Typography>
        <Button 
          variant="contained" 
          color="primary" 
          startIcon={<AddIcon />}
          onClick={() => setIsDialogOpen(true)}
        >
          Add Account
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
          {accounts.length === 0 ? (
            <Grid item xs={12}>
              <Typography variant="body1">No accounts found. Create your first trading account.</Typography>
            </Grid>
          ) : (
            accounts.map((account) => (
              <Grid item xs={12} sm={6} md={4} key={account.account_id}>
                <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                  <CardContent sx={{ flexGrow: 1 }}>
                    <Box display="flex" alignItems="center" mb={2}>
                      <AccountIcon color="primary" sx={{ mr: 1 }} />
                      <Typography variant="h6" component="h2">
                        {account.account_name}
                      </Typography>
                    </Box>
                    <Typography color="textSecondary" gutterBottom>
                      Broker: {account.broker_name}
                    </Typography>
                    <Typography variant="body2" component="p">
                      Type: {account.account_type}
                    </Typography>
                    <Typography variant="body2" component="p">
                      Initial Balance: ${account.initial_balance.toFixed(2)}
                    </Typography>
                    <Typography variant="body1" component="p" fontWeight="bold" mt={1}>
                      Current Balance: ${account.current_balance.toFixed(2)}
                    </Typography>
                  </CardContent>
                  <CardActions>
                    <IconButton 
                      color="error" 
                      onClick={() => handleDeleteAccount(account.account_id)}
                      aria-label="delete account"
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

      {/* Add Account Dialog */}
      <Dialog open={isDialogOpen} onClose={() => setIsDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Add New Trading Account</DialogTitle>
        <form onSubmit={formik.handleSubmit}>
          <DialogContent>
            <TextField
              fullWidth
              margin="normal"
              id="account_name"
              name="account_name"
              label="Account Name"
              value={formik.values.account_name}
              onChange={formik.handleChange}
              error={formik.touched.account_name && Boolean(formik.errors.account_name)}
              helperText={formik.touched.account_name && formik.errors.account_name}
            />
            <TextField
              fullWidth
              margin="normal"
              id="broker_name"
              name="broker_name"
              label="Broker Name"
              value={formik.values.broker_name}
              onChange={formik.handleChange}
              error={formik.touched.broker_name && Boolean(formik.errors.broker_name)}
              helperText={formik.touched.broker_name && formik.errors.broker_name}
            />
            <TextField
              fullWidth
              margin="normal"
              id="initial_balance"
              name="initial_balance"
              label="Initial Balance"
              type="number"
              value={formik.values.initial_balance}
              onChange={formik.handleChange}
              error={formik.touched.initial_balance && Boolean(formik.errors.initial_balance)}
              helperText={formik.touched.initial_balance && formik.errors.initial_balance}
            />
            <TextField
              fullWidth
              margin="normal"
              id="account_type"
              name="account_type"
              label="Account Type"
              value={formik.values.account_type}
              onChange={formik.handleChange}
              error={formik.touched.account_type && Boolean(formik.errors.account_type)}
              helperText={formik.touched.account_type && formik.errors.account_type}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setIsDialogOpen(false)}>Cancel</Button>
            <Button 
              type="submit" 
              variant="contained" 
              color="primary" 
              disabled={formik.isSubmitting || !formik.isValid}
            >
              {formik.isSubmitting ? <CircularProgress size={24} /> : 'Add Account'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Container>
  );
};

export default AccountsPage;