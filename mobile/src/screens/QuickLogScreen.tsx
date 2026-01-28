/**
 * QuickLogScreen.tsx
 *
 * The main feature of the app - logging pesticide applications quickly (<30 seconds).
 * This screen is designed for field use with:
 * - Large touch targets for work gloves (48x48px minimum)
 * - Large fonts for outdoor readability (16px minimum)
 * - Green theme matching the landscaping industry
 *
 * React Native Concepts Used:
 * - ScrollView: Allows the form to scroll when it's longer than the screen
 * - KeyboardAvoidingView: Moves content up when the keyboard appears
 * - useState: React hook for local component state (form fields)
 * - useEffect: React hook for side effects (fetching data, getting GPS)
 * - StyleSheet: React Native's way of defining styles (similar to CSS)
 * - Platform: Detects if running on iOS or Android (they handle keyboards differently)
 * - Alert: Shows native alert dialogs
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
  Modal,
  FlatList,
  Image,
} from 'react-native';
// expo-location provides GPS functionality
import * as Location from 'expo-location';
// expo-image-picker for photo capture
import * as ImagePicker from 'expo-image-picker';
// Import our typed Redux hooks
import { useAppDispatch, useAppSelector } from '../hooks/useRedux';
// Import Redux actions
import { fetchCustomers } from '../store/customersSlice';
import { fetchChemicals, fetchTargetPests } from '../store/chemicalsSlice';
import { createApplication } from '../store/applicationsSlice';
// Import types
import { CreateApplicationData, Customer, Chemical, TargetPest } from '../types';
// Import API client for weather fetching
import api from '../services/api';

// ============================================================================
// CONSTANTS
// ============================================================================

/**
 * App theme colors.
 * Green (#2e7d32) is the primary color - represents landscaping/nature.
 */
const COLORS = {
  primary: '#2e7d32', // Main green color
  primaryDark: '#1b5e20', // Darker green for pressed states
  primaryLight: '#4caf50', // Lighter green for backgrounds
  background: '#f5f5f5', // Light gray background
  white: '#ffffff',
  black: '#000000',
  gray: '#757575', // For placeholder text
  lightGray: '#e0e0e0', // For borders
  error: '#d32f2f', // Red for errors
  success: '#388e3c', // Green for success messages
};

/**
 * Available units for amount measurement.
 * These are common units used in pesticide applications.
 */
const UNITS = [
  { label: 'oz', value: 'oz' }, // Ounces (liquid)
  { label: 'gal', value: 'gal' }, // Gallons
  { label: 'lb', value: 'lb' }, // Pounds
  { label: 'ml', value: 'ml' }, // Milliliters
  { label: 'L', value: 'L' }, // Liters
  { label: 'kg', value: 'kg' }, // Kilograms
  { label: 'g', value: 'g' }, // Grams
  { label: 'qt', value: 'qt' }, // Quarts
];

// ============================================================================
// HELPER COMPONENTS
// ============================================================================

/**
 * SearchableDropdown Component
 *
 * A custom dropdown that lets users search through options.
 * Used for selecting customers, chemicals, and target pests.
 *
 * Props:
 * - label: The field label shown above the dropdown
 * - placeholder: Text shown when nothing is selected
 * - items: Array of items to choose from
 * - selectedValue: Currently selected item's ID
 * - onSelect: Function called when user selects an item
 * - displayField: Which property to show as the item's label
 * - loading: Whether to show a loading spinner
 * - required: Whether this field is required
 */
interface SearchableDropdownProps<T extends { id: string }> {
  label: string;
  placeholder: string;
  items: T[];
  selectedValue: string;
  onSelect: (id: string) => void;
  displayField: keyof T;
  secondaryField?: keyof T;
  loading?: boolean;
  required?: boolean;
}

