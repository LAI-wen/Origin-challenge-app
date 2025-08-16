// index.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');

const authRoutes = require('./src/routes/auth.route');
const levelsRoutes = require('./src/routes/levels.route');

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy',
    database: 'connected',
    timestamp: new Date().toISOString()
  });
});

app.get('/', (req, res) => {
  res.send('Hello, welcome to the Challenge App Backend!');
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/levels', levelsRoutes);

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});