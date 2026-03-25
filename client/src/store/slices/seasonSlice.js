import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../utils/api';

export const fetchSeasons = createAsyncThunk('season/fetchSeasons', async (_, { rejectWithValue }) => {
  try {
    const res = await api.get('/api/seasons');
    return res.data;
  } catch (err) {
    return rejectWithValue(err.response?.data || err.message);
  }
});

export const createSeason = createAsyncThunk('season/createSeason', async (data, { rejectWithValue }) => {
  try {
    const res = await api.post('/api/seasons', data);
    return res.data;
  } catch (err) {
    return rejectWithValue(err.response?.data || err.message);
  }
});

export const closeSeason = createAsyncThunk('season/closeSeason', async (id, { rejectWithValue }) => {
  try {
    const res = await api.put(`/api/seasons/${id}/close`);
    return res.data;
  } catch (err) {
    return rejectWithValue(err.response?.data || err.message);
  }
});

export const carryForwardSeason = createAsyncThunk('season/carryForwardSeason', async (id, { rejectWithValue }) => {
  try {
    const res = await api.post(`/api/seasons/${id}/carry-forward`);
    return res.data;
  } catch (err) {
    return rejectWithValue(err.response?.data || err.message);
  }
});

export const deleteSeason = createAsyncThunk('season/deleteSeason', async (id, { rejectWithValue }) => {
  try {
    const res = await api.delete(`/api/seasons/${id}`);
    return { id, message: res.data.message };
  } catch (err) {
    return rejectWithValue(err.response?.data || err.message);
  }
});

const seasonSlice = createSlice({
  name: 'season',
  initialState: {
    seasons: [],
    loading: false,
    error: null,
    carryForwardResult: null,
    selectedSeason: null,
  },
  reducers: {
    clearSeasonError(state) {
      state.error = null;
    },
    clearCarryForwardResult(state) {
      state.carryForwardResult = null;
    },
    setSelectedSeason(state, action) {
      state.selectedSeason = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchSeasons.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchSeasons.fulfilled, (state, action) => {
        state.loading = false;
        state.seasons = action.payload;
      })
      .addCase(fetchSeasons.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to fetch seasons';
      })
      .addCase(createSeason.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createSeason.fulfilled, (state, action) => {
        state.loading = false;
        state.seasons.unshift(action.payload);
      })
      .addCase(createSeason.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to create season';
      })
      .addCase(closeSeason.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(closeSeason.fulfilled, (state, action) => {
        state.loading = false;
        const idx = state.seasons.findIndex(s => s._id === action.payload._id);
        if (idx !== -1) state.seasons[idx] = action.payload;
      })
      .addCase(closeSeason.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to close season';
      })
      .addCase(carryForwardSeason.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.carryForwardResult = null;
      })
      .addCase(carryForwardSeason.fulfilled, (state, action) => {
        state.loading = false;
        state.carryForwardResult = action.payload;
      })
      .addCase(carryForwardSeason.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to carry forward cattle';
      })
      .addCase(deleteSeason.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteSeason.fulfilled, (state, action) => {
        state.loading = false;
        state.seasons = state.seasons.filter(s => s._id !== action.payload.id);
      })
      .addCase(deleteSeason.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to delete season';
      });
  }
});

export const { clearSeasonError, clearCarryForwardResult, setSelectedSeason } = seasonSlice.actions;
export default seasonSlice.reducer; 