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
  InputAdornment,
  Typography,
  ThemeProvider,
  createTheme,
} from '@mui/material';
import { useDispatch, useSelector } from 'react-redux';
import { createCattle, updateCattle } from '../../store/slices/cattleSlice';
import { DatePicker } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';


const theme = createTheme({
  palette: {
    primary: {
      main: '#FFD700', // A golden yellow
      light: '#FFF4B8',
      dark: '#E6B800',
      contrastText: '#000',
    },
    background: {
      default: '#FFFDF0',
      paper: '#FFFDF0',
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        contained: {
          backgroundColor: '#FFD700',
          '&:hover': {
            backgroundColor: '#E6B800',
          },
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            '&.Mui-focused fieldset': {
              borderColor: '#FFD700',
            },
          },
          '& .MuiInputLabel-root.Mui-focused': {
            color: '#E6B800',
          },
        },
      },
    },
    MuiFormControl: {
      styleOverrides: {
        root: {
          '& .MuiInputLabel-root.Mui-focused': {
            color: '#E6B800',
          },
          '& .MuiOutlinedInput-root': {
            '&.Mui-focused fieldset': {
              borderColor: '#FFD700',
            },
          },
        },
      },
    },
  },
});

const BREEDS = [
  'Friesian',
  'Jersey',
  'Guernsey',
  'Brown Swiss',
  'Ayrshire',
  'Sahiwal',
  'Red Sindhi',
  'Tharparkar',
  'Cholistani',
  'Dhanni',
  'Bhagnari',
  'Lohani',
  'Rojhan',
  'Kankrej',
  'Dajli',
  'Australian Cross'
];

const PURPOSES = [
  { value: 'Fattening', label: 'Fattening' },
  { value: 'Breeding', label: 'Breeding' },
  { value: 'For Sale', label: 'For Sale' }
];

const GENDERS = [
  { value: 'Male', label: 'Male' },
  { value: 'Female', label: 'Female' }
];

const initialFormState = {
  tag: '',
  name: '',
  breed: '',
  gender: '',
  purpose: '',
  purchaseDate: '',
  weight: '',
  purchasePrice: '',
  transportationCost: '',
  colorMarkings: '',
  expectedSalePrice: '',
  actualSalePrice: '',
  saleDate: '',
  notes: '',
  custodyType: '',
  custodyDetails: {
    ownerName: '',
    ownerContact: '',
    monthlyFee: '',
    startDate: '',
    endDate: '',
    notes: ''
  },
  breedingDetails: {
    lastHeatDate: '',
    expectedHeatDate: '',
    lastMatingDate: '',
    expectedDeliveryDate: '',
    numberOfCalves: '',
    isPregnant: false,
    notes: '',
    matingMethod: '',
    breedingStartDate: '',
    breedingRole: ''
  },
  imageUrl: '',
};

