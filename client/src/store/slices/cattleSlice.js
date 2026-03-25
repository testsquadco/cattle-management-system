import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../utils/api';

// Async thunks
export const fetchCattle = createAsyncThunk(
  'cattle/fetchCattle',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/api/cattle');
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch cattle');
    }
  }
);

export const fetchCattleById = createAsyncThunk(
  'cattle/fetchCattleById',
  async (id, { rejectWithValue }) => {
    try {
      const response = await api.get(`/api/cattle/${id}`);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch cattle');
    }
  }
);

export const createCattle = createAsyncThunk(
  'cattle/createCattle',
  async (cattleData, { rejectWithValue }) => {
    try {
      const response = await api.post('/api/cattle', cattleData);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to create cattle');
    }
  }
);

export const updateCattle = createAsyncThunk(
  'cattle/updateCattle',
  async ({ id, formData }, { rejectWithValue }) => {
    try {
      const response = await api.put(`/api/cattle/${id}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update cattle');
    }
  }
);

export const deleteCattle = createAsyncThunk(
  'cattle/deleteCattle',
  async (id, { rejectWithValue }) => {
    try {
      await api.delete(`/api/cattle/${id}`);
      return id;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to delete cattle');
    }
  }
);

// Initial state
const initialState = {
  cattle: [],
  selectedCattle: null,
  loading: false,
  error: null,
};

// Slice
const cattleSlice = createSlice({
  name: 'cattle',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    clearSelectedCattle: (state) => {
      state.selectedCattle = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch all cattle
      .addCase(fetchCattle.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchCattle.fulfilled, (state, action) => {
        state.loading = false;
        state.cattle = action.payload;
      })
      .addCase(fetchCattle.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message || 'Failed to fetch cattle';
      })
      // Fetch cattle by ID
      .addCase(fetchCattleById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchCattleById.fulfilled, (state, action) => {
        state.loading = false;
        state.selectedCattle = action.payload;
      })
      .addCase(fetchCattleById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message || 'Failed to fetch cattle details';
      })
      // Create cattle
      .addCase(createCattle.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createCattle.fulfilled, (state, action) => {
        state.loading = false;
        state.cattle.push(action.payload);
      })
      .addCase(createCattle.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message || 'Failed to create cattle';
      })
      // Update cattle
      .addCase(updateCattle.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateCattle.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.cattle.findIndex((c) => c._id === action.payload._id);
        if (index !== -1) {
          state.cattle[index] = action.payload;
        }
        if (state.selectedCattle?._id === action.payload._id) {
          state.selectedCattle = action.payload;
        }
      })
      .addCase(updateCattle.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message || 'Failed to update cattle';
      })
      // Delete cattle
      .addCase(deleteCattle.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteCattle.fulfilled, (state, action) => {
        state.loading = false;
        state.cattle = state.cattle.filter((c) => c._id !== action.payload);
        if (state.selectedCattle?._id === action.payload) {
          state.selectedCattle = null;
        }
      })
      .addCase(deleteCattle.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message || 'Failed to delete cattle';
      });
  },
});

export const { clearError, clearSelectedCattle } = cattleSlice.actions;

export default cattleSlice.reducer; 