function SearchableDropdown<T extends { id: string }>({
  label,
  placeholder,
  items,
  selectedValue,
  onSelect,
  displayField,
  secondaryField,
  loading = false,
  required = false,
}: SearchableDropdownProps<T>) {
  // Local state for the modal visibility and search text
  const [modalVisible, setModalVisible] = useState(false);
  const [searchText, setSearchText] = useState('');

  // Find the currently selected item to display its name
  const selectedItem = items.find((item) => item.id === selectedValue);

  // Filter items based on search text
  // toLowerCase() makes the search case-insensitive
  const filteredItems = items.filter((item) => {
    const displayValue = String(item[displayField] || '');
    const secondaryValue = secondaryField ? String(item[secondaryField] || '') : '';
    const search = searchText.toLowerCase();
    return (
      displayValue.toLowerCase().includes(search) ||
      secondaryValue.toLowerCase().includes(search)
    );
  });

  /**
   * Handle item selection:
   * 1. Call the onSelect callback with the item's ID
   * 2. Close the modal
   * 3. Clear the search text
   */
  const handleSelect = (item: T) => {
    onSelect(item.id);
    setModalVisible(false);
    setSearchText('');
  };

  return (
    <View style={styles.fieldContainer}>
      {/* Field Label */}
      <Text style={styles.label}>
        {label}
        {required && <Text style={styles.required}> *</Text>}
      </Text>

      {/* Touchable area that opens the dropdown */}
      <TouchableOpacity
        style={styles.dropdownButton}
        onPress={() => setModalVisible(true)}
        // accessibilityLabel helps screen readers describe the button
        accessibilityLabel={`Select ${label}`}
        accessibilityRole="button"
      >
        {loading ? (
          // Show loading spinner while data is being fetched
          <ActivityIndicator size="small" color={COLORS.primary} />
        ) : selectedItem ? (
          // Show selected item's name
          <Text style={styles.dropdownButtonText}>
            {String(selectedItem[displayField])}
            {secondaryField && selectedItem[secondaryField] && (
              <Text style={styles.dropdownSecondary}>
                {' - '}
                {String(selectedItem[secondaryField])}
              </Text>
            )}
          </Text>
        ) : (
          // Show placeholder if nothing selected
          <Text style={styles.dropdownPlaceholder}>{placeholder}</Text>
        )}
        {/* Down arrow indicator */}
        <Text style={styles.dropdownArrow}>▼</Text>
      </TouchableOpacity>

      {/* Modal that contains the searchable list */}
      <Modal
        visible={modalVisible}
        // 'slide' animation slides up from the bottom
        animationType="slide"
        // 'transparent' allows us to add a semi-transparent background
        transparent={true}
        onRequestClose={() => setModalVisible(false)}
      >
        {/* Dark overlay behind the modal */}
        <View style={styles.modalOverlay}>
          {/* White modal content area */}
          <View style={styles.modalContent}>
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select {label}</Text>
              <TouchableOpacity
                onPress={() => {
                  setModalVisible(false);
                  setSearchText('');
                }}
                style={styles.modalCloseButton}
              >
                <Text style={styles.modalCloseText}>Cancel</Text>
              </TouchableOpacity>
            </View>

            {/* Search Input */}
            <TextInput
              style={styles.searchInput}
              placeholder={`Search ${label.toLowerCase()}...`}
              placeholderTextColor={COLORS.gray}
              value={searchText}
              onChangeText={setSearchText}
              // autoFocus opens the keyboard when modal opens
              autoFocus={true}
              // returnKeyType changes the keyboard's return key label
              returnKeyType="search"
            />

            {/* List of Items */}
            <FlatList
              data={filteredItems}
              // keyExtractor tells FlatList how to identify each item
              keyExtractor={(item) => item.id}
              // renderItem defines how each item looks
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.listItem,
                    // Highlight the selected item
                    item.id === selectedValue && styles.listItemSelected,
                  ]}
                  onPress={() => handleSelect(item)}
                >
                  <Text
                    style={[
                      styles.listItemText,
                      item.id === selectedValue && styles.listItemTextSelected,
                    ]}
                  >
                    {String(item[displayField])}
                  </Text>
                  {secondaryField && item[secondaryField] && (
                    <Text style={styles.listItemSecondary}>
                      {String(item[secondaryField])}
                    </Text>
                  )}
                </TouchableOpacity>
              )}
              // Show message when no items match the search
              ListEmptyComponent={
                <View style={styles.emptyList}>
                  <Text style={styles.emptyListText}>
                    {searchText ? 'No matches found' : 'No items available'}
                  </Text>
                </View>
              }
              // Slightly better performance for long lists
              initialNumToRender={20}
              maxToRenderPerBatch={20}
            />
          </View>
        </View>
      </Modal>
    </View>
  );
}

/**
 * UnitSelector Component
 *
 * Horizontal row of buttons for selecting measurement units.
 * Designed with large touch targets for work gloves.
 */
interface UnitSelectorProps {
  selectedUnit: string;
  onSelect: (unit: string) => void;
}

