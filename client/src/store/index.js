import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import cattleReducer from './slices/cattleSlice';
import categoryReducer from './slices/categorySlice';
import expenseReducer from './slices/expenseSlice';
import custodyPaymentReducer from './slices/custodyPaymentSlice';
import kundaRentalReducer from './slices/kundaRentalSlice';
import kundaPaymentReducer from './slices/kundaPaymentSlice';
import custodyIncomeReducer from './slices/custodyIncomeSlice';
import seasonReducer from './slices/seasonSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    cattle: cattleReducer,
    category: categoryReducer,
    expense: expenseReducer,
    custodyPayment: custodyPaymentReducer,
    kundaRental: kundaRentalReducer,
    kundaPayment: kundaPaymentReducer,
    custodyIncome: custodyIncomeReducer,
    season: seasonReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false,
    }),
}); 