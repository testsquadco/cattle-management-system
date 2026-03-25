import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  fetchSeasons,
  createSeason,
  closeSeason,
  carryForwardSeason,
  clearSeasonError,
  clearCarryForwardResult,
  deleteSeason
} from '../store/slices/seasonSlice';
import {
  Box,
  Typography,
  Button,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  CircularProgress,
  Alert
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import IconButton from '@mui/material/IconButton';

const SeasonManagement = () => {
  const dispatch = useDispatch();
  const { seasons, loading, error, carryForwardResult } = useSelector((state) => state.season);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: '', startDate: '', endDate: '' });
  const [creating, setCreating] = useState(false);
  const [carryDialog, setCarryDialog] = useState({ open: false, season: null });
  const [deleteDialog, setDeleteDialog] = useState({ open: false, season: null });

  useEffect(() => {
    dispatch(fetchSeasons());
  }, [dispatch]);

  const handleOpen = () => setOpen(true);
  const handleClose = () => {
    setOpen(false);
    setForm({ name: '', startDate: '', endDate: '' });
    dispatch(clearSeasonError());
  };

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleCreate = async () => {
    setCreating(true);
    await dispatch(createSeason(form));
    setCreating(false);
    handleClose();
  };

  const handleCloseSeason = (id) => {
    dispatch(closeSeason(id));
  };

  const handleCarryForward = (season) => {
    setCarryDialog({ open: true, season });
    dispatch(clearCarryForwardResult());
  };

  const confirmCarryForward = async () => {
    if (carryDialog.season) {
      await dispatch(carryForwardSeason(carryDialog.season._id));
    }
  };

  const closeCarryDialog = () => {
    setCarryDialog({ open: false, season: null });
    dispatch(clearCarryForwardResult());
  };

  const handleDeleteSeason = (season) => {
    setDeleteDialog({ open: true, season });
  };

  const confirmDeleteSeason = async () => {
    if (deleteDialog.season) {
      await dispatch(deleteSeason(deleteDialog.season._id));
      setDeleteDialog({ open: false, season: null });
    }
  };

  const closeDeleteDialog = () => {
    setDeleteDialog({ open: false, season: null });
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>Season Management</Typography>
      <Button variant="contained" onClick={handleOpen} sx={{ mb: 2 }}>Create New Season</Button>
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error.message || error}</Alert>}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>Start Date</TableCell>
              <TableCell>End Date</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {seasons.map((season) => (
              <TableRow key={season._id}>
                <TableCell>{season.name}</TableCell>
                <TableCell>{new Date(season.startDate).toLocaleDateString()}</TableCell>
                <TableCell>{new Date(season.endDate).toLocaleDateString()}</TableCell>
                <TableCell>
                  {season.isClosed ? 'Closed' : 'Active'}
                </TableCell>
                <TableCell>
                  {!season.isClosed && (
                    <Button
                      variant="outlined"
                      color="warning"
                      size="small"
                      onClick={() => handleCloseSeason(season._id)}
                      disabled={loading}
                    >
                      Close Season
                    </Button>
                  )}
                  {season.isClosed && (
                    <>
                      <Button
                        variant="outlined"
                        color="primary"
                        size="small"
                        onClick={() => handleCarryForward(season)}
                        disabled={loading}
                        sx={{ mr: 1 }}
                      >
                        Carry Forward
                      </Button>
                      <IconButton
                        color="error"
                        onClick={() => handleDeleteSeason(season)}
                        disabled={loading}
                        aria-label="Delete Season"
                      >
                        <DeleteIcon />
                      </IconButton>
                    </>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Create Season Dialog */}
      <Dialog open={open} onClose={handleClose}>
        <DialogTitle>Create New Season</DialogTitle>
        <DialogContent>
          <TextField
            margin="dense"
            label="Season Name"
            name="name"
            value={form.name}
            onChange={handleChange}
            fullWidth
            required
          />
          <TextField
            margin="dense"
            label="Start Date"
            name="startDate"
            type="date"
            value={form.startDate}
            onChange={handleChange}
            fullWidth
            required
            InputLabelProps={{ shrink: true }}
          />
          <TextField
            margin="dense"
            label="End Date"
            name="endDate"
            type="date"
            value={form.endDate}
            onChange={handleChange}
            fullWidth
            required
            InputLabelProps={{ shrink: true }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Cancel</Button>
          <Button onClick={handleCreate} variant="contained" disabled={creating || !form.name || !form.startDate || !form.endDate}>
            {creating ? <CircularProgress size={20} /> : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Carry Forward Dialog */}
      <Dialog open={carryDialog.open} onClose={closeCarryDialog}>
        <DialogTitle>Carry Forward Unsold Cattle</DialogTitle>
        <DialogContent>
          <Typography gutterBottom>
            This will carry forward all unsold cattle from <b>{carryDialog.season?.name}</b> to the next season.
          </Typography>
          {loading && <CircularProgress sx={{ my: 2 }} />}
          {carryForwardResult && (
            <Alert severity="success" sx={{ my: 2 }}>
              {carryForwardResult.message}<br />
              {carryForwardResult.carriedCattle && carryForwardResult.carriedCattle.length > 0 && (
                <>
                  {carryForwardResult.carriedCattle.length} cattle carried forward.<br />
                </>
              )}
            </Alert>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={closeCarryDialog}>Close</Button>
          <Button
            onClick={confirmCarryForward}
            variant="contained"
            color="primary"
            disabled={loading || (carryForwardResult && carryForwardResult.carriedCattle)}
          >
            Carry Forward
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Season Dialog */}
      <Dialog open={deleteDialog.open} onClose={closeDeleteDialog}>
        <DialogTitle>Delete Season?</DialogTitle>
        <DialogContent>
          <Typography gutterBottom>
            Are you sure you want to delete the season <b>{deleteDialog.season?.name}</b>?<br />
            <b>This action cannot be undone.</b>
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeDeleteDialog}>Cancel</Button>
          <Button onClick={confirmDeleteSeason} color="error" variant="contained" disabled={loading}>
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default SeasonManagement; 