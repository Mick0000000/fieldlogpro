/**
 * HistoryScreen - Application History List
 *
 * This screen displays a scrollable list of past pesticide applications.
 * Users can view their application history, pull to refresh, and tap
 * any row to see full details.
 *
 * REACT NATIVE CONCEPTS EXPLAINED:
 *
 * FlatList: A performant component for rendering long lists.
 * Unlike a regular map(), FlatList only renders items currently visible
 * on screen, which saves memory and improves performance.
 *
 * RefreshControl: Enables pull-to-refresh functionality.
 * When the user pulls down on the list, it triggers a refresh.
 *
 * useEffect: A React hook that runs code when the component mounts
 * or when specified dependencies change.
 *
 * useNavigation: A React Navigation hook that gives access to
 * navigation functions like navigate() to move between screens.
 */

import React, { useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
// Navigation hooks for moving between screens
import { useNavigation } from '@react-navigation/native';
// NativeStackNavigationProp provides type-safe navigation
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

// Custom typed Redux hooks - these provide autocomplete and type safety
import { useAppDispatch, useAppSelector } from '../hooks/useRedux';
// Redux actions for fetching applications
import { fetchApplications, resetApplications } from '../store/applicationsSlice';
// Type definitions
import { Application, HistoryStackParamList } from '../types';

// Type for the navigation prop - tells TypeScript what screens exist
type HistoryNavigationProp = NativeStackNavigationProp<HistoryStackParamList, 'HistoryList'>;

/**
 * Main History Screen Component
 *
 * This is a functional component using React hooks.
 * Functional components are the modern way to write React components.
 */
const HistoryScreen: React.FC = () => {
  // ==========================================
  // HOOKS SECTION
  // All React hooks must be called at the top level of the component.
  // They cannot be called inside conditions or loops.
  // ==========================================

  // Get the navigation object to navigate between screens
  const navigation = useNavigation<HistoryNavigationProp>();

  // Get the dispatch function to send actions to Redux
  // dispatch() is how we trigger state changes in Redux
  const dispatch = useAppDispatch();

  // Select data from the Redux store
  // useAppSelector takes a function that receives the entire state
  // and returns just the piece we need
  const {
    items: applications, // The list of applications (renamed for clarity)
    isLoading,           // True while fetching data
    hasMore,             // True if more pages are available
    currentPage,         // Current pagination page
    error,               // Error message if fetch failed
  } = useAppSelector((state) => state.applications);

  // ==========================================
  // DATA FETCHING
  // ==========================================

  /**
   * Fetch applications when the screen first loads
   *
   * useEffect with an empty dependency array [] runs once when
   * the component mounts (appears on screen for the first time).
   */
  useEffect(() => {
    // Dispatch the fetchApplications action to load initial data
    // refresh: true tells the reducer to replace existing data
    dispatch(fetchApplications({ page: 1, limit: 20, refresh: true }));

    // Cleanup function: runs when component unmounts
    // Reset state so we get fresh data next time
    return () => {
      dispatch(resetApplications());
    };
  }, [dispatch]); // dispatch is stable but included for ESLint

  // ==========================================
  // EVENT HANDLERS
  // ==========================================

  /**
   * Handle pull-to-refresh gesture
   *
   * useCallback memoizes the function so it doesn't get recreated
   * on every render. This is important for performance.
   */
  const handleRefresh = useCallback(() => {
    dispatch(fetchApplications({ page: 1, limit: 20, refresh: true }));
  }, [dispatch]);

  /**
   * Handle reaching the end of the list (infinite scroll)
   *
   * When the user scrolls near the bottom, load more items
   * if there are more pages available.
   */
  const handleLoadMore = useCallback(() => {
    // Don't load more if already loading or no more pages
    if (isLoading || !hasMore) return;

    // Fetch the next page
    dispatch(fetchApplications({ page: currentPage + 1, limit: 20 }));
  }, [dispatch, isLoading, hasMore, currentPage]);

  /**
   * Handle tapping on an application row
   *
   * Navigate to the detail screen, passing the application ID
   * so the detail screen knows which application to display.
   */
  const handleApplicationPress = useCallback(
    (applicationId: string) => {
      // Navigate to ApplicationDetail screen with the ID as a parameter
      navigation.navigate('ApplicationDetail', { applicationId });
    },
    [navigation]
  );

  // ==========================================
  // HELPER FUNCTIONS
  // ==========================================

  /**
   * Format a date string for display
   *
   * Converts ISO date string to a human-readable format.
   * Example: "2024-01-15T10:30:00Z" becomes "Jan 15, 2024"
   */
  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  /**
   * Format time from a date string
   *
   * Example: "2024-01-15T10:30:00Z" becomes "10:30 AM"
   */
  const formatTime = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  /**
   * Get the color for a status badge
   *
   * Returns different colors based on application status
   * for visual indication.
   */
  const getStatusColor = (status: Application['status']): string => {
    switch (status) {
      case 'completed':
        return '#2e7d32'; // Green for completed
      case 'voided':
        return '#d32f2f'; // Red for voided
      default:
        return '#757575'; // Gray for unknown
    }
  };

  // ==========================================
  // RENDER FUNCTIONS
  // ==========================================

  /**
   * Render a single application row
   *
   * This function is passed to FlatList's renderItem prop.
   * It receives an object with { item, index } and returns JSX.
   *
   * @param item - The application data for this row
   */
  const renderApplicationItem = ({ item }: { item: Application }) => (
    // TouchableOpacity provides touch feedback (opacity change on press)
    <TouchableOpacity
      style={styles.applicationRow}
      onPress={() => handleApplicationPress(item.id)}
      // Accessibility: Describes the row for screen readers
      accessibilityLabel={`Application for ${item.customer?.name || 'Customer'} on ${formatDate(item.applicationDate)}`}
      accessibilityRole="button"
    >
      {/* Left section: Date and time */}
      <View style={styles.dateSection}>
        <Text style={styles.dateText}>{formatDate(item.applicationDate)}</Text>
        <Text style={styles.timeText}>{formatTime(item.applicationDate)}</Text>
      </View>

      {/* Middle section: Customer and chemical info */}
      <View style={styles.detailsSection}>
        {/* Customer name - most prominent */}
        <Text style={styles.customerName} numberOfLines={1}>
          {item.customer?.name || 'Unknown Customer'}
        </Text>

        {/* Chemical name */}
        <Text style={styles.chemicalName} numberOfLines={1}>
          {item.chemicalName}
        </Text>

        {/* Amount applied */}
        <Text style={styles.amountText}>
          {item.amount} {item.unit}
        </Text>
      </View>

      {/* Right section: Status badge */}
      <View
        style={[
          styles.statusBadge,
          { backgroundColor: getStatusColor(item.status) },
        ]}
      >
        <Text style={styles.statusText}>
          {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
        </Text>
      </View>
    </TouchableOpacity>
  );

  /**
   * Render the empty state when no applications exist
   *
   * This is shown when the list is empty after loading completes.
   */
  const renderEmptyState = () => {
    // Don't show empty state while loading
    if (isLoading) return null;

    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyTitle}>No Applications Yet</Text>
        <Text style={styles.emptySubtitle}>
          Your application history will appear here after you log your first application.
        </Text>
      </View>
    );
  };

  /**
   * Render the loading footer when loading more items
   *
   * Shows a spinner at the bottom of the list when loading
   * additional pages (infinite scroll).
   */
  const renderFooter = () => {
    // Only show footer loading indicator when loading more (not initial load)
    if (!isLoading || applications.length === 0) return null;

    return (
      <View style={styles.footerLoader}>
        <ActivityIndicator size="small" color="#2e7d32" />
        <Text style={styles.footerText}>Loading more...</Text>
      </View>
    );
  };

  // ==========================================
  // MAIN RENDER
  // ==========================================

  // Show error state if fetch failed
  if (error && applications.length === 0) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorTitle}>Unable to Load History</Text>
        <Text style={styles.errorMessage}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={handleRefresh}>
          <Text style={styles.retryButtonText}>Try Again</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Show loading spinner on initial load
  if (isLoading && applications.length === 0) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#2e7d32" />
        <Text style={styles.loadingText}>Loading applications...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Application History</Text>
      </View>

      {/*
        FlatList - The main scrollable list component

        Key props explained:
        - data: Array of items to render
        - renderItem: Function that renders each item
        - keyExtractor: Function that returns a unique key for each item
        - onEndReached: Called when scroll reaches near the bottom
        - onEndReachedThreshold: How close to bottom (0.2 = 20%) before calling onEndReached
        - refreshControl: Component for pull-to-refresh behavior
        - ListEmptyComponent: What to show when data array is empty
        - ListFooterComponent: What to show at the bottom of the list
      */}
      <FlatList
        data={applications}
        renderItem={renderApplicationItem}
        keyExtractor={(item) => item.id}
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.2}
        refreshControl={
          <RefreshControl
            refreshing={isLoading && applications.length > 0 && currentPage === 1}
            onRefresh={handleRefresh}
            colors={['#2e7d32']} // Android spinner color
            tintColor="#2e7d32" // iOS spinner color
          />
        }
        ListEmptyComponent={renderEmptyState}
        ListFooterComponent={renderFooter}
        // Improve performance by telling FlatList items have fixed height
        // getItemLayout={(data, index) => ({ length: 100, offset: 100 * index, index })}
        // Remove default separators (we use margin/padding instead)
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        // Content padding
        contentContainerStyle={
          applications.length === 0 ? styles.emptyListContent : styles.listContent
        }
      />
    </View>
  );
};

