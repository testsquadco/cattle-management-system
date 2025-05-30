# Cattle Expense Tracker

A comprehensive web application for tracking cattle expenses, managing cattle information, and generating detailed reports for cattle farm operations.

## Features

- Add and manage cattle information
- Track various types of expenses
- Create custom expense categories
- Generate detailed reports and analytics
- Export reports to Excel/PDF
- User authentication and authorization

## Tech Stack

- Frontend: React.js with Material-UI
- Backend: Node.js with Express
- Database: MongoDB
- Authentication: JWT

## Prerequisites

- Node.js (v14 or higher)
- MongoDB
- npm or yarn

## Setup Instructions

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   cd client
   npm install
   cd ..
   ```

3. Create a .env file in the root directory with the following variables:
   ```
   MONGODB_URI=your_mongodb_connection_string
   JWT_SECRET=your_jwt_secret
   PORT=5000
   ```

4. Start the development servers:
   ```bash
   # Run both frontend and backend
   npm run dev:full

   # Run only backend
   npm run dev

   # Run only frontend
   npm run client
   ```

## Project Structure

```
cattle-expense-tracker/
├── client/                 # React frontend
├── server/                 # Node.js backend
│   ├── models/            # Database models
│   ├── routes/            # API routes
│   ├── controllers/       # Business logic
│   └── middleware/        # Custom middleware
└── package.json
```

## API Documentation

The API documentation will be available at `/api-docs` when running the server.

## License

MIT 