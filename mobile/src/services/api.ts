/**
 * API Service
 *
 * Centralized Axios instance for all API calls.
 * Handles authentication headers and error responses.
 *
 * How it works:
 * 1. Creates an Axios instance with base URL
 * 2. Request interceptor adds auth token to every request
 * 3. Response interceptor handles errors consistently
 */

import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Base URL for the API
const API_BASE_URL = 'https://fieldlogpro-production.up.railway.app/api';

// Create Axios instance with defaults
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000, // 30 second timeout
  headers: {
    'Content-Type': 'application/json',
  },
});

// Key used to store auth token in AsyncStorage
export const AUTH_TOKEN_KEY = '@auth_token';

/**
 * Request interceptor
 *
 * Runs before every request is sent.
 * Adds the authentication token if available.
 */
api.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    try {
      // Get token from storage
      const token = await AsyncStorage.getItem(AUTH_TOKEN_KEY);

      // If token exists, add to Authorization header
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (error) {
      console.error('Error reading auth token:', error);
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

/**
 * Response interceptor
 *
 * Runs after every response is received.
 * Handles errors consistently across the app.
 */
api.interceptors.response.use(
  // Success handler - just return the response
  (response) => response,

  // Error handler - transform errors into consistent format
  async (error: AxiosError) => {
    // Get error details from response
    const errorData = error.response?.data as { error?: { message?: string; code?: string } } | undefined;
    const message = errorData?.error?.message || error.message || 'An unexpected error occurred';
    const code = errorData?.error?.code || 'UNKNOWN_ERROR';
    const status = error.response?.status;

    // Handle 401 Unauthorized - token expired or invalid
    if (status === 401) {
      // Clear stored token
      await AsyncStorage.removeItem(AUTH_TOKEN_KEY);
      // You could also dispatch a logout action here
    }

    // Create a consistent error object
    const apiError = new Error(message) as Error & { code: string; status?: number };
    apiError.code = code;
    apiError.status = status;

    return Promise.reject(apiError);
  }
);

export default api;

/**
 * Helper function to store auth token
 */
export async function setAuthToken(token: string): Promise<void> {
  await AsyncStorage.setItem(AUTH_TOKEN_KEY, token);
}

/**
 * Helper function to clear auth token (logout)
 */
export async function clearAuthToken(): Promise<void> {
  await AsyncStorage.removeItem(AUTH_TOKEN_KEY);
}

/**
 * Helper function to get stored auth token
 */
export async function getAuthToken(): Promise<string | null> {
  return AsyncStorage.getItem(AUTH_TOKEN_KEY);
}
