import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Button,
  Typography,
  CircularProgress,
  Alert,
  Paper,
  Grid,
  Card,
  CardContent,
  Divider,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Container,
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Scale as ScaleIcon,
} from '@mui/icons-material';
import { fetchCattleById, deleteCattle, updateCattle } from '../../store/slices/cattleSlice';
import { fetchExpensesByCattle } from '../../store/slices/expenseSlice';
import CattleForm from './CattleForm';
import api from '../../utils/api';

const HEALTH_STATUSES = [
  { value: 'healthy', label: 'Healthy', color: 'success' },
  { value: 'sick', label: 'Sick', color: 'error' },
  { value: 'recovering', label: 'Recovering', color: 'warning' },
  { value: 'pregnant', label: 'Pregnant', color: 'info' },
];

const DeleteConfirmation = ({ open, handleClose, onConfirm, loading }) => (
  <Dialog open={open} onClose={handleClose}>
    <DialogTitle>Delete Cattle</DialogTitle>
    <DialogContent>
      <Typography>
        Are you sure you want to delete this cattle? This action cannot be undone.
        All expenses associated with this cattle will also be deleted.
      </Typography>
    </DialogContent>
    <DialogActions>
      <Button onClick={handleClose}>Cancel</Button>
      <Button onClick={onConfirm} color="error" variant="contained" disabled={loading}>
        {loading ? <CircularProgress size={24} /> : 'Delete'}
      </Button>
    </DialogActions>
  </Dialog>
);

