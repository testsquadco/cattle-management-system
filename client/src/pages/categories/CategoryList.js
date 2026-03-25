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
  Typography,
  CircularProgress,
  Alert,
  IconButton,
  Tooltip,
  Paper,
  Chip,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  SubdirectoryArrowRight as SubcategoryIcon,
} from '@mui/icons-material';
import { DataGrid } from '@mui/x-data-grid';
import {
  fetchCategories,
  createCategory,
  updateCategory,
  deleteCategory,
} from '../../store/slices/categorySlice';
import CategoryForm from './CategoryForm';

const DeleteConfirmation = ({ open, handleClose, onConfirm, loading }) => (
  <Dialog open={open} onClose={handleClose}>
    <DialogTitle>Delete Category</DialogTitle>
    <DialogContent>
      <Typography>
        Are you sure you want to delete this category? This action cannot be undone.
        All subcategories and expenses associated with this category will also be deleted.
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

const CategoryList = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { categories, loading, error } = useSelector((state) => state.category);
  const [formOpen, setFormOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);

  useEffect(() => {
    dispatch(fetchCategories());
  }, [dispatch]);

  const handleAdd = () => {
    setSelectedCategory(null);
    setFormOpen(true);
  };

  const handleEdit = (category) => {
    setSelectedCategory(category);
    setFormOpen(true);
  };

  const handleDelete = (category) => {
    setSelectedCategory(category);
    setDeleteOpen(true);
  };

  const handleViewSubcategories = (category) => {
    navigate(`/categories/${category._id}/subcategories`);
  };

  const handleSubmit = async (formData) => {
    if (selectedCategory) {
      await dispatch(updateCategory({ id: selectedCategory._id, data: formData }));
    } else {
      await dispatch(createCategory(formData));
    }
    setFormOpen(false);
  };

  const handleDeleteConfirm = async () => {
    await dispatch(deleteCategory(selectedCategory._id));
    setDeleteOpen(false);
  };

  const getTypeChip = (type) => (
    <Chip
      label={type === 'expense' ? 'Expense' : 'Income'}
      color={type === 'expense' ? 'error' : 'success'}
      size="small"
    />
  );

  const columns = [
    { field: 'name', headerName: 'Name', flex: 1 },
    { field: 'description', headerName: 'Description', flex: 2 },
    {
      field: 'type',
      headerName: 'Type',
      flex: 1,
      renderCell: (params) => getTypeChip(params.value),
    },
    {
      field: 'subcategoryCount',
      headerName: 'Subcategories',
      flex: 1,
      renderCell: (params) => params.row.subcategories?.length || 0,
    },
    {
      field: 'actions',
      headerName: 'Actions',
      flex: 1,
      renderCell: (params) => (
        <Box>
          <Tooltip title="View Subcategories">
            <IconButton onClick={() => handleViewSubcategories(params.row)} color="primary">
              <SubcategoryIcon />
            </IconButton>
          </Tooltip>
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

  return (
    <Box sx={{ height: '100%', width: '100%', p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h4" component="h1">
          Category Management
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleAdd}
          disabled={loading}
        >
          Add Category
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Paper sx={{ height: 600, width: '100%' }}>
        <DataGrid
          rows={categories || []}
          columns={columns}
          pageSize={10}
          rowsPerPageOptions={[10]}
          disableSelectionOnClick
          loading={loading}
          getRowId={(row) => row._id}
        />
      </Paper>

      <CategoryForm
        open={formOpen}
        handleClose={() => setFormOpen(false)}
        category={selectedCategory}
        onSubmit={handleSubmit}
        loading={loading}
      />

      <DeleteConfirmation
        open={deleteOpen}
        handleClose={() => setDeleteOpen(false)}
        onConfirm={handleDeleteConfirm}
        loading={loading}
      />
    </Box>
  );
};

export default CategoryList; 