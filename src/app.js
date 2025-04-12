const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
const authRoutes = require('./routes/authRoutes');
const accountRoutes = require('./routes/accountRoutes');
const templateRoutes = require('./routes/templateRoutes');
const scenarioRoutes = require('./routes/scenarioRoutes');
const simulationRoutes = require('./routes/simulationRoutes');
const calculatorRoutes = require('./routes/calculatorRoutes');

app.use('/api/auth', authRoutes);
app.use('/api/accounts', accountRoutes);
app.use('/api/templates', templateRoutes);
app.use('/api/scenarios', scenarioRoutes);
app.use('/api/simulations', simulationRoutes);
app.use('/api/calculator', calculatorRoutes);

// Basic route
app.get('/', (req, res) => {
  res.json({ message: 'Gold Trading Journal API' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});