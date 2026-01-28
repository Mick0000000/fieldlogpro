/**
 * Applications Redux Slice for Web Dashboard
 */

import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../services/api';
import type { Application, PaginatedResponse } from '../types';

interface ApplicationsState {
  items: Application[];
  currentPage: number;
  totalPages: number;
  total: number;
  isLoading: boolean;
  error: string | null;
  selectedApplication: Application | null;
}

const initialState: ApplicationsState = {
  items: [],
  currentPage: 1,
  totalPages: 0,
  total: 0,
  isLoading: false,
  error: null,
  selectedApplication: null,
};

export const fetchApplications = createAsyncThunk(
  'applications/fetch',
  async (
    params: {
      page?: number;
      limit?: number;
      customerId?: string;
      applicatorId?: string;
      dateFrom?: string;
      dateTo?: string;
    } = {},
    { rejectWithValue }
  ) => {
    try {
      const queryParams = new URLSearchParams();
      if (params.page) queryParams.append('page', params.page.toString());
      if (params.limit) queryParams.append('limit', params.limit.toString());
      if (params.customerId) queryParams.append('customerId', params.customerId);
      if (params.applicatorId) queryParams.append('applicatorId', params.applicatorId);
      if (params.dateFrom) queryParams.append('dateFrom', params.dateFrom);
      if (params.dateTo) queryParams.append('dateTo', params.dateTo);

      const response = await api.get<PaginatedResponse<Application>>(
        `/applications?${queryParams.toString()}`
      );
      return response.data;
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to fetch applications');
    }
  }
);

export const fetchApplicationById = createAsyncThunk(
  'applications/fetchById',
  async (id: string, { rejectWithValue }) => {
    try {
      const response = await api.get<{ data: Application }>(`/applications/${id}`);
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to fetch application');
    }
  }
);

const applicationsSlice = createSlice({
  name: 'applications',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    clearSelectedApplication: (state) => {
      state.selectedApplication = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchApplications.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchApplications.fulfilled, (state, action) => {
        state.isLoading = false;
        state.items = action.payload.data;
        state.currentPage = action.payload.pagination.page;
        state.totalPages = action.payload.pagination.totalPages;
        state.total = action.payload.pagination.total;
      })
      .addCase(fetchApplications.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      .addCase(fetchApplicationById.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(fetchApplicationById.fulfilled, (state, action) => {
        state.isLoading = false;
        state.selectedApplication = action.payload;
      })
      .addCase(fetchApplicationById.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });
  },
});

export const { clearError, clearSelectedApplication } = applicationsSlice.actions;
export default applicationsSlice.reducer;
