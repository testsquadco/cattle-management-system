import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../utils/api';

export const fetchCategories = createAsyncThunk(
  'category/fetchCategories',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/api/categories');
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch categories');
    }
  }
);

export const createCategory = createAsyncThunk(
  'category/createCategory',
  async (data, { rejectWithValue }) => {
    try {
      const response = await api.post('/api/categories', data);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to create category');
    }
  }
);

export const updateCategory = createAsyncThunk(
  'category/updateCategory',
  async ({ id, data }, { rejectWithValue }) => {
    try {
      const response = await api.put(`/api/categories/${id}`, data);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update category');
    }
  }
);

export const deleteCategory = createAsyncThunk(
  'category/deleteCategory',
  async (id, { rejectWithValue }) => {
    try {
      await api.delete(`/api/categories/${id}`);
      return id;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to delete category');
    }
  }
);

export const createSubcategory = createAsyncThunk(
  'category/createSubcategory',
  async ({ categoryId, data }, { rejectWithValue }) => {
    try {
      const response = await api.post(`/api/categories/${categoryId}/subcategories`, data);
      return { categoryId, subcategory: response.data.name };
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to create subcategory');
    }
  }
);

export const deleteSubcategory = createAsyncThunk(
  'category/deleteSubcategory',
  async ({ categoryId, subcategory }, { rejectWithValue }) => {
    try {
      await api.delete(`/api/categories/${categoryId}/subcategories/${encodeURIComponent(subcategory)}`);
      return { categoryId, subcategory };
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to delete subcategory');
    }
  }
);

const initialState = {
  categories: [],
  loading: false,
  error: null,
};

const categorySlice = createSlice({
  name: 'category',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchCategories.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchCategories.fulfilled, (state, action) => {
        state.loading = false;
        state.categories = action.payload;
      })
      .addCase(fetchCategories.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(createCategory.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createCategory.fulfilled, (state, action) => {
        state.loading = false;
        state.categories.push(action.payload);
      })
      .addCase(createCategory.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(updateCategory.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateCategory.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.categories.findIndex(cat => cat._id === action.payload._id);
        if (index !== -1) {
          state.categories[index] = action.payload;
        }
      })
      .addCase(updateCategory.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(deleteCategory.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteCategory.fulfilled, (state, action) => {
        state.loading = false;
        state.categories = state.categories.filter(cat => cat._id !== action.payload);
      })
      .addCase(deleteCategory.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(createSubcategory.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createSubcategory.fulfilled, (state, action) => {
        state.loading = false;
        const category = state.categories.find(cat => cat._id === action.payload.categoryId);
        if (category) {
          if (!category.subCategories) {
            category.subCategories = [];
          }
          category.subCategories.push(action.payload.subcategory);
        }
      })
      .addCase(createSubcategory.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(deleteSubcategory.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteSubcategory.fulfilled, (state, action) => {
        state.loading = false;
        const category = state.categories.find(cat => cat._id === action.payload.categoryId);
        if (category && category.subCategories) {
          category.subCategories = category.subCategories.filter(sub => sub !== action.payload.subcategory);
        }
      })
      .addCase(deleteSubcategory.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { clearError } = categorySlice.actions;
export default categorySlice.reducer; 