/**
 * Redux Store Configuration for Web Dashboard
 */

import { configureStore } from '@reduxjs/toolkit';
import authReducer from './authSlice';
import applicationsReducer from './applicationsSlice';
import customersReducer from './customersSlice';
import usersReducer from './usersSlice';
import notificationsReducer from './notificationsSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    applications: applicationsReducer,
    customers: customersReducer,
    users: usersReducer,
    notifications: notificationsReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
