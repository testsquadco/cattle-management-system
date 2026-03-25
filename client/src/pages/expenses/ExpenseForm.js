import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Typography,
  Chip,
  Checkbox,
  ListItemText
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { useDispatch, useSelector } from 'react-redux';
import { createExpense, updateExpense } from '../../store/slices/expenseSlice';
import { fetchCategories } from '../../store/slices/categorySlice';
import { fetchCattle } from '../../store/slices/cattleSlice';
import { parseISO, format } from 'date-fns';
import { fetchSeasons } from '../../store/slices/seasonSlice';

const ALL_CATTLE = 'all';
const NONE_CATTLE = 'none';
const QUANTITY_REQUIRED_CATEGORIES = ['Feed', 'Vaccine'];
const UNIT_OPTIONS = {
  Feed: ['KG'],
  Vaccine: ['ml']
};

const ExpenseForm = ({ open, handleClose, expense = null }) => {
  const dispatch = useDispatch();
  const { categories } = useSelector((state) => state.category);
  const { cattle } = useSelector((state) => state.cattle);
  const { seasons, loading } = useSelector((state) => state.season);
  const activeSeasons = seasons.filter(s => !s.isClosed);
  const selectedSeason = React.useMemo(() => {
    if (!seasons || seasons.length === 0) return null;
    const active = seasons.find(s => !s.isClosed);
    if (active) return active;
    return seasons[0];
  }, [seasons]);

  const [formData, setFormData] = useState({
    date: new Date(),
    category: '',
    subCategory: '',
    cattle: [],
    amount: '',
    description: '',
    quantity: '',
    unit: '',
    contributor: 'Eliya',
    season: '',
  });

  useEffect(() => {
    dispatch(fetchCategories());
    dispatch(fetchCattle());
    dispatch(fetchSeasons());
  }, [dispatch]);

  // Initialize form data only once when the component mounts or when expense changes
  useEffect(() => {
    if (expense) {
      setFormData({
        date: expense.date ? parseISO(expense.date) : new Date(),
        category: expense.category?._id || '',
        subCategory: expense.subCategory || '',
        cattle: expense.isSharedExpense
          ? [ALL_CATTLE]
          : Array.isArray(expense.cattle)
            ? expense.cattle.map(c => c._id)
            : (expense.cattle?._id ? [expense.cattle._id] : []),
        amount: expense.amount || '',
        description: expense.description || '',
        quantity: expense.quantity || '',
        unit: expense.unit || '',
        contributor: expense.contributor || 'Eliya',
        season: expense.season?._id || '',
      });
    }
  }, [expense]);

  // Set initial season when opening the form for a new expense
  useEffect(() => {
    if (!expense && open && activeSeasons.length > 0 && !formData.season) {
      setFormData(prev => ({
        ...prev,
        season: activeSeasons[0]._id
      }));
    }
  }, [open, activeSeasons, expense, formData.season]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
      ...(name === 'category' && { 
        subCategory: '',
        quantity: '',
        unit: '',
      }),
    }));
  };

  const handleDateChange = (date) => {
    const validDate = date instanceof Date && !isNaN(date) ? date : new Date();
    setFormData((prev) => ({
      ...prev,
      date: validDate,
    }));
  };

  const handleCattleChange = (event) => {
    const value = event.target.value;
    if (value.includes(ALL_CATTLE)) {
      setFormData((prev) => ({ ...prev, cattle: [ALL_CATTLE] }));
    } else if (value.includes(NONE_CATTLE)) {
      setFormData((prev) => ({ ...prev, cattle: [] }));
    } else {
      setFormData((prev) => ({ ...prev, cattle: value }));
    }
  };

  const isReadOnly = selectedSeason && selectedSeason.isClosed;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isReadOnly) return;
    if (!formData.season) {
      alert('Please select a season.');
      return;
    }

    try {
      const validDate = formData.date instanceof Date && !isNaN(formData.date) 
        ? formData.date 
        : new Date();

      let cattleField;
      if (formData.cattle.includes(ALL_CATTLE)) {
        cattleField = 'all';
      } else if (!formData.cattle || formData.cattle.length === 0) {
        cattleField = '';
      } else {
        cattleField = formData.cattle;
      }

      const expenseData = {
        ...formData,
        cattle: cattleField,
        date: format(validDate, "yyyy-MM-dd'T'HH:mm:ss.SSSxxx"),
      };

      if (selectedCategory && QUANTITY_REQUIRED_CATEGORIES.includes(selectedCategory.name)) {
        if (!formData.quantity || formData.quantity <= 0) {
          alert('Please enter a valid quantity for ' + selectedCategory.name);
          return;
        }
        if (!formData.unit) {
          alert('Please enter a unit for ' + selectedCategory.name);
          return;
        }
      }

      if (formData.cattle === ALL_CATTLE) {
        const expenseWithAllCattle = {
          ...expenseData,
          cattle: 'all',
          description: `${expenseData.description || ''}\n(Shared expense for all cattle)`.trim()
        };
        await dispatch(expense ? 
          updateExpense({ id: expense._id, data: expenseWithAllCattle }) :
          createExpense(expenseWithAllCattle)
        ).unwrap();
      } else {
        await dispatch(expense ?
          updateExpense({ id: expense._id, data: expenseData }) :
          createExpense(expenseData)
        ).unwrap();
      }
      handleClose();
    } catch (error) {
      console.error('Failed to save expense:', error);
    }
  };

  const selectedCategory = categories.find(c => c._id === formData.category);
  const availableSubcategories = selectedCategory?.subCategories || [];

  // Calculate the per-cattle amount if "All" is selected
  const perCattleAmount = formData.cattle === ALL_CATTLE && formData.amount 
    ? Number(formData.amount) / cattle.length 
    : null;

  // Check if quantity field should be shown
  const showQuantityFields = selectedCategory && QUANTITY_REQUIRED_CATEGORIES.includes(selectedCategory.name);

  console.log('Selected Category:', selectedCategory);
  console.log('Show Quantity Fields:', showQuantityFields);

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>{expense ? 'Edit Expense' : 'Add New Expense'}</DialogTitle>
      {isReadOnly && (
        <Box sx={{ mb: 2, p: 2, bgcolor: '#f8d7da', color: '#721c24', borderRadius: 1, textAlign: 'center' }}>
          This season is closed. Data is read-only.
        </Box>
      )}
      <form onSubmit={handleSubmit}>
        <DialogContent>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <DatePicker
                label="Date"
                value={formData.date}
                onChange={handleDateChange}
                renderInput={(params) => <TextField {...params} fullWidth disabled={isReadOnly} />}
              />
            </Grid>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Category *</InputLabel>
                <Select
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  label="Category *"
                  required
                  disabled={isReadOnly}
                >
                  {categories.map((category) => (
                    <MenuItem key={category._id} value={category._id}>
                      {category.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            {availableSubcategories.length > 0 && (
              <Grid item xs={12}>
                <FormControl fullWidth required>
                  <InputLabel>Subcategory</InputLabel>
                  <Select
                    name="subCategory"
                    value={formData.subCategory}
                    onChange={handleChange}
                    label="Subcategory"
                    disabled={isReadOnly || !formData.category}
                  >
                    {availableSubcategories.map((subcategory) => (
                      <MenuItem key={subcategory} value={subcategory}>
                        {subcategory}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
            )}
            {showQuantityFields && (
              <>
                <Grid item xs={8}>
                  <TextField
                    name="quantity"
                    label="Quantity"
                    type="number"
                    value={formData.quantity}
                    onChange={handleChange}
                    fullWidth
                    required
                    disabled={isReadOnly}
                    InputProps={{
                      inputProps: { min: 0, step: "0.01" }
                    }}
                  />
                </Grid>
                <Grid item xs={4}>
                  <FormControl fullWidth required>
                    <InputLabel>Unit</InputLabel>
                    <Select
                      name="unit"
                      value={formData.unit}
                      onChange={handleChange}
                      label="Unit"
                      disabled={isReadOnly}
                    >
                      {selectedCategory && UNIT_OPTIONS[selectedCategory.name]?.map((unit) => (
                        <MenuItem key={unit} value={unit}>
                          {unit}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
              </>
            )}
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Cattle</InputLabel>
                <Select
                  name="cattle"
                  multiple
                  value={formData.cattle}
                  onChange={handleCattleChange}
                  label="Cattle"
                  renderValue={(selected) =>
                    selected.includes(ALL_CATTLE)
                      ? 'All Cattle'
                      : selected.length === 0
                        ? 'None'
                        : (
                          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                            {selected.map((id) => {
                              const cow = cattle.find((c) => c._id === id);
                              return cow ? (
                                <Chip key={id} label={`${cow.tag} - ${cow.breed}`} />
                              ) : null;
                            })}
                          </Box>
                        )
                  }
                  disabled={isReadOnly}
                >
                  <MenuItem value={NONE_CATTLE} disabled={formData.cattle.length === 0}>
                    <em>None</em>
                  </MenuItem>
                  <MenuItem value={ALL_CATTLE}>
                    <em>All Cattle ({cattle.length})</em>
                  </MenuItem>
                  {cattle
                    .slice()
                    .sort((a, b) => a.tag.localeCompare(b.tag))
                    .map((c) => (
                      <MenuItem
                        key={c._id}
                        value={c._id}
                        disabled={c.custodyType === 'Sold'}
                        style={c.custodyType === 'Sold' ? { opacity: 0.5, fontStyle: 'italic' } : {}}
                      >
                        <Checkbox checked={formData.cattle.indexOf(c._id) > -1} />
                        <ListItemText
                          primary={`${c.tag} - ${c.breed}`}
                          secondary={c.custodyType === 'Sold' ? 'Sold' : ''}
                        />
                      </MenuItem>
                    ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <TextField
                name="amount"
                label="Amount"
                type="number"
                value={formData.amount}
                onChange={handleChange}
                fullWidth
                required
                disabled={isReadOnly}
                InputProps={{
                  startAdornment: 'PKR ',
                  inputProps: { min: 0 },
                }}
              />
              {perCattleAmount && (
                <Typography variant="caption" color="textSecondary" sx={{ mt: 1, display: 'block' }}>
                  Amount per cattle: PKR {perCattleAmount.toFixed(2)}
                </Typography>
              )}
            </Grid>
            <Grid item xs={12}>
              <TextField
                name="description"
                label="Description"
                value={formData.description}
                onChange={handleChange}
                fullWidth
                multiline
                rows={4}
                disabled={isReadOnly}
              />
            </Grid>
            <Grid item xs={12}>
              <FormControl fullWidth required>
                <InputLabel>Contributor</InputLabel>
                <Select
                  name="contributor"
                  value={formData.contributor}
                  onChange={handleChange}
                  label="Contributor *"
                  disabled={isReadOnly}
                >
                  <MenuItem value="Eliya">Eliya</MenuItem>
                  <MenuItem value="Kumail">Kumail</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <FormControl fullWidth required margin="normal">
                <InputLabel id="season-label">Season</InputLabel>
                <Select
                  labelId="season-label"
                  name="season"
                  value={formData.season}
                  onChange={handleChange}
                  label="Season"
                  disabled={isReadOnly}
                >
                  {activeSeasons.map(season => (
                    <MenuItem key={season._id} value={season._id}>
                      {season.name} ({new Date(season.startDate).toLocaleDateString()} - {new Date(season.endDate).toLocaleDateString()})
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Cancel</Button>
          <Button type="submit" variant="contained" color="primary" disabled={isReadOnly}>
            {expense ? 'Update' : 'Add'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default ExpenseForm; 