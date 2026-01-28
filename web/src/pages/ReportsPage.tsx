/**
 * Reports Page - Compliance report generation UI for regulatory compliance
 */

import { useEffect, useState, useMemo } from 'react';
import type { SelectChangeEvent } from '@mui/material';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  TextField,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Grid,
  Divider,
  CircularProgress,
  Snackbar,
  Alert,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
} from '@mui/material';
import {
  Assessment as AssessmentIcon,
  PictureAsPdf as PdfIcon,
  DateRange as DateRangeIcon,
  Home as HomeIcon,
  Person as PersonIcon,
  TableChart as TableChartIcon,
  Check as CheckIcon,
} from '@mui/icons-material';
import { useAppDispatch, useAppSelector } from '../hooks/useRedux';
import { fetchApplications } from '../store/applicationsSlice';
import { fetchCustomers } from '../store/customersSlice';
import { fetchUsers } from '../store/usersSlice';
import api from '../services/api';

// Supported states for compliance reports
const SUPPORTED_STATES = [
  { value: 'CA', label: 'California' },
  { value: 'FL', label: 'Florida' },
  { value: 'TX', label: 'Texas' },
];

// State-specific information about what's included in reports
const STATE_REPORT_INFO: Record<string, string[]> = {
  CA: [
    'Applicator license number and certification',
    'EPA registration number for all chemicals',
    'Restricted materials usage reporting',
    'Application site coordinates (latitude/longitude)',
    'Weather conditions at time of application',
  ],
  FL: [
    'Certified applicator information',
    'Target pest and treatment area',
    'Chemical concentration and dilution rates',
    'Customer notification records',
    'Re-entry interval documentation',
  ],
  TX: [
    'Structural pest control license info',
    'Application method and equipment',
    'Treatment area measurements',
    'Chemical manufacturer and lot numbers',
    'Pre-treatment inspection notes',
  ],
};

// Date formatting helpers
const formatDateDisplay = (dateString: string): string => {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
};

