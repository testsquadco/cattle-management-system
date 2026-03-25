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
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  InputAdornment,
  Chip,
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as ViewIcon,
} from '@mui/icons-material';
import { DataGrid } from '@mui/x-data-grid';
import {
  fetchCattle,
  createCattle,
  updateCattle,
  deleteCattle,
} from '../../store/slices/cattleSlice';
import CattleForm from './CattleForm';
import './CattleList.css';

const BREEDS = [
  'Holstein Friesian',
  'Jersey',
  'Guernsey',
  'Ayrshire',
  'Brown Swiss',
  'Red Sindhi',
  'Sahiwal',
  'Gir',
  'Tharparkar',
  'Rathi',
  'Other',
];

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

const CattleList = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { cattle, loading, error } = useSelector((state) => state.cattle);
  const [formOpen, setFormOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selectedCattle, setSelectedCattle] = useState(null);

  useEffect(() => {
    dispatch(fetchCattle());
  }, [dispatch]);

  const handleAdd = () => {
    setSelectedCattle(null);
    setFormOpen(true);
  };

  const handleEdit = (cattle) => {
    setSelectedCattle(cattle);
    setFormOpen(true);
  };

  const handleDelete = (cattle) => {
    setSelectedCattle(cattle);
    setDeleteOpen(true);
  };

  const handleView = (cattle) => {
    navigate(`/cattle/${cattle._id}`);
  };

  const handleSubmit = async (formData) => {
    if (selectedCattle) {
      await dispatch(updateCattle({ id: selectedCattle._id, data: formData }));
    } else {
      await dispatch(createCattle(formData));
    }
    setFormOpen(false);
  };

  const handleDeleteConfirm = async () => {
    await dispatch(deleteCattle(selectedCattle._id));
    setDeleteOpen(false);
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

  const columns = [
    {
      field: 'image',
      headerName: 'Image',
      width: 100,
      renderCell: (params) => (
        <Box
          sx={{
            width: 50,
            height: 50,
            borderRadius: '4px',
            overflow: 'hidden',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#f5f5f5'
          }}
        >
          {params.row.image ? (
            <img
              src={`${process.env.REACT_APP_API_URL}/uploads/cattle/${params.row.image}`}
              alt={params.row.name || params.row.tag}
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover'
              }}
            />
          ) : (
            <Typography color="textSecondary" variant="caption">No image</Typography>
          )}
        </Box>
      ),
    },
    { field: 'tag', headerName: 'Tag Number', flex: 1 },
    { field: 'name', headerName: 'Name', flex: 1, renderCell: (params) => params.value || '-' },
    { field: 'breed', headerName: 'Breed', flex: 1 },
    {
      field: 'purchaseDate',
      headerName: 'Purchase Date',
      flex: 1,
      renderCell: (params) => new Date(params.value).toLocaleDateString(),
    },
    {
      field: 'initialCost',
      headerName: 'Initial Cost',
      flex: 1,
      renderCell: (params) => `PKR ${(params.row.purchasePrice + params.row.transportationCost).toLocaleString()}`,
    },
    {
      field: 'currentWeight',
      headerName: 'Weight',
      flex: 1,
      renderCell: (params) => {
        const weightChange = params.value - params.row.weight;
        const changeColor = weightChange >= 0 ? 'success.main' : 'error.main';
        return (
          <Box>
            <Typography
              component="span"
              sx={{ 
                fontWeight: 'medium'
              }}
            >
              {params.value} kg
            </Typography>
            <Typography
              component="span"
              sx={{ 
                ml: 1,
                color: changeColor,
                fontSize: '0.75rem'
              }}
            >
              ({weightChange >= 0 ? '+' : ''}{weightChange.toFixed(1)} kg since purchase)
            </Typography>
          </Box>
        );
      },
    },
    {
      field: 'actions',
      headerName: 'Actions',
      flex: 1,
      renderCell: (params) => (
        <Box>
          <Tooltip title="View Details">
            <IconButton onClick={() => handleView(params.row)} color="primary">
              <ViewIcon />
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
          Cattle Management
        </Typography>
        <Tooltip title="">
          <span>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={handleAdd}
              disabled={loading}
            >
              Add Cattle
            </Button>
          </span>
        </Tooltip>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Paper sx={{ height: 600, width: '100%' }}>
        <DataGrid
          rows={cattle || []}
          columns={columns}
          pageSize={10}
          rowsPerPageOptions={[10]}
          disableSelectionOnClick
          loading={loading}
          getRowId={(row) => row._id}
          getRowClassName={(params) => {
            if (params.row.custodyType === 'Sold') return 'sold-cattle-row';
            if (params.row.custodyType === 'Custody') return 'custody-cattle-row';
            return '';
          }}
        />
      </Paper>

      <CattleForm
        open={formOpen}
        onClose={() => setFormOpen(false)}
        cattle={selectedCattle}
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

export default CattleList; 