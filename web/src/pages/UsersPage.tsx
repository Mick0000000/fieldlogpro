/**
 * Users Management Page
 * Admin-only page for managing company users/team members
 */

import { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Button,
  Chip,
  IconButton,
  Switch,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  Snackbar,
  CircularProgress,
  Tooltip,
  FormHelperText,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Block as BlockIcon,
} from '@mui/icons-material';
import { useAppDispatch, useAppSelector } from '../hooks/useRedux';
import { fetchUsers, inviteUser, updateUser, clearError } from '../store/usersSlice';
import type { User, InviteUserData, UpdateUserData } from '../types';

// Form interfaces
interface InviteForm {
  email: string;
  firstName: string;
  lastName: string;
  role: 'admin' | 'applicator';
  licenseNumber: string;
  licenseState: string;
}

interface EditForm {
  firstName: string;
  lastName: string;
  role: 'admin' | 'applicator';
  licenseNumber: string;
  licenseState: string;
  isActive: boolean;
}

// Form validation
interface FormErrors {
  email?: string;
  firstName?: string;
  lastName?: string;
  licenseState?: string;
}

const initialInviteForm: InviteForm = {
  email: '',
  firstName: '',
  lastName: '',
  role: 'applicator',
  licenseNumber: '',
  licenseState: '',
};

const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

const validateLicenseState = (state: string): boolean => {
  if (!state) return true; // Optional field
  return /^[A-Z]{2}$/.test(state.toUpperCase());
};