export default function ReportsPage() {
  const dispatch = useAppDispatch();

  // Redux state
  const { total: applicationCount, isLoading: applicationsLoading } = useAppSelector(
    (state) => state.applications
  );
  const { items: customers } = useAppSelector((state) => state.customers);
  const { items: users } = useAppSelector((state) => state.users);

  // Form state
  const [selectedState, setSelectedState] = useState<string>('CA');
  const [dateFrom, setDateFrom] = useState<string>('');
  const [dateTo, setDateTo] = useState<string>('');
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('');
  const [selectedApplicatorId, setSelectedApplicatorId] = useState<string>('');

  // UI state
  const [isGenerating, setIsGenerating] = useState(false);
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error';
  }>({
    open: false,
    message: '',
    severity: 'success',
  });

  // Fetch customers and users on mount
  useEffect(() => {
    dispatch(fetchCustomers({ limit: 1000 }));
    dispatch(fetchUsers({ limit: 1000 }));
  }, [dispatch]);

  // Fetch application count when filters change
  useEffect(() => {
    if (dateFrom && dateTo) {
      dispatch(
        fetchApplications({
          limit: 1, // We only need the count
          customerId: selectedCustomerId || undefined,
          applicatorId: selectedApplicatorId || undefined,
          dateFrom: dateFrom || undefined,
          dateTo: dateTo || undefined,
        })
      );
    }
  }, [dispatch, dateFrom, dateTo, selectedCustomerId, selectedApplicatorId]);

  // Filter applicators (active users)
  const applicators = useMemo(() => users.filter((u) => u.isActive), [users]);

  // Get unique customers count from filter
  const filteredCustomerCount = useMemo(() => {
    if (selectedCustomerId) return 1;
    return customers.filter((c) => c.isActive).length;
  }, [customers, selectedCustomerId]);

  // Get unique applicators count from filter
  const filteredApplicatorCount = useMemo(() => {
    if (selectedApplicatorId) return 1;
    return applicators.length;
  }, [applicators, selectedApplicatorId]);

  // Check if form is valid for generating report
  const isFormValid = dateFrom && dateTo && selectedState;

  // Handle state change
  const handleStateChange = (event: SelectChangeEvent<string>) => {
    setSelectedState(event.target.value);
  };

  // Handle customer change
  const handleCustomerChange = (event: SelectChangeEvent<string>) => {
    setSelectedCustomerId(event.target.value);
  };

  // Handle applicator change
  const handleApplicatorChange = (event: SelectChangeEvent<string>) => {
    setSelectedApplicatorId(event.target.value);
  };

  // Generate PDF report
  const handleGenerateReport = async () => {
    if (!isFormValid) return;

    setIsGenerating(true);
    try {
      const response = await api.post(
        '/reports/generate',
        {
          state: selectedState,
          dateFrom,
          dateTo,
          customerId: selectedCustomerId || undefined,
          applicatorId: selectedApplicatorId || undefined,
        },
        {
          responseType: 'blob', // Important for file download
        }
      );

      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute(
        'download',
        `compliance-report-${selectedState}-${new Date().toISOString().split('T')[0]}.pdf`
      );
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      setSnackbar({
        open: true,
        message: 'Report downloaded successfully!',
        severity: 'success',
      });
    } catch (error) {
      console.error('Failed to generate report:', error);
      setSnackbar({
        open: true,
        message: error instanceof Error ? error.message : 'Failed to generate report',
        severity: 'error',
      });
    } finally {
      setIsGenerating(false);
    }
  };

  // Close snackbar
  const handleCloseSnackbar = () => {
    setSnackbar((prev) => ({ ...prev, open: false }));
  };

  return (
    <Box sx={{ p: 3, maxWidth: 800, mx: 'auto' }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
          <AssessmentIcon sx={{ fontSize: 32, color: 'primary.main' }} />
          <Typography variant="h4" component="h1">
            Compliance Reports
          </Typography>
        </Box>
        <Typography variant="body1" color="text.secondary">
          Generate state-compliant pesticide application reports for regulatory compliance.
        </Typography>
      </Box>

      {/* Report Settings Card */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <TableChartIcon color="primary" />
            Report Settings
          </Typography>
          <Divider sx={{ mb: 3 }} />

          <Grid container spacing={3}>
            {/* State Selector */}
            <Grid size={{ xs: 12 }}>
              <FormControl fullWidth>
                <InputLabel>State</InputLabel>
                <Select
                  value={selectedState}
                  label="State"
                  onChange={handleStateChange}
                >
                  {SUPPORTED_STATES.map((state) => (
                    <MenuItem key={state.value} value={state.value}>
                      {state.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            {/* Date Range */}
            <Grid size={{ xs: 12 }}>
              <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
                Date Range
              </Typography>
              <Grid container spacing={2}>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    label="From"
                    type="date"
                    value={dateFrom}
                    onChange={(e) => setDateFrom(e.target.value)}
                    fullWidth
                    slotProps={{
                      inputLabel: { shrink: true },
                    }}
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    label="To"
                    type="date"
                    value={dateTo}
                    onChange={(e) => setDateTo(e.target.value)}
                    fullWidth
                    slotProps={{
                      inputLabel: { shrink: true },
                    }}
                  />
                </Grid>
              </Grid>
            </Grid>

            {/* Optional Filters */}
            <Grid size={{ xs: 12 }}>
              <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
                Filters (Optional)
              </Typography>
              <Grid container spacing={2}>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <FormControl fullWidth>
                    <InputLabel>Customer</InputLabel>
                    <Select
                      value={selectedCustomerId}
                      label="Customer"
                      onChange={handleCustomerChange}
                    >
                      <MenuItem value="">
                        <em>All Customers</em>
                      </MenuItem>
                      {customers
                        .filter((c) => c.isActive)
                        .map((customer) => (
                          <MenuItem key={customer.id} value={customer.id}>
                            {customer.name}
                          </MenuItem>
                        ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <FormControl fullWidth>
                    <InputLabel>Applicator</InputLabel>
                    <Select
                      value={selectedApplicatorId}
                      label="Applicator"
                      onChange={handleApplicatorChange}
                    >
                      <MenuItem value="">
                        <em>All Applicators</em>
                      </MenuItem>
                      {applicators.map((user) => (
                        <MenuItem key={user.id} value={user.id}>
                          {user.firstName} {user.lastName}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
              </Grid>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Preview Card */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <AssessmentIcon color="primary" />
            Preview
          </Typography>
          <Divider sx={{ mb: 2 }} />

          {dateFrom && dateTo ? (
            <Box>
              <List dense disablePadding>
                <ListItem disableGutters>
                  <ListItemIcon sx={{ minWidth: 36 }}>
                    <TableChartIcon color="action" />
                  </ListItemIcon>
                  <ListItemText
                    primary={
                      applicationsLoading ? (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <CircularProgress size={16} />
                          <span>Counting applications...</span>
                        </Box>
                      ) : (
                        <strong>{applicationCount} applications</strong>
                      )
                    }
                    secondary="match your criteria"
                  />
                </ListItem>
                <ListItem disableGutters>
                  <ListItemIcon sx={{ minWidth: 36 }}>
                    <DateRangeIcon color="action" />
                  </ListItemIcon>
                  <ListItemText
                    primary={`Date range: ${formatDateDisplay(dateFrom)} - ${formatDateDisplay(dateTo)}`}
                  />
                </ListItem>
                <ListItem disableGutters>
                  <ListItemIcon sx={{ minWidth: 36 }}>
                    <HomeIcon color="action" />
                  </ListItemIcon>
                  <ListItemText
                    primary={`Customers: ${selectedCustomerId ? '1 (filtered)' : filteredCustomerCount}`}
                  />
                </ListItem>
                <ListItem disableGutters>
                  <ListItemIcon sx={{ minWidth: 36 }}>
                    <PersonIcon color="action" />
                  </ListItemIcon>
                  <ListItemText
                    primary={`Applicators: ${selectedApplicatorId ? '1 (filtered)' : filteredApplicatorCount}`}
                  />
                </ListItem>
              </List>

              {/* State-specific info */}
              <Box sx={{ mt: 3, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
                <Typography variant="subtitle2" gutterBottom>
                  {SUPPORTED_STATES.find((s) => s.value === selectedState)?.label} Report Includes:
                </Typography>
                <List dense disablePadding>
                  {STATE_REPORT_INFO[selectedState]?.map((item, index) => (
                    <ListItem key={index} disableGutters sx={{ py: 0.25 }}>
                      <ListItemIcon sx={{ minWidth: 28 }}>
                        <CheckIcon fontSize="small" color="success" />
                      </ListItemIcon>
                      <ListItemText
                        primary={item}
                        primaryTypographyProps={{ variant: 'body2' }}
                      />
                    </ListItem>
                  ))}
                </List>
              </Box>
            </Box>
          ) : (
            <Typography variant="body2" color="text.secondary" sx={{ py: 2, textAlign: 'center' }}>
              Select a date range to see a preview of what will be included in the report.
            </Typography>
          )}
        </CardContent>
      </Card>

      {/* Generate Button */}
      <Box sx={{ display: 'flex', justifyContent: 'center' }}>
        <Button
          variant="contained"
          size="large"
          startIcon={isGenerating ? <CircularProgress size={20} color="inherit" /> : <PdfIcon />}
          onClick={handleGenerateReport}
          disabled={!isFormValid || isGenerating || (Boolean(dateFrom) && Boolean(dateTo) && applicationCount === 0)}
          sx={{ minWidth: 250 }}
        >
          {isGenerating ? 'Generating Report...' : 'Generate PDF Report'}
        </Button>
      </Box>

      {/* Validation message */}
      {!dateFrom || !dateTo ? (
        <Typography variant="body2" color="text.secondary" sx={{ mt: 2, textAlign: 'center' }}>
          Please select a date range to generate a report.
        </Typography>
      ) : applicationCount === 0 && !applicationsLoading ? (
        <Typography variant="body2" color="error" sx={{ mt: 2, textAlign: 'center' }}>
          No applications found for the selected criteria. Please adjust your filters.
        </Typography>
      ) : null}

      {/* Snackbar for success/error messages */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
