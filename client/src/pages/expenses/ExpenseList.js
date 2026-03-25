import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Typography,
  CircularProgress,
  Alert,
  IconButton,
  Tooltip,
  Paper,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Table,
  TableBody,
  TableCell,
  TableRow,
  Grid,
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  FilterList as FilterIcon,
  Clear as ClearIcon,
} from '@mui/icons-material';
import { DataGrid } from '@mui/x-data-grid';
import {
  fetchExpenses,
  createExpense,
  updateExpense,
  deleteExpense,
} from '../../store/slices/expenseSlice';
import { fetchCategories } from '../../store/slices/categorySlice';
import { fetchCattle } from '../../store/slices/cattleSlice';
import ExpenseForm from './ExpenseForm';
import { format, parseISO } from 'date-fns';

const DeleteConfirmation = ({ open, handleClose, onConfirm, loading }) => (
  <Dialog open={open} onClose={handleClose}>
    <DialogTitle>Delete Expense</DialogTitle>
    <DialogContent>
      <Typography>
        Are you sure you want to delete this expense? This action cannot be undone.
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

const ExpenseList = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { expenses, loading, error } = useSelector((state) => state.expense);
  const { categories } = useSelector((state) => state.category);
  const { cattle } = useSelector((state) => state.cattle);
  const { seasons, loading: seasonsLoading } = useSelector((state) => state.season);
  
  const [formOpen, setFormOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState(null);
  const [filters, setFilters] = useState({
    startDate: null,
    endDate: null,
    category: '',
    cattle: '',
  });
  const [filterOpen, setFilterOpen] = useState(false);

  const selectedSeason = React.useMemo(() => {
    if (!seasons || seasons.length === 0) return null;
    const active = seasons.find(s => !s.isClosed);
    if (active) return active;
    return seasons[0];
  }, [seasons]);

  useEffect(() => {
    if (selectedSeason && selectedSeason._id) {
      dispatch(fetchExpenses({ season: selectedSeason._id }));
    } else {
      dispatch(fetchExpenses());
    }
    dispatch(fetchCategories());
    dispatch(fetchCattle());
  }, [dispatch, selectedSeason]);

  const handleAdd = () => {
    setSelectedExpense(null);
    setFormOpen(true);
  };

  const handleEdit = (expense) => {
    setSelectedExpense(expense);
    setFormOpen(true);
  };

  const handleDelete = (expense) => {
    setSelectedExpense(expense);
    setDeleteOpen(true);
  };

  const handleSubmit = async (formData) => {
    try {
      if (selectedExpense) {
        await dispatch(updateExpense({ id: selectedExpense._id, data: formData })).unwrap();
      } else {
        await dispatch(createExpense(formData)).unwrap();
      }
      handleClose();
      // Fetch expenses immediately after successful creation/update
      await dispatch(fetchExpenses());
    } catch (error) {
      console.error('Failed to save expense:', error);
    }
  };

  const handleClose = () => {
    setFormOpen(false);
    setSelectedExpense(null);
  };

  const handleDeleteConfirm = async () => {
    await dispatch(deleteExpense(selectedExpense._id));
    setDeleteOpen(false);
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleDateFilterChange = (name, date) => {
    setFilters((prev) => ({
      ...prev,
      [name]: date,
    }));
  };

  const applyFilters = () => {
    dispatch(fetchExpenses(filters));
    setFilterOpen(false);
  };

  const clearFilters = () => {
    setFilters({
      startDate: null,
      endDate: null,
      category: '',
      cattle: '',
    });
    dispatch(fetchExpenses());
  };

  const filteredExpenses = expenses?.filter((expense) => {
    if (filters.category && expense.category._id !== filters.category) return false;
    if (filters.cattle && expense.cattle._id !== filters.cattle) return false;
    
    const expenseDate = new Date(expense.date);
    if (filters.startDate && expenseDate < filters.startDate) return false;
    if (filters.endDate && expenseDate > filters.endDate) return false;
    
    return true;
  });

  const getContributorSummary = () => {
    if (!filteredExpenses) return { Eliya: 0, Kumail: 0, total: 0 };
    
    const summary = filteredExpenses.reduce((acc, expense) => {
        // Add to contributor total if contributor exists
        if (expense.contributor) {
            acc[expense.contributor] = (acc[expense.contributor] || 0) + expense.amount;
        }
        // Always add to total
        acc.total = (acc.total || 0) + expense.amount;
        return acc;
    }, { Eliya: 0, Kumail: 0, total: 0 });

    return summary;
  };

  const contributorSummary = getContributorSummary();

  const columns = [
    {
      field: 'date',
      headerName: 'Date',
      flex: 1,
      renderCell: (params) => {
        try {
          const date = parseISO(params.value);
          return format(date, 'dd/MM/yyyy');
        } catch (error) {
          return '-';
        }
      },
    },
    {
      field: 'category',
      headerName: 'Category',
      flex: 1,
      renderCell: (params) => {
        console.log('Category params:', params);
        return params.row.category?.name || '-';
      },
    },
    {
      field: 'subCategory',
      headerName: 'Subcategory',
      flex: 1,
      renderCell: (params) => params.value || '-',
    },
    {
      field: 'cattle',
      headerName: 'Cattle',
      flex: 1,
      renderCell: (params) => params.row.cattleDisplay || '-',
    },
    {
      field: 'amount',
      headerName: 'Amount',
      flex: 1,
      renderCell: (params) => `PKR ${params.value.toLocaleString()}`,
    },
    {
      field: 'quantity',
      headerName: 'Quantity',
      flex: 1,
      renderCell: (params) => params.value ? params.value.toLocaleString() : '-',
    },
    {
      field: 'unit',
      headerName: 'Unit',
      flex: 1,
      renderCell: (params) => params.value || '-',
    },
    {
      field: 'description',
      headerName: 'Description',
      flex: 2,
      renderCell: (params) => params.value || '-',
    },
    {
      field: 'actions',
      headerName: 'Actions',
      flex: 1,
      renderCell: (params) => (
        <Box>
          <Tooltip title="Edit">
            <IconButton onClick={() => handleEdit(params.row)} color="primary">
              <EditIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="Delete">
            <IconButton onClick={() => handleDelete(params.row)} color="error">
              <DeleteIcon />
            </IconButton>
          </Tooltip>
        </Box>
      ),
    },
  ];

  const getAddButtonProps = () => {
    if (!selectedSeason) {
      return {
        disabled: true,
        tooltip: 'Please select a season first',
      };
    }

    if (selectedSeason.status === 'closed') {
      return {
        disabled: true,
        tooltip: 'Cannot add expenses to a closed season',
      };
    }

    if (seasonsLoading) {
      return {
        disabled: true,
        tooltip: 'Loading...',
      };
    }

    return {
      disabled: false,
      tooltip: 'Add new expense',
    };
  };

  const addButtonProps = getAddButtonProps();

  return (
    <Box sx={{ height: '100%', width: '100%', p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h4" component="h1">
          Expense Management
        </Typography>
        <Box>
          <Button
            variant="outlined"
            startIcon={<FilterIcon />}
            onClick={() => setFilterOpen(true)}
            sx={{ mr: 1 }}
          >
            Filters
          </Button>
          <Tooltip title={addButtonProps.tooltip}>
            <span>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={handleAdd}
                disabled={addButtonProps.disabled}
              >
                Add Expense
              </Button>
            </span>
          </Tooltip>
        </Box>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Contributor Summary
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <Typography color="textSecondary">Eliya's Contribution</Typography>
                <Typography variant="h6">
                  PKR {contributorSummary.Eliya.toLocaleString()}
                </Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography color="textSecondary">Kumail's Contribution</Typography>
                <Typography variant="h6">
                  PKR {contributorSummary.Kumail.toLocaleString()}
                </Typography>
              </Grid>
              <Grid item xs={12}>
                <Typography color="textSecondary">Total Expenses</Typography>
                <Typography variant="h6">
                  PKR {contributorSummary.total.toLocaleString()}
                </Typography>
              </Grid>
            </Grid>
          </Paper>
        </Grid>

        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Filters
            </Typography>
            <LocalizationProvider dateAdapter={AdapterDateFns}>
              <DatePicker
                label="Start Date"
                value={filters.startDate}
                onChange={(date) => handleDateFilterChange('startDate', date)}
                renderInput={(params) => <TextField {...params} fullWidth />}
              />
              <DatePicker
                label="End Date"
                value={filters.endDate}
                onChange={(date) => handleDateFilterChange('endDate', date)}
                renderInput={(params) => <TextField {...params} fullWidth />}
              />
            </LocalizationProvider>

            <FormControl fullWidth>
              <InputLabel>Category</InputLabel>
              <Select
                name="category"
                value={filters.category}
                onChange={handleFilterChange}
                label="Category"
              >
                <MenuItem value="">All Categories</MenuItem>
                {categories?.map((category) => (
                  <MenuItem key={category._id} value={category._id}>
                    {category.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl fullWidth>
              <InputLabel>Cattle</InputLabel>
              <Select
                name="cattle"
                value={filters.cattle}
                onChange={handleFilterChange}
                label="Cattle"
              >
                <MenuItem value="">All Cattle</MenuItem>
                {cattle?.map((cow) => (
                  <MenuItem key={cow._id} value={cow._id}>
                    {`${cow.tag} - ${cow.breed}`}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Paper>
        </Grid>
      </Grid>

      <Paper sx={{ height: 600, width: '100%' }}>
        <Table>
          <TableBody>
            <TableRow>
              <TableCell>Date</TableCell>
              <TableCell>Category</TableCell>
              <TableCell>Description</TableCell>
              <TableCell>Cattle</TableCell>
              <TableCell>Contributor</TableCell>
              <TableCell align="right">Amount</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
            {filteredExpenses?.map((expense) => (
              <TableRow key={expense._id}>
                <TableCell>
                  {format(new Date(expense.date), 'dd/MM/yyyy')}
                </TableCell>
                <TableCell>
                  {expense.category?.name}
                  {expense.subCategory && ` - ${expense.subCategory}`}
                </TableCell>
                <TableCell>{expense.description}</TableCell>
                <TableCell>
                  {expense.isSharedExpense
                    ? 'All Cattle'
                    : expense.cattle?.tag || '-'}
                </TableCell>
                <TableCell>
                  {expense.contributor}
                </TableCell>
                <TableCell align="right">
                  PKR {expense.amount.toLocaleString()}
                </TableCell>
                <TableCell>
                  <Box>
                    <Tooltip title="Edit">
                      <IconButton onClick={() => handleEdit(expense)} color="primary">
                        <EditIcon />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Delete">
                      <IconButton onClick={() => handleDelete(expense)} color="error">
                        <DeleteIcon />
                      </IconButton>
                    </Tooltip>
                  </Box>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Paper>

      <Dialog
        open={formOpen}
        onClose={handleClose}
        maxWidth="sm"
        fullWidth
      >
        <ExpenseForm
          open={formOpen}
          handleClose={handleClose}
          expense={selectedExpense}
          onSubmit={handleSubmit}
        />
      </Dialog>

      <DeleteConfirmation
        open={deleteOpen}
        handleClose={() => setDeleteOpen(false)}
        onConfirm={handleDeleteConfirm}
        loading={loading}
      />

      <Dialog open={filterOpen} onClose={() => setFilterOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Filter Expenses</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
            <LocalizationProvider dateAdapter={AdapterDateFns}>
              <DatePicker
                label="Start Date"
                value={filters.startDate}
                onChange={(date) => handleDateFilterChange('startDate', date)}
                renderInput={(params) => <TextField {...params} fullWidth />}
              />
              <DatePicker
                label="End Date"
                value={filters.endDate}
                onChange={(date) => handleDateFilterChange('endDate', date)}
                renderInput={(params) => <TextField {...params} fullWidth />}
              />
            </LocalizationProvider>

            <FormControl fullWidth>
              <InputLabel>Category</InputLabel>
              <Select
                name="category"
                value={filters.category}
                onChange={handleFilterChange}
                label="Category"
              >
                <MenuItem value="">All Categories</MenuItem>
                {categories?.map((category) => (
                  <MenuItem key={category._id} value={category._id}>
                    {category.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl fullWidth>
              <InputLabel>Cattle</InputLabel>
              <Select
                name="cattle"
                value={filters.cattle}
                onChange={handleFilterChange}
                label="Cattle"
              >
                <MenuItem value="">All Cattle</MenuItem>
                {cattle?.map((cow) => (
                  <MenuItem key={cow._id} value={cow._id}>
                    {`${cow.tag} - ${cow.breed}`}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button startIcon={<ClearIcon />} onClick={clearFilters}>
            Clear Filters
          </Button>
          <Button onClick={() => setFilterOpen(false)}>Cancel</Button>
          <Button onClick={applyFilters} variant="contained">
            Apply Filters
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ExpenseList; 