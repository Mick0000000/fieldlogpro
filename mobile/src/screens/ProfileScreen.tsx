/**
 * ProfileScreen - User Profile Management Screen
 *
 * This screen allows users to:
 * 1. View and edit their profile information
 * 2. View their company information (read-only)
 * 3. Log out of the application
 *
 * REACT NATIVE CONCEPTS EXPLAINED:
 *
 * ScrollView:
 *   - A container that allows content to be scrolled when it exceeds the screen height
 *   - Use it when your content might be longer than the available screen space
 *   - Unlike a regular View, ScrollView can scroll its children vertically or horizontally
 *
 * TextInput:
 *   - The basic text input component for user-editable text
 *   - Similar to <input type="text"> in HTML
 *   - Props like `value` and `onChangeText` make it a controlled component
 *   - `editable={false}` makes it read-only (like a disabled input)
 *
 * Alert.alert():
 *   - Shows a native alert dialog (like window.confirm() in web)
 *   - First argument: title
 *   - Second argument: message
 *   - Third argument: array of buttons with their handlers
 *
 * TouchableOpacity:
 *   - A touchable component that reduces opacity when pressed
 *   - Use it for buttons and clickable elements
 *   - `activeOpacity` controls how transparent it gets when pressed
 *
 * useState Hook:
 *   - React hook to manage local component state
 *   - Returns [currentValue, setterFunction]
 *   - Each call to the setter triggers a re-render
 *
 * useEffect Hook:
 *   - React hook to perform side effects (like initializing form data)
 *   - Runs after render; dependency array controls when it re-runs
 *   - Empty dependency array [] means it only runs once on mount
 *
 * Redux Integration:
 *   - useAppSelector: reads data from the Redux store
 *   - useAppDispatch: returns a function to dispatch actions
 *   - dispatch(action) sends an action to the Redux store
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';

// Import typed Redux hooks for type-safe store access
import { useAppDispatch, useAppSelector } from '../hooks/useRedux';

// Import auth actions from the Redux slice
import { logout, updateProfile, clearError } from '../store/authSlice';

/**
 * ProfileScreen Component
 *
 * Main profile management screen that displays:
 * - User avatar/icon and name
 * - Editable profile fields
 * - Company information (read-only)
 * - Logout button
 */
