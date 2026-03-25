import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { ThemeProvider, createTheme, CssBaseline } from '@mui/material';
import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';

// Layouts
import MainLayout from './layouts/MainLayout';
import AuthLayout from './layouts/AuthLayout';

// Pages
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import Dashboard from './pages/Dashboard';
import CattleList from './pages/cattle/CattleList';
import CattleDetail from './pages/cattle/CattleDetail';
import CategoryList from './pages/categories/CategoryList';
import SubcategoryList from './pages/categories/SubcategoryList';
import ExpenseList from './pages/expenses/ExpenseList';
import Reports from './pages/reports/Reports';
import CattleWeightPage from './pages/weights/CattleWeightPage';
import CustodyPayments from './pages/custody/CustodyPayments';
import { fetchUserProfile } from './store/slices/authSlice';
import KundaRentals from './pages/kunda/KundaRentals';
import KundaPayments from './pages/kunda/KundaPayments';
import ProfitnLoss from './pages/ProfitnLoss';
import BreedingReports from './pages/breeding/BreedingReports';
import BreedingHistory from './pages/breeding/BreedingHistory';
import FeedItems from './pages/feed/FeedItems';
import DailyFeedLogs from './pages/feed/DailyFeedLogs';
import MonthlySummary from './pages/feed/MonthlySummary';
import FeedTemplates from './pages/feed/FeedTemplates';
import Analytics from './pages/feed/Analytics';
import { fetchSeasons } from './store/slices/seasonSlice';
import SeasonManagement from './pages/season-management';

// Create theme
const theme = createTheme({
  palette: {
    primary: {
      main: '#4CAF50', // Material Green
      light: '#81C784',
      dark: '#388E3C',
      contrastText: '#fff',
    },
    secondary: {
      main: '#66BB6A', // Lighter Green
      light: '#98EE99',
      dark: '#338A3E',
      contrastText: '#fff',
    },
    background: {
      default: '#F1F8E9', // Very Light Green
      paper: '#FFFFFF',
    },
  },
  components: {
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: '#4CAF50',
          color: '#FFFFFF',
        },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: {
          backgroundColor: '#F1F8E9',
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        contained: {
          backgroundColor: '#4CAF50',
          color: '#FFFFFF',
          '&:hover': {
            backgroundColor: '#388E3C',
          },
        },
      },
    },
  },
});

const PrivateRoute = ({ children }) => {
  const { isAuthenticated, loading } = useSelector((state) => state.auth);
  
  if (loading) {
    return <div>Loading...</div>;
  }
  
  return isAuthenticated ? children : <Navigate to="/login" />;
};

const App = () => {
  const dispatch = useDispatch();
  const { token } = useSelector((state) => state.auth);

  useEffect(() => {
    if (token) {
      dispatch(fetchUserProfile());
      dispatch(fetchSeasons());
    }
  }, [dispatch, token]);

  return (
    <ThemeProvider theme={theme}>
      <LocalizationProvider dateAdapter={AdapterDateFns}>
        <CssBaseline />
        <Router>
          <Routes>
            {/* Auth Routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />

            {/* Protected Routes */}
            <Route
              path="/"
              element={
                <PrivateRoute>
                  <MainLayout />
                </PrivateRoute>
              }
            >
              <Route index element={<Dashboard />} />
              <Route path="cattle">
                <Route index element={<CattleList />} />
                <Route path=":id" element={<CattleDetail />} />
                <Route path=":id/weights" element={<CattleWeightPage />} />
              </Route>
              <Route path="categories">
                <Route index element={<CategoryList />} />
                <Route path=":id/subcategories" element={<SubcategoryList />} />
              </Route>
              <Route path="expenses" element={<ExpenseList />} />
              <Route path="custody-payments" element={<CustodyPayments />} />
              <Route path="reports" element={<Reports />} />
              <Route path="kunda-rentals" element={<KundaRentals />} />
              <Route path="kunda-payments" element={<KundaPayments />} />
              <Route path="profit-loss" element={<ProfitnLoss />} />
              <Route path="breeding">
                <Route index element={<BreedingReports />} />
                <Route path="history" element={<BreedingHistory />} />
              </Route>
              <Route path="feed">
                <Route path="items" element={<FeedItems />} />
                <Route path="logs" element={<DailyFeedLogs />} />
                <Route path="summary" element={<MonthlySummary />} />
                <Route path="templates" element={<FeedTemplates />} />
                <Route path="analytics" element={<Analytics />} />
              </Route>
              <Route path="season-management" element={<SeasonManagement />} />
            </Route>

            {/* Catch all route */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Router>
      </LocalizationProvider>
    </ThemeProvider>
  );
};

export default App;
