/**
 * Main App Component
 * Sets up routing, Redux Provider, and MUI Theme
 */

import { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Provider } from 'react-redux';
import { ThemeProvider, createTheme, CssBaseline } from '@mui/material';
import { store } from './store';
import { useAppDispatch } from './hooks/useRedux';
import { initializeAuth } from './store/authSlice';

// Pages
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import ApplicationsPage from './pages/ApplicationsPage';
import CustomersPage from './pages/CustomersPage';
import UsersPage from './pages/UsersPage';
import ReportsPage from './pages/ReportsPage';
import NotificationsPage from './pages/NotificationsPage';
import PrivacyPolicyPage from './pages/PrivacyPolicyPage';
import SupportPage from './pages/SupportPage';

// Layouts
import DashboardLayout from './layouts/DashboardLayout';

// Components
import ProtectedRoute from './components/ProtectedRoute';

// Create MUI theme with green primary color
const theme = createTheme({
  palette: {
    primary: {
      main: '#2e7d32',
      light: '#4caf50',
      dark: '#1b5e20',
      contrastText: '#ffffff',
    },
    secondary: {
      main: '#558b2f',
    },
    background: {
      default: '#f5f5f5',
    },
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    h4: {
      fontWeight: 600,
    },
    h6: {
      fontWeight: 600,
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 500,
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 12,
        },
      },
    },
  },
});

// App content component (needs to be inside Provider to use hooks)
const AppContent = () => {
  const dispatch = useAppDispatch();

  useEffect(() => {
    // Initialize auth on mount
    dispatch(initializeAuth());
  }, [dispatch]);

  return (
    <Routes>
      {/* Public routes */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/signup" element={<SignupPage />} />
      <Route path="/privacy" element={<PrivacyPolicyPage />} />
      <Route path="/support" element={<SupportPage />} />

      {/* Protected routes */}
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <DashboardLayout />
          </ProtectedRoute>
        }
      >
        {/* Default redirect to applications */}
        <Route index element={<Navigate to="/applications" replace />} />
        <Route path="applications" element={<ApplicationsPage />} />
        <Route path="customers" element={<CustomersPage />} />
        <Route path="users" element={<UsersPage />} />
        <Route path="reports" element={<ReportsPage />} />
        <Route path="notifications" element={<NotificationsPage />} />
      </Route>

      {/* Catch all - redirect to home */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

function App() {
  return (
    <Provider store={store}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <AppContent />
      </ThemeProvider>
    </Provider>
  );
}

export default App;
