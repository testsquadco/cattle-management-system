import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../utils/api';

// Async thunks
export const fetchKundaRentals = createAsyncThunk(
    'kundaRental/fetchAll',
    async () => {
        const response = await api.get('/api/kunda-rentals');
        return response.data;
    }
);

export const fetchActiveRentals = createAsyncThunk(
    'kundaRental/fetchActive',
    async () => {
        const response = await api.get('/api/kunda-rentals/active');
        return response.data;
    }
);

export const fetchRentalSummary = createAsyncThunk(
    'kundaRental/fetchSummary',
    async () => {
        const response = await api.get('/api/kunda-rentals/summary');
        return response.data;
    }
);

export const fetchMonthlySummary = createAsyncThunk(
    'kundaRental/fetchMonthlySummary',
    async ({ year, month }) => {
        const response = await api.get('/api/kunda-rentals/monthly-summary', {
            params: { year, month }
        });
        return response.data;
    }
);

export const createKundaRental = createAsyncThunk(
    'kundaRental/create',
    async (rentalData) => {
        const response = await api.post('/api/kunda-rentals', rentalData);
        return response.data;
    }
);

export const updateKundaRental = createAsyncThunk(
    'kundaRental/update',
    async ({ id, rentalData }) => {
        const response = await api.put(`/api/kunda-rentals/${id}`, rentalData);
        return response.data;
    }
);

export const deleteKundaRental = createAsyncThunk(
    'kundaRental/delete',
    async (id) => {
        await api.delete(`/api/kunda-rentals/${id}`);
        return id;
    }
);

export const fetchCurrentMonthStatus = createAsyncThunk(
    'kundaRental/fetchCurrentMonthStatus',
    async (selectedMonth = new Date(), { rejectWithValue }) => {
        try {
            // Create start and end dates for the selected month
            const startDate = new Date(selectedMonth.getFullYear(), selectedMonth.getMonth(), 1);
            const endDate = new Date(selectedMonth.getFullYear(), selectedMonth.getMonth() + 1, 0);
            
            const response = await api.get('/api/kunda-rentals/current-month-status', {
                params: {
                    startDate: startDate.toISOString(),
                    endDate: endDate.toISOString()
                }
            });
            return response.data;
        } catch (error) {
            return rejectWithValue(error.response?.data || 'Failed to fetch current month status');
        }
    }
);

const kundaRentalSlice = createSlice({
    name: 'kundaRental',
    initialState: {
        rentals: [],
        activeRentals: [],
        summary: {
            totalActiveRentals: 0,
            totalKundasRented: 0,
            totalMonthlyIncome: 0,
            averagePricePerKunda: 0
        },
        currentMonthStatus: {
            totalKundasRented: 0,
            totalAmount: 0,
            paid: 0,
            pending: 0,
            overdue: 0
        },
        loading: false,
        error: null,
        selectedRental: null
    },
    reducers: {
        setSelectedRental: (state, action) => {
            state.selectedRental = action.payload;
        },
        clearSelectedRental: (state) => {
            state.selectedRental = null;
        }
    },
    extraReducers: (builder) => {
        builder
            // Fetch all rentals
            .addCase(fetchKundaRentals.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchKundaRentals.fulfilled, (state, action) => {
                state.loading = false;
                state.rentals = action.payload;
            })
            .addCase(fetchKundaRentals.rejected, (state, action) => {
                state.loading = false;
                state.error = action.error.message;
            })
            // Fetch active rentals
            .addCase(fetchActiveRentals.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchActiveRentals.fulfilled, (state, action) => {
                state.loading = false;
                state.activeRentals = action.payload;
            })
            .addCase(fetchActiveRentals.rejected, (state, action) => {
                state.loading = false;
                state.error = action.error.message;
            })
            // Fetch summary
            .addCase(fetchRentalSummary.fulfilled, (state, action) => {
                state.summary = action.payload;
            })
            // Create rental
            .addCase(createKundaRental.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(createKundaRental.fulfilled, (state, action) => {
                state.loading = false;
                state.rentals.unshift(action.payload);
                if (action.payload.isActive) {
                    state.activeRentals.unshift(action.payload);
                }
            })
            .addCase(createKundaRental.rejected, (state, action) => {
                state.loading = false;
                state.error = action.error.message;
            })
            // Update rental
            .addCase(updateKundaRental.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(updateKundaRental.fulfilled, (state, action) => {
                state.loading = false;
                const index = state.rentals.findIndex(r => r._id === action.payload._id);
                if (index !== -1) {
                    state.rentals[index] = action.payload;
                }
                const activeIndex = state.activeRentals.findIndex(r => r._id === action.payload._id);
                if (action.payload.isActive && activeIndex === -1) {
                    state.activeRentals.push(action.payload);
                } else if (!action.payload.isActive && activeIndex !== -1) {
                    state.activeRentals.splice(activeIndex, 1);
                }
            })
            .addCase(updateKundaRental.rejected, (state, action) => {
                state.loading = false;
                state.error = action.error.message;
            })
            // Delete rental
            .addCase(deleteKundaRental.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(deleteKundaRental.fulfilled, (state, action) => {
                state.loading = false;
                state.rentals = state.rentals.filter(r => r._id !== action.payload);
                state.activeRentals = state.activeRentals.filter(r => r._id !== action.payload);
            })
            .addCase(deleteKundaRental.rejected, (state, action) => {
                state.loading = false;
                state.error = action.error.message;
            })
            // Fetch current month status
            .addCase(fetchCurrentMonthStatus.fulfilled, (state, action) => {
                state.currentMonthStatus = action.payload;
            })
    }
});

export const { setSelectedRental, clearSelectedRental } = kundaRentalSlice.actions;
export default kundaRentalSlice.reducer; 