/**
 * Authentication Redux Slice
 *
 * Manages user authentication state:
 * - Current user info
 * - Login/logout actions
 * - Loading and error states
 *
 * A "slice" is a collection of Redux reducer logic and actions
 * for a single feature of the app.
 */

import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import api, { setAuthToken, clearAuthToken, getAuthToken } from '../services/api';
import { User, UserWithCompany, AuthResponse } from '../types';

// State shape for auth
interface AuthState {
  user: UserWithCompany | null;
  token: string | null;
  isLoading: boolean;
  isInitialized: boolean; // Have we checked for existing session?
  error: string | null;
}

// Initial state
const initialState: AuthState = {
  user: null,
  token: null,
  isLoading: false,
  isInitialized: false,
  error: null,
};

/**
 * Async thunk: Login
 *
 * Thunks are functions that can contain async logic.
 * They can dispatch actions and access state.
 */
export const login = createAsyncThunk(
  'auth/login',
  async (credentials: { email: string; password: string }, { rejectWithValue }) => {
    try {
      const response = await api.post<AuthResponse>('/auth/login', credentials);

      // Store token securely
      await setAuthToken(response.data.token);

      // Fetch full user profile with company info
      const profileResponse = await api.get<{ user: UserWithCompany }>('/users/me');

      return {
        user: profileResponse.data.user,
        token: response.data.token,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Login failed';
      return rejectWithValue(message);
    }
  }
);

/**
 * Async thunk: Signup
 *
 * Creates a new company and admin user
 */
export const signup = createAsyncThunk(
  'auth/signup',
  async (
    data: {
      companyName: string;
      email: string;
      password: string;
      firstName: string;
      lastName: string;
    },
    { rejectWithValue }
  ) => {
    try {
      const response = await api.post<AuthResponse>('/auth/signup', data);

      // Store token securely
      await setAuthToken(response.data.token);

      // Fetch full user profile with company info
      const profileResponse = await api.get<{ user: UserWithCompany }>('/users/me');

      return {
        user: profileResponse.data.user,
        token: response.data.token,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Signup failed';
      return rejectWithValue(message);
    }
  }
);

/**
 * Async thunk: Initialize Auth
 *
 * Called on app startup to check for existing session
 */
export const initializeAuth = createAsyncThunk(
  'auth/initialize',
  async (_, { rejectWithValue }) => {
    try {
      // Check if we have a stored token
      const token = await getAuthToken();

      if (!token) {
        return { user: null, token: null };
      }

      // Verify token is still valid by fetching user profile
      const response = await api.get<{ user: UserWithCompany }>('/users/me');

      return {
        user: response.data.user,
        token,
      };
    } catch (error) {
      // Token is invalid or expired - clear it
      await clearAuthToken();
      return { user: null, token: null };
    }
  }
);

/**
 * Async thunk: Logout
 */
export const logout = createAsyncThunk('auth/logout', async () => {
  await clearAuthToken();
  return null;
});

/**
 * Async thunk: Update Profile
 */
export const updateProfile = createAsyncThunk(
  'auth/updateProfile',
  async (
    data: {
      firstName?: string;
      lastName?: string;
      licenseNumber?: string;
      licenseState?: string;
    },
    { rejectWithValue, getState }
  ) => {
    try {
      const state = getState() as { auth: AuthState };
      const userId = state.auth.user?.id;

      if (!userId) {
        return rejectWithValue('User not logged in');
      }

      await api.patch(`/users/${userId}`, data);

      // Fetch updated profile
      const response = await api.get<{ user: UserWithCompany }>('/users/me');
      return response.data.user;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Update failed';
      return rejectWithValue(message);
    }
  }
);

// Create the auth slice
const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    // Clear any error messages
    clearError: (state) => {
      state.error = null;
    },
    // Set user directly (useful for testing)
    setUser: (state, action: PayloadAction<UserWithCompany | null>) => {
      state.user = action.payload;
    },
  },
  extraReducers: (builder) => {
    // Login
    builder
      .addCase(login.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(login.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload.user;
        state.token = action.payload.token;
      })
      .addCase(login.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Signup
    builder
      .addCase(signup.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(signup.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload.user;
        state.token = action.payload.token;
      })
      .addCase(signup.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Initialize Auth
    builder
      .addCase(initializeAuth.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(initializeAuth.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isInitialized = true;
        state.user = action.payload.user;
        state.token = action.payload.token;
      })
      .addCase(initializeAuth.rejected, (state) => {
        state.isLoading = false;
        state.isInitialized = true;
        state.user = null;
        state.token = null;
      });

    // Logout
    builder.addCase(logout.fulfilled, (state) => {
      state.user = null;
      state.token = null;
    });

    // Update Profile
    builder
      .addCase(updateProfile.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(updateProfile.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload;
      })
      .addCase(updateProfile.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });
  },
});

export const { clearError, setUser } = authSlice.actions;
export default authSlice.reducer;
