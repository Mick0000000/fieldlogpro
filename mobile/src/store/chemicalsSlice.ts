/**
 * Chemicals Redux Slice
 *
 * Manages chemical/pesticide reference data:
 * - List of available chemicals
 * - Target pests
 */

import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../services/api';
import { Chemical, TargetPest } from '../types';

interface ChemicalsState {
  chemicals: Chemical[];
  targetPests: TargetPest[];
  isLoading: boolean;
  error: string | null;
}

const initialState: ChemicalsState = {
  chemicals: [],
  targetPests: [],
  isLoading: false,
  error: null,
};

/**
 * Fetch all chemicals
 */
export const fetchChemicals = createAsyncThunk(
  'chemicals/fetchChemicals',
  async (_, { rejectWithValue }) => {
    try {
      // Note: This endpoint needs to be added to the backend
      // For now, we'll fetch from a generic endpoint
      const response = await api.get<{ data: Chemical[] }>('/chemicals');
      return response.data.data;
    } catch (error) {
      // If endpoint doesn't exist, return empty array
      // This allows the app to work while backend is being updated
      console.warn('Chemicals endpoint not available, using empty list');
      return [];
    }
  }
);

/**
 * Fetch all target pests
 */
export const fetchTargetPests = createAsyncThunk(
  'chemicals/fetchTargetPests',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get<{ data: TargetPest[] }>('/target-pests');
      return response.data.data;
    } catch (error) {
      console.warn('Target pests endpoint not available, using empty list');
      return [];
    }
  }
);

/**
 * Fetch all reference data at once
 */
export const fetchReferenceData = createAsyncThunk(
  'chemicals/fetchAll',
  async (_, { dispatch }) => {
    await Promise.all([
      dispatch(fetchChemicals()),
      dispatch(fetchTargetPests()),
    ]);
  }
);

const chemicalsSlice = createSlice({
  name: 'chemicals',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    // Fetch chemicals
    builder
      .addCase(fetchChemicals.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchChemicals.fulfilled, (state, action) => {
        state.isLoading = false;
        state.chemicals = action.payload;
      })
      .addCase(fetchChemicals.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Fetch target pests
    builder
      .addCase(fetchTargetPests.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(fetchTargetPests.fulfilled, (state, action) => {
        state.isLoading = false;
        state.targetPests = action.payload;
      })
      .addCase(fetchTargetPests.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });
  },
});

export const { clearError } = chemicalsSlice.actions;
export default chemicalsSlice.reducer;
