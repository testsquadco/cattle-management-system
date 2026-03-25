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
    Grid,
    Autocomplete,
    MenuItem
} from '@mui/material';
import {
    Add as AddIcon,
    Edit as EditIcon,
    Delete as DeleteIcon
} from '@mui/icons-material';
import api from '../../utils/api';

const FeedTemplates = () => {
    const [templates, setTemplates] = useState([]);
    const [feedItems, setFeedItems] = useState([]);
    const [open, setOpen] = useState(false);
    const [selectedTemplate, setSelectedTemplate] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        items: [],
        createdBy: 'Eliya',
        notes: ''
    });

    useEffect(() => {
        fetchTemplates();
        fetchFeedItems();
    }, []);

    const fetchTemplates = async () => {
        try {
            const response = await api.get('/api/feed/templates');
            setTemplates(response.data);
        } catch (error) {
            console.error('Error fetching templates:', error);
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

    const handleOpen = (template = null) => {
        if (template) {
            setSelectedTemplate(template);
            setFormData(template);
        } else {
            setSelectedTemplate(null);
            setFormData({
                name: '',
                description: '',
                items: [],
                createdBy: 'Eliya',
                notes: ''
            });
        }
        setOpen(true);
    };

    const handleClose = () => {
        setOpen(false);
        setSelectedTemplate(null);
    };

    const handleSubmit = async () => {
        try {
            if (selectedTemplate) {
                await api.put(`/api/feed/templates/${selectedTemplate._id}`, formData);
            } else {
                await api.post('/api/feed/templates', formData);
            }
            handleClose();
            fetchTemplates();
        } catch (error) {
            console.error('Error saving template:', error);
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to delete this template?')) {
            try {
                await api.delete(`/api/feed/templates/${id}`);
                fetchTemplates();
            } catch (error) {
                console.error('Error deleting template:', error);
            }
        }
    };

    const handleAddItem = () => {
        setFormData({
            ...formData,
            items: [
                ...formData.items,
                {
                    feedItem: '',
                    quantity: 0,
                    unit: 'kg'
                }
            ]
        });
    };

    const handleRemoveItem = (index) => {
        const newItems = [...formData.items];
        newItems.splice(index, 1);
        setFormData({
            ...formData,
            items: newItems
        });
    };

    const handleItemChange = (index, field, value) => {
        const newItems = [...formData.items];
        newItems[index] = {
            ...newItems[index],
            [field]: value
        };
        setFormData({
            ...formData,
            items: newItems
        });
    };

    return (
        <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
                <Typography variant="h5">Feed Templates</Typography>
                <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={() => handleOpen()}
                >
                    Add Template
                </Button>
            </Box>

            <TableContainer component={Paper}>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell>Name</TableCell>
                            <TableCell>Description</TableCell>
                            <TableCell>Items</TableCell>
                            <TableCell align="right">Expected Daily Cost</TableCell>
                            <TableCell>Created By</TableCell>
                            <TableCell align="center">Actions</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {templates.map((template) => (
                            <TableRow key={template._id}>
                                <TableCell>{template.name}</TableCell>
                                <TableCell>{template.description}</TableCell>
                                <TableCell>{template.items.length} items</TableCell>
                                <TableCell align="right">${template.expectedDailyCost.toFixed(2)}</TableCell>
                                <TableCell>{template.createdBy}</TableCell>
                                <TableCell align="center">
                                    <IconButton
                                        size="small"
                                        onClick={() => handleOpen(template)}
                                        color="primary"
                                    >
                                        <EditIcon />
                                    </IconButton>
                                    <IconButton
                                        size="small"
                                        onClick={() => handleDelete(template._id)}
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
                    {selectedTemplate ? 'Edit Feed Template' : 'Add New Feed Template'}
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
                                label="Created By"
                                value={formData.createdBy}
                                onChange={(e) => setFormData({ ...formData, createdBy: e.target.value })}
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
                                label="Description"
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            />
                        </Grid>
                        <Grid item xs={12}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                                <Typography variant="subtitle1">Feed Items</Typography>
                                <Button
                                    variant="outlined"
                                    startIcon={<AddIcon />}
                                    onClick={handleAddItem}
                                >
                                    Add Item
                                </Button>
                            </Box>
                            {formData.items.map((item, index) => (
                                <Grid container spacing={2} key={index} sx={{ mb: 2 }}>
                                    <Grid item xs={12} sm={5}>
                                        <Autocomplete
                                            options={feedItems}
                                            getOptionLabel={(option) => option.name}
                                            value={feedItems.find(fi => fi._id === item.feedItem) || null}
                                            onChange={(event, newValue) => {
                                                handleItemChange(index, 'feedItem', newValue?._id || '');
                                                if (newValue) {
                                                    handleItemChange(index, 'unit', newValue.unit);
                                                }
                                            }}
                                            renderInput={(params) => (
                                                <TextField
                                                    {...params}
                                                    label="Feed Item"
                                                    required
                                                />
                                            )}
                                        />
                                    </Grid>
                                    <Grid item xs={12} sm={3}>
                                        <TextField
                                            fullWidth
                                            type="number"
                                            label="Quantity"
                                            value={item.quantity}
                                            onChange={(e) => handleItemChange(index, 'quantity', parseFloat(e.target.value))}
                                        />
                                    </Grid>
                                    <Grid item xs={12} sm={3}>
                                        <TextField
                                            fullWidth
                                            label="Unit"
                                            value={item.unit}
                                            disabled
                                        />
                                    </Grid>
                                    <Grid item xs={12} sm={1}>
                                        <IconButton
                                            color="error"
                                            onClick={() => handleRemoveItem(index)}
                                            sx={{ mt: 1 }}
                                        >
                                            <DeleteIcon />
                                        </IconButton>
                                    </Grid>
                                </Grid>
                            ))}
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
                        {selectedTemplate ? 'Save' : 'Add'}
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default FeedTemplates; 