const UsersPage = () => {
  const dispatch = useAppDispatch();
  const { items: users, isLoading, error, total } = useAppSelector(
    (state) => state.users
  );
  const currentUser = useAppSelector((state) => state.auth.user);

  // Pagination state
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // Dialog state
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  // Form state
  const [inviteForm, setInviteForm] = useState<InviteForm>(initialInviteForm);
  const [editForm, setEditForm] = useState<EditForm>({
    firstName: '',
    lastName: '',
    role: 'applicator',
    licenseNumber: '',
    licenseState: '',
    isActive: true,
  });
  const [formErrors, setFormErrors] = useState<FormErrors>({});

  // Snackbar state
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error' | 'info';
  }>({
    open: false,
    message: '',
    severity: 'success',
  });

  // Check if current user is admin
  const isAdmin = currentUser?.role === 'admin';

  // Fetch users on mount and when pagination changes
  useEffect(() => {
    if (isAdmin) {
      dispatch(fetchUsers({ page: page + 1, limit: rowsPerPage }));
    }
  }, [dispatch, page, rowsPerPage, isAdmin]);

  // Clear error when component unmounts
  useEffect(() => {
    return () => {
      dispatch(clearError());
    };
  }, [dispatch]);

  // Handle pagination
  const handleChangePage = (_event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  // Invite dialog handlers
  const handleOpenInviteDialog = () => {
    setInviteForm(initialInviteForm);
    setFormErrors({});
    setInviteDialogOpen(true);
  };

  const handleCloseInviteDialog = () => {
    setInviteDialogOpen(false);
    setInviteForm(initialInviteForm);
    setFormErrors({});
  };

  const handleInviteFormChange = (field: keyof InviteForm, value: string) => {
    setInviteForm((prev) => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (formErrors[field as keyof FormErrors]) {
      setFormErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const validateInviteForm = (): boolean => {
    const errors: FormErrors = {};

    if (!inviteForm.email.trim()) {
      errors.email = 'Email is required';
    } else if (!validateEmail(inviteForm.email)) {
      errors.email = 'Invalid email format';
    }

    if (!inviteForm.firstName.trim()) {
      errors.firstName = 'First name is required';
    }

    if (!inviteForm.lastName.trim()) {
      errors.lastName = 'Last name is required';
    }

    if (inviteForm.licenseState && !validateLicenseState(inviteForm.licenseState)) {
      errors.licenseState = 'Must be 2-letter state code (e.g., CA, TX)';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSendInvite = async () => {
    if (!validateInviteForm()) return;

    const inviteData: InviteUserData = {
      email: inviteForm.email.trim(),
      firstName: inviteForm.firstName.trim(),
      lastName: inviteForm.lastName.trim(),
      role: inviteForm.role,
    };

    if (inviteForm.licenseNumber.trim()) {
      inviteData.licenseNumber = inviteForm.licenseNumber.trim();
    }

    if (inviteForm.licenseState.trim()) {
      inviteData.licenseState = inviteForm.licenseState.toUpperCase().trim();
    }

    try {
      await dispatch(inviteUser(inviteData)).unwrap();
      setSnackbar({
        open: true,
        message: 'User invited successfully! Temporary password has been logged to the server console.',
        severity: 'success',
      });
      handleCloseInviteDialog();
    } catch (err) {
      setSnackbar({
        open: true,
        message: (err as string) || 'Failed to invite user',
        severity: 'error',
      });
    }
  };

  // Edit dialog handlers
  const handleOpenEditDialog = (user: User) => {
    setSelectedUser(user);
    setEditForm({
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      licenseNumber: user.licenseNumber || '',
      licenseState: user.licenseState || '',
      isActive: user.isActive,
    });
    setFormErrors({});
    setEditDialogOpen(true);
  };

  const handleCloseEditDialog = () => {
    setEditDialogOpen(false);
    setSelectedUser(null);
    setFormErrors({});
  };

  const handleEditFormChange = (field: keyof EditForm, value: string | boolean) => {
    setEditForm((prev) => ({ ...prev, [field]: value }));
    if (formErrors[field as keyof FormErrors]) {
      setFormErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const validateEditForm = (): boolean => {
    const errors: FormErrors = {};

    if (!editForm.firstName.trim()) {
      errors.firstName = 'First name is required';
    }

    if (!editForm.lastName.trim()) {
      errors.lastName = 'Last name is required';
    }

    if (editForm.licenseState && !validateLicenseState(editForm.licenseState)) {
      errors.licenseState = 'Must be 2-letter state code (e.g., CA, TX)';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSaveEdit = async () => {
    if (!selectedUser || !validateEditForm()) return;

    const isCurrentUser = selectedUser.id === currentUser?.id;

    // Prevent self-demotion
    if (isCurrentUser && selectedUser.role === 'admin' && editForm.role !== 'admin') {
      setSnackbar({
        open: true,
        message: 'You cannot demote yourself from admin',
        severity: 'error',
      });
      return;
    }

    // Prevent self-deactivation
    if (isCurrentUser && !editForm.isActive) {
      setSnackbar({
        open: true,
        message: 'You cannot deactivate your own account',
        severity: 'error',
      });
      return;
    }

    const updateData: UpdateUserData = {
      firstName: editForm.firstName.trim(),
      lastName: editForm.lastName.trim(),
      role: editForm.role,
      isActive: editForm.isActive,
    };

    // Only include license fields if they have values or are being cleared
    if (editForm.licenseNumber.trim() || selectedUser.licenseNumber) {
      updateData.licenseNumber = editForm.licenseNumber.trim() || undefined;
    }

    if (editForm.licenseState.trim() || selectedUser.licenseState) {
      updateData.licenseState = editForm.licenseState.toUpperCase().trim() || undefined;
    }

    try {
      await dispatch(updateUser({ id: selectedUser.id, data: updateData })).unwrap();
      setSnackbar({
        open: true,
        message: 'User updated successfully',
        severity: 'success',
      });
      handleCloseEditDialog();
    } catch (err) {
      setSnackbar({
        open: true,
        message: (err as string) || 'Failed to update user',
        severity: 'error',
      });
    }
  };

  // Quick toggle active status
  const handleToggleActive = async (user: User) => {
    const isCurrentUser = user.id === currentUser?.id;

    if (isCurrentUser) {
      setSnackbar({
        open: true,
        message: 'You cannot deactivate your own account',
        severity: 'error',
      });
      return;
    }

    try {
      await dispatch(
        updateUser({
          id: user.id,
          data: { isActive: !user.isActive },
        })
      ).unwrap();
      setSnackbar({
        open: true,
        message: `User ${user.isActive ? 'deactivated' : 'activated'} successfully`,
        severity: 'success',
      });
    } catch (err) {
      setSnackbar({
        open: true,
        message: (err as string) || 'Failed to update user status',
        severity: 'error',
      });
    }
  };

  // Role badge component
  const RoleBadge = ({ role }: { role: 'admin' | 'applicator' }) => (
    <Chip
      label={role === 'admin' ? 'Admin' : 'Applicator'}
      size="small"
      sx={{
        backgroundColor: role === 'admin' ? '#9c27b0' : '#2196f3',
        color: 'white',
        fontWeight: 500,
        textTransform: 'capitalize',
      }}
    />
  );

  // Access denied for non-admins
  if (!isAdmin) {
    return (
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '60vh',
          gap: 2,
        }}
      >
        <BlockIcon sx={{ fontSize: 64, color: 'error.main' }} />
        <Typography variant="h4" color="error">
          Access Denied
        </Typography>
        <Typography variant="body1" color="text.secondary">
          You must be an administrator to access this page.
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          mb: 3,
        }}
      >
        <Typography variant="h4" component="h1">
          Users Management
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleOpenInviteDialog}
        >
          Invite User
        </Button>
      </Box>

      {/* Error Alert */}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => dispatch(clearError())}>
          {error}
        </Alert>
      )}

      {/* Users Table */}
      <Paper sx={{ width: '100%', overflow: 'hidden' }}>
        <TableContainer>
          <Table stickyHeader>
            <TableHead>
              <TableRow>
                <TableCell>Name</TableCell>
                <TableCell>Email</TableCell>
                <TableCell>Role</TableCell>
                <TableCell>License #</TableCell>
                <TableCell align="center">Applications</TableCell>
                <TableCell align="center">Status</TableCell>
                <TableCell align="center">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {isLoading && users.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                    <CircularProgress />
                  </TableCell>
                </TableRow>
              ) : users.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                    <Typography color="text.secondary">No users found</Typography>
                  </TableCell>
                </TableRow>
              ) : (
                users.map((user) => {
                  const isCurrentUserRow = user.id === currentUser?.id;
                  return (
                    <TableRow
                      key={user.id}
                      hover
                      sx={{
                        backgroundColor: isCurrentUserRow ? 'action.hover' : 'inherit',
                        cursor: 'pointer',
                        '&:hover': {
                          backgroundColor: isCurrentUserRow
                            ? 'action.selected'
                            : 'action.hover',
                        },
                      }}
                      onClick={() => handleOpenEditDialog(user)}
                    >
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography>
                            {user.firstName} {user.lastName}
                          </Typography>
                          {isCurrentUserRow && (
                            <Chip
                              label="You"
                              size="small"
                              variant="outlined"
                              sx={{ height: 20, fontSize: '0.7rem' }}
                            />
                          )}
                        </Box>
                      </TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>
                        <RoleBadge role={user.role} />
                      </TableCell>
                      <TableCell>
                        {user.licenseNumber ? (
                          <Typography variant="body2">
                            {user.licenseNumber}
                            {user.licenseState && ` (${user.licenseState})`}
                          </Typography>
                        ) : (
                          <Typography variant="body2" color="text.secondary">
                            -
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell align="center">
                        <Chip
                          label={user.applicationCount ?? 0}
                          size="small"
                          variant="outlined"
                        />
                      </TableCell>
                      <TableCell align="center" onClick={(e) => e.stopPropagation()}>
                        <Tooltip
                          title={
                            isCurrentUserRow
                              ? "You can't deactivate yourself"
                              : user.isActive
                              ? 'Click to deactivate'
                              : 'Click to activate'
                          }
                        >
                          <span>
                            <Switch
                              checked={user.isActive}
                              onChange={() => handleToggleActive(user)}
                              disabled={isCurrentUserRow || isLoading}
                              color="success"
                              size="small"
                            />
                          </span>
                        </Tooltip>
                      </TableCell>
                      <TableCell align="center" onClick={(e) => e.stopPropagation()}>
                        <Tooltip title="Edit user">
                          <IconButton
                            size="small"
                            onClick={() => handleOpenEditDialog(user)}
                          >
                            <EditIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination
          rowsPerPageOptions={[5, 10, 25]}
          component="div"
          count={total}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      </Paper>

      {/* Invite User Dialog */}
      <Dialog
        open={inviteDialogOpen}
        onClose={handleCloseInviteDialog}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Invite New User</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
            <TextField
              label="Email"
              type="email"
              value={inviteForm.email}
              onChange={(e) => handleInviteFormChange('email', e.target.value)}
              error={!!formErrors.email}
              helperText={formErrors.email}
              required
              fullWidth
              autoFocus
            />
            <Box sx={{ display: 'flex', gap: 2 }}>
              <TextField
                label="First Name"
                value={inviteForm.firstName}
                onChange={(e) => handleInviteFormChange('firstName', e.target.value)}
                error={!!formErrors.firstName}
                helperText={formErrors.firstName}
                required
                fullWidth
              />
              <TextField
                label="Last Name"
                value={inviteForm.lastName}
                onChange={(e) => handleInviteFormChange('lastName', e.target.value)}
                error={!!formErrors.lastName}
                helperText={formErrors.lastName}
                required
                fullWidth
              />
            </Box>
            <FormControl fullWidth>
              <InputLabel>Role</InputLabel>
              <Select
                value={inviteForm.role}
                label="Role"
                onChange={(e) =>
                  handleInviteFormChange('role', e.target.value as 'admin' | 'applicator')
                }
              >
                <MenuItem value="applicator">Applicator</MenuItem>
                <MenuItem value="admin">Admin</MenuItem>
              </Select>
            </FormControl>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <TextField
                label="License Number"
                value={inviteForm.licenseNumber}
                onChange={(e) => handleInviteFormChange('licenseNumber', e.target.value)}
                fullWidth
                placeholder="Optional"
              />
              <TextField
                label="License State"
                value={inviteForm.licenseState}
                onChange={(e) =>
                  handleInviteFormChange('licenseState', e.target.value.toUpperCase())
                }
                error={!!formErrors.licenseState}
                helperText={formErrors.licenseState || '2-letter code'}
                sx={{ width: 150 }}
                inputProps={{ maxLength: 2 }}
                placeholder="CA"
              />
            </Box>
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={handleCloseInviteDialog}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleSendInvite}
            disabled={isLoading}
          >
            {isLoading ? <CircularProgress size={24} /> : 'Send Invite'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit User Dialog */}
      <Dialog
        open={editDialogOpen}
        onClose={handleCloseEditDialog}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          Edit User
          {selectedUser?.id === currentUser?.id && (
            <Chip
              label="Your Account"
              size="small"
              color="primary"
              sx={{ ml: 1 }}
            />
          )}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
            <TextField
              label="Email"
              value={selectedUser?.email || ''}
              disabled
              fullWidth
              helperText="Email cannot be changed"
            />
            <Box sx={{ display: 'flex', gap: 2 }}>
              <TextField
                label="First Name"
                value={editForm.firstName}
                onChange={(e) => handleEditFormChange('firstName', e.target.value)}
                error={!!formErrors.firstName}
                helperText={formErrors.firstName}
                required
                fullWidth
              />
              <TextField
                label="Last Name"
                value={editForm.lastName}
                onChange={(e) => handleEditFormChange('lastName', e.target.value)}
                error={!!formErrors.lastName}
                helperText={formErrors.lastName}
                required
                fullWidth
              />
            </Box>
            <FormControl fullWidth>
              <InputLabel>Role</InputLabel>
              <Select
                value={editForm.role}
                label="Role"
                onChange={(e) =>
                  handleEditFormChange('role', e.target.value as 'admin' | 'applicator')
                }
                disabled={
                  selectedUser?.id === currentUser?.id &&
                  selectedUser?.role === 'admin'
                }
              >
                <MenuItem value="applicator">Applicator</MenuItem>
                <MenuItem value="admin">Admin</MenuItem>
              </Select>
              {selectedUser?.id === currentUser?.id &&
                selectedUser?.role === 'admin' && (
                  <FormHelperText>
                    You cannot demote yourself from admin
                  </FormHelperText>
                )}
            </FormControl>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <TextField
                label="License Number"
                value={editForm.licenseNumber}
                onChange={(e) => handleEditFormChange('licenseNumber', e.target.value)}
                fullWidth
                placeholder="Optional"
              />
              <TextField
                label="License State"
                value={editForm.licenseState}
                onChange={(e) =>
                  handleEditFormChange('licenseState', e.target.value.toUpperCase())
                }
                error={!!formErrors.licenseState}
                helperText={formErrors.licenseState || '2-letter code'}
                sx={{ width: 150 }}
                inputProps={{ maxLength: 2 }}
                placeholder="CA"
              />
            </Box>
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                p: 2,
                bgcolor: 'grey.50',
                borderRadius: 1,
              }}
            >
              <Box>
                <Typography variant="subtitle2">Account Status</Typography>
                <Typography variant="body2" color="text.secondary">
                  {editForm.isActive
                    ? 'User can log in and access the system'
                    : 'User is blocked from accessing the system'}
                </Typography>
              </Box>
              <Tooltip
                title={
                  selectedUser?.id === currentUser?.id
                    ? "You can't deactivate yourself"
                    : ''
                }
              >
                <span>
                  <Switch
                    checked={editForm.isActive}
                    onChange={(e) =>
                      handleEditFormChange('isActive', e.target.checked)
                    }
                    disabled={selectedUser?.id === currentUser?.id}
                    color="success"
                  />
                </span>
              </Tooltip>
            </Box>
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={handleCloseEditDialog}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleSaveEdit}
            disabled={isLoading}
          >
            {isLoading ? <CircularProgress size={24} /> : 'Save Changes'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default UsersPage;
