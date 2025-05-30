const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Serve static files from the uploads directory
const uploadsPath = path.join(__dirname, 'public', 'uploads');
app.use('/uploads', express.static(uploadsPath));

app.use('/api/auth', require('./routes/auth'));
app.use('/api/users', require('./routes/users'));
app.use('/api/cattle', require('./routes/cattle'));
app.use('/api/categories', require('./routes/categories'));
app.use('/api/expenses', require('./routes/expenses'));
app.use('/api/weights', require('./routes/weights'));

const kundaRentalsRouter = require('./routes/kundaRentals');
const kundaPaymentsRouter = require('./routes/kundaPayments');

app.use('/api/kunda-rentals', kundaRentalsRouter);
app.use('/api/kunda-payments', kundaPaymentsRouter);

module.exports = app;