export default function ProfileScreen() {
  // ============================================
  // REDUX STATE ACCESS
  // ============================================

  /**
   * useAppDispatch gives us the dispatch function to send actions to Redux.
   * We'll use this to trigger logout and updateProfile actions.
   */
  const dispatch = useAppDispatch();

  /**
   * useAppSelector lets us read data from the Redux store.
   * Here we're extracting the user, isLoading, and error from auth state.
   *
   * The callback (state) => state.auth gives us the auth slice,
   * and we destructure the properties we need.
   */
  const { user, isLoading, error } = useAppSelector((state) => state.auth);

  // ============================================
  // LOCAL STATE FOR FORM FIELDS
  // ============================================

  /**
   * Local state for editable form fields.
   * We use local state (not Redux) for form inputs because:
   * 1. It's more responsive (no dispatch on every keystroke)
   * 2. It allows us to "cancel" edits without affecting the store
   * 3. We only update Redux when the user explicitly saves
   */
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [licenseNumber, setLicenseNumber] = useState('');
  const [licenseState, setLicenseState] = useState('');

  /**
   * Local state for tracking save operation status.
   * We use this to show success/error feedback after saving.
   */
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // ============================================
  // EFFECTS
  // ============================================

  /**
   * Initialize form fields when user data is available.
   *
   * useEffect runs after the component renders. The dependency array [user]
   * means this effect will re-run whenever the `user` object changes.
   *
   * This populates the form with the current user data when:
   * - The screen first loads
   * - The user data is updated in Redux
   */
  useEffect(() => {
    if (user) {
      setFirstName(user.firstName || '');
      setLastName(user.lastName || '');
      setLicenseNumber(user.licenseNumber || '');
      setLicenseState(user.licenseState || '');
    }
  }, [user]);

  /**
   * Clear success message after 3 seconds.
   * This creates a better UX by not leaving the success message indefinitely.
   */
  useEffect(() => {
    if (saveSuccess) {
      const timer = setTimeout(() => {
        setSaveSuccess(false);
      }, 3000);

      // Cleanup function: clear the timer if component unmounts
      // or if saveSuccess changes before the timer fires
      return () => clearTimeout(timer);
    }
  }, [saveSuccess]);

  /**
   * Clear any Redux errors when the component mounts or unmounts.
   * This ensures we don't show stale error messages.
   */
  useEffect(() => {
    return () => {
      dispatch(clearError());
    };
  }, [dispatch]);

  // ============================================
  // EVENT HANDLERS
  // ============================================

  /**
   * Handle saving profile changes.
   *
   * This function:
   * 1. Dispatches the updateProfile action with the form data
   * 2. Shows success or error feedback based on the result
   *
   * The `unwrap()` method on the dispatch result allows us to:
   * - await the async action completion
   * - catch any errors thrown by the thunk
   */
  const handleSaveChanges = async () => {
    // Clear any previous success/error state
    setSaveSuccess(false);
    dispatch(clearError());
    setIsSaving(true);

    try {
      // Dispatch the updateProfile action and wait for it to complete
      // unwrap() converts the resolved action into its payload or throws on rejection
      await dispatch(
        updateProfile({
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          licenseNumber: licenseNumber.trim() || undefined,
          licenseState: licenseState.trim().toUpperCase() || undefined,
        })
      ).unwrap();

      // If we get here, the update was successful
      setSaveSuccess(true);
    } catch (err) {
      // Error is already handled by Redux, but we could add additional handling here
      // The error message will be shown from the Redux error state
    } finally {
      setIsSaving(false);
    }
  };

  /**
   * Handle logout button press.
   *
   * Shows a confirmation dialog before logging out.
   * Alert.alert() is the React Native way to show native dialogs.
   */
  const handleLogout = () => {
    Alert.alert(
      'Confirm Logout', // Dialog title
      'Are you sure you want to log out?', // Dialog message
      [
        {
          // Cancel button - does nothing, just closes the dialog
          text: 'Cancel',
          style: 'cancel', // iOS: shows as a cancel-style button
        },
        {
          // Logout button - dispatches the logout action
          text: 'Logout',
          style: 'destructive', // iOS: shows in red to indicate destructive action
          onPress: () => {
            dispatch(logout());
            // Note: The navigation will automatically redirect to login
            // because AppNavigator checks auth state
          },
        },
      ]
    );
  };

  /**
   * Format the subscription status for display.
   * Capitalizes the first letter for a nicer presentation.
   */
  const formatSubscriptionStatus = (status: string): string => {
    return status.charAt(0).toUpperCase() + status.slice(1);
  };

  /**
   * Format date for display.
   * Converts ISO date string to a human-readable format.
   */
  const formatDate = (dateString: string | null | undefined): string => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  // ============================================
  // RENDER HELPERS
  // ============================================

  /**
   * Get user's display name.
   * Falls back to email if name is not available.
   */
  const getDisplayName = (): string => {
    if (user?.firstName || user?.lastName) {
      return `${user.firstName || ''} ${user.lastName || ''}`.trim();
    }
    return user?.email || 'User';
  };

  /**
   * Get user's initials for the avatar.
   * Uses first letter of first and last name, or first two letters of email.
   */
  const getInitials = (): string => {
    if (user?.firstName && user?.lastName) {
      return `${user.firstName[0]}${user.lastName[0]}`.toUpperCase();
    }
    if (user?.firstName) {
      return user.firstName.substring(0, 2).toUpperCase();
    }
    if (user?.email) {
      return user.email.substring(0, 2).toUpperCase();
    }
    return 'U';
  };

  // ============================================
  // RENDER
  // ============================================

  /**
   * If user data isn't available yet, show a loading state.
   * This shouldn't normally happen since the screen is only accessible when logged in,
   * but it's good defensive programming.
   */
  if (!user) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2e7d32" />
        <Text style={styles.loadingText}>Loading profile...</Text>
      </View>
    );
  }

  return (
    /**
     * KeyboardAvoidingView pushes content up when the keyboard opens.
     * This prevents the keyboard from covering the input fields.
     *
     * behavior="padding" on iOS adds padding at the bottom
     * On Android, the system usually handles this automatically
     */
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {/**
       * ScrollView allows the content to scroll when it exceeds screen height.
       * keyboardShouldPersistTaps="handled" ensures taps on buttons work
       * even when the keyboard is open.
       */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* ============================================ */}
        {/* USER HEADER SECTION */}
        {/* ============================================ */}
        <View style={styles.headerSection}>
          {/**
           * Avatar circle with user's initials.
           * This is a simple circular View with centered text.
           */}
          <View style={styles.avatarContainer}>
            <Text style={styles.avatarText}>{getInitials()}</Text>
          </View>

          {/* Display user's full name */}
          <Text style={styles.userName}>{getDisplayName()}</Text>

          {/* Display user's email (always visible, not editable) */}
          <Text style={styles.userEmail}>{user.email}</Text>

          {/* Display user's role badge */}
          <View style={styles.roleBadge}>
            <Text style={styles.roleText}>
              {user.role === 'admin' ? 'Administrator' : 'Applicator'}
            </Text>
          </View>
        </View>

        {/* ============================================ */}
        {/* SUCCESS MESSAGE */}
        {/* ============================================ */}
        {saveSuccess && (
          <View style={styles.successBanner}>
            <Text style={styles.successText}>Profile updated successfully!</Text>
          </View>
        )}

        {/* ============================================ */}
        {/* ERROR MESSAGE */}
        {/* ============================================ */}
        {error && (
          <View style={styles.errorBanner}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        {/* ============================================ */}
        {/* EDIT PROFILE SECTION */}
        {/* ============================================ */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>EDIT PROFILE</Text>

          {/**
           * First Name Input Field
           *
           * TextInput is the basic text input component in React Native.
           * - value: controlled value from state
           * - onChangeText: called with the new text when user types
           * - placeholder: hint text shown when empty
           * - autoCapitalize: controls automatic capitalization
           */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>First Name</Text>
            <TextInput
              style={styles.input}
              value={firstName}
              onChangeText={setFirstName}
              placeholder="Enter first name"
              placeholderTextColor="#999"
              autoCapitalize="words"
              autoCorrect={false}
            />
          </View>

          {/* Last Name Input Field */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Last Name</Text>
            <TextInput
              style={styles.input}
              value={lastName}
              onChangeText={setLastName}
              placeholder="Enter last name"
              placeholderTextColor="#999"
              autoCapitalize="words"
              autoCorrect={false}
            />
          </View>

          {/**
           * Email Field (Read-Only)
           *
           * We show email as a disabled input so users know they can't change it.
           * editable={false} prevents user interaction.
           * The disabled style makes it visually distinct.
           */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Email</Text>
            <TextInput
              style={[styles.input, styles.inputDisabled]}
              value={user.email}
              editable={false}
            />
            <Text style={styles.inputHint}>Email cannot be changed</Text>
          </View>

          {/**
           * Applicator License Number Input
           *
           * This field stores the user's professional license number.
           * autoCapitalize="characters" makes all input uppercase.
           */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Applicator License Number</Text>
            <TextInput
              style={styles.input}
              value={licenseNumber}
              onChangeText={setLicenseNumber}
              placeholder="Enter license number"
              placeholderTextColor="#999"
              autoCapitalize="characters"
              autoCorrect={false}
            />
          </View>

          {/**
           * License State Input
           *
           * Uses maxLength to limit to 2 characters (state code).
           * The hint helps users understand the expected format.
           */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>License State</Text>
            <TextInput
              style={[styles.input, styles.stateInput]}
              value={licenseState}
              onChangeText={(text) => setLicenseState(text.toUpperCase())}
              placeholder="CA"
              placeholderTextColor="#999"
              maxLength={2}
              autoCapitalize="characters"
              autoCorrect={false}
            />
            <Text style={styles.inputHint}>2-letter state code (e.g., CA, TX, NY)</Text>
          </View>

          {/**
           * Save Changes Button
           *
           * TouchableOpacity provides touch feedback (opacity change on press).
           * We disable it during loading to prevent double-submissions.
           * The button shows either loading indicator or text based on state.
           */}
          <TouchableOpacity
            style={[
              styles.saveButton,
              (isSaving || isLoading) && styles.buttonDisabled,
            ]}
            onPress={handleSaveChanges}
            disabled={isSaving || isLoading}
            activeOpacity={0.7}
          >
            {isSaving || isLoading ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Text style={styles.saveButtonText}>Save Changes</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* ============================================ */}
        {/* COMPANY INFORMATION SECTION */}
        {/* ============================================ */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>COMPANY</Text>

          {/**
           * Company information is displayed as read-only info rows.
           * Users can view but not edit company details.
           */}
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Company Name</Text>
            <Text style={styles.infoValue}>{user.company.name}</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Company Email</Text>
            <Text style={styles.infoValue}>{user.company.email}</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Subscription Status</Text>
            <View style={styles.statusContainer}>
              <View
                style={[
                  styles.statusBadge,
                  user.company.subscriptionStatus === 'trial'
                    ? styles.statusTrial
                    : user.company.subscriptionStatus === 'active'
                    ? styles.statusActive
                    : styles.statusInactive,
                ]}
              >
                <Text style={styles.statusBadgeText}>
                  {formatSubscriptionStatus(user.company.subscriptionStatus)}
                </Text>
              </View>
            </View>
          </View>

          {/**
           * Conditionally show trial end date only if the user is on trial.
           * This keeps the UI clean by hiding irrelevant information.
           */}
          {user.company.subscriptionStatus === 'trial' &&
            user.company.trialEndsAt && (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Trial Ends</Text>
                <Text style={styles.infoValue}>
                  {formatDate(user.company.trialEndsAt)}
                </Text>
              </View>
            )}
        </View>

        {/* ============================================ */}
        {/* ACCOUNT ACTIONS SECTION */}
        {/* ============================================ */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>ACCOUNT</Text>

          {/**
           * Logout Button
           *
           * This is styled as a "destructive" action with a different color.
           * The confirmation dialog (in handleLogout) prevents accidental logouts.
           */}
          <TouchableOpacity
            style={styles.logoutButton}
            onPress={handleLogout}
            activeOpacity={0.7}
          >
            <Text style={styles.logoutButtonText}>Logout</Text>
          </TouchableOpacity>
        </View>

        {/* Bottom spacing to ensure content isn't hidden by tab bar */}
        <View style={styles.bottomSpacer} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

// ============================================
// STYLES
// ============================================

/**
 * StyleSheet.create() is React Native's way of defining styles.
 * It's similar to CSS but uses JavaScript objects with camelCase properties.
 *
 * Key differences from web CSS:
 * - All dimensions are unitless (no 'px' or 'em')
 * - flexDirection defaults to 'column' (not 'row')
 * - Most styling is done with Flexbox
 * - No cascading - each component needs explicit styles
 */
const styles = StyleSheet.create({
  // ============================================
  // CONTAINER STYLES
  // ============================================

  /**
   * Main container - takes full screen.
   * flex: 1 means "take up all available space"
   */
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },

  /**
   * ScrollView fills the container
   */
  scrollView: {
    flex: 1,
  },

  /**
   * Content inside ScrollView with padding.
   * flexGrow: 1 allows content to expand if needed.
   */
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 24,
  },

  /**
   * Loading container - centered content
   */
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },

  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },

  // ============================================
  // HEADER SECTION STYLES
  // ============================================

  /**
   * Header section with avatar and user info.
   * Green background to match the app theme.
   */
  headerSection: {
    backgroundColor: '#2e7d32',
    paddingTop: 24,
    paddingBottom: 32,
    alignItems: 'center',
  },

  /**
   * Avatar circle - uses width/height and borderRadius to create a circle.
   * borderRadius of half the width/height creates a perfect circle.
   */
  avatarContainer: {
    width: 80,
    height: 80,
    borderRadius: 40, // Half of width/height for perfect circle
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },

  avatarText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#2e7d32',
  },

  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },

  userEmail: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
    marginBottom: 12,
  },

  /**
   * Role badge - small pill-shaped badge
   */
  roleBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 16,
  },

  roleText: {
    fontSize: 14,
    color: '#fff',
    fontWeight: '600',
  },

  // ============================================
  // FEEDBACK BANNERS
  // ============================================

  successBanner: {
    backgroundColor: '#e8f5e9',
    padding: 16,
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#2e7d32',
  },

  successText: {
    fontSize: 16,
    color: '#2e7d32',
    fontWeight: '500',
  },

  errorBanner: {
    backgroundColor: '#ffebee',
    padding: 16,
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#c62828',
  },

  errorText: {
    fontSize: 16,
    color: '#c62828',
    fontWeight: '500',
  },

  // ============================================
  // SECTION STYLES
  // ============================================

  /**
   * Each section (Edit Profile, Company, Account) is a white card.
   */
  section: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 12,
    padding: 16,
    // Shadow for iOS
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    // Shadow for Android
    elevation: 2,
  },

  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#666',
    letterSpacing: 0.5,
    marginBottom: 16,
  },

  // ============================================
  // INPUT STYLES
  // ============================================

  /**
   * Input group contains label, input, and optional hint.
   */
  inputGroup: {
    marginBottom: 16,
  },

  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },

  /**
   * Input field styling.
   * minHeight of 48 ensures good touch target size (accessibility).
   */
  input: {
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#333',
    minHeight: 48, // Minimum touch target size for accessibility
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },

  /**
   * Disabled input has lower contrast to indicate non-editable state.
   */
  inputDisabled: {
    backgroundColor: '#eee',
    color: '#666',
  },

  /**
   * State code input is narrower since it only needs 2 characters.
   */
  stateInput: {
    width: 80, // Narrow width for 2-char state code
  },

  inputHint: {
    fontSize: 13,
    color: '#888',
    marginTop: 4,
    fontStyle: 'italic',
  },

  // ============================================
  // BUTTON STYLES
  // ============================================

  /**
   * Save button - primary action button.
   * Green background to match app theme.
   */
  saveButton: {
    backgroundColor: '#2e7d32',
    borderRadius: 8,
    paddingVertical: 14,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    minHeight: 48, // Accessibility: minimum touch target
  },

  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },

  /**
   * Disabled button has reduced opacity.
   */
  buttonDisabled: {
    opacity: 0.6,
  },

  /**
   * Logout button - destructive action with red color.
   */
  logoutButton: {
    backgroundColor: '#c62828',
    borderRadius: 8,
    paddingVertical: 14,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48, // Accessibility: minimum touch target
  },

  logoutButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },

  // ============================================
  // INFO ROW STYLES (for Company section)
  // ============================================

  /**
   * Info row displays label and value side by side.
   */
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },

  infoLabel: {
    fontSize: 16,
    color: '#666',
    flex: 1,
  },

  infoValue: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
    flex: 1,
    textAlign: 'right',
  },

  // ============================================
  // STATUS BADGE STYLES
  // ============================================

  statusContainer: {
    flex: 1,
    alignItems: 'flex-end',
  },

  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },

  statusTrial: {
    backgroundColor: '#fff3e0',
  },

  statusActive: {
    backgroundColor: '#e8f5e9',
  },

  statusInactive: {
    backgroundColor: '#ffebee',
  },

  statusBadgeText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },

  // ============================================
  // SPACING
  // ============================================

  /**
   * Bottom spacer ensures content isn't hidden behind tab bar.
   */
  bottomSpacer: {
    height: 24,
  },
});
