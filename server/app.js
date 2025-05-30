const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const morgan = require('morgan');
require('dotenv').config();

const app = express();

// Import routes
const authRouter = require('./routes/auth');
const cattleRouter = require('./routes/cattle');
const categoryRouter = require('./routes/categories');
const expenseRouter = require('./routes/expenses');
const custodyPaymentRouter = require('./routes/custodyPayments');
const kundaRentalsRouter = require('./routes/kundaRentals');
const kundaPaymentsRouter = require('./routes/kundaPayments');
const weightsRouter = require('./routes/weights');

// Middleware
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
})
.then(() => console.log('Connected to MongoDB'))
.catch(err => console.error('MongoDB connection error:', err));

// Routes
app.use('/api/auth', authRouter);
app.use('/api/cattle', cattleRouter);
app.use('/api/categories', categoryRouter);
app.use('/api/expenses', expenseRouter);
app.use('/api/custody-payments', custodyPaymentRouter);
app.use('/api/kunda-rentals', kundaRentalsRouter);
app.use('/api/kunda-payments', kundaPaymentsRouter);
app.use('/api/weights', weightsRouter);

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ 
        message: 'Something broke!',
        error: err.message 
    });
});

// Start server
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
}); 