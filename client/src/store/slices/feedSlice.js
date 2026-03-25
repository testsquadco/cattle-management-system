import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../utils/api';

// Async thunks
export const fetchFeedItems = createAsyncThunk(
    'feed/fetchItems',
    async () => {
        const response = await api.get('/api/feed/items');
        return response.data;
    }
);

export const fetchDailyLogs = createAsyncThunk(
    'feed/fetchLogs',
    async ({ startDate, endDate, feedItem, cattle, cattleGroup }) => {
        const response = await api.get('/api/feed/logs', {
            params: { startDate, endDate, feedItem, cattle, cattleGroup }
        });
        return response.data;
    }
);

export const fetchMonthlySummary = createAsyncThunk(
    'feed/fetchMonthlySummary',
    async ({ year, month }) => {
        const response = await api.get('/api/feed/monthly-summary', {
            params: { year, month }
        });
        return response.data;
    }
);

export const fetchTemplates = createAsyncThunk(
    'feed/fetchTemplates',
    async () => {
        const response = await api.get('/api/feed/templates');
        return response.data;
    }
);

export const fetchAnalytics = createAsyncThunk(
    'feed/fetchAnalytics',
    async ({ startDate, endDate, feedItem }) => {
        const response = await api.get('/feed/analytics', {
            params: { startDate, endDate, feedItem }
        });
        return response.data;
    }
);

const initialState = {
    items: {
        data: [],
        loading: false,
        error: null
    },
    logs: {
        data: [],
        loading: false,
        error: null,
        filters: {
            startDate: null,
            endDate: null,
            feedItem: null,
            cattle: null,
            cattleGroup: null
        }
    },
    monthlySummary: {
        data: [],
        loading: false,
        error: null,
        selectedDate: new Date()
    },
    templates: {
        data: [],
        loading: false,
        error: null
    },
    analytics: {
        data: {
            usageData: [],
            costData: [],
            categoryData: [],
            summary: {
                totalQuantity: 0,
                totalCost: 0,
                averageCostPerUnit: 0,
                mostUsedItem: '',
                highestCostItem: ''
            }
        },
        loading: false,
        error: null,
        filters: {
            timeRange: 'month',
            startDate: null,
            endDate: null,
            feedItem: 'all'
        }
    }
};

const feedSlice = createSlice({
    name: 'feed',
    initialState,
    reducers: {
        setLogFilters: (state, action) => {
            state.logs.filters = { ...state.logs.filters, ...action.payload };
        },
        setAnalyticsFilters: (state, action) => {
            state.analytics.filters = { ...state.analytics.filters, ...action.payload };
        },
        setMonthlySummaryDate: (state, action) => {
            state.monthlySummary.selectedDate = action.payload;
        },
        clearFeedErrors: (state) => {
            state.items.error = null;
            state.logs.error = null;
            state.monthlySummary.error = null;
            state.templates.error = null;
            state.analytics.error = null;
        }
    },
    extraReducers: (builder) => {
        // Feed Items
        builder
            .addCase(fetchFeedItems.pending, (state) => {
                state.items.loading = true;
                state.items.error = null;
            })
            .addCase(fetchFeedItems.fulfilled, (state, action) => {
                state.items.loading = false;
                state.items.data = action.payload;
            })
            .addCase(fetchFeedItems.rejected, (state, action) => {
                state.items.loading = false;
                state.items.error = action.error.message;
            });

        // Daily Logs
        builder
            .addCase(fetchDailyLogs.pending, (state) => {
                state.logs.loading = true;
                state.logs.error = null;
            })
            .addCase(fetchDailyLogs.fulfilled, (state, action) => {
                state.logs.loading = false;
                state.logs.data = action.payload;
            })
            .addCase(fetchDailyLogs.rejected, (state, action) => {
                state.logs.loading = false;
                state.logs.error = action.error.message;
            });

        // Monthly Summary
        builder
            .addCase(fetchMonthlySummary.pending, (state) => {
                state.monthlySummary.loading = true;
                state.monthlySummary.error = null;
            })
            .addCase(fetchMonthlySummary.fulfilled, (state, action) => {
                state.monthlySummary.loading = false;
                state.monthlySummary.data = action.payload;
            })
            .addCase(fetchMonthlySummary.rejected, (state, action) => {
                state.monthlySummary.loading = false;
                state.monthlySummary.error = action.error.message;
            });

        // Templates
        builder
            .addCase(fetchTemplates.pending, (state) => {
                state.templates.loading = true;
                state.templates.error = null;
            })
            .addCase(fetchTemplates.fulfilled, (state, action) => {
                state.templates.loading = false;
                state.templates.data = action.payload;
            })
            .addCase(fetchTemplates.rejected, (state, action) => {
                state.templates.loading = false;
                state.templates.error = action.error.message;
            });

        // Analytics
        builder
            .addCase(fetchAnalytics.pending, (state) => {
                state.analytics.loading = true;
                state.analytics.error = null;
            })
            .addCase(fetchAnalytics.fulfilled, (state, action) => {
                state.analytics.loading = false;
                state.analytics.data = action.payload;
            })
            .addCase(fetchAnalytics.rejected, (state, action) => {
                state.analytics.loading = false;
                state.analytics.error = action.error.message;
            });
    }
});

export const {
    setLogFilters,
    setAnalyticsFilters,
    setMonthlySummaryDate,
    clearFeedErrors
} = feedSlice.actions;

export default feedSlice.reducer; 