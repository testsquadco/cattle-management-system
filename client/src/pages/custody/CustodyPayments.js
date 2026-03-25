import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  Container,
  Grid,
  Paper,
  Typography,
  Button,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  MenuItem,
  IconButton,
  Box,
  Alert,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Receipt as ReceiptIcon,
} from '@mui/icons-material';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider, DatePicker } from '@mui/x-date-pickers';
import { format } from 'date-fns';
import {
  fetchCustodyPayments,
  createCustodyPayment,
  updateCustodyPayment,
  deleteCustodyPayment,
} from '../../store/slices/custodyPaymentSlice';
import { fetchCattle } from '../../store/slices/cattleSlice';

const CustodyPayments = () => {
  const dispatch = useDispatch();
  const { payments, loading, error } = useSelector((state) => state.custodyPayment);
  const { cattle } = useSelector((state) => state.cattle);
  const custodyCattle = cattle.filter(c => c.custodyType === 'Custody');

  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    cattle: '',
    amount: '',
    month: new Date(),
    status: 'Pending',
    receivedBy: '',
    notes: ''
  });
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);

  useEffect(() => {
    dispatch(fetchCustodyPayments());
    dispatch(fetchCattle());
  }, [dispatch]);

  const handleOpen = () => {
    setOpen(true);
    setSelectedPayment(null);
    setFormData({
      cattle: '',
      amount: '',
      month: new Date(),
      status: 'Pending',
      receivedBy: '',
      notes: ''
    });
  };

  const handleClose = () => {
    setOpen(false);
    setSelectedPayment(null);
  };

  const handleEdit = (payment) => {
    setSelectedPayment(payment);
    setFormData({
      cattle: payment.cattle._id,
      amount: payment.amount,
      month: new Date(payment.month),
      status: payment.paymentStatus,
      receivedBy: payment.receivedBy || '',
      notes: payment.notes || ''
    });
    setOpen(true);
  };

  const handleDelete = async (id) => {
    await dispatch(deleteCustodyPayment(id));
    setDeleteConfirmOpen(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const submissionData = {
      ...formData,
      paymentStatus: formData.status // Map status to paymentStatus
    };
    if (selectedPayment) {
      await dispatch(updateCustodyPayment({
        id: selectedPayment._id,
        paymentData: submissionData,
      }));
    } else {
      await dispatch(createCustodyPayment(submissionData));
    }
    handleClose();
    dispatch(fetchCustodyPayments());
  };

  const formatCurrency = (amount) => {
    return `PKR ${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  if (loading && !payments.length) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth={false}>
      <Box sx={{ pt: 3 }}>
        <Grid container justifyContent="space-between" alignItems="center" mb={3}>
          <Grid item>
            <Typography variant="h4">Custody Payments</Typography>
          </Grid>
          <Grid item>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={handleOpen}
            >
              Record Payment
            </Button>
          </Grid>
        </Grid>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Receipt #</TableCell>
                <TableCell>Cattle</TableCell>
                <TableCell>Owner</TableCell>
                <TableCell>Amount</TableCell>
                <TableCell>Payment Month</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Received By</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {payments.map((payment) => (
                <TableRow key={payment._id}>
                  <TableCell>{payment.receiptNumber}</TableCell>
                  <TableCell>{`${payment.cattle.tag} - ${payment.cattle.breed}`}</TableCell>
                  <TableCell>{payment.cattle.custodyDetails.ownerName}</TableCell>
                  <TableCell>{formatCurrency(payment.amount)}</TableCell>
                  <TableCell>{format(new Date(payment.month), 'MMMM yyyy')}</TableCell>
                  <TableCell>{payment.paymentStatus}</TableCell>
                  <TableCell>{payment.receivedBy || '-'}</TableCell>
                  <TableCell>
                    <IconButton onClick={() => handleEdit(payment)} size="small">
                      <EditIcon />
                    </IconButton>
                    <IconButton
                      onClick={() => {
                        setSelectedPayment(payment);
                        setDeleteConfirmOpen(true);
                      }}
                      size="small"
                      color="error"
                    >
                      <DeleteIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>

        {/* Payment Form Dialog */}
        <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
          <DialogTitle>
            {selectedPayment ? 'Edit Payment' : 'Record New Payment'}
          </DialogTitle>
          <DialogContent>
            <Box component="form" noValidate sx={{ mt: 2 }}>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <TextField
                    select
                    fullWidth
                    label="Cattle"
                    value={formData.cattle}
                    onChange={(e) => setFormData({ ...formData, cattle: e.target.value })}
                    required
                  >
                    {custodyCattle.map((c) => (
                      <MenuItem key={c._id} value={c._id}>
                        {`${c.tag} - ${c.breed} (${c.custodyDetails.ownerName})`}
                      </MenuItem>
                    ))}
                  </TextField>
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Amount"
                    type="number"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    required
                  />
                </Grid>
                <Grid item xs={12}>
                  <LocalizationProvider dateAdapter={AdapterDateFns}>
                    <DatePicker
                      label="Payment Month"
                      value={formData.month}
                      onChange={(newValue) => setFormData({ ...formData, month: newValue })}
                      views={['year', 'month']}
                      renderInput={(params) => <TextField {...params} fullWidth required />}
                    />
                  </LocalizationProvider>
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    select
                    fullWidth
                    label="Status"
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    required
                  >
                    <MenuItem value="Paid">Paid</MenuItem>
                    <MenuItem value="Pending">Pending</MenuItem>
                    <MenuItem value="Overdue">Overdue</MenuItem>
                  </TextField>
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    select
                    fullWidth
                    label="Received By"
                    value={formData.receivedBy}
                    onChange={(e) => setFormData({ ...formData, receivedBy: e.target.value })}
                    required
                  >
                    <MenuItem value="Eliya">Eliya</MenuItem>
                    <MenuItem value="Kumail">Kumail</MenuItem>
                  </TextField>
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Notes"
                    multiline
                    rows={3}
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  />
                </Grid>
              </Grid>
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleClose}>Cancel</Button>
            <Button onClick={handleSubmit} variant="contained">
              {selectedPayment ? 'Update' : 'Save'}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <Dialog open={deleteConfirmOpen} onClose={() => setDeleteConfirmOpen(false)}>
          <DialogTitle>Confirm Delete</DialogTitle>
          <DialogContent>
            Are you sure you want to delete this payment record?
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDeleteConfirmOpen(false)}>Cancel</Button>
            <Button
              onClick={() => handleDelete(selectedPayment._id)}
              color="error"
              variant="contained"
            >
              Delete
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </Container>
  );
};

export default CustodyPayments; 