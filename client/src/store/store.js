import { configureStore } from '@reduxjs/toolkit';
import cattleReducer from './slices/cattleSlice';
import expenseReducer from './slices/expenseSlice';
import kundaReducer from './slices/kundaSlice';
import breedingReducer from './slices/breedingSlice';
import authReducer from './slices/authSlice';
import categoryReducer from './slices/categorySlice';
import custodyIncomeReducer from './slices/custodyIncomeSlice';
import kundaRentalReducer from './slices/kundaRentalSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    cattle: cattleReducer,
    expense: expenseReducer,
    kunda: kundaReducer,
    breeding: breedingReducer,
    category: categoryReducer,
    custodyIncome: custodyIncomeReducer,
    kundaRental: kundaRentalReducer,
  },
});

export default store; 