const CattleForm = ({ open, onClose, cattle = null }) => {
  const dispatch = useDispatch();
  const [formData, setFormData] = useState({ ...initialFormState });
  const [imagePreview, setImagePreview] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (cattle) {
      setFormData({
        ...cattle,
        imageFile: null
      });
      // Set image preview for existing cattle
      if (cattle.image) {
        setImagePreview(`${process.env.REACT_APP_API_URL}/uploads/${cattle.image}`);
      } else {
        setImagePreview(null);
      }
    } else {
      setFormData(initialFormState);
      setImagePreview(null);
    }
  }, [cattle, open]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name.startsWith('custody.')) {
      const field = name.split('.')[1];
      setFormData((prev) => ({
        ...prev,
        custodyDetails: {
          ...prev.custodyDetails,
          [field]: name === 'custody.monthlyFee' ? (value === '' ? null : parseFloat(value)) : value
        }
      }));
    } else if (name.startsWith('breedingDetails.')) {
      const field = name.split('.')[1];
      setFormData((prev) => ({
        ...prev,
        breedingDetails: {
          ...prev.breedingDetails,
          [field]: field === 'isPregnant' ? value === 'true' : 
                   field === 'numberOfCalves' ? (value === '' ? null : parseInt(value)) : value
        }
      }));
    } else {
      // Handle numeric fields
      const numericFields = ['weight', 'purchasePrice', 'transportationCost', 'expectedSalePrice', 'actualSalePrice'];
      const isNumericField = numericFields.includes(name);
      
      setFormData((prev) => ({
        ...prev,
        [name]: isNumericField ? (value === '' ? null : parseFloat(value)) : value,
      }));
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Create preview URL for the selected file
      const previewUrl = URL.createObjectURL(file);
      setImagePreview(previewUrl);
      setFormData(prev => ({
        ...prev,
        imageFile: file
      }));
    }
  };

  const handleDateChange = (name, date) => {
    if (name.startsWith('breedingDetails.')) {
      const field = name.split('.')[1];
      setFormData((prev) => ({
        ...prev,
        breedingDetails: {
          ...prev.breedingDetails,
          [field]: date ? date.toISOString().split('T')[0] : ''
        }
      }));
    } else if (name.startsWith('custody.')) {
      const field = name.split('.')[1];
      setFormData((prev) => ({
        ...prev,
        custodyDetails: {
          ...prev.custodyDetails,
          [field]: date ? date.toISOString().split('T')[0] : ''
        }
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: date ? date.toISOString().split('T')[0] : ''
      }));
    }
  };

  const handleClose = () => {
    setFormData(initialFormState);
    onClose();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setIsSubmitting(true);
      
      // Create form data for file upload
      const formDataObj = new FormData();
      if (formData.imageFile) {
        formDataObj.append('image', formData.imageFile);
      }
      
      // Add other form fields
      const payload = { 
        ...formData,
        // Ensure required fields are included with fallback to existing values
        purchaseDate: formData.purchaseDate || cattle?.purchaseDate,
        weight: formData.weight || cattle?.weight,
        purchasePrice: formData.purchasePrice || cattle?.purchasePrice,
        transportationCost: formData.transportationCost || cattle?.transportationCost || 0,
        gender: formData.gender || cattle?.gender,
        breed: formData.breed || cattle?.breed,
        purpose: formData.purpose || cattle?.purpose || 'For Sale',
        custodyType: formData.custodyType || cattle?.custodyType || 'Owned'
      };

      // Ensure all required fields are included in the form data
      Object.keys(payload).forEach(key => {
        if (key !== 'imageFile' && payload[key] !== undefined) {
          // Convert dates to ISO string format
          if (key === 'purchaseDate' && payload[key]) {
            formDataObj.append(key, new Date(payload[key]).toISOString());
          } else if (key === 'custodyDetails' || key === 'breedingDetails') {
            // Handle nested objects
            Object.keys(payload[key]).forEach(nestedKey => {
              if (payload[key][nestedKey] !== undefined) {
                formDataObj.append(`${key}[${nestedKey}]`, payload[key][nestedKey]);
              }
            });
          } else {
            formDataObj.append(key, payload[key]);
          }
        }
      });

      // Log form data for debugging
      console.log('Form data being sent:', Object.fromEntries(formDataObj));

      try {
        if (cattle) {
          const result = await dispatch(updateCattle({ 
            id: cattle._id, 
            formData: formDataObj 
          })).unwrap();
          
          // Update local state with new image filename
          if (result.image) {
            setImagePreview(`${process.env.REACT_APP_API_URL}/uploads/${result.image}`);
          }
          handleClose();
        } else {
          const result = await dispatch(createCattle(formDataObj)).unwrap();
          handleClose();
        }
      } catch (error) {
        console.error('API Error:', error);
        const errorMessage = error.message || 'Failed to save cattle';
        const validationErrors = error.errors || [];
        
        if (validationErrors.length > 0) {
          alert(`Validation errors:\n${validationErrors.map(err => `- ${err.msg}`).join('\n')}`);
        } else {
          alert(errorMessage);
        }
        throw new Error(errorMessage);
      }
    } catch (error) {
      console.error('Form Error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ThemeProvider theme={theme}>
      <LocalizationProvider dateAdapter={AdapterDateFns}>
        <Dialog 
          open={open} 
          onClose={handleClose} 
          maxWidth="sm" 
          fullWidth
          disablePortal
          disableEnforceFocus
          PaperProps={{
            style: {
              backgroundColor: '#FFFDF0',
            },
          }}
        >
          <DialogTitle sx={{ color: '#000' }}>{cattle ? 'Edit Cattle' : 'Add New Cattle'}</DialogTitle>
          <form onSubmit={handleSubmit} data-testid="cattle-form">
            <DialogContent>
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
                    backgroundColor: '#f5f5f5',
                    position: 'relative',
                    cursor: 'pointer'
                  }}>
                    {imagePreview ? (
                      <img
                        src={imagePreview}
                        alt="Cattle preview"
                        style={{
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover'
                        }}
                      />
                    ) : (
                      <Typography color="textSecondary">Click to add image</Typography>
                    )}
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        width: '100%',
                        height: '100%',
                        opacity: 0,
                        cursor: 'pointer'
                      }}
                    />
                  </Box>
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    name="tag"
                    label="Tag Number"
                    value={formData.tag}
                    onChange={handleChange}
                    fullWidth
                    disabled={false}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    name="name"
                    label="Name"
                    value={formData.name}
                    onChange={handleChange}
                    fullWidth
                    disabled={false}
                  />
                </Grid>
                <Grid item xs={12}>
                  <FormControl fullWidth>
                    <InputLabel>Purpose</InputLabel>
                    <Select
                      name="purpose"
                      value={formData.purpose}
                      onChange={handleChange}
                      label="Purpose"
                      data-testid="purpose-select"
                      disabled={false}
                    >
                      {PURPOSES.map((purpose) => (
                        <MenuItem key={purpose.value} value={purpose.value}>
                          {purpose.label}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12}>
                  <FormControl fullWidth>
                    <InputLabel>Breed</InputLabel>
                    <Select
                      name="breed"
                      value={formData.breed}
                      onChange={handleChange}
                      label="Breed"
                      data-testid="breed-select"
                      disabled={false}
                    >
                      {BREEDS.map((breed) => (
                        <MenuItem key={breed} value={breed}>
                          {breed}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12}>
                  <FormControl fullWidth>
                    <InputLabel>Gender</InputLabel>
                    <Select
                      name="gender"
                      value={formData.gender}
                      onChange={handleChange}
                      label="Gender"
                      data-testid="gender-select"
                      disabled={false}
                    >
                      {GENDERS.map((gender) => (
                        <MenuItem key={gender.value} value={gender.value}>
                          {gender.label}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    name="colorMarkings"
                    label="Color/Markings"
                    value={formData.colorMarkings}
                    onChange={handleChange}
                    fullWidth
                    disabled={false}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <DatePicker
                    label="Purchase Date"
                    value={formData.purchaseDate ? new Date(formData.purchaseDate) : null}
                    onChange={(date) => handleDateChange('purchaseDate', date)}
                    slotProps={{ textField: { fullWidth: true } }}
                    disabled={false}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    name="weight"
                    label="Weight (kg)"
                    type="number"
                    value={formData.weight}
                    onChange={handleChange}
                    fullWidth
                    InputProps={{
                      endAdornment: <InputAdornment position="end">kg</InputAdornment>,
                    }}
                    disabled={false}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    name="purchasePrice"
                    label="Purchase Price"
                    type="number"
                    value={formData.purchasePrice}
                    onChange={handleChange}
                    fullWidth
                    InputProps={{
                      startAdornment: <InputAdornment position="start">PKR</InputAdornment>,
                    }}
                    disabled={false}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    name="transportationCost"
                    label="Transportation Cost"
                    type="number"
                    value={formData.transportationCost}
                    onChange={handleChange}
                    fullWidth
                    InputProps={{
                      startAdornment: <InputAdornment position="start">PKR</InputAdornment>,
                    }}
                    disabled={false}
                  />
                </Grid>
                {formData.purpose !== 'Breeding' && (
                  <>
                    <Grid item xs={12} md={6}>
                      <TextField
                        name="expectedSalePrice"
                        label="Expected Sale Price"
                        type="number"
                        value={formData.expectedSalePrice}
                        onChange={handleChange}
                        fullWidth
                        InputProps={{
                          startAdornment: <InputAdornment position="start">PKR</InputAdornment>,
                          inputProps: { min: 0 },
                        }}
                        disabled={false}
                      />
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <TextField
                        name="actualSalePrice"
                        label="Actual Sale Price"
                        type="number"
                        value={formData.actualSalePrice}
                        onChange={handleChange}
                        fullWidth
                        InputProps={{
                          startAdornment: <InputAdornment position="start">PKR</InputAdornment>,
                        }}
                        disabled={false}
                      />
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <DatePicker
                        label="Sale Date"
                        value={formData.saleDate ? new Date(formData.saleDate) : null}
                        onChange={(date) => handleDateChange('saleDate', date)}
                        slotProps={{ textField: { fullWidth: true } }}
                        disabled={false}
                      />
                    </Grid>
                  </>
                )}
                <Grid item xs={12}>
                  <FormControl fullWidth>
                    <InputLabel>Custody Type</InputLabel>
                    <Select
                      name="custodyType"
                      value={formData.custodyType}
                      onChange={handleChange}
                      label="Custody Type"
                      disabled={false}
                    >
                      <MenuItem value="Owned">Owned</MenuItem>
                      <MenuItem value="Custody">In Custody</MenuItem>
                      <MenuItem value="Sold">Sold</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>

                {formData.custodyType === 'Custody' && (
                  <>
                    <Grid item xs={12}>
                      <TextField
                        name="custody.ownerName"
                        label="Owner Name"
                        value={formData.custodyDetails.ownerName}
                        onChange={handleChange}
                        fullWidth
                        disabled={false}
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <TextField
                        name="custody.ownerContact"
                        label="Owner Contact"
                        value={formData.custodyDetails.ownerContact}
                        onChange={handleChange}
                        fullWidth
                        disabled={false}
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <TextField
                        name="custody.monthlyFee"
                        label="Monthly Fee"
                        type="number"
                        value={formData.custodyDetails.monthlyFee}
                        onChange={handleChange}
                        fullWidth
                        InputProps={{
                          startAdornment: <InputAdornment position="start">PKR</InputAdornment>,
                          inputProps: { min: 0 },
                        }}
                        disabled={false}
                      />
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <DatePicker
                        label="Custody Start Date"
                        value={formData.custodyDetails.startDate ? new Date(formData.custodyDetails.startDate) : null}
                        onChange={(date) => handleDateChange('custody.startDate', date)}
                        slotProps={{ textField: { fullWidth: true } }}
                        disabled={false}
                      />
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <DatePicker
                        label="Expected End Date (Optional)"
                        value={formData.custodyDetails.endDate ? new Date(formData.custodyDetails.endDate) : null}
                        onChange={(date) => handleDateChange('custody.endDate', date)}
                        slotProps={{ textField: { fullWidth: true } }}
                        disabled={false}
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <TextField
                        name="custody.notes"
                        label="Custody Notes"
                        value={formData.custodyDetails.notes}
                        onChange={handleChange}
                        fullWidth
                        multiline
                        rows={3}
                        disabled={false}
                      />
                    </Grid>
                  </>
                )}

                {formData.purpose === 'Breeding' && (
                  <>
                    <Grid item xs={12}>
                      <Typography variant="subtitle1" sx={{ mb: 2 }}>
                        Breeding Information
                      </Typography>
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <FormControl fullWidth>
                        <InputLabel>Breeding Role</InputLabel>
                        <Select
                          name="breedingDetails.breedingRole"
                          value={formData.breedingDetails.breedingRole}
                          onChange={handleChange}
                          label="Breeding Role"
                          data-testid="breeding-role-select"
                          disabled={false}
                        >
                          <MenuItem value="Dam">Dam</MenuItem>
                          <MenuItem value="Sire">Sire</MenuItem>
                        </Select>
                      </FormControl>
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <FormControl fullWidth>
                        <InputLabel>Mating Method</InputLabel>
                        <Select
                          name="breedingDetails.matingMethod"
                          value={formData.breedingDetails.matingMethod}
                          onChange={handleChange}
                          label="Mating Method"
                          data-testid="mating-method-select"
                          disabled={false}
                        >
                          <MenuItem value="Natural">Natural</MenuItem>
                          <MenuItem value="AI">AI</MenuItem>
                        </Select>
                      </FormControl>
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <FormControl fullWidth>
                        <InputLabel>Pregnancy Status</InputLabel>
                        <Select
                          name="breedingDetails.isPregnant"
                          value={formData.breedingDetails.isPregnant ? "true" : "false"}
                          onChange={handleChange}
                          label="Pregnancy Status"
                          data-testid="pregnancy-status-select"
                          disabled={false}
                        >
                          <MenuItem value="true">Pregnant</MenuItem>
                          <MenuItem value="false">Not Pregnant</MenuItem>
                        </Select>
                      </FormControl>
                    </Grid>

                    {formData.breedingDetails.isPregnant && (
                      <>
                        <Grid item xs={12} md={6}>
                          <DatePicker
                            label="Breeding Start Date"
                            value={formData.breedingDetails.breedingStartDate ? new Date(formData.breedingDetails.breedingStartDate) : null}
                            onChange={(date) => handleDateChange('breedingDetails.breedingStartDate', date)}
                            slotProps={{ textField: { fullWidth: true } }}
                            disabled={false}
                          />
                        </Grid>
                        <Grid item xs={12} md={6}>
                          <DatePicker
                            label="Last Heat Date"
                            value={formData.breedingDetails.lastHeatDate ? new Date(formData.breedingDetails.lastHeatDate) : null}
                            onChange={(date) => handleDateChange('breedingDetails.lastHeatDate', date)}
                            slotProps={{ textField: { fullWidth: true } }}
                            disabled={false}
                          />
                        </Grid>
                        <Grid item xs={12} md={6}>
                          <DatePicker
                            label="Expected Heat Date"
                            value={formData.breedingDetails.expectedHeatDate ? new Date(formData.breedingDetails.expectedHeatDate) : null}
                            onChange={(date) => handleDateChange('breedingDetails.expectedHeatDate', date)}
                            slotProps={{ textField: { fullWidth: true } }}
                            disabled={false}
                          />
                        </Grid>
                        <Grid item xs={12} md={6}>
                          <DatePicker
                            label="Last Mating Date"
                            value={formData.breedingDetails.lastMatingDate ? new Date(formData.breedingDetails.lastMatingDate) : null}
                            onChange={(date) => handleDateChange('breedingDetails.lastMatingDate', date)}
                            slotProps={{ textField: { fullWidth: true } }}
                            disabled={false}
                          />
                        </Grid>
                        <Grid item xs={12} md={6}>
                          <DatePicker
                            label="Expected Delivery Date"
                            value={formData.breedingDetails.expectedDeliveryDate ? new Date(formData.breedingDetails.expectedDeliveryDate) : null}
                            onChange={(date) => handleDateChange('breedingDetails.expectedDeliveryDate', date)}
                            slotProps={{ textField: { fullWidth: true } }}
                            disabled={false}
                          />
                        </Grid>
                        <Grid item xs={12} md={6}>
                          <TextField
                            name="breedingDetails.numberOfCalves"
                            label="Number of Calves"
                            type="number"
                            value={formData.breedingDetails.numberOfCalves}
                            onChange={handleChange}
                            fullWidth
                            InputProps={{
                              inputProps: { min: 0 },
                              disabled: false
                            }}
                          />
                        </Grid>
                      </>
                    )}
                    <Grid item xs={12}>
                      <TextField
                        name="breedingDetails.notes"
                        label="Breeding Notes"
                        value={formData.breedingDetails.notes}
                        onChange={handleChange}
                        fullWidth
                        multiline
                        rows={3}
                        disabled={false}
                      />
                    </Grid>
                  </>
                )}

                <Grid item xs={12}>
                  <TextField
                    name="notes"
                    label="General Notes"
                    value={formData.notes}
                    onChange={handleChange}
                    fullWidth
                    multiline
                    rows={3}
                    disabled={false}
                  />
                </Grid>

              </Grid>
            </DialogContent>
            <DialogActions>
              <Button onClick={handleClose}>Cancel</Button>
              <Button 
                type="submit" 
                variant="contained" 
                color="primary" 
                data-testid="submit-button"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Saving...' : (cattle ? 'Update' : 'Add')} Cattle
              </Button>
            </DialogActions>
          </form>
        </Dialog>
      </LocalizationProvider>
    </ThemeProvider>
  );
};

export default CattleForm; 