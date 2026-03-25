import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';

// Async thunks
export const fetchBreedingCattle = createAsyncThunk(
  'breeding/fetchBreedingCattle',
  async () => {
    const response = await fetch('/api/breeding/cattle');
    return response.json();
  }
);

export const fetchBreedingReport = createAsyncThunk(
  'breeding/fetchBreedingReport',
  async ({ reportType, cattleId, startDate, endDate }) => {
    const response = await fetch('/api/breeding/report', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        reportType,
        cattleId,
        startDate,
        endDate,
      }),
    });
    return response.json();
  }
);

export const fetchMatingHistory = createAsyncThunk(
  'breeding/fetchMatingHistory',
  async (cattleId) => {
    const response = await fetch(`/api/breeding/mating?cattleId=${cattleId}`);
    return response.json();
  }
);

export const addMatingRecord = createAsyncThunk(
  'breeding/addMatingRecord',
  async (matingData) => {
    const response = await fetch('/api/breeding/mating', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(matingData),
    });
    return response.json();
  }
);

export const updateMatingResult = createAsyncThunk(
  'breeding/updateMatingResult',
  async ({ cattleId, matingId, result }) => {
    const response = await fetch(`/api/breeding/mating/${cattleId}/${matingId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(result),
    });
    return response.json();
  }
);

const initialState = {
  breedingCattle: [],
  currentReport: null,
  matingHistory: [],
  loading: false,
  error: null,
};

const breedingSlice = createSlice({
  name: 'breeding',
  initialState,
  reducers: {
    clearCurrentReport: (state) => {
      state.currentReport = null;
    },
    clearMatingHistory: (state) => {
      state.matingHistory = [];
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch breeding cattle
      .addCase(fetchBreedingCattle.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchBreedingCattle.fulfilled, (state, action) => {
        state.loading = false;
        state.breedingCattle = action.payload;
      })
      .addCase(fetchBreedingCattle.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      })
      // Fetch breeding report
      .addCase(fetchBreedingReport.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchBreedingReport.fulfilled, (state, action) => {
        state.loading = false;
        state.currentReport = action.payload;
      })
      .addCase(fetchBreedingReport.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      })
      // Fetch mating history
      .addCase(fetchMatingHistory.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchMatingHistory.fulfilled, (state, action) => {
        state.loading = false;
        state.matingHistory = action.payload;
      })
      .addCase(fetchMatingHistory.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      })
      // Add mating record
      .addCase(addMatingRecord.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(addMatingRecord.fulfilled, (state, action) => {
        state.loading = false;
        state.matingHistory.push(action.payload);
      })
      .addCase(addMatingRecord.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      })
      // Update mating result
      .addCase(updateMatingResult.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateMatingResult.fulfilled, (state, action) => {
        state.loading = false;
        const updatedCattle = action.payload;
        state.matingHistory = updatedCattle.matingHistory;
      })
      .addCase(updateMatingResult.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      });
  },
});

export const { clearCurrentReport, clearMatingHistory } = breedingSlice.actions;

export default breedingSlice.reducer; 