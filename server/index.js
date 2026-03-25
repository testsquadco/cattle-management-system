const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const morgan = require('morgan');
require('dotenv').config();

// Import routes
const authRouter = require('./routes/auth');
const cattleRouter = require('./routes/cattle');
const categoryRouter = require('./routes/categories');
const expenseRouter = require('./routes/expenses');
const custodyPaymentRouter = require('./routes/custodyPayments');
const kundaRentalsRouter = require('./routes/kundaRentals');
const kundaPaymentsRouter = require('./routes/kundaPayments');
const weightsRouter = require('./routes/weights');
const seasonsRouter = require('./routes/seasons');

// Create Express app
const app = express();

// Middleware
app.use(cors({
  origin: [process.env.CLIENT_URL, 'http://localhost:3000'].filter(Boolean),
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
// Handle preflight requests for all routes
app.options('*', cors());
app.use(express.json());
app.use(morgan('dev'));

// MongoDB connection options
const mongooseOptions = {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    serverSelectionTimeoutMS: 5000, // Timeout after 5s instead of 30s
    socketTimeoutMS: 45000, // Close sockets after 45s of inactivity
    family: 4 // Use IPv4, skip trying IPv6
};

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/cattle-expense-tracker', mongooseOptions)
    .then(() => {
        console.log('Connected to MongoDB');
        // Start server only after successful database connection
        const PORT = process.env.PORT || 5000;
        app.listen(PORT, () => {
            console.log(`Server running on port ${PORT}`);
        });
    })
    .catch(err => {
        console.error('MongoDB connection error:', err);
        process.exit(1); // Exit if cannot connect to database
    });

// Routes
app.use('/api/auth', authRouter);
app.use('/api/cattle', cattleRouter);
app.use('/api/categories', categoryRouter);
app.use('/api/expenses', expenseRouter);
app.use('/api/custody-payments', custodyPaymentRouter);
app.use('/api/kunda-rentals', kundaRentalsRouter);
app.use('/api/kunda-payments', kundaPaymentsRouter);
app.use('/api/weights', weightsRouter);
app.use('/api/seasons', seasonsRouter);

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
            custodyPayments: '/api/custody-payments',
            seasons: '/api/seasons'
        }
    });
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ 
        message: 'Something went wrong!',
        error: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
    });
}); 