/**
 * Redux Store Configuration
 *
 * This file sets up the Redux store that holds all app state.
 *
 * Redux concepts:
 * - Store: Single source of truth for all app state
 * - Slices: Pieces of state with their own reducers
 * - Actions: Events that trigger state changes
 * - Selectors: Functions to read state values
 */

import { configureStore } from '@reduxjs/toolkit';
import authReducer from './authSlice';
import applicationsReducer from './applicationsSlice';
import customersReducer from './customersSlice';
import chemicalsReducer from './chemicalsSlice';

// Create the Redux store
export const store = configureStore({
  reducer: {
    auth: authReducer,
    applications: applicationsReducer,
    customers: customersReducer,
    chemicals: chemicalsReducer,
  },
  // Middleware configuration
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      // Allow non-serializable values (like Date objects) in state
      serializableCheck: {
        ignoredActions: ['auth/setUser'],
      },
    }),
});

// TypeScript types for the store
// These are used to get proper typing in components

// RootState: The type of the entire Redux state tree
export type RootState = ReturnType<typeof store.getState>;

// AppDispatch: The type of the dispatch function
export type AppDispatch = typeof store.dispatch;
