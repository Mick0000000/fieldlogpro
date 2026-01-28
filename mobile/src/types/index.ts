/**
 * TypeScript type definitions for the mobile app
 *
 * These types match the backend API responses and ensure
 * type safety throughout the application.
 */

// User types
export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'admin' | 'applicator';
  companyId: string;
  licenseNumber?: string | null;
  licenseState?: string | null;
  isActive: boolean;
  createdAt: string;
}

export interface Company {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  zipCode?: string | null;
  licenseNumber?: string | null;
  licenseState?: string | null;
  subscriptionStatus: string;
  trialEndsAt?: string | null;
}

export interface UserWithCompany extends User {
  company: Company;
}

// Customer types
export interface Customer {
  id: string;
  name: string;
  email?: string | null;
  phone?: string | null;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  latitude?: number | null;
  longitude?: number | null;
  notifyByEmail: boolean;
  notes?: string | null;
  isActive: boolean;
  applicationCount?: number;
}

// Chemical types
export interface Chemical {
  id: string;
  name: string;
  epaNumber?: string | null;
  activeIngredient?: string | null;
  manufacturer?: string | null;
  signalWord?: string | null;
  isActive: boolean;
}

// Target pest types
export interface TargetPest {
  id: string;
  name: string;
  category?: string | null;
  description?: string | null;
  isActive: boolean;
}

// Application types
export interface Application {
  id: string;
  applicationDate: string;
  chemicalId: string;
  chemicalName: string;
  epaNumber?: string | null;
  amount: number;
  unit: string;
  targetPestId?: string | null;
  targetPestName?: string | null;
  applicationMethod?: string | null;
  areaTreated?: number | null;
  areaUnit?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  temperature?: number | null;
  humidity?: number | null;
  windSpeed?: number | null;
  windDirection?: string | null;
  weatherCondition?: string | null;
  labelPhotoUrl?: string | null;
  beforePhotoUrl?: string | null;
  afterPhotoUrl?: string | null;
  notes?: string | null;
  reentryInterval?: string | null;
  customerConsent: boolean;
  status: 'completed' | 'voided';
  companyId: string;
  applicatorId: string;
  customerId: string;
  createdAt: string;
  updatedAt: string;
  customer?: {
    id: string;
    name: string;
    address?: string;
    city?: string;
    state?: string;
  };
  applicator?: {
    id: string;
    firstName: string;
    lastName: string;
    email?: string;
  };
  chemical?: Chemical;
  targetPest?: TargetPest;
}

// Form data for creating an application
export interface CreateApplicationData {
  customerId: string;
  chemicalId: string;
  amount: number;
  unit: string;
  applicationDate: string;
  targetPestId?: string;
  applicationMethod?: string;
  areaTreated?: number;
  areaUnit?: string;
  latitude?: number;
  longitude?: number;
  temperature?: number;
  humidity?: number;
  windSpeed?: number;
  windDirection?: string;
  weatherCondition?: string;
  labelPhotoUrl?: string;
  beforePhotoUrl?: string;
  afterPhotoUrl?: string;
  notes?: string;
  reentryInterval?: string;
  customerConsent?: boolean;
}

// API response types
export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasMore: boolean;
  };
}

export interface AuthResponse {
  message: string;
  user: User;
  token: string;
}

// Navigation types
export type RootStackParamList = {
  Auth: undefined;
  Main: undefined;
  Login: undefined;
  Signup: undefined;
};

export type MainTabParamList = {
  QuickLog: undefined;
  History: undefined;
  Profile: undefined;
};

export type HistoryStackParamList = {
  HistoryList: undefined;
  ApplicationDetail: { applicationId: string };
};
