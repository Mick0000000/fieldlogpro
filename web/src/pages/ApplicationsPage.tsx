/**
 * Applications Page - Main applications log table with filters, sorting, and detail view
 */

import { useEffect, useState, useMemo, useCallback } from 'react';
import type { SelectChangeEvent } from '@mui/material';
import {
  Box,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  TableSortLabel,
  Typography,
  Button,
  TextField,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Chip,
  Drawer,
  IconButton,
  Skeleton,
  Alert,
  Grid,
  Divider,
  Card,
  CardMedia,
  Stack,
} from '@mui/material';
import {
  FilterList as FilterListIcon,
  Clear as ClearIcon,
  Download as DownloadIcon,
  Close as CloseIcon,
  Refresh as RefreshIcon,
  Person as PersonIcon,
  Science as ScienceIcon,
  Cloud as CloudIcon,
  Notes as NotesIcon,
  PhotoLibrary as PhotoIcon,
} from '@mui/icons-material';
import { useAppDispatch, useAppSelector } from '../hooks/useRedux';
import { fetchApplications, fetchApplicationById, clearSelectedApplication } from '../store/applicationsSlice';
import { fetchCustomers } from '../store/customersSlice';
import { fetchUsers } from '../store/usersSlice';
import type { Application } from '../types';

// Sorting types
type Order = 'asc' | 'desc';
type SortableColumn = 'applicationDate' | 'customer' | 'chemicalName' | 'amount' | 'applicator' | 'status';

interface HeadCell {
  id: SortableColumn;
  label: string;
  sortable: boolean;
}

const headCells: HeadCell[] = [
  { id: 'applicationDate', label: 'Date', sortable: true },
  { id: 'customer', label: 'Customer', sortable: true },
  { id: 'chemicalName', label: 'Chemical', sortable: true },
  { id: 'amount', label: 'Amount', sortable: true },
  { id: 'applicator', label: 'Applicator', sortable: true },
  { id: 'status', label: 'Status', sortable: true },
];

// Date formatting helper
const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
};

// Status badge component
const StatusBadge = ({ status }: { status: 'completed' | 'voided' }) => (
  <Chip
    label={status.charAt(0).toUpperCase() + status.slice(1)}
    size="small"
    color={status === 'completed' ? 'success' : 'error'}
    variant="filled"
  />
);

// Loading skeleton for table rows
const TableRowSkeleton = () => (
  <>
    {[...Array(10)].map((_, index) => (
      <TableRow key={index}>
        {[...Array(6)].map((_, cellIndex) => (
          <TableCell key={cellIndex}>
            <Skeleton variant="text" />
          </TableCell>
        ))}
      </TableRow>
    ))}
  </>
);