// ==========================================
// STYLES
// ==========================================

/**
 * StyleSheet.create provides performance optimization
 * by creating the styles once at startup rather than on every render.
 *
 * Style values are in density-independent pixels (dp) which
 * automatically scale based on device screen density.
 */
const styles = StyleSheet.create({
  // Main container - fills the screen
  container: {
    flex: 1, // flex: 1 means take up all available space
    backgroundColor: '#f5f5f5',
  },

  // Header section
  header: {
    backgroundColor: '#2e7d32', // Green theme color
    paddingVertical: 16,
    paddingHorizontal: 20,
    // Shadow for iOS
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    // Shadow for Android
    elevation: 4,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
  },

  // List content padding
  listContent: {
    paddingVertical: 8,
  },
  emptyListContent: {
    flexGrow: 1, // Allow empty state to center vertically
  },

  // Individual application row
  applicationRow: {
    flexDirection: 'row', // Arrange children horizontally
    alignItems: 'center',
    backgroundColor: '#ffffff',
    marginHorizontal: 12,
    marginVertical: 4,
    padding: 16,
    borderRadius: 12,
    // Shadow
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },

  // Date section (left side)
  dateSection: {
    width: 80,
    alignItems: 'center',
  },
  dateText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2e7d32',
  },
  timeText: {
    fontSize: 12,
    color: '#757575',
    marginTop: 2,
  },

  // Details section (middle)
  detailsSection: {
    flex: 1, // Take remaining space
    marginLeft: 12,
  },
  customerName: {
    fontSize: 18, // Large for outdoor readability
    fontWeight: '600',
    color: '#212121',
    marginBottom: 2,
  },
  chemicalName: {
    fontSize: 16,
    color: '#424242',
    marginBottom: 2,
  },
  amountText: {
    fontSize: 14,
    color: '#757575',
  },

  // Status badge (right side)
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginLeft: 8,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#ffffff',
  },

  // Row separator
  separator: {
    height: 4,
  },

  // Centered container for loading/error states
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    backgroundColor: '#f5f5f5',
  },

  // Loading state
  loadingText: {
    fontSize: 16,
    color: '#757575',
    marginTop: 12,
  },

  // Error state
  errorTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#d32f2f',
    marginBottom: 8,
  },
  errorMessage: {
    fontSize: 16,
    color: '#757575',
    textAlign: 'center',
    marginBottom: 24,
  },
  retryButton: {
    backgroundColor: '#2e7d32',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },

  // Empty state
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#424242',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 16,
    color: '#757575',
    textAlign: 'center',
    lineHeight: 24,
  },

  // Footer loading indicator
  footerLoader: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 16,
  },
  footerText: {
    fontSize: 14,
    color: '#757575',
    marginLeft: 8,
  },
});

export default HistoryScreen;