const CattleDetail = () => {
  const { id } = useParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { selectedCattle, loading: cattleLoading, error: cattleError } = useSelector((state) => state.cattle);
  const { expenses, loading: expensesLoading, error: expensesError } = useSelector((state) => state.expense);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [latestWeight, setLatestWeight] = useState(null);
  const [weightLoading, setWeightLoading] = useState(false);

  useEffect(() => {
    if (id) {
      dispatch(fetchCattleById(id));
      dispatch(fetchExpensesByCattle(id));
      fetchLatestWeight();
    }
  }, [dispatch, id]);

  const fetchLatestWeight = async () => {
    setWeightLoading(true);
    try {
      const response = await api.get(`/weights/cattle/${id}`);
      if (response.data && response.data.length > 0) {
        // Sort by date and get the most recent weight
        const sortedWeights = response.data.sort((a, b) => new Date(b.date) - new Date(a.date));
        setLatestWeight(sortedWeights[0].weight);
      } else {
        setLatestWeight(null);
      }
    } catch (error) {
      console.error('Error fetching latest weight:', error);
      setLatestWeight(null);
    } finally {
      setWeightLoading(false);
    }
  };

  const handleBack = () => {
    navigate('/cattle');
  };

  const handleEdit = () => {
    setEditOpen(true);
  };

  const handleDelete = () => {
    setDeleteOpen(true);
  };

  const handleDeleteConfirm = async () => {
    await dispatch(deleteCattle(id));
    setDeleteOpen(false);
    navigate('/cattle');
  };

  const handleEditSubmit = async (formData) => {
    try {
      await dispatch(updateCattle({ id: selectedCattle._id, ...formData })).unwrap();
      await dispatch(fetchCattleById(selectedCattle._id));
      setEditOpen(false);
    } catch (error) {
      console.error('Failed to update cattle:', error);
    }
  };

  const getHealthStatusChip = (status) => {
    const healthStatus = HEALTH_STATUSES.find((s) => s.value === status);
    return (
      <Chip
        label={healthStatus?.label || status}
        color={healthStatus?.color || 'default'}
        size="small"
      />
    );
  };

  const calculateTotalExpenses = () => {
    if (!expenses || expenses.length === 0) return 0;
    return expenses.reduce((total, expense) => total + expense.amount, 0);
  };

  const getCurrentWeight = () => {
    if (weightLoading) return 'Loading...';
    if (latestWeight !== null) return latestWeight;
    return selectedCattle?.weight || 0;
  };



  if (cattleLoading || expensesLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (cattleError) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">{cattleError}</Alert>
        <Button startIcon={<ArrowBackIcon />} onClick={handleBack} sx={{ mt: 2 }}>
          Back to Cattle List
        </Button>
      </Box>
    );
  }

  if (!selectedCattle) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="info">Cattle not found</Alert>
        <Button startIcon={<ArrowBackIcon />} onClick={handleBack} sx={{ mt: 2 }}>
          Back to Cattle List
        </Button>
      </Box>
    );
  }

  const totalExpenses = calculateTotalExpenses();

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Paper sx={{ p: 3 }}>
        <Typography variant="h5" gutterBottom>
          Cattle Details - {selectedCattle.tag} ({selectedCattle.breed})
        </Typography>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
          <Button startIcon={<ArrowBackIcon />} onClick={handleBack}>
            Back to Cattle List
          </Button>
          <Box>
            <Button
              startIcon={<ScaleIcon />}
              variant="contained"
              color="primary"
              onClick={() => navigate(`/cattle/${id}/weights`)}
              sx={{ mr: 1 }}
            >
              Weight Tracking
            </Button>
            <Button
              startIcon={<EditIcon />}
              variant="contained"
              onClick={handleEdit}
              sx={{ mr: 1 }}
            >
              Edit
            </Button>
            <Button
              startIcon={<DeleteIcon />}
              variant="contained"
              color="error"
              onClick={handleDelete}
            >
              Delete
            </Button>
          </Box>
        </Box>

        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold', mb: 3 }}>
                Basic Information
              </Typography>

              {/* Identification Group */}
              <Box sx={{ mb: 4 }}>
                <Typography variant="subtitle1" sx={{ color: 'primary.main', fontWeight: 'medium', mb: 2 }}>
                  Identification
                </Typography>
                <Grid container spacing={3}>
                  <Grid item xs={12}>
                    <Box sx={{ 
                      width: '200px', 
                      height: '200px', 
                      border: '1px solid #ddd',
                      borderRadius: '8px',
                      overflow: 'hidden',
                      mb: 2,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      backgroundColor: '#f5f5f5'
                    }}>
                      {selectedCattle?.image ? (
                        <img
                          src={`${process.env.REACT_APP_API_URL}/uploads/cattle/${selectedCattle.image}`}
                          alt={`${selectedCattle.name || selectedCattle.tag}`}
                          style={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover'
                          }}
                        />
                      ) : (
                        <Box sx={{ textAlign: 'center' }}>
                          <Typography color="textSecondary" variant="body2">No Image Available</Typography>
                          <Typography color="textSecondary" variant="caption">Click edit to add an image</Typography>
                        </Box>
                      )}
                    </Box>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography color="textSecondary" gutterBottom>Tag Number</Typography>
                    <Typography variant="body1" sx={{ fontWeight: 'medium' }}>{selectedCattle.tag}</Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography color="textSecondary" gutterBottom>Name</Typography>
                    <Typography variant="body1" sx={{ fontWeight: 'medium' }}>{selectedCattle.name || '-'}</Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography color="textSecondary" gutterBottom>Breed</Typography>
                    <Typography variant="body1">{selectedCattle.breed}</Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography color="textSecondary" gutterBottom>Color/Markings</Typography>
                    <Typography variant="body1">{selectedCattle.colorMarkings || '-'}</Typography>
                  </Grid>
                </Grid>
              </Box>

              {/* Physical Characteristics */}
              <Box sx={{ mb: 4 }}>
                <Typography variant="subtitle1" sx={{ color: 'primary.main', fontWeight: 'medium', mb: 2 }}>
                  Physical Characteristics
                </Typography>
                <Grid container spacing={3}>
                  <Grid item xs={6}>
                    <Typography color="textSecondary" gutterBottom>Weight</Typography>
                    <Typography variant="body1">
                      {getCurrentWeight()} kg
                      {latestWeight !== null && (
                        <Typography variant="caption" color="textSecondary" sx={{ ml: 1 }}>
                          (Updated: {new Date(latestWeight.date).toLocaleDateString()})
                        </Typography>
                      )}
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography color="textSecondary" gutterBottom>Gender</Typography>
                    <Typography variant="body1">{selectedCattle.gender}</Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography color="textSecondary" gutterBottom>Daily Feed</Typography>
                    <Typography variant="body1">{(getCurrentWeight() * 0.03).toFixed(2)} kg</Typography>
                    <Typography variant="caption" color="textSecondary">
                      (3% of current weight)
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography color="textSecondary" gutterBottom>Weight (Mun)</Typography>
                    <Typography variant="body1">
                      {getCurrentWeight() ? (getCurrentWeight() / 40).toFixed(2) : 'N/A'} Mun
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography color="textSecondary" gutterBottom>Meat Weight (Mun)</Typography>
                    <Typography variant="body1">
                      {getCurrentWeight() ? ((getCurrentWeight() / 40) * 0.55).toFixed(2) : 'N/A'} Mun
                    </Typography>
                  </Grid>
                </Grid>
              </Box>

              {/* Purchase Details */}
              <Box sx={{ mb: 4 }}>
                <Typography variant="subtitle1" sx={{ color: 'primary.main', fontWeight: 'medium', mb: 2 }}>
                  Purchase Details
                </Typography>
                <Grid container spacing={3}>
                  <Grid item xs={6}>
                    <Typography color="textSecondary" gutterBottom>Purchase Date</Typography>
                    <Typography variant="body1">
                      {selectedCattle.purchaseDate ? new Date(selectedCattle.purchaseDate).toLocaleDateString() : '-'}
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography color="textSecondary" gutterBottom>Purchase Price</Typography>
                    <Typography variant="body1">
                      PKR {(selectedCattle.purchasePrice || 0).toLocaleString()}
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography color="textSecondary" gutterBottom>Transportation Cost</Typography>
                    <Typography variant="body1">
                      PKR {(selectedCattle.transportationCost || 0).toLocaleString()}
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography color="textSecondary" gutterBottom>Initial Cost</Typography>
                    <Typography variant="body1" sx={{ fontWeight: 'medium' }}>
                      PKR {((selectedCattle.purchasePrice || 0) + (selectedCattle.transportationCost || 0)).toLocaleString()}
                    </Typography>
                    <Typography variant="caption" color="textSecondary">
                      Purchase Price + Transportation
                    </Typography>
                  </Grid>
                </Grid>
              </Box>

              {/* Financial Projections */}
              <Box sx={{ mb: 4 }}>
                <Typography variant="subtitle1" sx={{ color: 'primary.main', fontWeight: 'medium', mb: 2 }}>
                  Financial Projections
                </Typography>
                <Grid container spacing={3}>
                  <Grid item xs={12}>
                    <Typography color="textSecondary" gutterBottom>Total Expenses</Typography>
                    <Typography variant="h6" sx={{ fontWeight: 'medium' }}>
                      PKR {(selectedCattle.totalExpenses || 0).toLocaleString()}
                    </Typography>
                    <Typography variant="caption" color="textSecondary">
                      Your share of all operational expenses
                    </Typography>
                  </Grid>
                  <Grid item xs={12}>
                    <Typography color="textSecondary" gutterBottom>Total Investment</Typography>
                    <Typography variant="h6" sx={{ fontWeight: 'medium' }}>
                      PKR {(selectedCattle.totalInvestment || 0).toLocaleString()}
                    </Typography>
                    <Typography variant="caption" color="textSecondary">
                      Initial Cost (PKR {(selectedCattle.initialCost || 0).toLocaleString()}) + Total Expenses
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography color="textSecondary" gutterBottom>Expected Sale Price</Typography>
                    <Typography variant="body1">
                      {selectedCattle.expectedSalePrice ? `PKR ${selectedCattle.expectedSalePrice.toLocaleString()}` : '-'}
                    </Typography>
                  </Grid>
                  <Grid item xs={12}>
                    <Typography color="textSecondary" gutterBottom>Expected Profit/Loss</Typography>
                    <Typography 
                      variant="h6" 
                      color={
                        selectedCattle.expectedSalePrice && selectedCattle.totalInvestment
                          ? (selectedCattle.expectedSalePrice - selectedCattle.totalInvestment >= 0 
                            ? 'success.main' 
                            : 'error.main')
                          : 'text.secondary'
                      }
                      sx={{ fontWeight: 'medium' }}
                    >
                      {selectedCattle.expectedSalePrice && selectedCattle.totalInvestment
                        ? (selectedCattle.expectedSalePrice - selectedCattle.totalInvestment < 0
                          ? `-PKR ${Math.abs(selectedCattle.expectedSalePrice - selectedCattle.totalInvestment).toLocaleString()}`
                          : `PKR ${(selectedCattle.expectedSalePrice - selectedCattle.totalInvestment).toLocaleString()}`)
                        : '-'}
                    </Typography>
                    <Typography variant="caption" color="textSecondary">
                      Expected Sale Price - Total Investment
                    </Typography>
                  </Grid>
                </Grid>
              </Box>

              {/* Sale Details */}
              <Box>
                <Typography variant="subtitle1" sx={{ color: 'primary.main', fontWeight: 'medium', mb: 2 }}>
                  Sale Details
                </Typography>
                <Grid container spacing={3}>
                  <Grid item xs={6}>
                    <Typography color="textSecondary" gutterBottom>Actual Sale Price</Typography>
                    <Typography variant="body1">
                      {selectedCattle.actualSalePrice ? `PKR ${selectedCattle.actualSalePrice.toLocaleString()}` : '-'}
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography color="textSecondary" gutterBottom>Sale Date</Typography>
                    <Typography variant="body1">
                      {selectedCattle.saleDate ? new Date(selectedCattle.saleDate).toLocaleDateString() : '-'}
                    </Typography>
                  </Grid>
                  <Grid item xs={12}>
                    <Typography color="textSecondary" gutterBottom>Actual Profit/Loss</Typography>
                    <Typography 
                      variant="h6" 
                      color={selectedCattle.profitLoss < 0 ? 'error.main' : 'success.main'}
                      sx={{ fontWeight: 'medium' }}
                    >
                      {selectedCattle.profitLoss !== undefined && selectedCattle.profitLoss !== null
                        ? (selectedCattle.profitLoss < 0
                          ? `-PKR ${Math.abs(selectedCattle.profitLoss).toLocaleString()}`
                          : `PKR ${selectedCattle.profitLoss.toLocaleString()}`)
                        : '-'}
                    </Typography>
                    <Typography variant="caption" color="textSecondary">
                      Actual Sale Price - Total Investment
                    </Typography>
                  </Grid>
                </Grid>
              </Box>

              {/* Notes Section */}
              {selectedCattle.notes && (
                <Box sx={{ mt: 4 }}>
                  <Typography variant="subtitle1" sx={{ color: 'primary.main', fontWeight: 'medium', mb: 2 }}>
                    Notes
                  </Typography>
                  <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
                    {selectedCattle.notes}
                  </Typography>
                </Box>
              )}
            </Paper>
          </Grid>

          <Grid item xs={12} md={6}>
            {/* Remove the Expense Summary Paper */}
          </Grid>

          <Grid item xs={12}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Expense History
              </Typography>
              <Divider sx={{ mb: 2 }} />
              {expensesError ? (
                <Alert severity="error">{expensesError}</Alert>
              ) : expenses && expenses.length > 0 ? (
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Date</TableCell>
                        <TableCell>Category</TableCell>
                        <TableCell>Description</TableCell>
                        <TableCell align="right">Amount</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {expenses.map((expense) => (
                        <TableRow key={expense._id}>
                          <TableCell>
                            {new Date(expense.date).toLocaleDateString()}
                          </TableCell>
                          <TableCell>{expense.category.name}</TableCell>
                          <TableCell>{expense.description}</TableCell>
                          <TableCell align="right">
                            PKR {expense.amount.toLocaleString()}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              ) : (
                <Typography>No expenses found for this cattle</Typography>
              )}
            </Paper>
          </Grid>
        </Grid>
      </Paper>

      <DeleteConfirmation
        open={deleteOpen}
        handleClose={() => setDeleteOpen(false)}
        onConfirm={handleDeleteConfirm}
        loading={cattleLoading}
      />

      <CattleForm
        open={editOpen}
        onClose={() => setEditOpen(false)}
        cattle={selectedCattle}
        onSubmit={handleEditSubmit}
      />
    </Container>
  );
};

export default CattleDetail; 