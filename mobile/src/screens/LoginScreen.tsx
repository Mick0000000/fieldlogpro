/**
 * LoginScreen.tsx
 *
 * The login screen for the pesticide tracking app.
 *
 * REACT NATIVE CONCEPTS:
 * - View: Like a <div> in web development - a container for other elements
 * - Text: Required for all text content (unlike web where text can be anywhere)
 * - TextInput: Like <input> in web - for user text entry
 * - TouchableOpacity: A button that fades when pressed (provides feedback)
 * - StyleSheet: Creates optimized styles (like CSS but as JavaScript objects)
 * - KeyboardAvoidingView: Moves content up when keyboard appears so inputs stay visible
 * - Platform: Detects iOS vs Android for platform-specific behavior
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

// Import our typed Redux hooks and actions
import { useAppDispatch, useAppSelector } from '../hooks/useRedux';
import { login, clearError } from '../store/authSlice';
import { RootStackParamList } from '../types';

// Type for navigation - tells TypeScript what screens we can navigate to
type LoginScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Login'>;

/**
 * LoginScreen Component
 *
 * Displays a form for users to sign in with their email and password.
 * Uses Redux to manage authentication state and dispatch login actions.
 */
export default function LoginScreen() {
  // ============================================
  // STATE MANAGEMENT
  // ============================================

  // Local state for form inputs
  // useState returns [currentValue, setterFunction]
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');

  // Get dispatch function to send actions to Redux store
  const dispatch = useAppDispatch();

  // Get authentication state from Redux store
  // useAppSelector lets us "select" specific pieces of state
  const { isLoading, error } = useAppSelector((state) => state.auth);

  // Navigation hook to move between screens
  const navigation = useNavigation<LoginScreenNavigationProp>();

  // ============================================
  // VALIDATION FUNCTIONS
  // ============================================

  /**
   * Validates email format using a simple regex pattern
   * Returns true if valid, false otherwise
   */
  const validateEmail = (emailToValidate: string): boolean => {
    // Basic email pattern: something@something.something
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailPattern.test(emailToValidate);
  };

  /**
   * Validates all form inputs
   * Returns true if all inputs are valid
   */
  const validateForm = (): boolean => {
    let isValid = true;

    // Clear previous errors
    setEmailError('');
    setPasswordError('');

    // Check email
    if (!email.trim()) {
      setEmailError('Email is required');
      isValid = false;
    } else if (!validateEmail(email)) {
      setEmailError('Please enter a valid email address');
      isValid = false;
    }

    // Check password
    if (!password) {
      setPasswordError('Password is required');
      isValid = false;
    } else if (password.length < 6) {
      setPasswordError('Password must be at least 6 characters');
      isValid = false;
    }

    return isValid;
  };

  // ============================================
  // EVENT HANDLERS
  // ============================================

  /**
   * Handles the sign in button press
   * Validates inputs, then dispatches login action
   */
  const handleSignIn = async () => {
    // Clear any previous API errors
    dispatch(clearError());

    // Validate form before submitting
    if (!validateForm()) {
      return;
    }

    try {
      // Dispatch the login action with email and password
      // unwrap() throws an error if the action was rejected
      await dispatch(login({ email: email.trim(), password })).unwrap();
      // If successful, navigation will happen automatically via the navigator
    } catch (err) {
      // Error is already handled by Redux and displayed via the error state
      // We could add additional handling here if needed
    }
  };

  /**
   * Navigates to the signup screen
   */
  const handleGoToSignup = () => {
    // Clear any errors before navigating
    dispatch(clearError());
    setEmailError('');
    setPasswordError('');
    navigation.navigate('Signup');
  };

  // ============================================
  // RENDER
  // ============================================

  return (
    // KeyboardAvoidingView pushes content up when keyboard opens
    // behavior differs between iOS (padding) and Android (height)
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
    >
      {/* ScrollView allows scrolling if content doesn't fit on screen */}
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled" // Allows tapping buttons while keyboard is open
        showsVerticalScrollIndicator={false}
      >
        {/* Header Section */}
        <View style={styles.header}>
          <Text style={styles.title}>Field Log Pro</Text>
          <Text style={styles.subtitle}>Sign in to your account</Text>
        </View>

        {/* Form Section */}
        <View style={styles.form}>
          {/* API Error Message - shown if login fails */}
          {error && (
            <View style={styles.errorBanner}>
              <Text style={styles.errorBannerText}>{error}</Text>
            </View>
          )}

          {/* Email Input */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Email</Text>
            <TextInput
              style={[
                styles.input,
                emailError ? styles.inputError : null, // Add red border if error
              ]}
              value={email}
              onChangeText={(text) => {
                setEmail(text);
                setEmailError(''); // Clear error when user types
              }}
              placeholder="your@email.com"
              placeholderTextColor="#999"
              keyboardType="email-address" // Shows @ symbol on keyboard
              autoCapitalize="none" // Don't capitalize email
              autoCorrect={false} // Don't autocorrect email
              autoComplete="email" // Helps password managers
              editable={!isLoading} // Disable while loading
            />
            {/* Field-level error message */}
            {emailError ? (
              <Text style={styles.fieldError}>{emailError}</Text>
            ) : null}
          </View>

          {/* Password Input */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Password</Text>
            <TextInput
              style={[
                styles.input,
                passwordError ? styles.inputError : null,
              ]}
              value={password}
              onChangeText={(text) => {
                setPassword(text);
                setPasswordError(''); // Clear error when user types
              }}
              placeholder="Enter your password"
              placeholderTextColor="#999"
              secureTextEntry // Hides password with dots
              autoCapitalize="none"
              autoComplete="password"
              editable={!isLoading}
            />
            {passwordError ? (
              <Text style={styles.fieldError}>{passwordError}</Text>
            ) : null}
          </View>

          {/* Sign In Button */}
          <TouchableOpacity
            style={[
              styles.button,
              isLoading ? styles.buttonDisabled : null, // Gray out when loading
            ]}
            onPress={handleSignIn}
            disabled={isLoading} // Prevent double-taps while loading
            activeOpacity={0.8} // Slight fade on press for feedback
          >
            {isLoading ? (
              // Show spinner while loading
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Text style={styles.buttonText}>Sign In</Text>
            )}
          </TouchableOpacity>

          {/* Link to Signup */}
          <View style={styles.linkContainer}>
            <Text style={styles.linkText}>Don't have an account? </Text>
            <TouchableOpacity onPress={handleGoToSignup} disabled={isLoading}>
              <Text style={styles.link}>Create one</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

// ============================================
// STYLES
// ============================================

/**
 * StyleSheet.create optimizes styles for React Native
 *
 * Key differences from CSS:
 * - camelCase instead of kebab-case (backgroundColor not background-color)
 * - Numbers are density-independent pixels (dp) by default
 * - No units needed (just 16 not '16px')
 * - Flexbox is the default layout system
 */
const styles = StyleSheet.create({
  // Main container - fills entire screen
  container: {
    flex: 1, // Take up all available space
    backgroundColor: '#f5f5f5', // Light gray background
  },

  // ScrollView content - centered with padding
  scrollContent: {
    flexGrow: 1, // Allow content to grow
    justifyContent: 'center', // Center vertically
    padding: 24, // Space from edges
  },

  // Header section with title
  header: {
    alignItems: 'center', // Center horizontally
    marginBottom: 40,
  },

  // App title
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#2e7d32', // Green theme color
    marginBottom: 8,
  },

  // Subtitle text
  subtitle: {
    fontSize: 18,
    color: '#666',
  },

  // Form container
  form: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    // Shadow for iOS
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    // Shadow for Android
    elevation: 4,
  },

  // Error banner at top of form
  errorBanner: {
    backgroundColor: '#ffebee', // Light red
    borderColor: '#f44336', // Red border
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },

  errorBannerText: {
    color: '#c62828', // Dark red text
    fontSize: 14,
    textAlign: 'center',
  },

  // Input group (label + input + error)
  inputGroup: {
    marginBottom: 20,
  },

  // Input label
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },

  // Text input field - large and touch-friendly for field use
  input: {
    backgroundColor: '#f9f9f9',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14, // Makes it taller for easier tapping
    fontSize: 18, // Large text for readability
    color: '#333',
    minHeight: 56, // 48px minimum + padding for touch targets
  },

  // Input with error - red border
  inputError: {
    borderColor: '#f44336',
    borderWidth: 2,
  },

  // Field-level error text
  fieldError: {
    color: '#f44336',
    fontSize: 14,
    marginTop: 6,
  },

  // Primary button - large and easy to tap with gloves
  button: {
    backgroundColor: '#2e7d32', // Green theme
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    minHeight: 56, // Touch-friendly height
  },

  // Disabled button style
  buttonDisabled: {
    backgroundColor: '#a5d6a7', // Lighter green
  },

  // Button text
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },

  // Container for the signup link
  linkContainer: {
    flexDirection: 'row', // Horizontal layout
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 24,
  },

  // Regular text before link
  linkText: {
    fontSize: 16,
    color: '#666',
  },

  // Clickable link text
  link: {
    fontSize: 16,
    color: '#2e7d32', // Green theme
    fontWeight: '600',
  },
});
