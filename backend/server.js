//backend/server.js
const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

 
dotenv.config();

const app = express();

// CORS MUST come before routes
app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
}));

 
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Test route
app.get('/test', (req, res) => {
  res.json({ message: 'Backend is working!' });
});

// Load database connection
const connectDB = require('./src/config/database');
connectDB();

// Routes
const authRoutes = require('./src/routes/auth');
const ratingRoutes = require('./src/routes/rating');

app.use('/api/auth', authRoutes);
app.use('/api', ratingRoutes);

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Something went wrong!' });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  console.log(`CORS enabled for: http://localhost:3000`);
});