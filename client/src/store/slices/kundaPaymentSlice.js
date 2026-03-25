import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../utils/api';

// Async thunks
export const fetchKundaPayments = createAsyncThunk(
    'kundaPayments/fetchKundaPayments',
    async () => {
        const response = await api.get('/api/kunda-payments');
        return response.data;
    }
);

export const fetchRentalPayments = createAsyncThunk(
    'kundaPayment/fetchByRental',
    async (rentalId) => {
        const response = await api.get(`/api/kunda-payments/rental/${rentalId}`);
        return response.data;
    }
);

export const createKundaPayment = createAsyncThunk(
    'kundaPayments/createKundaPayment',
    async (paymentData) => {
        const response = await api.post('/api/kunda-payments', paymentData);
        return response.data;
    }
);

export const updateKundaPayment = createAsyncThunk(
    'kundaPayments/updateKundaPayment',
    async ({ id, paymentData }) => {
        const response = await api.put(`/api/kunda-payments/${id}`, paymentData);
        return response.data;
    }
);

export const deleteKundaPayment = createAsyncThunk(
    'kundaPayments/deleteKundaPayment',
    async (id) => {
        await api.delete(`/api/kunda-payments/${id}`);
        return id;
    }
);

export const fetchCurrentMonthStatus = createAsyncThunk(
    'kundaPayments/fetchCurrentMonthStatus',
    async () => {
        const response = await api.get('/api/kunda-payments/current-month-status');
        return response.data;
    }
);

const initialState = {
    payments: [],
    rentalPayments: {},
    currentMonthStatus: {
        totalKundas: 0,
        totalAmount: 0,
        paid: 0,
        pending: 0,
        overdue: 0
    },
    loading: false,
    error: null,
    selectedPayment: null
};

const kundaPaymentSlice = createSlice({
    name: 'kundaPayments',
    initialState,
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
            .addCase(fetchKundaPayments.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchKundaPayments.fulfilled, (state, action) => {
                state.loading = false;
                state.payments = action.payload;
            })
            .addCase(fetchKundaPayments.rejected, (state, action) => {
                state.loading = false;
                state.error = action.error.message;
            })
            // Fetch rental payments
            .addCase(fetchRentalPayments.fulfilled, (state, action) => {
                if (action.payload.length > 0) {
                    const rentalId = action.payload[0].rental._id;
                    state.rentalPayments[rentalId] = action.payload;
                }
            })
            // Create payment
            .addCase(createKundaPayment.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(createKundaPayment.fulfilled, (state, action) => {
                state.loading = false;
                state.payments.unshift(action.payload);
                const rentalId = action.payload.rental._id;
                if (state.rentalPayments[rentalId]) {
                    state.rentalPayments[rentalId].unshift(action.payload);
                }
            })
            .addCase(createKundaPayment.rejected, (state, action) => {
                state.loading = false;
                state.error = action.error.message;
            })
            // Update payment
            .addCase(updateKundaPayment.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(updateKundaPayment.fulfilled, (state, action) => {
                state.loading = false;
                const index = state.payments.findIndex(p => p._id === action.payload._id);
                if (index !== -1) {
                    state.payments[index] = action.payload;
                }
                const rentalId = action.payload.rental._id;
                if (state.rentalPayments[rentalId]) {
                    const rentalIndex = state.rentalPayments[rentalId].findIndex(p => p._id === action.payload._id);
                    if (rentalIndex !== -1) {
                        state.rentalPayments[rentalId][rentalIndex] = action.payload;
                    }
                }
            })
            .addCase(updateKundaPayment.rejected, (state, action) => {
                state.loading = false;
                state.error = action.error.message;
            })
            // Delete payment
            .addCase(deleteKundaPayment.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(deleteKundaPayment.fulfilled, (state, action) => {
                state.loading = false;
                state.payments = state.payments.filter(p => p._id !== action.payload);
                // Remove from rentalPayments if exists
                Object.keys(state.rentalPayments).forEach(rentalId => {
                    state.rentalPayments[rentalId] = state.rentalPayments[rentalId].filter(p => p._id !== action.payload);
                });
            })
            .addCase(deleteKundaPayment.rejected, (state, action) => {
                state.loading = false;
                state.error = action.error.message;
            })
            // Fetch current month status
            .addCase(fetchCurrentMonthStatus.fulfilled, (state, action) => {
                state.currentMonthStatus = action.payload;
            });
    }
});

export const { setSelectedPayment, clearSelectedPayment } = kundaPaymentSlice.actions;
export default kundaPaymentSlice.reducer; 