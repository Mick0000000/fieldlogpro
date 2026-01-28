/**
 * Customers Management Page
 * Full CRUD operations for customer/property management
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  IconButton,
  Switch,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormControlLabel,
  Snackbar,
  Alert,
  CircularProgress,
  InputAdornment,
  Tooltip,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Search as SearchIcon,
  Email as EmailIcon,
  EmailOutlined as EmailOutlinedIcon,
} from '@mui/icons-material';
import { useAppDispatch, useAppSelector } from '../hooks/useRedux';
import { fetchCustomers, createCustomer, updateCustomer, clearError } from '../store/customersSlice';
import type { Customer, CreateCustomerData, UpdateCustomerData } from '../types';

// US State codes
const US_STATES = [
  'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA',
  'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD',
  'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ',
  'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC',
  'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY',
  'DC', 'PR', 'VI', 'GU', 'AS', 'MP',
];

// Form validation types
interface FormErrors {
  name?: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  email?: string;
}

interface CustomerFormData {
  name: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  email: string;
  phone: string;
  notes: string;
  notifyByEmail: boolean;
  isActive: boolean;
}

const initialFormData: CustomerFormData = {
  name: '',
  address: '',
  city: '',
  state: '',
  zipCode: '',
  email: '',
  phone: '',
  notes: '',
  notifyByEmail: true,
  isActive: true,
};

// Validation helpers
const validateEmail = (email: string): boolean => {
  if (!email) return true; // Optional field
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

const validateZipCode = (zip: string): boolean => {
  // 5 digits or 5+4 format (12345 or 12345-6789)
  const zipRegex = /^\d{5}(-\d{4})?$/;
  return zipRegex.test(zip);
};

const CustomersPage = () => {
  const dispatch = useAppDispatch();
  const { items: customers, isLoading, error, total } = useAppSelector(
    (state) => state.customers
  );

  // Local state
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [formData, setFormData] = useState<CustomerFormData>(initialFormData);
  const [formErrors, setFormErrors] = useState<FormErrors>({});
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
    open: false,
    message: '',
    severity: 'success',
  });
  const [isSaving, setIsSaving] = useState(false);

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
      setPage(0); // Reset to first page on search
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Fetch customers when page, rowsPerPage, or search changes
  useEffect(() => {
    dispatch(
      fetchCustomers({
        page: page + 1, // API uses 1-based pagination
        limit: rowsPerPage,
        search: debouncedSearch || undefined,
      })
    );
  }, [dispatch, page, rowsPerPage, debouncedSearch]);

  // Clear error on unmount
  useEffect(() => {
    return () => {
      dispatch(clearError());
    };
  }, [dispatch]);

  // Show error in snackbar
  useEffect(() => {
    if (error) {
      setSnackbar({ open: true, message: error, severity: 'error' });
    }
  }, [error]);

  // Form validation
  const validateForm = useCallback((): boolean => {
    const errors: FormErrors = {};

    if (!formData.name.trim()) {
      errors.name = 'Name is required';
    }
    if (!formData.address.trim()) {
      errors.address = 'Address is required';
    }
    if (!formData.city.trim()) {
      errors.city = 'City is required';
    }
    if (!formData.state) {
      errors.state = 'State is required';
    }
    if (!formData.zipCode.trim()) {
      errors.zipCode = 'ZIP code is required';
    } else if (!validateZipCode(formData.zipCode)) {
      errors.zipCode = 'Invalid ZIP code (use 12345 or 12345-6789)';
    }
    if (formData.email && !validateEmail(formData.email)) {
      errors.email = 'Invalid email format';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  }, [formData]);

  // Open add dialog
  const handleAddClick = () => {
    setEditingCustomer(null);
    setFormData(initialFormData);
    setFormErrors({});
    setDialogOpen(true);
  };

  // Open edit dialog
  const handleEditClick = (customer: Customer) => {
    setEditingCustomer(customer);
    setFormData({
      name: customer.name,
      address: customer.address,
      city: customer.city,
      state: customer.state,
      zipCode: customer.zipCode,
      email: customer.email || '',
      phone: customer.phone || '',
      notes: customer.notes || '',
      notifyByEmail: customer.notifyByEmail,
      isActive: customer.isActive,
    });
    setFormErrors({});
    setDialogOpen(true);
  };

  // Close dialog
  const handleDialogClose = () => {
    setDialogOpen(false);
    setEditingCustomer(null);
    setFormData(initialFormData);
    setFormErrors({});
  };

  // Handle form field change
  const handleFieldChange = (field: keyof CustomerFormData, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear error when field is edited
    if (formErrors[field as keyof FormErrors]) {
      setFormErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  // Save customer (create or update)
  const handleSave = async () => {
    if (!validateForm()) return;

    setIsSaving(true);

    try {
      if (editingCustomer) {
        // Update existing customer
        const updateData: UpdateCustomerData = {
          name: formData.name.trim(),
          address: formData.address.trim(),
          city: formData.city.trim(),
          state: formData.state,
          zipCode: formData.zipCode.trim(),
          email: formData.email.trim() || undefined,
          phone: formData.phone.trim() || undefined,
          notes: formData.notes.trim() || undefined,
          notifyByEmail: formData.notifyByEmail,
          isActive: formData.isActive,
        };

        await dispatch(updateCustomer({ id: editingCustomer.id, data: updateData })).unwrap();
        setSnackbar({ open: true, message: 'Customer updated successfully', severity: 'success' });
      } else {
        // Create new customer
        const createData: CreateCustomerData = {
          name: formData.name.trim(),
          address: formData.address.trim(),
          city: formData.city.trim(),
          state: formData.state,
          zipCode: formData.zipCode.trim(),
          email: formData.email.trim() || undefined,
          phone: formData.phone.trim() || undefined,
          notes: formData.notes.trim() || undefined,
          notifyByEmail: formData.notifyByEmail,
        };

        await dispatch(createCustomer(createData)).unwrap();
        setSnackbar({ open: true, message: 'Customer created successfully', severity: 'success' });
      }

      handleDialogClose();
    } catch (err) {
      setSnackbar({
        open: true,
        message: err instanceof Error ? err.message : 'Failed to save customer',
        severity: 'error',
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Toggle notification for a customer (inline)
  const handleNotificationToggle = async (customer: Customer) => {
    try {
      await dispatch(
        updateCustomer({
          id: customer.id,
          data: { notifyByEmail: !customer.notifyByEmail },
        })
      ).unwrap();
      setSnackbar({
        open: true,
        message: `Email notifications ${!customer.notifyByEmail ? 'enabled' : 'disabled'} for ${customer.name}`,
        severity: 'success',
      });
    } catch {
      setSnackbar({
        open: true,
        message: 'Failed to update notification settings',
        severity: 'error',
      });
    }
  };

  // Handle pagination
  const handleChangePage = (_: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  // Format address for display
  const formatAddress = (customer: Customer): string => {
    return `${customer.address}, ${customer.city}, ${customer.state} ${customer.zipCode}`;
  };

  // Memoized dialog title
  const dialogTitle = useMemo(() => {
    return editingCustomer ? 'Edit Customer' : 'Add New Customer';
  }, [editingCustomer]);

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold' }}>
          Customers
        </Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={handleAddClick}>
          Add Customer
        </Button>
      </Box>

      {/* Search */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <TextField
          fullWidth
          placeholder="Search by name..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          }}
        />
      </Paper>

      {/* Customer Table */}
      <Paper>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Name</TableCell>
                <TableCell>Address</TableCell>
                <TableCell>Email</TableCell>
                <TableCell>Phone</TableCell>
                <TableCell align="center">Applications</TableCell>
                <TableCell align="center">Notifications</TableCell>
                <TableCell align="center">Status</TableCell>
                <TableCell align="center">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {isLoading && customers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} align="center" sx={{ py: 4 }}>
                    <CircularProgress />
                  </TableCell>
                </TableRow>
              ) : customers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} align="center" sx={{ py: 4 }}>
                    <Typography color="text.secondary">
                      {debouncedSearch ? 'No customers found matching your search' : 'No customers yet'}
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                customers.map((customer) => (
                  <TableRow
                    key={customer.id}
                    hover
                    sx={{ cursor: 'pointer' }}
                    onClick={() => handleEditClick(customer)}
                  >
                    <TableCell>
                      <Typography fontWeight={500}>{customer.name}</Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" color="text.secondary">
                        {formatAddress(customer)}
                      </Typography>
                    </TableCell>
                    <TableCell>{customer.email || '-'}</TableCell>
                    <TableCell>{customer.phone || '-'}</TableCell>
                    <TableCell align="center">
                      <Chip
                        label={customer.applicationCount ?? 0}
                        size="small"
                        color={customer.applicationCount ? 'primary' : 'default'}
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell align="center" onClick={(e) => e.stopPropagation()}>
                      <Tooltip title={customer.notifyByEmail ? 'Email notifications on' : 'Email notifications off'}>
                        <Switch
                          checked={customer.notifyByEmail}
                          onChange={() => handleNotificationToggle(customer)}
                          size="small"
                          icon={<EmailOutlinedIcon fontSize="small" />}
                          checkedIcon={<EmailIcon fontSize="small" />}
                        />
                      </Tooltip>
                    </TableCell>
                    <TableCell align="center">
                      <Chip
                        label={customer.isActive ? 'Active' : 'Inactive'}
                        size="small"
                        color={customer.isActive ? 'success' : 'default'}
                      />
                    </TableCell>
                    <TableCell align="center" onClick={(e) => e.stopPropagation()}>
                      <Tooltip title="Edit customer">
                        <IconButton size="small" onClick={() => handleEditClick(customer)}>
                          <EditIcon />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination
          rowsPerPageOptions={[5, 10, 25, 50]}
          component="div"
          count={total}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      </Paper>

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onClose={handleDialogClose} maxWidth="sm" fullWidth>
        <DialogTitle>{dialogTitle}</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            {/* Name */}
            <TextField
              label="Name"
              required
              fullWidth
              value={formData.name}
              onChange={(e) => handleFieldChange('name', e.target.value)}
              error={!!formErrors.name}
              helperText={formErrors.name}
            />

            {/* Address */}
            <TextField
              label="Address"
              required
              fullWidth
              value={formData.address}
              onChange={(e) => handleFieldChange('address', e.target.value)}
              error={!!formErrors.address}
              helperText={formErrors.address}
            />

            {/* City, State, ZIP */}
            <Box sx={{ display: 'flex', gap: 2 }}>
              <TextField
                label="City"
                required
                fullWidth
                value={formData.city}
                onChange={(e) => handleFieldChange('city', e.target.value)}
                error={!!formErrors.city}
                helperText={formErrors.city}
                sx={{ flex: 2 }}
              />
              <FormControl required sx={{ flex: 1 }} error={!!formErrors.state}>
                <InputLabel>State</InputLabel>
                <Select
                  value={formData.state}
                  label="State"
                  onChange={(e) => handleFieldChange('state', e.target.value)}
                >
                  {US_STATES.map((state) => (
                    <MenuItem key={state} value={state}>
                      {state}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <TextField
                label="ZIP Code"
                required
                value={formData.zipCode}
                onChange={(e) => handleFieldChange('zipCode', e.target.value)}
                error={!!formErrors.zipCode}
                helperText={formErrors.zipCode}
                sx={{ flex: 1.5 }}
                placeholder="12345"
              />
            </Box>

            {/* Email and Phone */}
            <Box sx={{ display: 'flex', gap: 2 }}>
              <TextField
                label="Email"
                type="email"
                fullWidth
                value={formData.email}
                onChange={(e) => handleFieldChange('email', e.target.value)}
                error={!!formErrors.email}
                helperText={formErrors.email}
              />
              <TextField
                label="Phone"
                fullWidth
                value={formData.phone}
                onChange={(e) => handleFieldChange('phone', e.target.value)}
              />
            </Box>

            {/* Notes */}
            <TextField
              label="Notes"
              multiline
              rows={3}
              fullWidth
              value={formData.notes}
              onChange={(e) => handleFieldChange('notes', e.target.value)}
            />

            {/* Notification Toggle */}
            <FormControlLabel
              control={
                <Switch
                  checked={formData.notifyByEmail}
                  onChange={(e) => handleFieldChange('notifyByEmail', e.target.checked)}
                />
              }
              label="Send email notifications"
            />

            {/* Active Status (only for edit) */}
            {editingCustomer && (
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.isActive}
                    onChange={(e) => handleFieldChange('isActive', e.target.checked)}
                  />
                }
                label="Customer is active"
              />
            )}
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={handleDialogClose} disabled={isSaving}>
            Cancel
          </Button>
          <Button variant="contained" onClick={handleSave} disabled={isSaving}>
            {isSaving ? <CircularProgress size={24} /> : 'Save'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
          severity={snackbar.severity}
          variant="filled"
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default CustomersPage;
