require('dotenv').config();
const express = require('express');
const cors = require('cors');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Rest of your code...

// Routes
const authRoutes = require('./routes/authRoutes');
const accountRoutes = require('./routes/accountRoutes');

app.use('/api/auth', authRoutes);
app.use('/api/accounts', accountRoutes);

// Basic route
app.get('/', (req, res) => {
  res.json({ message: 'Gold Trading Journal API' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});