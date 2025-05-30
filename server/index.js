const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Create Express app
const app = express();

// Middleware
app.use(cors({
  origin: 'http://localhost:3000',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));
app.use(express.json());

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/cattle-expense-tracker', {
    useNewUrlParser: true,
    useUnifiedTopology: true
})
.then(() => console.log('Connected to MongoDB'))
.catch(err => console.error('MongoDB connection error:', err));

// Routes
app.use('/api/cattle', require('./routes/cattle'));
app.use('/api/categories', require('./routes/categories'));
app.use('/api/expenses', require('./routes/expenses'));
app.use('/api/auth', require('./routes/auth'));
app.use('/api/weights', require('./routes/weights'));
app.use('/api/custody-payments', require('./routes/custodyIncome'));
app.use('/api/kunda-rentals', require('./routes/kundaRentals'));

// Root route
app.get('/', (req, res) => {
    res.json({
        message: 'Cattle Expense Tracker API',
        endpoints: {
            auth: '/api/auth',
            cattle: '/api/cattle',
            categories: '/api/categories',
            expenses: '/api/expenses',
            weights: '/api/weights',
            custodyPayments: '/api/custody-payments'
        }
    });
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ message: 'Something went wrong!' });
});

// Start server
const PORT = 8080; // Using port 8080 instead
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`);
}); 