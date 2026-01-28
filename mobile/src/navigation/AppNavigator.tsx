/**
 * App Navigation Structure
 *
 * React Navigation setup for the app:
 * - Auth stack (Login, Signup) - shown when logged out
 * - Main tabs (QuickLog, History, Profile) - shown when logged in
 */

import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { ActivityIndicator, View, StyleSheet, Text } from 'react-native';
import { useAppSelector } from '../hooks/useRedux';

// Import screens
import LoginScreen from '../screens/LoginScreen';
import SignupScreen from '../screens/SignupScreen';
import QuickLogScreen from '../screens/QuickLogScreen';
import HistoryScreen from '../screens/HistoryScreen';
import ApplicationDetailScreen from '../screens/ApplicationDetailScreen';
import ProfileScreen from '../screens/ProfileScreen';

// Type definitions for navigation
import { RootStackParamList, MainTabParamList, HistoryStackParamList } from '../types';

// Create navigators
const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<MainTabParamList>();
const HistoryStack = createNativeStackNavigator<HistoryStackParamList>();

/**
 * History stack navigator
 * Contains the history list and application detail screens
 */
function HistoryStackNavigator() {
  return (
    <HistoryStack.Navigator>
      <HistoryStack.Screen
        name="HistoryList"
        component={HistoryScreen}
        options={{ headerShown: false }}
      />
      <HistoryStack.Screen
        name="ApplicationDetail"
        component={ApplicationDetailScreen}
        options={{ title: 'Application Details' }}
      />
    </HistoryStack.Navigator>
  );
}

/**
 * Main tab navigator (shown when logged in)
 */
function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: '#2e7d32', // Green color for active tab
        tabBarInactiveTintColor: '#666',
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
        },
        tabBarStyle: {
          paddingBottom: 8,
          paddingTop: 8,
          height: 60,
        },
        headerStyle: {
          backgroundColor: '#2e7d32',
        },
        headerTintColor: '#fff',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      }}
    >
      <Tab.Screen
        name="QuickLog"
        component={QuickLogScreen}
        options={{
          title: 'Quick Log',
          tabBarLabel: 'Log',
          tabBarIcon: ({ color, size }) => (
            <Text style={{ fontSize: size, color }}>+</Text>
          ),
        }}
      />
      <Tab.Screen
        name="History"
        component={HistoryStackNavigator}
        options={{
          title: 'History',
          headerShown: false,
          tabBarIcon: ({ color, size }) => (
            <Text style={{ fontSize: size - 4, color }}>&#128203;</Text>
          ),
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, size }) => (
            <Text style={{ fontSize: size - 4, color }}>&#128100;</Text>
          ),
        }}
      />
    </Tab.Navigator>
  );
}

/**
 * Auth stack navigator (shown when logged out)
 */
function AuthStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: '#2e7d32',
        },
        headerTintColor: '#fff',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      }}
    >
      <Stack.Screen
        name="Login"
        component={LoginScreen}
        options={{ title: 'Sign In' }}
      />
      <Stack.Screen
        name="Signup"
        component={SignupScreen}
        options={{ title: 'Create Account' }}
      />
    </Stack.Navigator>
  );
}

/**
 * Main App Navigator
 *
 * Decides which stack to show based on authentication state
 */
export default function AppNavigator() {
  const { user, isInitialized, isLoading } = useAppSelector((state) => state.auth);

  // Show loading spinner while checking for existing session
  if (!isInitialized || isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2e7d32" />
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  return (
    <NavigationContainer>
      {user ? <MainTabs /> : <AuthStack />}
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
});