// Helper components for detail drawer (declared outside to prevent re-creation during render)
const DetailSection = ({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) => (
  <Box sx={{ mb: 3 }}>
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
      {icon}
      <Typography variant="subtitle1" fontWeight="bold">
        {title}
      </Typography>
    </Box>
    {children}
  </Box>
);

const DetailItem = ({ label, value }: { label: string; value: string | number | null | undefined }) => (
  <Box sx={{ mb: 1 }}>
    <Typography variant="caption" color="text.secondary">
      {label}
    </Typography>
    <Typography variant="body2">{value || '-'}</Typography>
  </Box>
);

// Detail drawer content
const ApplicationDetailDrawer = ({
  application,
  onClose,
}: {
  application: Application | null;
  onClose: () => void;
}) => {
  if (!application) return null;

  return (
    <Box sx={{ width: 450, p: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h6">Application Details</Typography>
        <IconButton onClick={onClose} size="small">
          <CloseIcon />
        </IconButton>
      </Box>

      <Divider sx={{ mb: 3 }} />

      {/* Status and Date */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <StatusBadge status={application.status} />
        <Typography variant="body2" color="text.secondary">
          {formatDate(application.applicationDate)}
        </Typography>
      </Box>

      {/* Customer Info */}
      <DetailSection title="Customer Information" icon={<PersonIcon color="primary" />}>
        <Grid container spacing={2}>
          <Grid size={{ xs: 12 }}>
            <DetailItem label="Name" value={application.customer?.name} />
          </Grid>
          <Grid size={{ xs: 12 }}>
            <DetailItem
              label="Address"
              value={
                application.customer
                  ? `${application.customer.address || ''}, ${application.customer.city || ''}, ${application.customer.state || ''}`
                  : undefined
              }
            />
          </Grid>
        </Grid>
      </DetailSection>

      {/* Applicator Info */}
      <DetailSection title="Applicator Information" icon={<PersonIcon color="primary" />}>
        <Grid container spacing={2}>
          <Grid size={{ xs: 6 }}>
            <DetailItem
              label="Name"
              value={
                application.applicator
                  ? `${application.applicator.firstName} ${application.applicator.lastName}`
                  : undefined
              }
            />
          </Grid>
          <Grid size={{ xs: 6 }}>
            <DetailItem label="License #" value={application.applicator?.licenseNumber} />
          </Grid>
          <Grid size={{ xs: 6 }}>
            <DetailItem label="License State" value={application.applicator?.licenseState} />
          </Grid>
          <Grid size={{ xs: 6 }}>
            <DetailItem label="Email" value={application.applicator?.email} />
          </Grid>
        </Grid>
      </DetailSection>

      {/* Chemical Info */}
      <DetailSection title="Chemical Information" icon={<ScienceIcon color="primary" />}>
        <Grid container spacing={2}>
          <Grid size={{ xs: 6 }}>
            <DetailItem label="Chemical Name" value={application.chemicalName} />
          </Grid>
          <Grid size={{ xs: 6 }}>
            <DetailItem label="EPA Number" value={application.epaNumber} />
          </Grid>
          <Grid size={{ xs: 6 }}>
            <DetailItem label="Amount" value={`${application.amount} ${application.unit}`} />
          </Grid>
          <Grid size={{ xs: 6 }}>
            <DetailItem label="Application Method" value={application.applicationMethod} />
          </Grid>
          <Grid size={{ xs: 6 }}>
            <DetailItem label="Target Pest" value={application.targetPestName} />
          </Grid>
          <Grid size={{ xs: 6 }}>
            <DetailItem
              label="Area Treated"
              value={application.areaTreated ? `${application.areaTreated} ${application.areaUnit || ''}` : undefined}
            />
          </Grid>
          <Grid size={{ xs: 12 }}>
            <DetailItem label="Re-entry Interval" value={application.reentryInterval} />
          </Grid>
        </Grid>
      </DetailSection>

      {/* Weather Conditions */}
      <DetailSection title="Weather Conditions" icon={<CloudIcon color="primary" />}>
        <Grid container spacing={2}>
          <Grid size={{ xs: 6 }}>
            <DetailItem label="Temperature" value={application.temperature ? `${application.temperature}F` : undefined} />
          </Grid>
          <Grid size={{ xs: 6 }}>
            <DetailItem label="Humidity" value={application.humidity ? `${application.humidity}%` : undefined} />
          </Grid>
          <Grid size={{ xs: 6 }}>
            <DetailItem label="Wind Speed" value={application.windSpeed ? `${application.windSpeed} mph` : undefined} />
          </Grid>
          <Grid size={{ xs: 6 }}>
            <DetailItem label="Wind Direction" value={application.windDirection} />
          </Grid>
          <Grid size={{ xs: 12 }}>
            <DetailItem label="Conditions" value={application.weatherCondition} />
          </Grid>
        </Grid>
      </DetailSection>

      {/* Photos */}
      <DetailSection title="Photos" icon={<PhotoIcon color="primary" />}>
        <Stack direction="row" spacing={2} sx={{ overflowX: 'auto', pb: 1 }}>
          {application.labelPhotoUrl && (
            <Card sx={{ minWidth: 120 }}>
              <CardMedia
                component="img"
                height="80"
                image={application.labelPhotoUrl}
                alt="Label"
                sx={{ objectFit: 'cover' }}
              />
              <Typography variant="caption" sx={{ p: 0.5, display: 'block', textAlign: 'center' }}>
                Label
              </Typography>
            </Card>
          )}
          {application.beforePhotoUrl && (
            <Card sx={{ minWidth: 120 }}>
              <CardMedia
                component="img"
                height="80"
                image={application.beforePhotoUrl}
                alt="Before"
                sx={{ objectFit: 'cover' }}
              />
              <Typography variant="caption" sx={{ p: 0.5, display: 'block', textAlign: 'center' }}>
                Before
              </Typography>
            </Card>
          )}
          {application.afterPhotoUrl && (
            <Card sx={{ minWidth: 120 }}>
              <CardMedia
                component="img"
                height="80"
                image={application.afterPhotoUrl}
                alt="After"
                sx={{ objectFit: 'cover' }}
              />
              <Typography variant="caption" sx={{ p: 0.5, display: 'block', textAlign: 'center' }}>
                After
              </Typography>
            </Card>
          )}
          {!application.labelPhotoUrl && !application.beforePhotoUrl && !application.afterPhotoUrl && (
            <Typography variant="body2" color="text.secondary">
              No photos available
            </Typography>
          )}
        </Stack>
      </DetailSection>

      {/* Notes */}
      <DetailSection title="Notes" icon={<NotesIcon color="primary" />}>
        <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
          {application.notes || 'No notes'}
        </Typography>
      </DetailSection>

      {/* Additional Info */}
      <Box sx={{ mt: 3, pt: 2, borderTop: '1px solid', borderColor: 'divider' }}>
        <Typography variant="caption" color="text.secondary">
          Customer Consent: {application.customerConsent ? 'Yes' : 'No'}
        </Typography>
        <br />
        <Typography variant="caption" color="text.secondary">
          Created: {formatDate(application.createdAt)}
        </Typography>
      </Box>
    </Box>
  );
};

// Main ApplicationsPage component
export default function ApplicationsPage() {
  const dispatch = useAppDispatch();

  // Redux state
  const { items: applications, isLoading, error, total, selectedApplication } = useAppSelector(
    (state) => state.applications
  );
  const { items: customers } = useAppSelector((state) => state.customers);
  const { items: users } = useAppSelector((state) => state.users);

  // Local state for table
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(50);
  const [order, setOrder] = useState<Order>('desc');
  const [orderBy, setOrderBy] = useState<SortableColumn>('applicationDate');

  // Local state for filters
  const [dateFrom, setDateFrom] = useState<string>('');
  const [dateTo, setDateTo] = useState<string>('');
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('');
  const [selectedApplicatorId, setSelectedApplicatorId] = useState<string>('');

  // Applied filters (only update when filter button is clicked)
  const [appliedFilters, setAppliedFilters] = useState({
    dateFrom: '',
    dateTo: '',
    customerId: '',
    applicatorId: '',
  });

  // Drawer state
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Fetch initial data
  useEffect(() => {
    dispatch(fetchCustomers({ limit: 1000 })); // Fetch all customers for dropdown
    dispatch(fetchUsers({ limit: 1000 })); // Fetch all users for dropdown
  }, [dispatch]);

  // Fetch applications when page changes or filters are applied
  useEffect(() => {
    dispatch(
      fetchApplications({
        page: page + 1,
        limit: rowsPerPage,
        customerId: appliedFilters.customerId || undefined,
        applicatorId: appliedFilters.applicatorId || undefined,
        dateFrom: appliedFilters.dateFrom || undefined,
        dateTo: appliedFilters.dateTo || undefined,
      })
    );
  }, [dispatch, page, rowsPerPage, appliedFilters]);

  // Sort applications locally
  const sortedApplications = useMemo(() => {
    const comparator = (a: Application, b: Application): number => {
      let aValue: string | number;
      let bValue: string | number;

      switch (orderBy) {
        case 'applicationDate':
          aValue = new Date(a.applicationDate).getTime();
          bValue = new Date(b.applicationDate).getTime();
          break;
        case 'customer':
          aValue = a.customer?.name || '';
          bValue = b.customer?.name || '';
          break;
        case 'chemicalName':
          aValue = a.chemicalName;
          bValue = b.chemicalName;
          break;
        case 'amount':
          aValue = a.amount;
          bValue = b.amount;
          break;
        case 'applicator':
          aValue = a.applicator ? `${a.applicator.firstName} ${a.applicator.lastName}` : '';
          bValue = b.applicator ? `${b.applicator.firstName} ${b.applicator.lastName}` : '';
          break;
        case 'status':
          aValue = a.status;
          bValue = b.status;
          break;
        default:
          return 0;
      }

      if (aValue < bValue) return order === 'asc' ? -1 : 1;
      if (aValue > bValue) return order === 'asc' ? 1 : -1;
      return 0;
    };

    return [...applications].sort(comparator);
  }, [applications, order, orderBy]);

  // Handlers
  const handleRequestSort = (property: SortableColumn) => {
    const isAsc = orderBy === property && order === 'asc';
    setOrder(isAsc ? 'desc' : 'asc');
    setOrderBy(property);
  };

  const handleChangePage = (_: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleRowClick = (application: Application) => {
    dispatch(fetchApplicationById(application.id));
    setDrawerOpen(true);
  };

  const handleCloseDrawer = () => {
    setDrawerOpen(false);
    dispatch(clearSelectedApplication());
  };

  const handleApplyFilters = () => {
    setAppliedFilters({
      dateFrom,
      dateTo,
      customerId: selectedCustomerId,
      applicatorId: selectedApplicatorId,
    });
    setPage(0);
  };

  const handleClearFilters = () => {
    setDateFrom('');
    setDateTo('');
    setSelectedCustomerId('');
    setSelectedApplicatorId('');
    setAppliedFilters({
      dateFrom: '',
      dateTo: '',
      customerId: '',
      applicatorId: '',
    });
    setPage(0);
  };

  const handleRetry = () => {
    dispatch(
      fetchApplications({
        page: page + 1,
        limit: rowsPerPage,
        customerId: appliedFilters.customerId || undefined,
        applicatorId: appliedFilters.applicatorId || undefined,
        dateFrom: appliedFilters.dateFrom || undefined,
        dateTo: appliedFilters.dateTo || undefined,
      })
    );
  };

  const handleCustomerChange = (event: SelectChangeEvent<string>) => {
    setSelectedCustomerId(event.target.value);
  };

  const handleApplicatorChange = (event: SelectChangeEvent<string>) => {
    setSelectedApplicatorId(event.target.value);
  };

  // CSV Export function
  const exportToCsv = useCallback(() => {
    const headers = ['Date', 'Customer', 'Chemical', 'Amount', 'Applicator', 'Status'];
    const rows = sortedApplications.map((a) => [
      new Date(a.applicationDate).toLocaleString(),
      a.customer?.name || '',
      a.chemicalName,
      `${a.amount} ${a.unit}`,
      a.applicator ? `${a.applicator.firstName} ${a.applicator.lastName}` : '',
      a.status,
    ]);

    // Build CSV string
    const csvContent = [
      headers.join(','),
      ...rows.map((row) =>
        row.map((cell) => {
          // Escape quotes and wrap in quotes if contains comma or quote
          const escaped = String(cell).replace(/"/g, '""');
          return escaped.includes(',') || escaped.includes('"') || escaped.includes('\n')
            ? `"${escaped}"`
            : escaped;
        }).join(',')
      ),
    ].join('\n');

    // Create download link
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `applications_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, [sortedApplications]);

  // Filter applicators (users who can apply)
  const applicators = useMemo(() => users.filter((u) => u.isActive), [users]);

  // Check if filters have been modified
  const hasFilterChanges =
    dateFrom !== appliedFilters.dateFrom ||
    dateTo !== appliedFilters.dateTo ||
    selectedCustomerId !== appliedFilters.customerId ||
    selectedApplicatorId !== appliedFilters.applicatorId;

  const hasActiveFilters =
    appliedFilters.dateFrom || appliedFilters.dateTo || appliedFilters.customerId || appliedFilters.applicatorId;

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          Applications Log
        </Typography>
        <Button variant="outlined" startIcon={<DownloadIcon />} onClick={exportToCsv} disabled={isLoading || applications.length === 0}>
          Export CSV
        </Button>
      </Box>

      {/* Filters */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
          <FilterListIcon color="action" />
          <Typography variant="subtitle1" fontWeight="medium">
            Filters
          </Typography>
          {hasActiveFilters && (
            <Chip label="Active" size="small" color="primary" sx={{ ml: 1 }} />
          )}
        </Box>
        <Grid container spacing={2} alignItems="center">
          <Grid size={{ xs: 12, sm: 6, md: 2.5 }}>
            <TextField
              label="Date From"
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              fullWidth
              size="small"
              slotProps={{
                inputLabel: { shrink: true },
              }}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 2.5 }}>
            <TextField
              label="Date To"
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              fullWidth
              size="small"
              slotProps={{
                inputLabel: { shrink: true },
              }}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 2.5 }}>
            <FormControl fullWidth size="small">
              <InputLabel>Customer</InputLabel>
              <Select
                value={selectedCustomerId}
                label="Customer"
                onChange={handleCustomerChange}
              >
                <MenuItem value="">
                  <em>All Customers</em>
                </MenuItem>
                {customers.map((customer) => (
                  <MenuItem key={customer.id} value={customer.id}>
                    {customer.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 2.5 }}>
            <FormControl fullWidth size="small">
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
          <Grid size={{ xs: 12, md: 2 }}>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button
                variant="contained"
                onClick={handleApplyFilters}
                disabled={!hasFilterChanges}
                fullWidth
              >
                Filter
              </Button>
              <Button
                variant="outlined"
                onClick={handleClearFilters}
                disabled={!hasActiveFilters && !hasFilterChanges}
                startIcon={<ClearIcon />}
              >
                Clear
              </Button>
            </Box>
          </Grid>
        </Grid>
      </Paper>

      {/* Error State */}
      {error && (
        <Alert
          severity="error"
          sx={{ mb: 3 }}
          action={
            <Button color="inherit" size="small" onClick={handleRetry} startIcon={<RefreshIcon />}>
              Retry
            </Button>
          }
        >
          {error}
        </Alert>
      )}

      {/* Table */}
      <Paper>
        <TableContainer>
          <Table sx={{ minWidth: 750 }}>
            <TableHead>
              <TableRow>
                {headCells.map((headCell) => (
                  <TableCell
                    key={headCell.id}
                    sortDirection={orderBy === headCell.id ? order : false}
                  >
                    {headCell.sortable ? (
                      <TableSortLabel
                        active={orderBy === headCell.id}
                        direction={orderBy === headCell.id ? order : 'asc'}
                        onClick={() => handleRequestSort(headCell.id)}
                      >
                        {headCell.label}
                      </TableSortLabel>
                    ) : (
                      headCell.label
                    )}
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {isLoading ? (
                <TableRowSkeleton />
              ) : sortedApplications.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 8 }}>
                    <Typography variant="body1" color="text.secondary">
                      No applications found
                    </Typography>
                    {hasActiveFilters && (
                      <Button
                        sx={{ mt: 2 }}
                        variant="outlined"
                        size="small"
                        onClick={handleClearFilters}
                      >
                        Clear Filters
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ) : (
                sortedApplications.map((application) => (
                  <TableRow
                    key={application.id}
                    hover
                    onClick={() => handleRowClick(application)}
                    sx={{ cursor: 'pointer' }}
                  >
                    <TableCell>{formatDate(application.applicationDate)}</TableCell>
                    <TableCell>{application.customer?.name || '-'}</TableCell>
                    <TableCell>{application.chemicalName}</TableCell>
                    <TableCell>
                      {application.amount} {application.unit}
                    </TableCell>
                    <TableCell>
                      {application.applicator
                        ? `${application.applicator.firstName} ${application.applicator.lastName}`
                        : '-'}
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={application.status} />
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination
          rowsPerPageOptions={[25, 50, 100]}
          component="div"
          count={total}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      </Paper>

      {/* Detail Drawer */}
      <Drawer anchor="right" open={drawerOpen} onClose={handleCloseDrawer}>
        <ApplicationDetailDrawer application={selectedApplication} onClose={handleCloseDrawer} />
      </Drawer>
    </Box>
  );
}
