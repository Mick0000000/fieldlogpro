/**
 * Users Redux Slice for Web Dashboard
 */

import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../services/api';
import type { User, InviteUserData, UpdateUserData } from '../types';

interface UsersState {
  items: User[];
  currentPage: number;
  totalPages: number;
  total: number;
  isLoading: boolean;
  error: string | null;
}

const initialState: UsersState = {
  items: [],
  currentPage: 1,
  totalPages: 0,
  total: 0,
  isLoading: false,
  error: null,
};

export const fetchUsers = createAsyncThunk(
  'users/fetch',
  async (params: { page?: number; limit?: number } = {}, { rejectWithValue }) => {
    try {
      const queryParams = new URLSearchParams();
      if (params.page) queryParams.append('page', params.page.toString());
      if (params.limit) queryParams.append('limit', params.limit.toString());

      const response = await api.get<{
        users: User[];
        pagination: { page: number; limit: number; total: number; totalPages: number };
      }>(`/users?${queryParams.toString()}`);

      return {
        data: response.data.users,
        pagination: response.data.pagination,
      };
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to fetch users');
    }
  }
);

export const inviteUser = createAsyncThunk(
  'users/invite',
  async (data: InviteUserData, { rejectWithValue }) => {
    try {
      const response = await api.post<{ user: User }>('/users', data);
      return response.data.user;
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to invite user');
    }
  }
);

export const updateUser = createAsyncThunk(
  'users/update',
  async ({ id, data }: { id: string; data: UpdateUserData }, { rejectWithValue }) => {
    try {
      const response = await api.patch<{ user: User }>(`/users/${id}`, data);
      return response.data.user;
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to update user');
    }
  }
);

const usersSlice = createSlice({
  name: 'users',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchUsers.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchUsers.fulfilled, (state, action) => {
        state.isLoading = false;
        state.items = action.payload.data;
        state.currentPage = action.payload.pagination.page;
        state.totalPages = action.payload.pagination.totalPages;
        state.total = action.payload.pagination.total;
      })
      .addCase(fetchUsers.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      .addCase(inviteUser.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(inviteUser.fulfilled, (state, action) => {
        state.isLoading = false;
        state.items = [action.payload, ...state.items];
        state.total += 1;
      })
      .addCase(inviteUser.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      .addCase(updateUser.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(updateUser.fulfilled, (state, action) => {
        state.isLoading = false;
        const index = state.items.findIndex((u) => u.id === action.payload.id);
        if (index !== -1) {
          state.items[index] = action.payload;
        }
      })
      .addCase(updateUser.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });
  },
});

export const { clearError } = usersSlice.actions;
export default usersSlice.reducer;
