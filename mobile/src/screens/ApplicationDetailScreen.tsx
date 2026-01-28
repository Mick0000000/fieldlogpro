/**
 * ApplicationDetailScreen - Full Application Details View
 *
 * This screen displays all the details of a single pesticide application.
 * It's accessed by tapping on a row in the History screen.
 *
 * REACT NATIVE CONCEPTS EXPLAINED:
 *
 * ScrollView: A scrollable container for content that might be
 * taller than the screen. Unlike FlatList, ScrollView renders all
 * its children at once (fine for small amounts of content).
 *
 * useRoute: A React Navigation hook that provides access to the
 * route object, which contains parameters passed from the previous screen.
 *
 * Conditional Rendering: In JSX, we use {condition && <Component />}
 * to only render something when a condition is true.
 *
 * Optional Chaining (?.): Safely access nested properties that might
 * be undefined. Example: item?.customer?.name
 */

import React, { useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
// Navigation hooks
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

// Custom typed Redux hooks
import { useAppDispatch, useAppSelector } from '../hooks/useRedux';
// Redux actions
import { fetchApplicationById, clearSelectedApplication } from '../store/applicationsSlice';
// Type definitions
import { HistoryStackParamList } from '../types';

// Type for the route prop - tells TypeScript what params this screen receives
type ApplicationDetailRouteProp = RouteProp<HistoryStackParamList, 'ApplicationDetail'>;
// Type for the navigation prop
type ApplicationDetailNavigationProp = NativeStackNavigationProp<
  HistoryStackParamList,
  'ApplicationDetail'
>;

/**
 * Main Application Detail Screen Component
 */
const ApplicationDetailScreen: React.FC = () => {
  // ==========================================
  // HOOKS SECTION
  // ==========================================

  // Get navigation and route objects
  const navigation = useNavigation<ApplicationDetailNavigationProp>();
  const route = useRoute<ApplicationDetailRouteProp>();

  // Extract the applicationId from route params
  // This was passed when navigating from the History screen
  const { applicationId } = route.params;

  // Get dispatch function for Redux actions
  const dispatch = useAppDispatch();

  // Select the application data and loading state from Redux
  const {
    selectedApplication: application, // The fetched application (renamed for clarity)
    isLoading,
    error,
  } = useAppSelector((state) => state.applications);

  // ==========================================
  // DATA FETCHING
  // ==========================================

  /**
   * Fetch the application details when the screen loads
   *
   * useEffect runs when the component mounts and whenever
   * applicationId changes (though it shouldn't change while on this screen).
   */
  useEffect(() => {
    // Dispatch action to fetch the application by ID
    dispatch(fetchApplicationById(applicationId));

    // Cleanup: Clear the selected application when leaving the screen
    // This prevents stale data from showing briefly on the next visit
    return () => {
      dispatch(clearSelectedApplication());
    };
  }, [dispatch, applicationId]);

  // ==========================================
  // HELPER FUNCTIONS
  // ==========================================

  /**
   * Format a date string to a readable format
   * Example: "January 15, 2024 at 10:30 AM"
   */
  const formatDateTime = (dateString: string): string => {
    const date = new Date(dateString);
    const dateOptions: Intl.DateTimeFormatOptions = {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    };
    const timeOptions: Intl.DateTimeFormatOptions = {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    };
    const formattedDate = date.toLocaleDateString('en-US', dateOptions);
    const formattedTime = date.toLocaleTimeString('en-US', timeOptions);
    return `${formattedDate} at ${formattedTime}`;
  };

  /**
   * Format coordinates for display
   */
  const formatCoordinates = (lat: number | null, lng: number | null): string => {
    if (lat === null || lng === null) return 'Not recorded';
    // Format to 6 decimal places
    return `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
  };

  /**
   * Get the color for a status badge
   */
  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'completed':
        return '#2e7d32'; // Green
      case 'voided':
        return '#d32f2f'; // Red
      default:
        return '#757575'; // Gray
    }
  };

  /**
   * Get background color for signal word (chemical hazard level)
   */
  const getSignalWordColor = (signalWord: string | null): string => {
    if (!signalWord) return '#e0e0e0';
    switch (signalWord.toLowerCase()) {
      case 'danger':
        return '#ffcdd2'; // Light red
      case 'warning':
        return '#fff9c4'; // Light yellow
      case 'caution':
        return '#c8e6c9'; // Light green
      default:
        return '#e0e0e0'; // Gray
    }
  };

  // ==========================================
  // RENDER HELPER COMPONENTS
  // ==========================================

  /**
   * Reusable component for a section header
   */
  const SectionHeader: React.FC<{ title: string }> = ({ title }) => (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{title}</Text>
    </View>
  );

  /**
   * Reusable component for a detail row (label + value)
   *
   * @param label - The label text (e.g., "Customer Name")
   * @param value - The value to display
   * @param highlight - Optional: highlight the value with color
   */
  const DetailRow: React.FC<{
    label: string;
    value: string | number | null | undefined;
    highlight?: string;
  }> = ({ label, value, highlight }) => (
    <View style={styles.detailRow}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text
        style={[
          styles.detailValue,
          highlight ? { color: highlight, fontWeight: '600' } : null,
        ]}
      >
        {value || 'Not specified'}
      </Text>
    </View>
  );

  // ==========================================
  // RENDER STATES
  // ==========================================

  // Show loading spinner while fetching
  if (isLoading || !application) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#2e7d32" />
        <Text style={styles.loadingText}>Loading application details...</Text>
      </View>
    );
  }

  // Show error state if fetch failed
  if (error) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorTitle}>Unable to Load Details</Text>
        <Text style={styles.errorMessage}>{error}</Text>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // ==========================================
  // MAIN RENDER
  // ==========================================

  return (
    <View style={styles.container}>
      {/* Header with back button and status */}
      <View style={styles.header}>
        {/* Back button */}
        <TouchableOpacity
          style={styles.headerBackButton}
          onPress={() => navigation.goBack()}
          accessibilityLabel="Go back to history"
          accessibilityRole="button"
        >
          <Text style={styles.headerBackText}>Back</Text>
        </TouchableOpacity>

        {/* Header title */}
        <Text style={styles.headerTitle}>Application Details</Text>

        {/* Status badge */}
        <View
          style={[
            styles.headerStatus,
            { backgroundColor: getStatusColor(application.status) },
          ]}
        >
          <Text style={styles.headerStatusText}>
            {application.status.charAt(0).toUpperCase() + application.status.slice(1)}
          </Text>
        </View>
      </View>

      {/* Scrollable content */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        // Show scroll indicator for large content
        showsVerticalScrollIndicator={true}
      >
        {/* ===== DATE & TIME SECTION ===== */}
        <SectionHeader title="Date & Time" />
        <View style={styles.card}>
          <Text style={styles.dateTimeText}>
            {formatDateTime(application.applicationDate)}
          </Text>
        </View>

        {/* ===== CUSTOMER SECTION ===== */}
        <SectionHeader title="Customer" />
        <View style={styles.card}>
          {/* Customer name - prominent */}
          <Text style={styles.primaryText}>
            {application.customer?.name || 'Unknown Customer'}
          </Text>

          {/* Customer address */}
          {application.customer?.address && (
            <Text style={styles.secondaryText}>
              {application.customer.address}
              {application.customer.city && `, ${application.customer.city}`}
              {application.customer.state && `, ${application.customer.state}`}
            </Text>
          )}
        </View>

        {/* ===== APPLICATOR SECTION ===== */}
        <SectionHeader title="Applicator" />
        <View style={styles.card}>
          {/* Applicator name */}
          <DetailRow
            label="Name"
            value={
              application.applicator
                ? `${application.applicator.firstName} ${application.applicator.lastName}`
                : 'Not specified'
            }
          />

          {/* Applicator email (if available) */}
          {application.applicator?.email && (
            <DetailRow label="Email" value={application.applicator.email} />
          )}
        </View>

        {/* ===== CHEMICAL SECTION ===== */}
        <SectionHeader title="Chemical Applied" />
        <View style={styles.card}>
          {/* Chemical name - prominent */}
          <Text style={styles.primaryText}>{application.chemicalName}</Text>

          {/* EPA Registration Number */}
          <DetailRow
            label="EPA Number"
            value={application.epaNumber || application.chemical?.epaNumber}
          />

          {/* Signal word with colored background */}
          {(application.chemical?.signalWord) && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Signal Word</Text>
              <View
                style={[
                  styles.signalWordBadge,
                  { backgroundColor: getSignalWordColor(application.chemical.signalWord) },
                ]}
              >
                <Text style={styles.signalWordText}>
                  {application.chemical.signalWord.toUpperCase()}
                </Text>
              </View>
            </View>
          )}

          {/* Active ingredient (if available) */}
          {application.chemical?.activeIngredient && (
            <DetailRow
              label="Active Ingredient"
              value={application.chemical.activeIngredient}
            />
          )}

          {/* Manufacturer (if available) */}
          {application.chemical?.manufacturer && (
            <DetailRow label="Manufacturer" value={application.chemical.manufacturer} />
          )}
        </View>

        {/* ===== APPLICATION DETAILS SECTION ===== */}
        <SectionHeader title="Application Details" />
        <View style={styles.card}>
          {/* Amount applied */}
          <DetailRow
            label="Amount"
            value={`${application.amount} ${application.unit}`}
            highlight="#2e7d32"
          />

          {/* Application method (if specified) */}
          {application.applicationMethod && (
            <DetailRow label="Method" value={application.applicationMethod} />
          )}

          {/* Area treated (if specified) */}
          {application.areaTreated && (
            <DetailRow
              label="Area Treated"
              value={`${application.areaTreated} ${application.areaUnit || 'sq ft'}`}
            />
          )}

          {/* Reentry interval (if specified) */}
          {application.reentryInterval && (
            <DetailRow label="Reentry Interval" value={application.reentryInterval} />
          )}
        </View>

        {/* ===== TARGET PEST SECTION (if specified) ===== */}
        {(application.targetPestName || application.targetPest) && (
          <>
            <SectionHeader title="Target Pest" />
            <View style={styles.card}>
              <Text style={styles.primaryText}>
                {application.targetPestName || application.targetPest?.name}
              </Text>
              {application.targetPest?.category && (
                <DetailRow label="Category" value={application.targetPest.category} />
              )}
              {application.targetPest?.description && (
                <Text style={styles.descriptionText}>
                  {application.targetPest.description}
                </Text>
              )}
            </View>
          </>
        )}

        {/* ===== LOCATION SECTION ===== */}
        <SectionHeader title="Location" />
        <View style={styles.card}>
          <DetailRow
            label="GPS Coordinates"
            value={formatCoordinates(application.latitude ?? null, application.longitude ?? null)}
          />
        </View>

        {/* ===== WEATHER SECTION (if any weather data exists) ===== */}
        {(application.temperature ||
          application.humidity ||
          application.windSpeed ||
          application.weatherCondition) && (
          <>
            <SectionHeader title="Weather Conditions" />
            <View style={styles.card}>
              {application.temperature !== null && application.temperature !== undefined && (
                <DetailRow
                  label="Temperature"
                  value={`${application.temperature}°F`}
                />
              )}
              {application.humidity !== null && application.humidity !== undefined && (
                <DetailRow label="Humidity" value={`${application.humidity}%`} />
              )}
              {application.windSpeed !== null && application.windSpeed !== undefined && (
                <DetailRow
                  label="Wind"
                  value={`${application.windSpeed} mph${
                    application.windDirection ? ` ${application.windDirection}` : ''
                  }`}
                />
              )}
              {application.weatherCondition && (
                <DetailRow label="Conditions" value={application.weatherCondition} />
              )}
            </View>
          </>
        )}

        {/* ===== NOTES SECTION (if notes exist) ===== */}
        {application.notes && (
          <>
            <SectionHeader title="Notes" />
            <View style={styles.card}>
              <Text style={styles.notesText}>{application.notes}</Text>
            </View>
          </>
        )}

        {/* ===== RECORD INFO SECTION ===== */}
        <SectionHeader title="Record Information" />
        <View style={styles.card}>
          <DetailRow label="Application ID" value={application.id} />
          <DetailRow
            label="Customer Consent"
            value={application.customerConsent ? 'Yes' : 'No'}
            highlight={application.customerConsent ? '#2e7d32' : '#d32f2f'}
          />
          <DetailRow
            label="Created"
            value={formatDateTime(application.createdAt)}
          />
          {application.updatedAt !== application.createdAt && (
            <DetailRow
              label="Last Updated"
              value={formatDateTime(application.updatedAt)}
            />
          )}
        </View>

        {/* Bottom spacing */}
        <View style={styles.bottomSpacer} />
      </ScrollView>
    </View>
  );
};

// ==========================================
// STYLES
// ==========================================

const styles = StyleSheet.create({
  // Main container
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#2e7d32',
    paddingVertical: 12,
    paddingHorizontal: 16,
    // Shadow
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  headerBackButton: {
    paddingVertical: 8,
    paddingRight: 16,
  },
  headerBackText: {
    fontSize: 16,
    color: '#ffffff',
    fontWeight: '500',
  },
  headerTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
    textAlign: 'center',
  },
  headerStatus: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  headerStatusText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#ffffff',
  },

  // Scroll view
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },

  // Section headers
  sectionHeader: {
    marginTop: 16,
    marginBottom: 8,
    paddingLeft: 4,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2e7d32',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },

  // Card container for grouped content
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    // Shadow
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },

  // Primary text (names, prominent values)
  primaryText: {
    fontSize: 20, // Large for outdoor readability
    fontWeight: '600',
    color: '#212121',
    marginBottom: 4,
  },

  // Secondary text (addresses, descriptions)
  secondaryText: {
    fontSize: 16,
    color: '#616161',
    lineHeight: 22,
  },

  // Date/time display
  dateTimeText: {
    fontSize: 18,
    fontWeight: '500',
    color: '#212121',
  },

  // Detail row (label + value pair)
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  detailLabel: {
    fontSize: 16,
    color: '#757575',
    flex: 1,
  },
  detailValue: {
    fontSize: 16,
    color: '#212121',
    flex: 1,
    textAlign: 'right',
  },

  // Signal word badge
  signalWordBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 8,
  },
  signalWordText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#424242',
  },

  // Notes text
  notesText: {
    fontSize: 16,
    color: '#424242',
    lineHeight: 24,
  },

  // Description text
  descriptionText: {
    fontSize: 14,
    color: '#757575',
    fontStyle: 'italic',
    marginTop: 8,
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

  // Back button (in error state)
  backButton: {
    backgroundColor: '#2e7d32',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },

  // Bottom spacer for scroll padding
  bottomSpacer: {
    height: 32,
  },
});

export default ApplicationDetailScreen;
