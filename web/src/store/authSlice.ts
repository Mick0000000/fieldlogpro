/**
 * Authentication Redux Slice for Web Dashboard
 */

import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api, { setAuthToken, clearAuthToken, getAuthToken } from '../services/api';
import type { UserWithCompany, AuthResponse } from '../types';

interface AuthState {
  user: UserWithCompany | null;
  isLoading: boolean;
  isInitialized: boolean;
  error: string | null;
}

const initialState: AuthState = {
  user: null,
  isLoading: false,
  isInitialized: false,
  error: null,
};

export const login = createAsyncThunk(
  'auth/login',
  async (credentials: { email: string; password: string }, { rejectWithValue }) => {
    try {
      const response = await api.post<AuthResponse>('/auth/login', credentials);
      setAuthToken(response.data.token);
      const profileResponse = await api.get<{ user: UserWithCompany }>('/users/me');
      return profileResponse.data.user;
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Login failed');
    }
  }
);

export const signup = createAsyncThunk(
  'auth/signup',
  async (
    data: { companyName: string; email: string; password: string; firstName: string; lastName: string },
    { rejectWithValue }
  ) => {
    try {
      const response = await api.post<AuthResponse>('/auth/signup', data);
      setAuthToken(response.data.token);
      const profileResponse = await api.get<{ user: UserWithCompany }>('/users/me');
      return profileResponse.data.user;
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Signup failed');
    }
  }
);

export const initializeAuth = createAsyncThunk('auth/initialize', async () => {
  const token = getAuthToken();
  if (!token) return null;

  try {
    const response = await api.get<{ user: UserWithCompany }>('/users/me');
    return response.data.user;
  } catch {
    clearAuthToken();
    return null;
  }
});

export const logout = createAsyncThunk('auth/logout', async () => {
  clearAuthToken();
  return null;
});

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(login.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(login.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload;
      })
      .addCase(login.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      .addCase(signup.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(signup.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload;
      })
      .addCase(signup.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      .addCase(initializeAuth.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(initializeAuth.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isInitialized = true;
        state.user = action.payload;
      })
      .addCase(initializeAuth.rejected, (state) => {
        state.isLoading = false;
        state.isInitialized = true;
      })
      .addCase(logout.fulfilled, (state) => {
        state.user = null;
      });
  },
});

export const { clearError } = authSlice.actions;
export default authSlice.reducer;
