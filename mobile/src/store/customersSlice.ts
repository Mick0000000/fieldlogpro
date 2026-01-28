/**
 * Customers Redux Slice
 *
 * Manages customer/property state:
 * - List of customers for selection
 * - Search functionality
 */

import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../services/api';
import { Customer, PaginatedResponse } from '../types';

interface CustomersState {
  items: Customer[];
  isLoading: boolean;
  error: string | null;
  searchQuery: string;
}

const initialState: CustomersState = {
  items: [],
  isLoading: false,
  error: null,
  searchQuery: '',
};

/**
 * Fetch customers with optional search
 */
export const fetchCustomers = createAsyncThunk(
  'customers/fetch',
  async (params: { search?: string } = {}, { rejectWithValue }) => {
    try {
      const queryParams = new URLSearchParams();
      queryParams.append('limit', '100'); // Fetch all for local search
      if (params.search) {
        queryParams.append('search', params.search);
      }

      const response = await api.get<PaginatedResponse<Customer>>(
        `/customers?${queryParams.toString()}`
      );

      return response.data.data;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to fetch customers';
      return rejectWithValue(message);
    }
  }
);

const customersSlice = createSlice({
  name: 'customers',
  initialState,
  reducers: {
    setSearchQuery: (state, action) => {
      state.searchQuery = action.payload;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchCustomers.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchCustomers.fulfilled, (state, action) => {
        state.isLoading = false;
        state.items = action.payload;
      })
      .addCase(fetchCustomers.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });
  },
});

export const { setSearchQuery, clearError } = customersSlice.actions;
export default customersSlice.reducer;
