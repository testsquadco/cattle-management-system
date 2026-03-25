import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Grid,
  CircularProgress,
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers';
import { useDispatch, useSelector } from 'react-redux';
import { format } from 'date-fns';
import {
  fetchBreedingCattle,
  fetchMatingHistory,
  addMatingRecord,
  updateMatingResult,
} from '../../store/slices/breedingSlice';

const BreedingHistory = () => {
  const dispatch = useDispatch();
  const { breedingCattle = [], matingHistory = [], loading = false, error = null } = useSelector((state) => state.breeding || {});
  const [selectedCattle, setSelectedCattle] = useState('');
  const [openDialog, setOpenDialog] = useState(false);
  const [matingForm, setMatingForm] = useState({
    date: null,
    method: 'Natural',
    partnerId: '',
    notes: ''
  });

  useEffect(() => {
    dispatch(fetchBreedingCattle());
  }, [dispatch]);

  useEffect(() => {
    if (selectedCattle) {
      dispatch(fetchMatingHistory(selectedCattle));
    }
  }, [dispatch, selectedCattle]);

  const handleAddMating = async () => {
    try {
      await dispatch(addMatingRecord({
        cattleId: selectedCattle,
        date: matingForm.date?.toISOString(),
        method: matingForm.method,
        partnerId: matingForm.partnerId || undefined,
        notes: matingForm.notes
      })).unwrap();
      
      setOpenDialog(false);
      setMatingForm({
        date: null,
        method: 'Natural',
        partnerId: '',
        notes: ''
      });
    } catch (error) {
      console.error('Error adding mating record:', error);
    }
  };

  const handleUpdateMatingResult = async (matingId, result) => {
    try {
      await dispatch(updateMatingResult({
        cattleId: selectedCattle,
        matingId,
        result
      })).unwrap();
    } catch (error) {
      console.error('Error updating mating result:', error);
    }
  };

  if (error) {
    return (
      <Container maxWidth="lg">
        <Box sx={{ mt: 4, mb: 4 }}>
          <Typography color="error">Error: {error}</Typography>
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg">
      <Box sx={{ mt: 4, mb: 4 }}>
        <Typography variant="h4" gutterBottom>
          Breeding History
        </Typography>

        <Paper sx={{ p: 3, mb: 3 }}>
          <Grid container spacing={3} alignItems="center">
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Select Breeding Cattle</InputLabel>
                <Select
                  value={selectedCattle}
                  onChange={(e) => setSelectedCattle(e.target.value)}
                  label="Select Breeding Cattle"
                >
                  {breedingCattle.map((cattle) => (
                    <MenuItem key={cattle._id} value={cattle._id}>
                      {cattle.tag} - {cattle.breedingRole}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <Button
                variant="contained"
                onClick={() => setOpenDialog(true)}
                disabled={!selectedCattle}
              >
                Add Mating Record
              </Button>
            </Grid>
          </Grid>
        </Paper>

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
            <CircularProgress />
          </Box>
        ) : (
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Date</TableCell>
                  <TableCell>Method</TableCell>
                  <TableCell>Partner</TableCell>
                  <TableCell>Pregnancy Status</TableCell>
                  <TableCell>Offspring Count</TableCell>
                  <TableCell>Notes</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {matingHistory.map((mating) => (
                  <TableRow key={mating._id}>
                    <TableCell>{format(new Date(mating.date), 'PP')}</TableCell>
                    <TableCell>{mating.method}</TableCell>
                    <TableCell>
                      {mating.partnerId ? breedingCattle.find(c => c._id === mating.partnerId)?.tag : 'N/A'}
                    </TableCell>
                    <TableCell>{mating.result.pregnancyStatus}</TableCell>
                    <TableCell>{mating.result.offspringCount}</TableCell>
                    <TableCell>{mating.result.notes || mating.notes}</TableCell>
                    <TableCell>
                      <Button
                        size="small"
                        onClick={() => handleUpdateMatingResult(mating._id, {
                          pregnancyStatus: 'Confirmed',
                          offspringCount: 1,
                          notes: 'Updated result'
                        })}
                      >
                        Update Result
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}

        <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="sm" fullWidth>
          <DialogTitle>Add Mating Record</DialogTitle>
          <DialogContent>
            <Grid container spacing={3} sx={{ mt: 1 }}>
              <Grid item xs={12}>
                <DatePicker
                  label="Mating Date"
                  value={matingForm.date}
                  onChange={(date) => setMatingForm(prev => ({ ...prev, date }))}
                  renderInput={(params) => <TextField {...params} fullWidth required />}
                />
              </Grid>
              <Grid item xs={12}>
                <FormControl fullWidth required>
                  <InputLabel>Mating Method</InputLabel>
                  <Select
                    value={matingForm.method}
                    onChange={(e) => setMatingForm(prev => ({ ...prev, method: e.target.value }))}
                    label="Mating Method"
                  >
                    <MenuItem value="Natural">Natural</MenuItem>
                    <MenuItem value="AI">AI</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12}>
                <FormControl fullWidth>
                  <InputLabel>Partner</InputLabel>
                  <Select
                    value={matingForm.partnerId}
                    onChange={(e) => setMatingForm(prev => ({ ...prev, partnerId: e.target.value }))}
                    label="Partner"
                  >
                    <MenuItem value="">None</MenuItem>
                    {breedingCattle
                      .filter(c => c._id !== selectedCattle)
                      .map((cattle) => (
                        <MenuItem key={cattle._id} value={cattle._id}>
                          {cattle.tag} - {cattle.breedingRole}
                        </MenuItem>
                      ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12}>
                <TextField
                  label="Notes"
                  value={matingForm.notes}
                  onChange={(e) => setMatingForm(prev => ({ ...prev, notes: e.target.value }))}
                  fullWidth
                  multiline
                  rows={3}
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
            <Button
              onClick={handleAddMating}
              variant="contained"
              disabled={!matingForm.date}
            >
              Add Record
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </Container>
  );
};

export default BreedingHistory; 