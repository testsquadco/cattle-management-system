import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
    Box,
    Button,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    IconButton,
    Typography,
    MenuItem,
    Grid,
    Autocomplete,
    Tooltip
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import {
    Add as AddIcon,
    Edit as EditIcon,
    Delete as DeleteIcon
} from '@mui/icons-material';
import api from '../../utils/api';

const DailyFeedLogs = () => {
    const [logs, setLogs] = useState([]);
    const [feedItems, setFeedItems] = useState([]);
    const [cattle, setCattle] = useState([]);
    const [open, setOpen] = useState(false);
    const [selectedLog, setSelectedLog] = useState(null);
    const [formData, setFormData] = useState({
        date: new Date(),
        feedItem: '',
        quantity: 0,
        unit: 'kg',
        unitPrice: 0,
        cattle: [],
        cattleGroup: '',
        notes: '',
        recordedBy: 'Eliya'
    });
    const { seasons, loading: seasonsLoading } = useSelector((state) => state.season);
    const selectedSeason = React.useMemo(() => {
        if (!seasons || seasons.length === 0) return null;
        const active = seasons.find(s => !s.isClosed);
        if (active) return active;
        return seasons[0];
    }, [seasons]);

    useEffect(() => {
        fetchLogs();
        fetchFeedItems();
        fetchCattle();
    }, []);

    const fetchLogs = async () => {
        try {
            const response = await api.get('/api/feed/logs');
            setLogs(response.data);
        } catch (error) {
            console.error('Error fetching feed logs:', error);
        }
    };

    const fetchFeedItems = async () => {
        try {
            const response = await api.get('/api/feed/items');
            setFeedItems(response.data);
        } catch (error) {
            console.error('Error fetching feed items:', error);
        }
    };

    const fetchCattle = async () => {
        try {
            const response = await api.get('/api/cattle');
            setCattle(response.data);
        } catch (error) {
            console.error('Error fetching cattle:', error);
        }
    };

    const handleOpen = (log = null) => {
        if (log) {
            setSelectedLog(log);
            setFormData({
                ...log,
                date: new Date(log.date)
            });
        } else {
            setSelectedLog(null);
            setFormData({
                date: new Date(),
                feedItem: '',
                quantity: 0,
                unit: 'kg',
                unitPrice: 0,
                cattle: [],
                cattleGroup: '',
                notes: '',
                recordedBy: 'Eliya'
            });
        }
        setOpen(true);
    };

    const handleClose = () => {
        setOpen(false);
        setSelectedLog(null);
    };

    const handleSubmit = async () => {
        try {
            if (selectedLog) {
                await api.put(`/api/feed/logs/${selectedLog._id}`, formData);
            } else {
                await api.post('/api/feed/logs', formData);
            }
            handleClose();
            fetchLogs();
        } catch (error) {
            console.error('Error saving feed log:', error);
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to delete this feed log?')) {
            try {
                await api.delete(`/api/feed/logs/${id}`);
                fetchLogs();
            } catch (error) {
                console.error('Error deleting feed log:', error);
            }
        }
    };

    const handleFeedItemChange = (event, newValue) => {
        if (newValue) {
            setFormData({
                ...formData,
                feedItem: newValue._id,
                unit: newValue.unit,
                unitPrice: newValue.unitPrice
            });
        }
    };

    const getAddButtonProps = () => {
        if (seasonsLoading) {
            return {
                disabled: true,
                tooltip: 'Loading...',
            };
        }

        if (!selectedSeason) {
            return {
                disabled: true,
                tooltip: 'Please select a season first',
            };
        }

        if (selectedSeason.status === 'closed') {
            return {
                disabled: true,
                tooltip: 'Cannot add feed logs to a closed season',
            };
        }

        return {
            disabled: false,
            tooltip: 'Add new feed log',
        };
    };

    const addButtonProps = getAddButtonProps();

    return (
        <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
                <Typography variant="h5">Daily Feed Logs</Typography>
                <Tooltip title={addButtonProps.tooltip}>
                    <span>
                        <Button
                            variant="contained"
                            startIcon={<AddIcon />}
                            onClick={() => handleOpen()}
                            disabled={addButtonProps.disabled}
                        >
                            Add Feed Log
                        </Button>
                    </span>
                </Tooltip>
            </Box>

            <TableContainer component={Paper}>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell>Date</TableCell>
                            <TableCell>Feed Item</TableCell>
                            <TableCell align="right">Quantity</TableCell>
                            <TableCell>Unit</TableCell>
                            <TableCell align="right">Unit Price</TableCell>
                            <TableCell align="right">Total Cost</TableCell>
                            <TableCell>Cattle Group</TableCell>
                            <TableCell>Recorded By</TableCell>
                            <TableCell align="center">Actions</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {logs.map((log) => (
                            <TableRow key={log._id}>
                                <TableCell>{new Date(log.date).toLocaleDateString()}</TableCell>
                                <TableCell>{log.feedItem?.name}</TableCell>
                                <TableCell align="right">{log.quantity}</TableCell>
                                <TableCell>{log.unit}</TableCell>
                                <TableCell align="right">{log.unitPrice}</TableCell>
                                <TableCell align="right">{log.totalCost}</TableCell>
                                <TableCell>{log.cattleGroup}</TableCell>
                                <TableCell>{log.recordedBy}</TableCell>
                                <TableCell align="center">
                                    <IconButton
                                        size="small"
                                        onClick={() => handleOpen(log)}
                                        color="primary"
                                    >
                                        <EditIcon />
                                    </IconButton>
                                    <IconButton
                                        size="small"
                                        onClick={() => handleDelete(log._id)}
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

            <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
                <DialogTitle>
                    {selectedLog ? 'Edit Feed Log' : 'Add New Feed Log'}
                </DialogTitle>
                <DialogContent>
                    <Grid container spacing={2} sx={{ mt: 1 }}>
                        <Grid item xs={12} sm={6}>
                            <LocalizationProvider dateAdapter={AdapterDateFns}>
                                <DatePicker
                                    label="Date"
                                    value={formData.date}
                                    onChange={(newValue) => setFormData({ ...formData, date: newValue })}
                                    renderInput={(params) => <TextField {...params} fullWidth />}
                                />
                            </LocalizationProvider>
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <Autocomplete
                                options={feedItems}
                                getOptionLabel={(option) => option.name}
                                value={feedItems.find(item => item._id === formData.feedItem) || null}
                                onChange={handleFeedItemChange}
                                renderInput={(params) => (
                                    <TextField
                                        {...params}
                                        label="Feed Item"
                                        required
                                    />
                                )}
                            />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <TextField
                                fullWidth
                                type="number"
                                label="Quantity"
                                value={formData.quantity}
                                onChange={(e) => setFormData({ ...formData, quantity: parseFloat(e.target.value) })}
                            />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <TextField
                                fullWidth
                                type="number"
                                label="Unit Price"
                                value={formData.unitPrice}
                                onChange={(e) => setFormData({ ...formData, unitPrice: parseFloat(e.target.value) })}
                            />
                        </Grid>
                        <Grid item xs={12}>
                            <Autocomplete
                                multiple
                                options={cattle}
                                getOptionLabel={(option) => `${option.name} (${option.tag})`}
                                value={cattle.filter(c => formData.cattle.includes(c._id))}
                                onChange={(event, newValue) => {
                                    setFormData({
                                        ...formData,
                                        cattle: newValue.map(c => c._id)
                                    });
                                }}
                                renderInput={(params) => (
                                    <TextField
                                        {...params}
                                        label="Cattle"
                                        placeholder="Select cattle"
                                    />
                                )}
                            />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <TextField
                                fullWidth
                                label="Cattle Group"
                                value={formData.cattleGroup}
                                onChange={(e) => setFormData({ ...formData, cattleGroup: e.target.value })}
                            />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <TextField
                                fullWidth
                                select
                                label="Recorded By"
                                value={formData.recordedBy}
                                onChange={(e) => setFormData({ ...formData, recordedBy: e.target.value })}
                            >
                                <MenuItem value="Eliya">Eliya</MenuItem>
                                <MenuItem value="Kumail">Kumail</MenuItem>
                            </TextField>
                        </Grid>
                        <Grid item xs={12}>
                            <TextField
                                fullWidth
                                multiline
                                rows={2}
                                label="Notes"
                                value={formData.notes}
                                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                            />
                        </Grid>
                    </Grid>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleClose}>Cancel</Button>
                    <Button onClick={handleSubmit} variant="contained">
                        {selectedLog ? 'Save' : 'Add'}
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default DailyFeedLogs; 