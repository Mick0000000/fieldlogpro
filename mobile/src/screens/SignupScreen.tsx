/**
 * SignupScreen.tsx
 *
 * Registration screen for new companies joining the pesticide tracking app.
 *
 * REACT NATIVE CONCEPTS CONTINUED:
 * - This screen builds on concepts from LoginScreen
 * - Multiple TextInputs can be navigated with returnKeyType and onSubmitEditing
 * - useRef creates references to components (like document.getElementById in web)
 * - TextInput refs let us focus the next input when user presses "Next" on keyboard
 */

import React, { useState, useRef } from 'react';
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
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

// Import our typed Redux hooks and actions
import { useAppDispatch, useAppSelector } from '../hooks/useRedux';
import { signup, clearError } from '../store/authSlice';
import { RootStackParamList } from '../types';

// Type for navigation
type SignupScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Signup'>;

/**
 * SignupScreen Component
 *
 * Collects company and user information to create a new account.
 * The company admin is created along with their company in one step.
 */
export default function SignupScreen() {
  // ============================================
  // STATE MANAGEMENT
  // ============================================

  // Form field values
  const [companyName, setCompanyName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');

  // Form field errors
  const [errors, setErrors] = useState<{
    companyName?: string;
    email?: string;
    password?: string;
    firstName?: string;
    lastName?: string;
  }>({});

  // Redux hooks
  const dispatch = useAppDispatch();
  const { isLoading, error } = useAppSelector((state) => state.auth);

  // Navigation
  const navigation = useNavigation<SignupScreenNavigationProp>();

  // ============================================
  // INPUT REFS FOR KEYBOARD NAVIGATION
  // ============================================

  /**
   * Refs let us reference the actual TextInput components
   * We use them to move focus to the next input when user presses "Next"
   * This improves the user experience when filling out forms
   */
  const emailRef = useRef<TextInput>(null);
  const passwordRef = useRef<TextInput>(null);
  const firstNameRef = useRef<TextInput>(null);
  const lastNameRef = useRef<TextInput>(null);

  // ============================================
  // VALIDATION FUNCTIONS
  // ============================================

  /**
   * Validates email format
   */
  const validateEmail = (emailToValidate: string): boolean => {
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailPattern.test(emailToValidate);
  };

  /**
   * Checks password strength and returns feedback
   */
  const getPasswordStrength = (pwd: string): { level: string; color: string } => {
    if (pwd.length === 0) return { level: '', color: '#999' };
    if (pwd.length < 6) return { level: 'Too short', color: '#f44336' };
    if (pwd.length < 8) return { level: 'Weak', color: '#ff9800' };

    // Check for complexity
    const hasUpper = /[A-Z]/.test(pwd);
    const hasLower = /[a-z]/.test(pwd);
    const hasNumber = /[0-9]/.test(pwd);
    const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(pwd);
    const complexity = [hasUpper, hasLower, hasNumber, hasSpecial].filter(Boolean).length;

    if (complexity >= 3 && pwd.length >= 10) return { level: 'Strong', color: '#2e7d32' };
    if (complexity >= 2) return { level: 'Good', color: '#4caf50' };
    return { level: 'Fair', color: '#ff9800' };
  };

  /**
   * Validates all form fields
   */
  const validateForm = (): boolean => {
    const newErrors: typeof errors = {};

    // Company name validation
    if (!companyName.trim()) {
      newErrors.companyName = 'Company name is required';
    } else if (companyName.trim().length < 2) {
      newErrors.companyName = 'Company name must be at least 2 characters';
    }

    // Email validation
    if (!email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!validateEmail(email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    // Password validation
    if (!password) {
      newErrors.password = 'Password is required';
    } else if (password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    // First name validation
    if (!firstName.trim()) {
      newErrors.firstName = 'First name is required';
    }

    // Last name validation
    if (!lastName.trim()) {
      newErrors.lastName = 'Last name is required';
    }

    setErrors(newErrors);

    // Return true if no errors (empty object)
    return Object.keys(newErrors).length === 0;
  };

  // ============================================
  // EVENT HANDLERS
  // ============================================

  /**
   * Handles the create account button press
   */
  const handleCreateAccount = async () => {
    // Clear any previous API errors
    dispatch(clearError());

    // Validate form
    if (!validateForm()) {
      return;
    }

    try {
      // Dispatch signup action with all form data
      await dispatch(
        signup({
          companyName: companyName.trim(),
          email: email.trim(),
          password,
          firstName: firstName.trim(),
          lastName: lastName.trim(),
        })
      ).unwrap();
      // If successful, navigation happens automatically
    } catch (err) {
      // Error is handled by Redux
    }
  };

  /**
   * Navigates back to the login screen
   */
  const handleGoToLogin = () => {
    dispatch(clearError());
    setErrors({});
    navigation.navigate('Login');
  };

  /**
   * Clears a specific field error when user starts typing
   */
  const clearFieldError = (field: keyof typeof errors) => {
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  // Get password strength for display
  const passwordStrength = getPasswordStrength(password);

  // ============================================
  // RENDER
  // ============================================

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Create Account</Text>
          <Text style={styles.subtitle}>Set up your company profile</Text>
        </View>

        {/* Form */}
        <View style={styles.form}>
          {/* API Error Banner */}
          {error && (
            <View style={styles.errorBanner}>
              <Text style={styles.errorBannerText}>{error}</Text>
            </View>
          )}

          {/* Company Name Input */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Company Name</Text>
            <TextInput
              style={[styles.input, errors.companyName ? styles.inputError : null]}
              value={companyName}
              onChangeText={(text) => {
                setCompanyName(text);
                clearFieldError('companyName');
              }}
              placeholder="Your Landscaping Company"
              placeholderTextColor="#999"
              autoCapitalize="words" // Capitalize first letter of each word
              autoCorrect={false}
              returnKeyType="next" // Shows "Next" button on keyboard
              onSubmitEditing={() => emailRef.current?.focus()} // Move to next field
              editable={!isLoading}
            />
            {errors.companyName && (
              <Text style={styles.fieldError}>{errors.companyName}</Text>
            )}
          </View>

          {/* Email Input */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Email</Text>
            <TextInput
              ref={emailRef} // Attach ref so we can focus this input
              style={[styles.input, errors.email ? styles.inputError : null]}
              value={email}
              onChangeText={(text) => {
                setEmail(text);
                clearFieldError('email');
              }}
              placeholder="your@email.com"
              placeholderTextColor="#999"
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              autoComplete="email"
              returnKeyType="next"
              onSubmitEditing={() => passwordRef.current?.focus()}
              editable={!isLoading}
            />
            {errors.email && <Text style={styles.fieldError}>{errors.email}</Text>}
          </View>

          {/* Password Input */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Password</Text>
            <TextInput
              ref={passwordRef}
              style={[styles.input, errors.password ? styles.inputError : null]}
              value={password}
              onChangeText={(text) => {
                setPassword(text);
                clearFieldError('password');
              }}
              placeholder="Create a secure password"
              placeholderTextColor="#999"
              secureTextEntry
              autoCapitalize="none"
              autoComplete="password-new"
              returnKeyType="next"
              onSubmitEditing={() => firstNameRef.current?.focus()}
              editable={!isLoading}
            />
            {/* Password Strength Indicator */}
            {password.length > 0 && (
              <View style={styles.strengthContainer}>
                <View
                  style={[
                    styles.strengthBar,
                    {
                      width:
                        password.length < 6
                          ? '25%'
                          : password.length < 8
                          ? '50%'
                          : passwordStrength.level === 'Strong'
                          ? '100%'
                          : '75%',
                      backgroundColor: passwordStrength.color,
                    },
                  ]}
                />
              </View>
            )}
            {password.length > 0 && (
              <Text style={[styles.strengthText, { color: passwordStrength.color }]}>
                {passwordStrength.level}
                {passwordStrength.level === 'Too short' && ' - minimum 6 characters'}
              </Text>
            )}
            {errors.password && <Text style={styles.fieldError}>{errors.password}</Text>}
          </View>

          {/* Name Row - First and Last Name side by side */}
          <View style={styles.nameRow}>
            {/* First Name */}
            <View style={[styles.inputGroup, styles.nameInput]}>
              <Text style={styles.label}>First Name</Text>
              <TextInput
                ref={firstNameRef}
                style={[styles.input, errors.firstName ? styles.inputError : null]}
                value={firstName}
                onChangeText={(text) => {
                  setFirstName(text);
                  clearFieldError('firstName');
                }}
                placeholder="John"
                placeholderTextColor="#999"
                autoCapitalize="words"
                autoComplete="given-name"
                returnKeyType="next"
                onSubmitEditing={() => lastNameRef.current?.focus()}
                editable={!isLoading}
              />
              {errors.firstName && (
                <Text style={styles.fieldError}>{errors.firstName}</Text>
              )}
            </View>

            {/* Last Name */}
            <View style={[styles.inputGroup, styles.nameInput]}>
              <Text style={styles.label}>Last Name</Text>
              <TextInput
                ref={lastNameRef}
                style={[styles.input, errors.lastName ? styles.inputError : null]}
                value={lastName}
                onChangeText={(text) => {
                  setLastName(text);
                  clearFieldError('lastName');
                }}
                placeholder="Doe"
                placeholderTextColor="#999"
                autoCapitalize="words"
                autoComplete="family-name"
                returnKeyType="done" // Shows "Done" on last field
                onSubmitEditing={handleCreateAccount} // Submit form on "Done"
                editable={!isLoading}
              />
              {errors.lastName && (
                <Text style={styles.fieldError}>{errors.lastName}</Text>
              )}
            </View>
          </View>

          {/* Create Account Button */}
          <TouchableOpacity
            style={[styles.button, isLoading ? styles.buttonDisabled : null]}
            onPress={handleCreateAccount}
            disabled={isLoading}
            activeOpacity={0.8}
          >
            {isLoading ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Text style={styles.buttonText}>Create Account</Text>
            )}
          </TouchableOpacity>

          {/* Link to Login */}
          <View style={styles.linkContainer}>
            <Text style={styles.linkText}>Already have an account? </Text>
            <TouchableOpacity onPress={handleGoToLogin} disabled={isLoading}>
              <Text style={styles.link}>Sign In</Text>
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },

  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 24,
    paddingTop: 40, // Extra padding at top for longer form
    paddingBottom: 40,
  },

  header: {
    alignItems: 'center',
    marginBottom: 32,
  },

  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#2e7d32',
    marginBottom: 8,
  },

  subtitle: {
    fontSize: 18,
    color: '#666',
  },

  form: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },

  errorBanner: {
    backgroundColor: '#ffebee',
    borderColor: '#f44336',
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },

  errorBannerText: {
    color: '#c62828',
    fontSize: 14,
    textAlign: 'center',
  },

  inputGroup: {
    marginBottom: 20,
  },

  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },

  input: {
    backgroundColor: '#f9f9f9',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 18,
    color: '#333',
    minHeight: 56,
  },

  inputError: {
    borderColor: '#f44336',
    borderWidth: 2,
  },

  fieldError: {
    color: '#f44336',
    fontSize: 14,
    marginTop: 6,
  },

  // Password strength indicator styles
  strengthContainer: {
    height: 4,
    backgroundColor: '#e0e0e0',
    borderRadius: 2,
    marginTop: 8,
    overflow: 'hidden', // Clip the colored bar to rounded corners
  },

  strengthBar: {
    height: '100%',
    borderRadius: 2,
  },

  strengthText: {
    fontSize: 13,
    marginTop: 4,
  },

  // Row for first/last name side by side
  nameRow: {
    flexDirection: 'row',
    gap: 12, // Space between the two inputs (requires React Native 0.71+)
  },

  // Each name input takes half the space minus gap
  nameInput: {
    flex: 1, // Split space evenly
  },

  button: {
    backgroundColor: '#2e7d32',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    minHeight: 56,
  },

  buttonDisabled: {
    backgroundColor: '#a5d6a7',
  },

  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },

  linkContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 24,
  },

  linkText: {
    fontSize: 16,
    color: '#666',
  },

  link: {
    fontSize: 16,
    color: '#2e7d32',
    fontWeight: '600',
  },
});
