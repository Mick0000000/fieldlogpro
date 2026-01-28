/**
 * Notifications Redux Slice for Web Dashboard
 * Manages notification logs and resend functionality
 */

import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../services/api';

export type NotificationStatus = 'sent' | 'delivered' | 'failed';

export interface NotificationLog {
  id: string;
  customerId: string;
  customerName: string;
  customerEmail: string;
  applicationId: string;
  status: NotificationStatus;
  sentAt: string;
  deliveredAt?: string | null;
  failedAt?: string | null;
  failureReason?: string | null;
  subject?: string | null;
  createdAt: string;
  updatedAt?: string;
}

interface NotificationsState {
  items: NotificationLog[];
  currentPage: number;
  totalPages: number;
  total: number;
  isLoading: boolean;
  isResending: boolean;
  error: string | null;
}

const initialState: NotificationsState = {
  items: [],
  currentPage: 1,
  totalPages: 0,
  total: 0,
  isLoading: false,
  isResending: false,
  error: null,
};

interface PaginatedNotificationsResponse {
  data: NotificationLog[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasMore: boolean;
  };
}

export const fetchNotifications = createAsyncThunk(
  'notifications/fetch',
  async (
    params: { page?: number; limit?: number; status?: NotificationStatus } = {},
    { rejectWithValue }
  ) => {
    try {
      const queryParams = new URLSearchParams();
      if (params.page) queryParams.append('page', params.page.toString());
      if (params.limit) queryParams.append('limit', params.limit.toString());
      if (params.status) queryParams.append('status', params.status);

      const response = await api.get<PaginatedNotificationsResponse>(
        `/notifications?${queryParams.toString()}`
      );
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error instanceof Error ? error.message : 'Failed to fetch notifications'
      );
    }
  }
);

export const resendNotification = createAsyncThunk(
  'notifications/resend',
  async (notificationId: string, { rejectWithValue }) => {
    try {
      const response = await api.post<{ data: NotificationLog }>(
        `/notifications/${notificationId}/resend`
      );
      return response.data.data;
    } catch (error) {
      return rejectWithValue(
        error instanceof Error ? error.message : 'Failed to resend notification'
      );
    }
  }
);

const notificationsSlice = createSlice({
  name: 'notifications',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch notifications
      .addCase(fetchNotifications.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchNotifications.fulfilled, (state, action) => {
        state.isLoading = false;
        state.items = action.payload.data;
        state.currentPage = action.payload.pagination.page;
        state.totalPages = action.payload.pagination.totalPages;
        state.total = action.payload.pagination.total;
      })
      .addCase(fetchNotifications.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // Resend notification
      .addCase(resendNotification.pending, (state) => {
        state.isResending = true;
        state.error = null;
      })
      .addCase(resendNotification.fulfilled, (state, action) => {
        state.isResending = false;
        // Update the notification in the list
        const index = state.items.findIndex((n) => n.id === action.payload.id);
        if (index !== -1) {
          state.items[index] = action.payload;
        }
      })
      .addCase(resendNotification.rejected, (state, action) => {
        state.isResending = false;
        state.error = action.payload as string;
      });
  },
});

export const { clearError } = notificationsSlice.actions;
export default notificationsSlice.reducer;
