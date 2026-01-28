/**
 * Customers Redux Slice for Web Dashboard
 */

import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../services/api';
import type { Customer, PaginatedResponse, CreateCustomerData, UpdateCustomerData } from '../types';

interface CustomersState {
  items: Customer[];
  currentPage: number;
  totalPages: number;
  total: number;
  isLoading: boolean;
  error: string | null;
}

const initialState: CustomersState = {
  items: [],
  currentPage: 1,
  totalPages: 0,
  total: 0,
  isLoading: false,
  error: null,
};

export const fetchCustomers = createAsyncThunk(
  'customers/fetch',
  async (params: { page?: number; limit?: number; search?: string } = {}, { rejectWithValue }) => {
    try {
      const queryParams = new URLSearchParams();
      if (params.page) queryParams.append('page', params.page.toString());
      if (params.limit) queryParams.append('limit', params.limit.toString());
      if (params.search) queryParams.append('search', params.search);

      const response = await api.get<PaginatedResponse<Customer>>(
        `/customers?${queryParams.toString()}`
      );
      return response.data;
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to fetch customers');
    }
  }
);

export const createCustomer = createAsyncThunk(
  'customers/create',
  async (data: CreateCustomerData, { rejectWithValue }) => {
    try {
      const response = await api.post<{ data: Customer }>('/customers', data);
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to create customer');
    }
  }
);

export const updateCustomer = createAsyncThunk(
  'customers/update',
  async ({ id, data }: { id: string; data: UpdateCustomerData }, { rejectWithValue }) => {
    try {
      const response = await api.patch<{ data: Customer }>(`/customers/${id}`, data);
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to update customer');
    }
  }
);

const customersSlice = createSlice({
  name: 'customers',
  initialState,
  reducers: {
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
        state.items = action.payload.data;
        state.currentPage = action.payload.pagination.page;
        state.totalPages = action.payload.pagination.totalPages;
        state.total = action.payload.pagination.total;
      })
      .addCase(fetchCustomers.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      .addCase(createCustomer.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(createCustomer.fulfilled, (state, action) => {
        state.isLoading = false;
        state.items = [action.payload, ...state.items];
        state.total += 1;
      })
      .addCase(createCustomer.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      .addCase(updateCustomer.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(updateCustomer.fulfilled, (state, action) => {
        state.isLoading = false;
        const index = state.items.findIndex((c) => c.id === action.payload.id);
        if (index !== -1) {
          state.items[index] = action.payload;
        }
      })
      .addCase(updateCustomer.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });
  },
});

export const { clearError } = customersSlice.actions;
export default customersSlice.reducer;
