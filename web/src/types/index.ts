/**
 * TypeScript type definitions for the web dashboard
 * Matches the backend API responses
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
  updatedAt?: string;
  applicationCount?: number;
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
  createdAt?: string;
  updatedAt?: string;
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
    licenseNumber?: string;
    licenseState?: string;
  };
  chemical?: Chemical;
  targetPest?: TargetPest;
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

// Form types
export interface CreateCustomerData {
  name: string;
  email?: string;
  phone?: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  latitude?: number;
  longitude?: number;
  notifyByEmail?: boolean;
  notes?: string;
}

export interface UpdateCustomerData extends Partial<CreateCustomerData> {
  isActive?: boolean;
}

export interface InviteUserData {
  email: string;
  firstName: string;
  lastName: string;
  role?: 'admin' | 'applicator';
  licenseNumber?: string;
  licenseState?: string;
}

export interface UpdateUserData {
  firstName?: string;
  lastName?: string;
  role?: 'admin' | 'applicator';
  isActive?: boolean;
  licenseNumber?: string;
  licenseState?: string;
}
