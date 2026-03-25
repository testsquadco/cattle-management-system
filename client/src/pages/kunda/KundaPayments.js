import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
    Box,
    Button,
    Card,
    CardContent,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    Grid,
    IconButton,
    MenuItem,
    Paper,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    TextField,
    Typography,
    CircularProgress,
    Alert,
    Chip
} from '@mui/material';
import {
    Add as AddIcon,
    Edit as EditIcon,
    Delete as DeleteIcon
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { fetchKundaRentals, fetchActiveRentals } from '../../store/slices/kundaRentalSlice';
import {
    fetchKundaPayments,
    createKundaPayment,
    updateKundaPayment,
    deleteKundaPayment,
    setSelectedPayment,
    clearSelectedPayment
} from '../../store/slices/kundaPaymentSlice';

const KundaPayments = () => {
    const dispatch = useDispatch();
    const [open, setOpen] = useState(false);
    const [formData, setFormData] = useState({
        rental: '',
        amount: '',
        month: null,
        paymentStatus: 'Pending',
        receivedBy: '',
        notes: ''
    });

    const { rentals = [], activeRentals = [], loading: rentalsLoading } = useSelector(state => state.kundaRental || {});
    const { payments = [], loading: paymentsLoading, error, selectedPayment } = useSelector(state => state.kundaPayment || {});

    useEffect(() => {
        dispatch(fetchKundaRentals());
        dispatch(fetchActiveRentals());
        dispatch(fetchKundaPayments());
    }, [dispatch]);

    const handleOpen = () => {
        setOpen(true);
    };

    const handleClose = () => {
        setOpen(false);
        setFormData({
            rental: '',
            amount: '',
            month: null,
            paymentStatus: 'Pending',
            receivedBy: '',
            notes: ''
        });
        dispatch(clearSelectedPayment());
    };

    const handleEdit = (payment) => {
        dispatch(setSelectedPayment(payment));
        setFormData({
            rental: payment.rental._id,
            amount: payment.amount,
            month: new Date(payment.month),
            paymentStatus: payment.paymentStatus,
            receivedBy: payment.receivedBy || '',
            notes: payment.notes || ''
        });
        setOpen(true);
    };

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to delete this payment?')) {
            await dispatch(deleteKundaPayment(id));
            dispatch(fetchKundaPayments());
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        const paymentData = {
            ...formData,
            month: formData.month.toISOString()
        };

        if (selectedPayment) {
            await dispatch(updateKundaPayment({ id: selectedPayment._id, paymentData }));
        } else {
            await dispatch(createKundaPayment(paymentData));
        }

        handleClose();
        dispatch(fetchKundaPayments());
    };

    const formatCurrency = (amount) => {
        return `PKR ${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    };

    const formatDate = (date) => {
        if (!date) return 'N/A';
        return new Date(date).toLocaleDateString('default', { 
            month: 'long',
            year: 'numeric'
        });
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'Paid':
                return 'success';
            case 'Overdue':
                return 'error';
            default:
                return 'warning';
        }
    };

    const renderPaymentTable = () => {
        if (paymentsLoading) return <CircularProgress />;
        if (error) return <Alert severity="error">{error}</Alert>;
        if (!payments?.length) return <Alert severity="info">No payments found</Alert>;

        return (
            <TableContainer component={Paper}>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell>Renter Name</TableCell>
                            <TableCell>Number of Kundas</TableCell>
                            <TableCell>Amount</TableCell>
                            <TableCell>Payment Status</TableCell>
                            <TableCell>Received By</TableCell>
                            <TableCell>Month</TableCell>
                            <TableCell>Actions</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {payments.map((payment) => (
                            <TableRow key={payment._id}>
                                <TableCell>{payment.rental?.renterName || 'N/A'}</TableCell>
                                <TableCell>{payment.rental?.numberOfKundas || 0}</TableCell>
                                <TableCell>{formatCurrency(payment.amount)}</TableCell>
                                <TableCell>
                                    <Chip 
                                        label={payment.paymentStatus} 
                                        color={getStatusColor(payment.paymentStatus)}
                                    />
                                </TableCell>
                                <TableCell>{payment.receivedBy || '-'}</TableCell>
                                <TableCell>{formatDate(payment.month)}</TableCell>
                                <TableCell>
                                    <IconButton onClick={() => handleEdit(payment)}>
                                        <EditIcon />
                                    </IconButton>
                                    <IconButton onClick={() => handleDelete(payment._id)}>
                                        <DeleteIcon />
                                    </IconButton>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>
        );
    };

    return (
        <Box sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
                <Typography variant="h4">Kunda Rental Payments</Typography>
                <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={handleOpen}
                >
                    Record Payment
                </Button>
            </Box>

            {renderPaymentTable()}

            <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
                <form onSubmit={handleSubmit}>
                    <DialogTitle>
                        {selectedPayment ? 'Edit Payment' : 'Record Payment'}
                    </DialogTitle>
                    <DialogContent>
                        <Grid container spacing={2} sx={{ mt: 1 }}>
                            <Grid item xs={12}>
                                <TextField
                                    select
                                    fullWidth
                                    label="Rental"
                                    value={formData.rental}
                                    onChange={(e) => {
                                        const rental = rentals.find(r => r._id === e.target.value);
                                        setFormData({
                                            ...formData,
                                            rental: e.target.value,
                                            amount: rental ? rental.numberOfKundas * rental.pricePerKunda : ''
                                        });
                                    }}
                                    required
                                >
                                    {rentals && rentals.map((rental) => (
                                        <MenuItem key={rental._id} value={rental._id}>
                                            {`${rental.renterName} - ${rental.numberOfKundas} Kundas`}
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
                                <DatePicker
                                    label="Month"
                                    value={formData.month}
                                    onChange={(date) => setFormData({ ...formData, month: date })}
                                    views={['year', 'month']}
                                    renderInput={(params) => <TextField {...params} fullWidth required />}
                                />
                            </Grid>
                            <Grid item xs={12}>
                                <TextField
                                    select
                                    fullWidth
                                    label="Payment Status"
                                    value={formData.paymentStatus}
                                    onChange={(e) => setFormData({ ...formData, paymentStatus: e.target.value })}
                                    required
                                >
                                    <MenuItem value="Pending">Pending</MenuItem>
                                    <MenuItem value="Paid">Paid</MenuItem>
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
                                    rows={2}
                                    value={formData.notes}
                                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                />
                            </Grid>
                        </Grid>
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={handleClose}>Cancel</Button>
                        <Button type="submit" variant="contained">
                            {selectedPayment ? 'Update' : 'Save'}
                        </Button>
                    </DialogActions>
                </form>
            </Dialog>
        </Box>
    );
};

export default KundaPayments; 