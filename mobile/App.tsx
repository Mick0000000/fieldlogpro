/**
 * Landscaping App - Mobile Application
 *
 * Entry point for the React Native/Expo app.
 * Sets up Redux store provider and navigation.
 */

import React, { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { Provider } from 'react-redux';
import { store } from './src/store';
import AppNavigator from './src/navigation/AppNavigator';
import { initializeAuth } from './src/store/authSlice';

/**
 * Inner App component that can use Redux hooks
 */
function AppContent() {
  useEffect(() => {
    // Check for existing auth session on app startup
    store.dispatch(initializeAuth());
  }, []);

  return (
    <>
      <StatusBar style="light" />
      <AppNavigator />
    </>
  );
}

/**
 * Root App component
 *
 * Wraps the app in Redux Provider for state management
 */
export default function App() {
  return (
    <Provider store={store}>
      <AppContent />
    </Provider>
  );
}
