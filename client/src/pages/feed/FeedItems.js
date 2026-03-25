import React, { useState, useEffect } from 'react';
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
    Grid
} from '@mui/material';
import {
    Add as AddIcon,
    Edit as EditIcon,
    Delete as DeleteIcon
} from '@mui/icons-material';
import api from '../../utils/api';

const FeedItems = () => {
    const [items, setItems] = useState([]);
    const [categories, setCategories] = useState([]);
    const [open, setOpen] = useState(false);
    const [selectedItem, setSelectedItem] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        category: '',
        subCategory: '',
        unit: 'kg',
        currentStock: 0,
        unitPrice: 0,
        nutritionalInfo: {
            protein: 0,
            fat: 0,
            fiber: 0,
            energy: 0
        },
        supplier: '',
        minimumStock: 0,
        notes: ''
    });

    useEffect(() => {
        fetchItems();
        fetchCategories();
    }, []);

    const fetchItems = async () => {
        try {
            const response = await api.get('/api/feed/items');
            setItems(response.data);
        } catch (error) {
            console.error('Error fetching feed items:', error);
        }
    };

    const fetchCategories = async () => {
        try {
            const response = await api.get('/api/categories');
            setCategories(response.data.filter(cat => cat.type === 'Feed'));
        } catch (error) {
            console.error('Error fetching categories:', error);
        }
    };

    const handleOpen = (item = null) => {
        if (item) {
            setSelectedItem(item);
            setFormData(item);
        } else {
            setSelectedItem(null);
            setFormData({
                name: '',
                category: '',
                subCategory: '',
                unit: 'kg',
                currentStock: 0,
                unitPrice: 0,
                nutritionalInfo: {
                    protein: 0,
                    fat: 0,
                    fiber: 0,
                    energy: 0
                },
                supplier: '',
                minimumStock: 0,
                notes: ''
            });
        }
        setOpen(true);
    };

    const handleClose = () => {
        setOpen(false);
        setSelectedItem(null);
    };

    const handleSubmit = async () => {
        try {
            if (selectedItem) {
                await api.put(`/api/feed/items/${selectedItem._id}`, formData);
            } else {
                await api.post('/api/feed/items', formData);
            }
            handleClose();
            fetchItems();
        } catch (error) {
            console.error('Error saving feed item:', error);
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to delete this feed item?')) {
            try {
                await api.delete(`/api/feed/items/${id}`);
                fetchItems();
            } catch (error) {
                console.error('Error deleting feed item:', error);
            }
        }
    };

    return (
        <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
                <Typography variant="h5">Feed Items</Typography>
                <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={() => handleOpen()}
                >
                    Add Feed Item
                </Button>
            </Box>

            <TableContainer component={Paper}>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell>Name</TableCell>
                            <TableCell>Category</TableCell>
                            <TableCell>Subcategory</TableCell>
                            <TableCell>Unit</TableCell>
                            <TableCell align="right">Current Stock</TableCell>
                            <TableCell align="right">Unit Price</TableCell>
                            <TableCell>Supplier</TableCell>
                            <TableCell align="center">Actions</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {items.map((item) => (
                            <TableRow key={item._id}>
                                <TableCell>{item.name}</TableCell>
                                <TableCell>{item.category?.name}</TableCell>
                                <TableCell>{item.subCategory}</TableCell>
                                <TableCell>{item.unit}</TableCell>
                                <TableCell align="right">{item.currentStock}</TableCell>
                                <TableCell align="right">{item.unitPrice}</TableCell>
                                <TableCell>{item.supplier}</TableCell>
                                <TableCell align="center">
                                    <IconButton
                                        size="small"
                                        onClick={() => handleOpen(item)}
                                        color="primary"
                                    >
                                        <EditIcon />
                                    </IconButton>
                                    <IconButton
                                        size="small"
                                        onClick={() => handleDelete(item._id)}
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
                    {selectedItem ? 'Edit Feed Item' : 'Add New Feed Item'}
                </DialogTitle>
                <DialogContent>
                    <Grid container spacing={2} sx={{ mt: 1 }}>
                        <Grid item xs={12} sm={6}>
                            <TextField
                                fullWidth
                                label="Name"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <TextField
                                fullWidth
                                select
                                label="Category"
                                value={formData.category}
                                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                            >
                                {categories.map((category) => (
                                    <MenuItem key={category._id} value={category._id}>
                                        {category.name}
                                    </MenuItem>
                                ))}
                            </TextField>
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <TextField
                                fullWidth
                                label="Subcategory"
                                value={formData.subCategory}
                                onChange={(e) => setFormData({ ...formData, subCategory: e.target.value })}
                            />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <TextField
                                fullWidth
                                select
                                label="Unit"
                                value={formData.unit}
                                onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                            >
                                <MenuItem value="kg">Kilograms (kg)</MenuItem>
                                <MenuItem value="g">Grams (g)</MenuItem>
                                <MenuItem value="l">Liters (l)</MenuItem>
                                <MenuItem value="ml">Milliliters (ml)</MenuItem>
                                <MenuItem value="piece">Piece</MenuItem>
                            </TextField>
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <TextField
                                fullWidth
                                type="number"
                                label="Current Stock"
                                value={formData.currentStock}
                                onChange={(e) => setFormData({ ...formData, currentStock: parseFloat(e.target.value) })}
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
                            <Typography variant="subtitle1" sx={{ mb: 1 }}>
                                Nutritional Information
                            </Typography>
                        </Grid>
                        <Grid item xs={12} sm={3}>
                            <TextField
                                fullWidth
                                type="number"
                                label="Protein %"
                                value={formData.nutritionalInfo.protein}
                                onChange={(e) => setFormData({
                                    ...formData,
                                    nutritionalInfo: {
                                        ...formData.nutritionalInfo,
                                        protein: parseFloat(e.target.value)
                                    }
                                })}
                            />
                        </Grid>
                        <Grid item xs={12} sm={3}>
                            <TextField
                                fullWidth
                                type="number"
                                label="Fat %"
                                value={formData.nutritionalInfo.fat}
                                onChange={(e) => setFormData({
                                    ...formData,
                                    nutritionalInfo: {
                                        ...formData.nutritionalInfo,
                                        fat: parseFloat(e.target.value)
                                    }
                                })}
                            />
                        </Grid>
                        <Grid item xs={12} sm={3}>
                            <TextField
                                fullWidth
                                type="number"
                                label="Fiber %"
                                value={formData.nutritionalInfo.fiber}
                                onChange={(e) => setFormData({
                                    ...formData,
                                    nutritionalInfo: {
                                        ...formData.nutritionalInfo,
                                        fiber: parseFloat(e.target.value)
                                    }
                                })}
                            />
                        </Grid>
                        <Grid item xs={12} sm={3}>
                            <TextField
                                fullWidth
                                type="number"
                                label="Energy (kcal/kg)"
                                value={formData.nutritionalInfo.energy}
                                onChange={(e) => setFormData({
                                    ...formData,
                                    nutritionalInfo: {
                                        ...formData.nutritionalInfo,
                                        energy: parseFloat(e.target.value)
                                    }
                                })}
                            />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <TextField
                                fullWidth
                                label="Supplier"
                                value={formData.supplier}
                                onChange={(e) => setFormData({ ...formData, supplier: e.target.value })}
                            />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <TextField
                                fullWidth
                                type="number"
                                label="Minimum Stock"
                                value={formData.minimumStock}
                                onChange={(e) => setFormData({ ...formData, minimumStock: parseFloat(e.target.value) })}
                            />
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
                        {selectedItem ? 'Save' : 'Add'}
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default FeedItems; 