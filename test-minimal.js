// test-minimal.js
const express = require('express');
const app = express();

app.use(express.json());

app.get('/', (req, res) => {
  res.json({ message: 'Test server' });
});

app.post('/api/auth/register', (req, res) => {
  res.json({ message: 'Register endpoint works', body: req.body });
});

const PORT = 5000;
app.listen(PORT, () => {
  console.log(`Test server running on port ${PORT}`);
});