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
    Switch,
    FormControlLabel,
} from '@mui/material';
import {
    Add as AddIcon,
    Edit as EditIcon,
    Delete as DeleteIcon,
} from '@mui/icons-material';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider, DatePicker } from '@mui/x-date-pickers';
import { format } from 'date-fns';
import {
    fetchKundaRentals,
    fetchRentalSummary,
    createKundaRental,
    updateKundaRental,
    deleteKundaRental,
} from '../../store/slices/kundaRentalSlice';

const KundaRentals = () => {
    const dispatch = useDispatch();
    const { rentals = [], summary = {}, loading = false, error = null } = useSelector((state) => state.kundaRental || {});

    const [open, setOpen] = useState(false);
    const [formData, setFormData] = useState({
        renterName: '',
        renterContact: '',
        numberOfKundas: '',
        pricePerKunda: '',
        startDate: new Date(),
        endDate: null,
        isActive: true,
        notes: ''
    });
    const [selectedRental, setSelectedRental] = useState(null);
    const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);

    useEffect(() => {
        dispatch(fetchKundaRentals());
        dispatch(fetchRentalSummary());
    }, [dispatch]);

    const handleOpen = () => {
        setOpen(true);
        setSelectedRental(null);
        setFormData({
            renterName: '',
            renterContact: '',
            numberOfKundas: '',
            pricePerKunda: '',
            startDate: new Date(),
            endDate: null,
            isActive: true,
            notes: ''
        });
    };

    const handleClose = () => {
        setOpen(false);
        setSelectedRental(null);
    };

    const handleEdit = (rental) => {
        setSelectedRental(rental);
        setFormData({
            renterName: rental.renterName,
            renterContact: rental.renterContact,
            numberOfKundas: rental.numberOfKundas,
            pricePerKunda: rental.pricePerKunda,
            startDate: new Date(rental.startDate),
            endDate: rental.endDate ? new Date(rental.endDate) : null,
            isActive: rental.isActive,
            notes: rental.notes || ''
        });
        setOpen(true);
    };

    const handleDelete = async (id) => {
        await dispatch(deleteKundaRental(id));
        setDeleteConfirmOpen(false);
        dispatch(fetchRentalSummary());
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (selectedRental) {
            await dispatch(updateKundaRental({
                id: selectedRental._id,
                rentalData: formData
            }));
        } else {
            await dispatch(createKundaRental(formData));
        }
        handleClose();
        dispatch(fetchRentalSummary());
    };

    const formatCurrency = (amount) => {
        return `PKR ${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    };

    if (loading && !rentals.length) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
                <CircularProgress />
            </Box>
        );
    }

    return (
        <Container maxWidth={false}>
            <Box sx={{ pt: 3 }}>
                {/* Summary Section */}
                <Grid container spacing={3} mb={3}>
                    <Grid item xs={12} sm={6} md={3}>
                        <Paper sx={{ p: 2 }}>
                            <Typography variant="h6">Active Rentals</Typography>
                            <Typography variant="h4">{summary.totalActiveRentals}</Typography>
                        </Paper>
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                        <Paper sx={{ p: 2 }}>
                            <Typography variant="h6">Total Kundas Rented</Typography>
                            <Typography variant="h4">{summary.totalKundasRented}</Typography>
                        </Paper>
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                        <Paper sx={{ p: 2 }}>
                            <Typography variant="h6">Monthly Income</Typography>
                            <Typography variant="h4">{formatCurrency(summary.totalMonthlyIncome)}</Typography>
                        </Paper>
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                        <Paper sx={{ p: 2 }}>
                            <Typography variant="h6">Avg. Price per Kunda</Typography>
                            <Typography variant="h4">{formatCurrency(summary.averagePricePerKunda)}</Typography>
                        </Paper>
                    </Grid>
                </Grid>

                {/* Main Content */}
                <Grid container justifyContent="space-between" alignItems="center" mb={3}>
                    <Grid item>
                        <Typography variant="h4">Kunda Rentals</Typography>
                    </Grid>
                    <Grid item>
                        <Button
                            variant="contained"
                            startIcon={<AddIcon />}
                            onClick={handleOpen}
                        >
                            Add Rental
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
                                <TableCell>Renter Name</TableCell>
                                <TableCell>Contact</TableCell>
                                <TableCell>Kundas</TableCell>
                                <TableCell>Price/Kunda</TableCell>
                                <TableCell>Total Rent</TableCell>
                                <TableCell>Start Date</TableCell>
                                <TableCell>Status</TableCell>
                                <TableCell>Actions</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {rentals.map((rental) => (
                                <TableRow key={rental._id}>
                                    <TableCell>{rental.renterName}</TableCell>
                                    <TableCell>{rental.renterContact}</TableCell>
                                    <TableCell>{rental.numberOfKundas}</TableCell>
                                    <TableCell>{formatCurrency(rental.pricePerKunda)}</TableCell>
                                    <TableCell>{formatCurrency(rental.totalMonthlyRent)}</TableCell>
                                    <TableCell>{format(new Date(rental.startDate), 'dd/MM/yyyy')}</TableCell>
                                    <TableCell>{rental.isActive ? 'Active' : 'Inactive'}</TableCell>
                                    <TableCell>
                                        <IconButton onClick={() => handleEdit(rental)} size="small">
                                            <EditIcon />
                                        </IconButton>
                                        <IconButton
                                            onClick={() => {
                                                setSelectedRental(rental);
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

                {/* Rental Form Dialog */}
                <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
                    <DialogTitle>
                        {selectedRental ? 'Edit Rental' : 'Add New Rental'}
                    </DialogTitle>
                    <DialogContent>
                        <Box component="form" noValidate sx={{ mt: 2 }}>
                            <Grid container spacing={2}>
                                <Grid item xs={12}>
                                    <TextField
                                        fullWidth
                                        label="Renter Name"
                                        value={formData.renterName}
                                        onChange={(e) => setFormData({ ...formData, renterName: e.target.value })}
                                        required
                                    />
                                </Grid>
                                <Grid item xs={12}>
                                    <TextField
                                        fullWidth
                                        label="Contact Number"
                                        value={formData.renterContact}
                                        onChange={(e) => setFormData({ ...formData, renterContact: e.target.value })}
                                        required
                                    />
                                </Grid>
                                <Grid item xs={12} sm={6}>
                                    <TextField
                                        fullWidth
                                        label="Number of Kundas"
                                        type="number"
                                        value={formData.numberOfKundas}
                                        onChange={(e) => setFormData({ ...formData, numberOfKundas: e.target.value })}
                                        required
                                    />
                                </Grid>
                                <Grid item xs={12} sm={6}>
                                    <TextField
                                        fullWidth
                                        label="Price per Kunda"
                                        type="number"
                                        value={formData.pricePerKunda}
                                        onChange={(e) => setFormData({ ...formData, pricePerKunda: e.target.value })}
                                        required
                                    />
                                </Grid>
                                <Grid item xs={12} sm={6}>
                                    <LocalizationProvider dateAdapter={AdapterDateFns}>
                                        <DatePicker
                                            label="Start Date"
                                            value={formData.startDate}
                                            onChange={(newValue) => setFormData({ ...formData, startDate: newValue })}
                                            renderInput={(params) => <TextField {...params} fullWidth required />}
                                        />
                                    </LocalizationProvider>
                                </Grid>
                                <Grid item xs={12} sm={6}>
                                    <LocalizationProvider dateAdapter={AdapterDateFns}>
                                        <DatePicker
                                            label="End Date"
                                            value={formData.endDate}
                                            onChange={(newValue) => setFormData({ ...formData, endDate: newValue })}
                                            renderInput={(params) => <TextField {...params} fullWidth />}
                                        />
                                    </LocalizationProvider>
                                </Grid>
                                <Grid item xs={12}>
                                    <FormControlLabel
                                        control={
                                            <Switch
                                                checked={formData.isActive}
                                                onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                                            />
                                        }
                                        label="Active"
                                    />
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
                            {selectedRental ? 'Update' : 'Save'}
                        </Button>
                    </DialogActions>
                </Dialog>

                {/* Delete Confirmation Dialog */}
                <Dialog open={deleteConfirmOpen} onClose={() => setDeleteConfirmOpen(false)}>
                    <DialogTitle>Confirm Delete</DialogTitle>
                    <DialogContent>
                        Are you sure you want to delete this rental record?
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={() => setDeleteConfirmOpen(false)}>Cancel</Button>
                        <Button
                            onClick={() => handleDelete(selectedRental._id)}
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

export default KundaRentals; 