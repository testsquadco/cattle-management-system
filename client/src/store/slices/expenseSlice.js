import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../utils/api';

export const fetchExpenses = createAsyncThunk(
  'expenses/fetchExpenses',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/api/expenses');
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);

export const createExpense = createAsyncThunk(
  'expenses/createExpense',
  async (expenseData, { rejectWithValue }) => {
    try {
      const response = await api.post('/api/expenses', expenseData);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);

export const updateExpense = createAsyncThunk(
  'expenses/updateExpense',
  async ({ id, data }, { rejectWithValue }) => {
    try {
      const response = await api.put(`/api/expenses/${id}`, data);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);

export const deleteExpense = createAsyncThunk(
  'expenses/deleteExpense',
  async (id, { rejectWithValue }) => {
    try {
      await api.delete(`/api/expenses/${id}`);
      return id;
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);

export const fetchExpenseSummary = createAsyncThunk(
  'expenses/fetchExpenseSummary',
  async (filters = {}, { rejectWithValue }) => {
    try {
      const response = await api.get('/api/expenses/summary', { params: filters });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || 'Failed to fetch expense summary');
    }
  }
);

export const fetchExpensesByCattle = createAsyncThunk(
  'expenses/fetchExpensesByCattle',
  async (cattleId, { rejectWithValue }) => {
    try {
      const response = await api.get(`/api/expenses/cattle/${cattleId}`);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);

const initialState = {
  expenses: [],
  summary: {
    totalExpenses: 0,
    averageExpense: 0,
    totalFarmSetupExpenses: 0,
    averagePerCattle: 0,
    averagePerCattleMonthly: 0,
    cattleCount: 0
  },
  loading: false,
  error: null,
};

const expenseSlice = createSlice({
  name: 'expenses',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchExpenses.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchExpenses.fulfilled, (state, action) => {
        state.loading = false;
        state.expenses = action.payload;
      })
      .addCase(fetchExpenses.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message || 'Failed to fetch expenses';
      })
      .addCase(createExpense.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createExpense.fulfilled, (state, action) => {
        state.loading = false;
        state.expenses.push(action.payload);
      })
      .addCase(createExpense.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message || 'Failed to create expense';
      })
      .addCase(updateExpense.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateExpense.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.expenses.findIndex((e) => e._id === action.payload._id);
        if (index !== -1) {
          state.expenses[index] = action.payload;
        }
      })
      .addCase(updateExpense.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message || 'Failed to update expense';
      })
      .addCase(deleteExpense.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteExpense.fulfilled, (state, action) => {
        state.loading = false;
        state.expenses = state.expenses.filter((e) => e.id !== action.payload);
      })
      .addCase(deleteExpense.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message || 'Failed to delete expense';
      })
      .addCase(fetchExpenseSummary.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchExpenseSummary.fulfilled, (state, action) => {
        state.loading = false;
        state.summary = action.payload;
      })
      .addCase(fetchExpenseSummary.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message || 'Failed to fetch expense summary';
      })
      .addCase(fetchExpensesByCattle.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchExpensesByCattle.fulfilled, (state, action) => {
        state.loading = false;
        state.expenses = action.payload;
      })
      .addCase(fetchExpensesByCattle.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message || 'Failed to fetch expenses for cattle';
      });
  },
});

export const { clearError } = expenseSlice.actions;
export default expenseSlice.reducer; 