function UnitSelector({ selectedUnit, onSelect }: UnitSelectorProps) {
  return (
    <View style={styles.fieldContainer}>
      <Text style={styles.label}>
        Unit<Text style={styles.required}> *</Text>
      </Text>
      <View style={styles.unitContainer}>
        {UNITS.map((unit) => (
          <TouchableOpacity
            key={unit.value}
            style={[
              styles.unitButton,
              // Apply selected style if this unit is selected
              selectedUnit === unit.value && styles.unitButtonSelected,
            ]}
            onPress={() => onSelect(unit.value)}
          >
            <Text
              style={[
                styles.unitButtonText,
                selectedUnit === unit.value && styles.unitButtonTextSelected,
              ]}
            >
              {unit.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

/**
 * QuickLogScreen - Main Screen Component
 *
 * This is the primary screen for logging pesticide applications.
 * It's designed for quick entry in the field.
 */
export default function QuickLogScreen() {
  // ==========================================================================
  // REDUX HOOKS
  // ==========================================================================

  /**
   * useAppDispatch gives us a function to send actions to Redux.
   * Think of it like sending commands to update the app's global state.
   */
  const dispatch = useAppDispatch();

  /**
   * useAppSelector lets us read data from Redux state.
   * It's like subscribing to specific pieces of the app's global state.
   * The component will re-render when these values change.
   */
  const { items: customers, isLoading: customersLoading } = useAppSelector(
    (state) => state.customers
  );
  const {
    chemicals,
    targetPests,
    isLoading: chemicalsLoading,
  } = useAppSelector((state) => state.chemicals);
  const { isCreating } = useAppSelector((state) => state.applications);

  // ==========================================================================
  // LOCAL STATE (Form Fields)
  // ==========================================================================

  /**
   * useState is a React hook that lets us store data in the component.
   * When state changes, the component re-renders.
   * Format: [currentValue, setterFunction] = useState(initialValue)
   */

  // Required fields
  const [customerId, setCustomerId] = useState('');
  const [chemicalId, setChemicalId] = useState('');
  const [amount, setAmount] = useState('');
  const [unit, setUnit] = useState('oz'); // Default to ounces

  // Optional fields
  const [targetPestId, setTargetPestId] = useState('');
  const [notes, setNotes] = useState('');

  // GPS location state
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [locationLoading, setLocationLoading] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);

  // Form validation state
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  // Success message state
  const [showSuccess, setShowSuccess] = useState(false);

  // Weather state
  const [weather, setWeather] = useState<{
    temperature?: number;
    humidity?: number;
    windSpeed?: number;
    windDirection?: string;
    weatherCondition?: string;
  } | null>(null);
  const [weatherLoading, setWeatherLoading] = useState(false);
  const [weatherError, setWeatherError] = useState<string | null>(null);

  // Photo state
  const [photos, setPhotos] = useState<{
    label: string | null;
    before: string | null;
    after: string | null;
  }>({ label: null, before: null, after: null });
  const [uploadingPhoto, setUploadingPhoto] = useState<string | null>(null);

  // ==========================================================================
  // SIDE EFFECTS (useEffect)
  // ==========================================================================

  /**
   * useEffect runs code when the component mounts or when dependencies change.
   * The empty array [] means this effect runs once when the component first appears.
   *
   * Here we:
   * 1. Fetch customers from the API
   * 2. Fetch chemicals and target pests from the API
   * 3. Request GPS location
   */
  useEffect(() => {
    // Fetch reference data from the server
    // Pass empty object to satisfy TypeScript (search parameter is optional)
    dispatch(fetchCustomers({}));
    dispatch(fetchChemicals());
    dispatch(fetchTargetPests());

    // Get GPS location
    getLocation();
  }, []); // Empty dependency array = run once on mount

  // ==========================================================================
  // WEATHER FETCH FUNCTION
  // ==========================================================================

  /**
   * fetchWeather - Fetch weather data for the given coordinates
   *
   * This function:
   * 1. Calls the weather API with latitude and longitude
   * 2. Stores weather data in state
   * 3. Handles errors gracefully (weather is optional data)
   */
  const fetchWeather = async (lat: number, lon: number) => {
    setWeatherLoading(true);
    setWeatherError(null);
    try {
      const response = await api.get(`/weather?lat=${lat}&lon=${lon}`);
      setWeather(response.data);
    } catch (error) {
      setWeatherError('Could not fetch weather');
      console.log('Weather fetch failed:', error);
    } finally {
      setWeatherLoading(false);
    }
  };

  // ==========================================================================
  // GPS LOCATION FUNCTION
  // ==========================================================================

  /**
   * getLocation - Request and capture GPS coordinates
   *
   * This function:
   * 1. Asks the user for permission to access location
   * 2. If granted, gets the current GPS coordinates
   * 3. Stores them in state to be submitted with the form
   * 4. Automatically fetches weather data for the location
   */
  const getLocation = async () => {
    setLocationLoading(true);
    setLocationError(null);

    try {
      // Step 1: Request permission to access location
      // On iOS, this shows the "Allow Location Access" popup
      const { status } = await Location.requestForegroundPermissionsAsync();

      if (status !== 'granted') {
        // User denied permission - that's OK, location is optional
        setLocationError('Location permission not granted');
        setLocationLoading(false);
        return;
      }

      // Step 2: Get the current position
      // accuracy: Location.Accuracy.Balanced is good for most uses
      // (High accuracy uses more battery)
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      // Step 3: Store the coordinates in state
      setLatitude(location.coords.latitude);
      setLongitude(location.coords.longitude);

      // Step 4: Fetch weather data for this location
      fetchWeather(location.coords.latitude, location.coords.longitude);
    } catch (error) {
      // Handle any errors (GPS turned off, no signal, etc.)
      console.error('Error getting location:', error);
      setLocationError('Could not get location');
    } finally {
      // Always set loading to false when done
      setLocationLoading(false);
    }
  };

  // ==========================================================================
  // PHOTO CAPTURE FUNCTIONS
  // ==========================================================================

  /**
   * pickImage - Show options to take photo or select from library
   *
   * Opens an action sheet giving the user the choice to either
   * take a new photo with the camera or select from their photo library.
   */
  const pickImage = async (type: 'label' | 'before' | 'after') => {
    // Request permissions
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Please allow access to your photos');
      return;
    }

    // Show action sheet to choose camera or library
    Alert.alert(
      'Add Photo',
      'Choose an option',
      [
        {
          text: 'Take Photo',
          onPress: () => takePhoto(type),
        },
        {
          text: 'Choose from Library',
          onPress: () => selectFromLibrary(type),
        },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  /**
   * takePhoto - Launch the camera to take a new photo
   */
  const takePhoto = async (type: 'label' | 'before' | 'after') => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Please allow camera access');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8, // 80% quality for compression
      allowsEditing: false,
    });

    if (!result.canceled && result.assets[0]) {
      await uploadPhoto(type, result.assets[0].uri);
    }
  };

  /**
   * selectFromLibrary - Open the photo library picker
   */
  const selectFromLibrary = async (type: 'label' | 'before' | 'after') => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
      allowsEditing: false,
    });

    if (!result.canceled && result.assets[0]) {
      await uploadPhoto(type, result.assets[0].uri);
    }
  };

  /**
   * uploadPhoto - Upload the selected/captured photo to the backend
   *
   * This function:
   * 1. Gets a presigned upload URL from the backend
   * 2. Uploads the photo to that URL
   * 3. Stores the public URL in state
   */
  const uploadPhoto = async (type: 'label' | 'before' | 'after', uri: string) => {
    setUploadingPhoto(type);
    try {
      // Get presigned upload URL from backend
      const response = await api.post('/photos/upload-url', {
        type,
        contentType: 'image/jpeg',
      });

      const { uploadUrl, fileUrl, mock } = response.data;

      // If not mock, actually upload the file
      if (!mock) {
        // Read file and upload to presigned URL
        const fileResponse = await fetch(uri);
        const blob = await fileResponse.blob();

        await fetch(uploadUrl, {
          method: 'PUT',
          body: blob,
          headers: {
            'Content-Type': 'image/jpeg',
          },
        });
      }

      // Store the public URL (or local URI for mock)
      setPhotos(prev => ({
        ...prev,
        [type]: mock ? uri : fileUrl,
      }));
    } catch (error) {
      console.error('Photo upload failed:', error);
      Alert.alert('Upload Failed', 'Could not upload photo. Please try again.');
    } finally {
      setUploadingPhoto(null);
    }
  };

  /**
   * removePhoto - Remove a photo from state
   */
  const removePhoto = (type: 'label' | 'before' | 'after') => {
    setPhotos(prev => ({ ...prev, [type]: null }));
  };

  // ==========================================================================
  // FORM VALIDATION
  // ==========================================================================

  /**
   * validateForm - Check that all required fields are filled in correctly
   *
   * Returns true if the form is valid, false otherwise.
   * Also sets error messages for invalid fields.
   */
  const validateForm = useCallback((): boolean => {
    const newErrors: { [key: string]: string } = {};

    // Customer is required
    if (!customerId) {
      newErrors.customerId = 'Please select a customer';
    }

    // Chemical is required
    if (!chemicalId) {
      newErrors.chemicalId = 'Please select a chemical';
    }

    // Amount is required and must be a positive number
    if (!amount) {
      newErrors.amount = 'Please enter an amount';
    } else if (isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) {
      newErrors.amount = 'Amount must be greater than 0';
    }

    // Unit is required
    if (!unit) {
      newErrors.unit = 'Please select a unit';
    }

    // Update state with any errors
    setErrors(newErrors);

    // Return true if no errors (object is empty)
    return Object.keys(newErrors).length === 0;
  }, [customerId, chemicalId, amount, unit]);

  // ==========================================================================
  // FORM SUBMISSION
  // ==========================================================================

  /**
   * handleSubmit - Process the form and create the application record
   *
   * This function:
   * 1. Validates the form
   * 2. Creates the data object
   * 3. Dispatches the createApplication action to Redux
   * 4. Handles success/failure
   */
  const handleSubmit = async () => {
    // Validate form first
    if (!validateForm()) {
      // Scroll to top so user sees error messages
      return;
    }

    // Build the data object to send to the API
    const applicationData: CreateApplicationData = {
      customerId,
      chemicalId,
      amount: parseFloat(amount),
      unit,
      // Current date/time in ISO format (e.g., "2024-01-15T10:30:00.000Z")
      applicationDate: new Date().toISOString(),
      // Only include optional fields if they have values
      ...(targetPestId && { targetPestId }),
      ...(latitude !== null && { latitude }),
      ...(longitude !== null && { longitude }),
      ...(notes.trim() && { notes: notes.trim() }),
      // Include weather data if available
      temperature: weather?.temperature,
      humidity: weather?.humidity,
      windSpeed: weather?.windSpeed,
      windDirection: weather?.windDirection,
      weatherCondition: weather?.weatherCondition,
      // Include photo URLs if available
      labelPhotoUrl: photos.label || undefined,
      beforePhotoUrl: photos.before || undefined,
      afterPhotoUrl: photos.after || undefined,
    };

    try {
      // dispatch returns a promise when using createAsyncThunk
      // unwrap() throws an error if the action was rejected
      await dispatch(createApplication(applicationData)).unwrap();

      // Success! Reset the form
      resetForm();

      // Show success message
      setShowSuccess(true);

      // Hide success message after 3 seconds
      setTimeout(() => {
        setShowSuccess(false);
      }, 3000);
    } catch (error) {
      // Show error to user
      Alert.alert(
        'Error',
        typeof error === 'string'
          ? error
          : 'Failed to log application. Please try again.',
        [{ text: 'OK' }]
      );
    }
  };

  // ==========================================================================
  // FORM RESET
  // ==========================================================================

  /**
   * resetForm - Clear all form fields back to defaults
   *
   * Called after successful submission to prepare for the next entry.
   */
  const resetForm = () => {
    setCustomerId('');
    setChemicalId('');
    setAmount('');
    setUnit('oz');
    setTargetPestId('');
    setNotes('');
    setErrors({});
    // Clear weather data
    setWeather(null);
    setWeatherError(null);
    // Clear photos
    setPhotos({ label: null, before: null, after: null });
    // Re-fetch location for next application (which will also fetch weather)
    getLocation();
  };

  // ==========================================================================
  // RENDER
  // ==========================================================================

  return (
    /**
     * KeyboardAvoidingView prevents the keyboard from covering input fields.
     * - On iOS, 'padding' works best (adds padding at the bottom)
     * - On Android, 'height' is usually better (adjusts view height)
     */
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 0}
    >
      {/* ScrollView allows the form to scroll when content is longer than screen */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        // Dismiss keyboard when tapping outside of inputs
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={true}
      >
        {/* Screen Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Quick Log</Text>
          <Text style={styles.headerSubtitle}>
            Log a pesticide application in under 30 seconds
          </Text>
        </View>

        {/* Success Message Banner */}
        {showSuccess && (
          <View style={styles.successBanner}>
            <Text style={styles.successText}>
              Application logged successfully!
            </Text>
          </View>
        )}

        {/* GPS Status Section */}
        <View style={styles.gpsSection}>
          <Text style={styles.gpsLabel}>GPS Location:</Text>
          {locationLoading ? (
            <View style={styles.gpsStatus}>
              <ActivityIndicator size="small" color={COLORS.primary} />
              <Text style={styles.gpsStatusText}>Getting location...</Text>
            </View>
          ) : latitude && longitude ? (
            <View style={styles.gpsStatus}>
              <Text style={styles.gpsSuccess}>Location captured</Text>
              <Text style={styles.gpsCoords}>
                {latitude.toFixed(6)}, {longitude.toFixed(6)}
              </Text>
            </View>
          ) : (
            <View style={styles.gpsStatus}>
              <Text style={styles.gpsError}>
                {locationError || 'Location not available'}
              </Text>
              <TouchableOpacity onPress={getLocation} style={styles.retryButton}>
                <Text style={styles.retryButtonText}>Retry</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Weather Section */}
        <View style={styles.formContainer}>
          <Text style={styles.sectionTitle}>Weather (Auto-filled)</Text>
          <View style={styles.weatherContainer}>
            {weatherLoading ? (
              <ActivityIndicator size="small" color="#2e7d32" />
            ) : weather ? (
              <View style={styles.weatherGrid}>
                <View style={styles.weatherItem}>
                  <Text style={styles.weatherLabel}>Temp</Text>
                  <Text style={styles.weatherValue}>{weather.temperature}°F</Text>
                </View>
                <View style={styles.weatherItem}>
                  <Text style={styles.weatherLabel}>Humidity</Text>
                  <Text style={styles.weatherValue}>{weather.humidity}%</Text>
                </View>
                <View style={styles.weatherItem}>
                  <Text style={styles.weatherLabel}>Wind</Text>
                  <Text style={styles.weatherValue}>{weather.windSpeed} mph {weather.windDirection}</Text>
                </View>
                <View style={styles.weatherItem}>
                  <Text style={styles.weatherLabel}>Conditions</Text>
                  <Text style={styles.weatherValue}>{weather.weatherCondition}</Text>
                </View>
              </View>
            ) : weatherError ? (
              <Text style={styles.weatherError}>{weatherError}</Text>
            ) : (
              <Text style={styles.weatherPlaceholder}>Weather will auto-fill when location is captured</Text>
            )}
          </View>
        </View>

        {/* Form Fields Container */}
        <View style={styles.formContainer}>
          {/* Customer Selection - Searchable Dropdown */}
          <SearchableDropdown<Customer>
            label="Customer / Property"
            placeholder="Select customer..."
            items={customers}
            selectedValue={customerId}
            onSelect={setCustomerId}
            displayField="name"
            secondaryField="address"
            loading={customersLoading}
            required={true}
          />
          {/* Show error if validation failed */}
          {errors.customerId && (
            <Text style={styles.errorText}>{errors.customerId}</Text>
          )}

          {/* Chemical Selection - Searchable Dropdown */}
          <SearchableDropdown<Chemical>
            label="Chemical / Pesticide"
            placeholder="Select chemical..."
            items={chemicals}
            selectedValue={chemicalId}
            onSelect={setChemicalId}
            displayField="name"
            secondaryField="epaNumber"
            loading={chemicalsLoading}
            required={true}
          />
          {errors.chemicalId && (
            <Text style={styles.errorText}>{errors.chemicalId}</Text>
          )}

          {/* Amount Input */}
          <View style={styles.fieldContainer}>
            <Text style={styles.label}>
              Amount<Text style={styles.required}> *</Text>
            </Text>
            <TextInput
              style={[styles.textInput, errors.amount && styles.textInputError]}
              placeholder="Enter amount..."
              placeholderTextColor={COLORS.gray}
              value={amount}
              onChangeText={setAmount}
              // keyboardType="decimal-pad" shows a number keyboard
              keyboardType="decimal-pad"
              // returnKeyType changes the keyboard's return key
              returnKeyType="done"
            />
            {errors.amount && (
              <Text style={styles.errorText}>{errors.amount}</Text>
            )}
          </View>

          {/* Unit Selector */}
          <UnitSelector selectedUnit={unit} onSelect={setUnit} />
          {errors.unit && <Text style={styles.errorText}>{errors.unit}</Text>}

          {/* Target Pest Selection - Optional */}
          <SearchableDropdown<TargetPest>
            label="Target Pest (Optional)"
            placeholder="Select pest if applicable..."
            items={targetPests}
            selectedValue={targetPestId}
            onSelect={setTargetPestId}
            displayField="name"
            secondaryField="category"
            loading={chemicalsLoading}
            required={false}
          />

          {/* Photos Section */}
          <Text style={styles.sectionTitle}>Photos</Text>
          <View style={styles.photosContainer}>
            {(['label', 'before', 'after'] as const).map((type) => (
              <View key={type} style={styles.photoItem}>
                <Text style={styles.photoLabel}>
                  {type === 'label' ? 'Product Label' : type === 'before' ? 'Before' : 'After'}
                </Text>
                {photos[type] ? (
                  <View style={styles.photoPreview}>
                    <Image source={{ uri: photos[type]! }} style={styles.photoImage} />
                    <TouchableOpacity
                      style={styles.removePhotoButton}
                      onPress={() => removePhoto(type)}
                    >
                      <Text style={styles.removePhotoText}>x</Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  <TouchableOpacity
                    style={styles.addPhotoButton}
                    onPress={() => pickImage(type)}
                    disabled={uploadingPhoto === type}
                  >
                    {uploadingPhoto === type ? (
                      <ActivityIndicator color="#2e7d32" />
                    ) : (
                      <>
                        <Text style={styles.addPhotoIcon}>+</Text>
                        <Text style={styles.addPhotoText}>Add</Text>
                      </>
                    )}
                  </TouchableOpacity>
                )}
              </View>
            ))}
          </View>

          {/* Notes Input - Optional */}
          <View style={styles.fieldContainer}>
            <Text style={styles.label}>Notes (Optional)</Text>
            <TextInput
              style={[styles.textInput, styles.notesInput]}
              placeholder="Add any additional notes..."
              placeholderTextColor={COLORS.gray}
              value={notes}
              onChangeText={setNotes}
              // multiline allows multiple lines of text
              multiline={true}
              numberOfLines={4}
              // textAlignVertical makes text start at top on Android
              textAlignVertical="top"
            />
          </View>

          {/* Submit Button */}
          <TouchableOpacity
            style={[styles.submitButton, isCreating && styles.submitButtonDisabled]}
            onPress={handleSubmit}
            // Disable button while submitting
            disabled={isCreating}
            accessibilityLabel="Log Application"
            accessibilityRole="button"
          >
            {isCreating ? (
              // Show loading spinner while submitting
              <ActivityIndicator size="small" color={COLORS.white} />
            ) : (
              <Text style={styles.submitButtonText}>Log Application</Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

// ============================================================================
// STYLES
// ============================================================================

/**
 * StyleSheet.create creates a stylesheet that's optimized by React Native.
 * It's similar to CSS but uses camelCase property names.
 *
 * Key differences from web CSS:
 * - All sizes are unitless (interpreted as density-independent pixels)
 * - flexDirection defaults to 'column' (not 'row')
 * - Uses camelCase (backgroundColor instead of background-color)
 */
const styles = StyleSheet.create({
  // Main container
  container: {
    flex: 1, // Take up all available space
    backgroundColor: COLORS.background,
  },

  // Scroll view
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40, // Extra padding at bottom for comfortable scrolling
  },

  // Header section
  header: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 24,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: COLORS.white,
  },
  headerSubtitle: {
    fontSize: 16,
    color: COLORS.white,
    opacity: 0.9,
    marginTop: 4,
  },

  // Success banner
  successBanner: {
    backgroundColor: COLORS.success,
    padding: 16,
    alignItems: 'center',
  },
  successText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '600',
  },

  // GPS section
  gpsSection: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lightGray,
  },
  gpsLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.black,
    marginRight: 12,
  },
  gpsStatus: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  gpsStatusText: {
    fontSize: 14,
    color: COLORS.gray,
    marginLeft: 8,
  },
  gpsSuccess: {
    fontSize: 14,
    color: COLORS.success,
    fontWeight: '500',
  },
  gpsCoords: {
    fontSize: 12,
    color: COLORS.gray,
    marginLeft: 8,
  },
  gpsError: {
    fontSize: 14,
    color: COLORS.error,
  },
  retryButton: {
    marginLeft: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: COLORS.primary,
    borderRadius: 4,
  },
  retryButtonText: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: '500',
  },

  // Form container
  formContainer: {
    padding: 20,
  },

  // Field container (wraps each form field)
  fieldContainer: {
    marginBottom: 20,
  },

  // Labels
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.black,
    marginBottom: 8,
  },
  required: {
    color: COLORS.error,
  },

  // Text inputs
  textInput: {
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.lightGray,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16, // Minimum 16px for readability
    color: COLORS.black,
    // Large touch target (48px minimum)
    minHeight: 52,
  },
  textInputError: {
    borderColor: COLORS.error,
  },
  notesInput: {
    minHeight: 100,
    textAlignVertical: 'top',
  },

  // Error text
  errorText: {
    color: COLORS.error,
    fontSize: 14,
    marginTop: 4,
  },

  // Dropdown button
  dropdownButton: {
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.lightGray,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 52, // Large touch target
  },
  dropdownButtonText: {
    fontSize: 16,
    color: COLORS.black,
    flex: 1,
  },
  dropdownSecondary: {
    fontSize: 14,
    color: COLORS.gray,
  },
  dropdownPlaceholder: {
    fontSize: 16,
    color: COLORS.gray,
    flex: 1,
  },
  dropdownArrow: {
    fontSize: 12,
    color: COLORS.gray,
    marginLeft: 8,
  },

  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)', // Semi-transparent black overlay
    justifyContent: 'flex-end', // Modal slides up from bottom
  },
  modalContent: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    maxHeight: '80%', // Don't cover entire screen
    minHeight: '50%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lightGray,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.black,
  },
  modalCloseButton: {
    padding: 8,
  },
  modalCloseText: {
    fontSize: 16,
    color: COLORS.primary,
    fontWeight: '500',
  },

  // Search input in modal
  searchInput: {
    margin: 16,
    backgroundColor: COLORS.background,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: COLORS.black,
  },

  // List items in modal
  listItem: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lightGray,
    minHeight: 56, // Large touch target
  },
  listItemSelected: {
    backgroundColor: COLORS.primaryLight + '20', // Light green with transparency
  },
  listItemText: {
    fontSize: 16,
    color: COLORS.black,
  },
  listItemTextSelected: {
    color: COLORS.primary,
    fontWeight: '600',
  },
  listItemSecondary: {
    fontSize: 14,
    color: COLORS.gray,
    marginTop: 4,
  },
  emptyList: {
    padding: 40,
    alignItems: 'center',
  },
  emptyListText: {
    fontSize: 16,
    color: COLORS.gray,
  },

  // Unit selector
  unitContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  unitButton: {
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.lightGray,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    minWidth: 60, // Consistent button sizes
    minHeight: 48, // Large touch target (48px)
    alignItems: 'center',
    justifyContent: 'center',
  },
  unitButtonSelected: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  unitButtonText: {
    fontSize: 16,
    color: COLORS.black,
    fontWeight: '500',
  },
  unitButtonTextSelected: {
    color: COLORS.white,
  },

  // Submit button
  submitButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 8,
    paddingVertical: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
    minHeight: 56, // Large touch target
  },
  submitButtonDisabled: {
    backgroundColor: COLORS.gray,
  },
  submitButtonText: {
    color: COLORS.white,
    fontSize: 18,
    fontWeight: '600',
  },

  // Section title
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.black,
    marginBottom: 8,
  },

  // Weather styles
  weatherContainer: {
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
  },
  weatherGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  weatherItem: {
    width: '48%',
    marginBottom: 12,
  },
  weatherLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 2,
  },
  weatherValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  weatherError: {
    color: '#d32f2f',
    fontSize: 14,
  },
  weatherPlaceholder: {
    color: '#999',
    fontSize: 14,
    fontStyle: 'italic',
  },

  // Photo styles
  photosContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  photoItem: {
    width: '31%',
    alignItems: 'center',
  },
  photoLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 8,
    textAlign: 'center',
  },
  addPhotoButton: {
    width: 80,
    height: 80,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#ccc',
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f9f9f9',
  },
  addPhotoIcon: {
    fontSize: 24,
    color: '#666',
  },
  addPhotoText: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  photoPreview: {
    width: 80,
    height: 80,
    borderRadius: 8,
    overflow: 'hidden',
    position: 'relative',
  },
  photoImage: {
    width: '100%',
    height: '100%',
  },
  removePhotoButton: {
    position: 'absolute',
    top: -8,
    right: -8,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#d32f2f',
    justifyContent: 'center',
    alignItems: 'center',
  },
  removePhotoText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
