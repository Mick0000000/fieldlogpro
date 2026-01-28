/**
 * Notifications Page
 * Displays notification history with filtering and resend functionality
 */

import { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Chip,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Snackbar,
  Alert,
  CircularProgress,
  Tooltip,
} from '@mui/material';
import {
  Refresh as RefreshIcon,
  Send as SendIcon,
} from '@mui/icons-material';
import { useAppDispatch, useAppSelector } from '../hooks/useRedux';
import {
  fetchNotifications,
  resendNotification,
  clearError,
  type NotificationStatus,
} from '../store/notificationsSlice';

const NotificationsPage = () => {
  const dispatch = useAppDispatch();
  const { items: notifications, isLoading, isResending, error, total } = useAppSelector(
    (state) => state.notifications
  );

  // Local state
  const [statusFilter, setStatusFilter] = useState<NotificationStatus | 'all'>('all');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [resendingId, setResendingId] = useState<string | null>(null);
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error';
  }>({
    open: false,
    message: '',
    severity: 'success',
  });

  // Fetch notifications when page, rowsPerPage, or status filter changes
  useEffect(() => {
    dispatch(
      fetchNotifications({
        page: page + 1, // API uses 1-based pagination
        limit: rowsPerPage,
        status: statusFilter === 'all' ? undefined : statusFilter,
      })
    );
  }, [dispatch, page, rowsPerPage, statusFilter]);

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

  // Handle status filter change
  const handleStatusFilterChange = (value: NotificationStatus | 'all') => {
    setStatusFilter(value);
    setPage(0); // Reset to first page on filter change
  };

  // Handle pagination
  const handleChangePage = (_: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  // Handle resend notification
  const handleResend = async (notificationId: string) => {
    setResendingId(notificationId);
    try {
      await dispatch(resendNotification(notificationId)).unwrap();
      setSnackbar({
        open: true,
        message: 'Notification resent successfully',
        severity: 'success',
      });
    } catch (err) {
      setSnackbar({
        open: true,
        message: err instanceof Error ? err.message : 'Failed to resend notification',
        severity: 'error',
      });
    } finally {
      setResendingId(null);
    }
  };

  // Handle refresh
  const handleRefresh = () => {
    dispatch(
      fetchNotifications({
        page: page + 1,
        limit: rowsPerPage,
        status: statusFilter === 'all' ? undefined : statusFilter,
      })
    );
  };

  // Format date for display
  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleString();
  };

  // Get status chip color
  const getStatusChipColor = (
    status: NotificationStatus
  ): 'success' | 'warning' | 'error' => {
    switch (status) {
      case 'delivered':
        return 'success';
      case 'sent':
        return 'warning';
      case 'failed':
        return 'error';
      default:
        return 'warning';
    }
  };

  // Get delivery info based on status
  const getDeliveryInfo = (notification: {
    status: NotificationStatus;
    deliveredAt?: string | null;
    failedAt?: string | null;
    failureReason?: string | null;
  }): string => {
    switch (notification.status) {
      case 'delivered':
        return notification.deliveredAt
          ? `Delivered: ${formatDate(notification.deliveredAt)}`
          : 'Delivered';
      case 'failed':
        return notification.failureReason || 'Delivery failed';
      case 'sent':
        return 'Awaiting delivery confirmation';
      default:
        return '-';
    }
  };

  return (
    <Box>
      {/* Header */}
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          mb: 3,
        }}
      >
        <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold' }}>
          Notifications
        </Typography>
        <Button
          variant="outlined"
          startIcon={<RefreshIcon />}
          onClick={handleRefresh}
          disabled={isLoading}
        >
          Refresh
        </Button>
      </Box>

      {/* Filters */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <FormControl sx={{ minWidth: 200 }}>
          <InputLabel>Status Filter</InputLabel>
          <Select
            value={statusFilter}
            label="Status Filter"
            onChange={(e) =>
              handleStatusFilterChange(e.target.value as NotificationStatus | 'all')
            }
          >
            <MenuItem value="all">All Statuses</MenuItem>
            <MenuItem value="sent">Sent</MenuItem>
            <MenuItem value="delivered">Delivered</MenuItem>
            <MenuItem value="failed">Failed</MenuItem>
          </Select>
        </FormControl>
      </Paper>

      {/* Notifications Table */}
      <Paper>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Date</TableCell>
                <TableCell>Customer</TableCell>
                <TableCell>Email</TableCell>
                <TableCell align="center">Status</TableCell>
                <TableCell>Delivery Info</TableCell>
                <TableCell align="center">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {isLoading && notifications.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                    <CircularProgress />
                  </TableCell>
                </TableRow>
              ) : notifications.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                    <Typography color="text.secondary">
                      {statusFilter !== 'all'
                        ? `No notifications with status "${statusFilter}"`
                        : 'No notifications yet'}
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                notifications.map((notification) => (
                  <TableRow key={notification.id} hover>
                    <TableCell>
                      <Typography variant="body2">
                        {formatDate(notification.sentAt)}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography fontWeight={500}>
                        {notification.customerName}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" color="text.secondary">
                        {notification.customerEmail}
                      </Typography>
                    </TableCell>
                    <TableCell align="center">
                      <Chip
                        label={notification.status.charAt(0).toUpperCase() + notification.status.slice(1)}
                        size="small"
                        color={getStatusChipColor(notification.status)}
                      />
                    </TableCell>
                    <TableCell>
                      <Tooltip
                        title={
                          notification.status === 'failed' && notification.failureReason
                            ? notification.failureReason
                            : ''
                        }
                      >
                        <Typography
                          variant="body2"
                          color={
                            notification.status === 'failed'
                              ? 'error.main'
                              : 'text.secondary'
                          }
                          sx={{
                            maxWidth: 250,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {getDeliveryInfo(notification)}
                        </Typography>
                      </Tooltip>
                    </TableCell>
                    <TableCell align="center">
                      {notification.status === 'failed' && (
                        <Button
                          size="small"
                          variant="outlined"
                          color="primary"
                          startIcon={
                            resendingId === notification.id ? (
                              <CircularProgress size={16} />
                            ) : (
                              <SendIcon />
                            )
                          }
                          onClick={() => handleResend(notification.id)}
                          disabled={isResending || resendingId === notification.id}
                        >
                          Resend
                        </Button>
                      )}
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

export default NotificationsPage;
