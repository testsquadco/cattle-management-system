import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../utils/api';

export const fetchCurrentMonthStatus = createAsyncThunk(
    'custodyIncome/fetchCurrentMonthStatus',
    async (_, { rejectWithValue }) => {
        try {
            const response = await api.get('/api/custody-income/current-month-status');
            return response.data;
        } catch (error) {
            return rejectWithValue(error.response?.data || 'Failed to fetch current month status');
        }
    }
);

const custodyIncomeSlice = createSlice({
    name: 'custodyIncome',
    initialState: {
        currentMonthStatus: {
            totalCattle: 0,
            totalAmount: 0,
            paid: 0,
            pending: 0,
            overdue: 0,
            month: null
        },
        loading: false,
        error: null
    },
    reducers: {
        clearError: (state) => {
            state.error = null;
        }
    },
    extraReducers: (builder) => {
        builder
            .addCase(fetchCurrentMonthStatus.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchCurrentMonthStatus.fulfilled, (state, action) => {
                state.loading = false;
                state.currentMonthStatus = action.payload;
            })
            .addCase(fetchCurrentMonthStatus.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            });
    }
});

export const { clearError } = custodyIncomeSlice.actions;
export default custodyIncomeSlice.reducer; 