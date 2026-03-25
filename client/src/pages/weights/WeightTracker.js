import React, { useState, useEffect } from 'react';
import {
    Paper,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Typography,
    Button,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    IconButton,
    Box,
    Card,
    CardContent,
    Grid,
    Tooltip
} from '@mui/material';
import {
    Add as AddIcon,
    GetApp as ExportIcon,
    Delete as DeleteIcon,
    Edit as EditIcon
} from '@mui/icons-material';
import { format } from 'date-fns';
import api from '../../utils/api';

const WeightTracker = ({ cattleId, cattleTag }) => {
    const [weights, setWeights] = useState([]);
    const [open, setOpen] = useState(false);
    const [deleteOpen, setDeleteOpen] = useState(false);
    const [selectedWeight, setSelectedWeight] = useState(null);
    const [isEditing, setIsEditing] = useState(false);
    const [cattleDetails, setCattleDetails] = useState(null);
    const [newWeight, setNewWeight] = useState({
        weight: '',
        date: format(new Date(), 'yyyy-MM-dd'),
        notes: ''
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchWeights();
        fetchCattleDetails();
    }, [cattleId]);

    const fetchCattleDetails = async () => {
        try {
            const response = await api.get(`/api/cattle/${cattleId}`);
            setCattleDetails(response.data);
        } catch (error) {
            console.error('Error fetching cattle details:', error);
        }
    };

    const fetchWeights = async () => {
        try {
            const response = await api.get(`/api/weights/cattle/${cattleId}`);
            setWeights(response.data);
            setLoading(false);
        } catch (error) {
            console.error('Error fetching weights:', error);
            setLoading(false);
        }
    };

    const handleAddWeight = async () => {
        try {
            if (isEditing) {
                await api.put(`/api/weights/${selectedWeight._id}`, {
                    weight: parseFloat(newWeight.weight),
                    date: new Date(newWeight.date).toISOString(),
                    notes: newWeight.notes
                });
            } else {
                await api.post('/api/weights', {
                    cattle: cattleId,
                    weight: parseFloat(newWeight.weight),
                    date: new Date(newWeight.date).toISOString(),
                    notes: newWeight.notes
                });
            }
            setOpen(false);
            setSelectedWeight(null);
            setIsEditing(false);
            setNewWeight({
                weight: '',
                date: format(new Date(), 'yyyy-MM-dd'),
                notes: ''
            });
            fetchWeights();
        } catch (error) {
            console.error('Error saving weight:', error);
        }
    };

    const handleExport = async () => {
        try {
            const response = await api.get(`/api/weights/cattle/${cattleId}/export`, {
                responseType: 'blob'
            });
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `weight_history_${cattleTag}.csv`);
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (error) {
            console.error('Error exporting weights:', error);
        }
    };

    const handleDelete = (weight) => {
        setSelectedWeight(weight);
        setDeleteOpen(true);
    };

    const handleDeleteConfirm = async () => {
        try {
            await api.delete(`/api/weights/${selectedWeight._id}`);
            setDeleteOpen(false);
            setSelectedWeight(null);
            fetchWeights();
        } catch (error) {
            console.error('Error deleting weight:', error);
        }
    };

    const handleEdit = (weight) => {
        setSelectedWeight(weight);
        setNewWeight({
            weight: weight.weight.toString(),
            date: format(new Date(weight.date), 'yyyy-MM-dd'),
            notes: weight.notes || ''
        });
        setIsEditing(true);
        setOpen(true);
    };

    const handleDialogClose = () => {
        setOpen(false);
        setIsEditing(false);
        setSelectedWeight(null);
        setNewWeight({
            weight: '',
            date: format(new Date(), 'yyyy-MM-dd'),
            notes: ''
        });
    };

    const WeightSummaryCard = () => {
        if (weights.length < 1) return null;

        const initialWeight = weights[weights.length - 1].weight;
        const currentWeight = weights[0].weight;
        const totalGain = currentWeight - initialWeight;
        const daysSinceStart = Math.round(
            (new Date(weights[0].date) - new Date(weights[weights.length - 1].date)) / (1000 * 60 * 60 * 24)
        );
        const overallADG = daysSinceStart > 0 ? totalGain / daysSinceStart : 0;

        // Calculate last weight gain
        const lastWeightGain = weights.length > 1 ? weights[0].weight - weights[1].weight : 0;

        return (
            <Card sx={{ mb: 3 }}>
                <CardContent>
                    <Grid container spacing={2}>
                        <Grid item xs={12} sm={2}>
                            <Typography variant="subtitle2" color="textSecondary">Initial Weight</Typography>
                            <Typography variant="h6">{initialWeight.toFixed(1)} kg</Typography>
                        </Grid>
                        <Grid item xs={12} sm={2}>
                            <Typography variant="subtitle2" color="textSecondary">Current Weight</Typography>
                            <Typography variant="h6">{currentWeight.toFixed(1)} kg</Typography>
                        </Grid>
                        <Grid item xs={12} sm={2}>
                            <Typography variant="subtitle2" color="textSecondary">Total Gain</Typography>
                            <Typography variant="h6" color={totalGain >= 0 ? 'success.main' : 'error.main'}>
                                {totalGain.toFixed(1)} kg
                            </Typography>
                        </Grid>
                        <Grid item xs={12} sm={2}>
                            <Typography variant="subtitle2" color="textSecondary">Overall ADG</Typography>
                            <Typography variant="h6" color={overallADG >= 0 ? 'success.main' : 'error.main'}>
                                {overallADG.toFixed(2)} kg/day
                            </Typography>
                        </Grid>
                        <Grid item xs={12} sm={2}>
                            <Typography variant="subtitle2" color="textSecondary">Last Weight Gain</Typography>
                            <Typography variant="h6" color={lastWeightGain >= 0 ? 'success.main' : 'error.main'}>
                                {lastWeightGain.toFixed(1)} kg
                            </Typography>
                        </Grid>
                        {weights.length > 1 && (
                            <Grid item xs={12} sm={2}>
                                <Typography variant="subtitle2" color="textSecondary">Days Since Last Weigh</Typography>
                                <Typography variant="h6">
                                    {Math.round((new Date(weights[0].date) - new Date(weights[1].date)) / (1000 * 60 * 60 * 24))} days
                                </Typography>
                            </Grid>
                        )}
                    </Grid>
                </CardContent>
            </Card>
        );
    };

    return (
        <div>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                <Typography variant="h6">
                    Weight History - {cattleDetails?.name ? `${cattleDetails.name} (${cattleTag})` : cattleTag}
                </Typography>
                <Box>
                    <Button
                        startIcon={<AddIcon />}
                        variant="contained"
                        onClick={() => setOpen(true)}
                        sx={{ mr: 1 }}
                    >
                        Add Weight
                    </Button>
                    <IconButton onClick={handleExport} color="primary" title="Export to CSV">
                        <ExportIcon />
                    </IconButton>
                </Box>
            </Box>

            <WeightSummaryCard />

            <TableContainer component={Paper}>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell>Date</TableCell>
                            <TableCell align="right">Weight (kg)</TableCell>
                            <TableCell align="right">Weight (Mun)</TableCell>
                            <TableCell align="right">Meat Weight (Mun)</TableCell>
                            <TableCell align="right">Change (kg)</TableCell>
                            <TableCell align="right">Days</TableCell>
                            <TableCell align="right">ADG (kg/day)</TableCell>
                            <TableCell>Notes</TableCell>
                            <TableCell align="center">Actions</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {weights.map((weight) => (
                            <TableRow key={weight._id}>
                                <TableCell>{format(new Date(weight.date), 'MMM d, yyyy')}</TableCell>
                                <TableCell align="right">{weight.weight.toFixed(1)}</TableCell>
                                <TableCell align="right">{(weight.weight / 40).toFixed(2)}</TableCell>
                                <TableCell align="right">{((weight.weight / 40) * 0.55).toFixed(2)}</TableCell>
                                <TableCell align="right">
                                    {weight.weightChange ? (
                                        <Typography
                                            color={weight.weightChange >= 0 ? 'success.main' : 'error.main'}
                                        >
                                            {weight.weightChange >= 0 ? '+' : ''}{weight.weightChange.toFixed(1)}
                                        </Typography>
                                    ) : (
                                        '-'
                                    )}
                                </TableCell>
                                <TableCell align="right">
                                    {weight.daysSinceLastWeigh || '-'}
                                </TableCell>
                                <TableCell align="right">
                                    {weight.averageDailyGain ? weight.averageDailyGain.toFixed(2) : '-'}
                                </TableCell>
                                <TableCell>{weight.notes || '-'}</TableCell>
                                <TableCell align="center">
                                    <IconButton
                                        size="small"
                                        onClick={() => handleEdit(weight)}
                                        color="primary"
                                    >
                                        <EditIcon />
                                    </IconButton>
                                    <IconButton
                                        size="small"
                                        onClick={() => handleDelete(weight)}
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

            <Dialog open={open} onClose={handleDialogClose}>
                <DialogTitle>{isEditing ? 'Edit Weight Entry' : 'Add New Weight'}</DialogTitle>
                <DialogContent>
                    <TextField
                        autoFocus
                        margin="dense"
                        label="Weight (kg)"
                        type="number"
                        fullWidth
                        value={newWeight.weight}
                        onChange={(e) => setNewWeight({ ...newWeight, weight: e.target.value })}
                        sx={{ mb: 2 }}
                    />
                    <TextField
                        margin="dense"
                        label="Date"
                        type="date"
                        fullWidth
                        value={newWeight.date}
                        onChange={(e) => setNewWeight({ ...newWeight, date: e.target.value })}
                        sx={{ mb: 2 }}
                    />
                    <TextField
                        margin="dense"
                        label="Notes"
                        fullWidth
                        multiline
                        rows={2}
                        value={newWeight.notes}
                        onChange={(e) => setNewWeight({ ...newWeight, notes: e.target.value })}
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleDialogClose}>Cancel</Button>
                    <Button onClick={handleAddWeight} variant="contained">
                        {isEditing ? 'Save' : 'Add'}
                    </Button>
                </DialogActions>
            </Dialog>

            <Dialog open={deleteOpen} onClose={() => setDeleteOpen(false)}>
                <DialogTitle>Delete Weight Entry</DialogTitle>
                <DialogContent>
                    <Typography>
                        Are you sure you want to delete the weight entry from {selectedWeight ? format(new Date(selectedWeight.date), 'dd/MM/yyyy') : ''}?
                    </Typography>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setDeleteOpen(false)}>Cancel</Button>
                    <Button onClick={handleDeleteConfirm} color="error" variant="contained">
                        Delete
                    </Button>
                </DialogActions>
            </Dialog>
        </div>
    );
};

export default WeightTracker; 