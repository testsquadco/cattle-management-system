import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../utils/api';

// Async thunks
export const fetchCustodyPayments = createAsyncThunk(
  'custodyPayment/fetchAll',
  async () => {
    const response = await api.get('/api/custody-payments');
    return response.data;
  }
);

export const createCustodyPayment = createAsyncThunk(
  'custodyPayment/create',
  async (paymentData) => {
    const formattedData = {
      cattle: paymentData.cattle,
      amount: paymentData.amount,
      month: new Date(paymentData.month).toISOString(),
      paymentStatus: paymentData.status,
      receivedBy: paymentData.receivedBy,
      notes: paymentData.notes
    };
    const response = await api.post('/api/custody-payments', formattedData);
    return response.data;
  }
);

export const updateCustodyPayment = createAsyncThunk(
  'custodyPayment/update',
  async ({ id, paymentData }) => {
    const formattedData = {
      cattle: paymentData.cattle,
      amount: paymentData.amount,
      month: new Date(paymentData.month).toISOString(),
      paymentStatus: paymentData.status,
      receivedBy: paymentData.receivedBy,
      notes: paymentData.notes
    };
    const response = await api.put(`/api/custody-payments/${id}`, formattedData);
    return response.data;
  }
);

export const deleteCustodyPayment = createAsyncThunk(
  'custodyPayment/delete',
  async (id) => {
    await api.delete(`/api/custody-payments/${id}`);
    return id;
  }
);

const custodyPaymentSlice = createSlice({
  name: 'custodyPayment',
  initialState: {
    payments: [],
    loading: false,
    error: null,
    selectedPayment: null
  },
  reducers: {
    setSelectedPayment: (state, action) => {
      state.selectedPayment = action.payload;
    },
    clearSelectedPayment: (state) => {
      state.selectedPayment = null;
    }
  },
  extraReducers: (builder) => {
    builder
      // Fetch payments
      .addCase(fetchCustodyPayments.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchCustodyPayments.fulfilled, (state, action) => {
        state.loading = false;
        state.payments = action.payload;
      })
      .addCase(fetchCustodyPayments.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      })
      // Create payment
      .addCase(createCustodyPayment.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createCustodyPayment.fulfilled, (state, action) => {
        state.loading = false;
        state.payments.unshift(action.payload);
      })
      .addCase(createCustodyPayment.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      })
      // Update payment
      .addCase(updateCustodyPayment.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateCustodyPayment.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.payments.findIndex(p => p._id === action.payload._id);
        if (index !== -1) {
          state.payments[index] = action.payload;
        }
      })
      .addCase(updateCustodyPayment.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      })
      // Delete payment
      .addCase(deleteCustodyPayment.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteCustodyPayment.fulfilled, (state, action) => {
        state.loading = false;
        state.payments = state.payments.filter(p => p._id !== action.payload);
      })
      .addCase(deleteCustodyPayment.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      });
  }
});

export const { setSelectedPayment, clearSelectedPayment } = custodyPaymentSlice.actions;
export default custodyPaymentSlice.reducer; 