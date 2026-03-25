import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useParams, useNavigate } from 'react-router-dom';
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
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
} from '@mui/material';
import {
  ArrowBack as BackIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material';
import {
  fetchCategories,
  createSubcategory,
  deleteSubcategory,
} from '../../store/slices/categorySlice';

const SubcategoryForm = ({ open, handleClose, onSubmit, loading }) => {
  const [name, setName] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({ name });
    setName('');
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>Add New Subcategory</DialogTitle>
      <form onSubmit={handleSubmit}>
        <DialogContent>
          <TextField
            required
            name="name"
            label="Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            fullWidth
            autoFocus
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Cancel</Button>
          <Button type="submit" variant="contained" disabled={loading || !name.trim()}>
            {loading ? <CircularProgress size={24} /> : 'Add'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

const DeleteConfirmation = ({ open, handleClose, onConfirm, loading, subcategoryName }) => (
  <Dialog open={open} onClose={handleClose}>
    <DialogTitle>Delete Subcategory</DialogTitle>
    <DialogContent>
      <Typography>
        Are you sure you want to delete the subcategory "{subcategoryName}"? This action cannot be undone.
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

const SubcategoryList = () => {
  const { id } = useParams();
  const { categories, loading, error } = useSelector((state) => state.category);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const selectedCategory = categories?.find(c => c._id === id);
  const [formOpen, setFormOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selectedSubcategory, setSelectedSubcategory] = useState(null);

  useEffect(() => {
    dispatch(fetchCategories());
  }, [dispatch]);

  const handleBack = () => {
    navigate('/categories');
  };

  const handleAdd = () => {
    setFormOpen(true);
  };

  const handleDelete = (subcategory) => {
    setSelectedSubcategory(subcategory);
    setDeleteOpen(true);
  };

  const handleSubmit = async (formData) => {
    await dispatch(createSubcategory({ 
      categoryId: id, 
      data: formData 
    }));
    setFormOpen(false);
  };

  const handleDeleteConfirm = async () => {
    await dispatch(deleteSubcategory({ 
      categoryId: id, 
      subcategory: selectedSubcategory 
    }));
    setDeleteOpen(false);
    setSelectedSubcategory(null);
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">{error}</Alert>
        <Button startIcon={<BackIcon />} onClick={handleBack} sx={{ mt: 2 }}>
          Back to Categories
        </Button>
      </Box>
    );
  }

  if (!selectedCategory) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="info">Category not found</Alert>
        <Button startIcon={<BackIcon />} onClick={handleBack} sx={{ mt: 2 }}>
          Back to Categories
        </Button>
      </Box>
    );
  }

  return (
    <Box sx={{ height: '100%', width: '100%', p: 3 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <Button
          startIcon={<BackIcon />}
          onClick={handleBack}
          sx={{ mr: 2 }}
        >
          Back
        </Button>
        <Typography variant="h4" component="h1" sx={{ flexGrow: 1 }}>
          {selectedCategory.name} - Subcategories
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleAdd}
          disabled={loading}
        >
          Add Subcategory
        </Button>
      </Box>

      <Paper sx={{ width: '100%' }}>
        {selectedCategory.subCategories?.length > 0 ? (
          <List>
            {selectedCategory.subCategories.map((subcategory, index) => (
              <ListItem key={index} divider={index < selectedCategory.subCategories.length - 1}>
                <ListItemText primary={subcategory} />
                <ListItemSecondaryAction>
                  <Tooltip title="Delete">
                    <IconButton onClick={() => handleDelete(subcategory)} color="error">
                      <DeleteIcon />
                    </IconButton>
                  </Tooltip>
                </ListItemSecondaryAction>
              </ListItem>
            ))}
          </List>
        ) : (
          <Box sx={{ p: 3, textAlign: 'center' }}>
            <Typography color="textSecondary">
              No subcategories found. Click the "Add Subcategory" button to create one.
            </Typography>
          </Box>
        )}
      </Paper>

      <SubcategoryForm
        open={formOpen}
        handleClose={() => setFormOpen(false)}
        onSubmit={handleSubmit}
        loading={loading}
      />

      <DeleteConfirmation
        open={deleteOpen}
        handleClose={() => {
          setDeleteOpen(false);
          setSelectedSubcategory(null);
        }}
        onConfirm={handleDeleteConfirm}
        loading={loading}
        subcategoryName={selectedSubcategory}
      />
    </Box>
  );
};

export default SubcategoryList; 