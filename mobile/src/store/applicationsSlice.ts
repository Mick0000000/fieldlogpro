/**
 * Applications Redux Slice
 *
 * Manages application log state:
 * - List of applications
 * - Creating new applications
 * - Fetching application details
 */

import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../services/api';
import { Application, PaginatedResponse, CreateApplicationData } from '../types';

interface ApplicationsState {
  items: Application[];
  currentPage: number;
  totalPages: number;
  total: number;
  hasMore: boolean;
  isLoading: boolean;
  isCreating: boolean;
  error: string | null;
  selectedApplication: Application | null;
}

const initialState: ApplicationsState = {
  items: [],
  currentPage: 1,
  totalPages: 0,
  total: 0,
  hasMore: false,
  isLoading: false,
  isCreating: false,
  error: null,
  selectedApplication: null,
};

/**
 * Fetch applications with optional filters
 */
export const fetchApplications = createAsyncThunk(
  'applications/fetch',
  async (
    params: {
      page?: number;
      limit?: number;
      customerId?: string;
      dateFrom?: string;
      dateTo?: string;
      refresh?: boolean;
    } = {},
    { rejectWithValue }
  ) => {
    try {
      const queryParams = new URLSearchParams();
      if (params.page) queryParams.append('page', params.page.toString());
      if (params.limit) queryParams.append('limit', params.limit.toString());
      if (params.customerId) queryParams.append('customerId', params.customerId);
      if (params.dateFrom) queryParams.append('dateFrom', params.dateFrom);
      if (params.dateTo) queryParams.append('dateTo', params.dateTo);

      const response = await api.get<PaginatedResponse<Application>>(
        `/applications?${queryParams.toString()}`
      );

      return {
        ...response.data,
        refresh: params.refresh || params.page === 1,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to fetch applications';
      return rejectWithValue(message);
    }
  }
);

/**
 * Fetch single application by ID
 */
export const fetchApplicationById = createAsyncThunk(
  'applications/fetchById',
  async (id: string, { rejectWithValue }) => {
    try {
      const response = await api.get<{ data: Application }>(`/applications/${id}`);
      return response.data.data;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to fetch application';
      return rejectWithValue(message);
    }
  }
);

/**
 * Create new application
 */
export const createApplication = createAsyncThunk(
  'applications/create',
  async (data: CreateApplicationData, { rejectWithValue }) => {
    try {
      const response = await api.post<{ data: Application }>('/applications', data);
      return response.data.data;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to create application';
      return rejectWithValue(message);
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
    resetApplications: (state) => {
      state.items = [];
      state.currentPage = 1;
      state.totalPages = 0;
      state.total = 0;
      state.hasMore = false;
    },
  },
  extraReducers: (builder) => {
    // Fetch applications
    builder
      .addCase(fetchApplications.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchApplications.fulfilled, (state, action) => {
        state.isLoading = false;
        if (action.payload.refresh) {
          state.items = action.payload.data;
        } else {
          state.items = [...state.items, ...action.payload.data];
        }
        state.currentPage = action.payload.pagination.page;
        state.totalPages = action.payload.pagination.totalPages;
        state.total = action.payload.pagination.total;
        state.hasMore = action.payload.pagination.hasMore;
      })
      .addCase(fetchApplications.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Fetch by ID
    builder
      .addCase(fetchApplicationById.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchApplicationById.fulfilled, (state, action) => {
        state.isLoading = false;
        state.selectedApplication = action.payload;
      })
      .addCase(fetchApplicationById.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Create application
    builder
      .addCase(createApplication.pending, (state) => {
        state.isCreating = true;
        state.error = null;
      })
      .addCase(createApplication.fulfilled, (state, action) => {
        state.isCreating = false;
        // Add to beginning of list
        state.items = [action.payload, ...state.items];
        state.total += 1;
      })
      .addCase(createApplication.rejected, (state, action) => {
        state.isCreating = false;
        state.error = action.payload as string;
      });
  },
});

export const { clearError, clearSelectedApplication, resetApplications } = applicationsSlice.actions;
export default applicationsSlice.reducer;
