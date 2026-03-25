import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Container,
  Grid,
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
  Divider,
  CircularProgress,
  TextField,
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers';
import { useDispatch, useSelector } from 'react-redux';
import { format } from 'date-fns';
import { fetchBreedingCattle, fetchBreedingReport } from '../../store/slices/breedingSlice';

const BreedingReports = () => {
  const dispatch = useDispatch();
  const { breedingCattle = [], currentReport = null, loading = false, error = null } = useSelector((state) => state.breeding || {});
  const [selectedCattle, setSelectedCattle] = useState('');
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [reportType, setReportType] = useState('Farm');

  useEffect(() => {
    dispatch(fetchBreedingCattle());
  }, [dispatch]);

  const handleGenerateReport = () => {
    if (!startDate || !endDate || (reportType === 'Individual' && !selectedCattle)) return;

    dispatch(fetchBreedingReport({
      reportType,
      cattleId: selectedCattle || undefined,
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
    }));
  };

  const renderIndividualReport = () => {
    if (!currentReport || !currentReport.cattle) return null;
    
    return (
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Individual Breeding Report
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle2">Tag Number:</Typography>
              <Typography>{currentReport.cattle.tag}</Typography>
            </Grid>
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle2">Breeding Role:</Typography>
              <Typography>{currentReport.cattle.breedingRole}</Typography>
            </Grid>
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle2">Breeding Start Date:</Typography>
              <Typography>
                {format(new Date(currentReport.cattle.breedingStartDate), 'PP')}
              </Typography>
            </Grid>
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle2">Number of Offspring:</Typography>
              <Typography>{currentReport.metrics.totalOffspring}</Typography>
            </Grid>
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle2">Expense per Offspring:</Typography>
              <Typography>
                PKR {currentReport.metrics.expensePerOffspring.toLocaleString()}
              </Typography>
            </Grid>
            <Grid item xs={12}>
              <Typography variant="subtitle2">Breeding Notes:</Typography>
              <Typography>{currentReport.cattle.breedingNotes || 'No notes available'}</Typography>
            </Grid>
          </Grid>
        </CardContent>
      </Card>
    );
  };

  const renderFarmReport = () => {
    if (!currentReport) return null;

    return (
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Farm-Level Breeding Report
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle2">Total Breeding Cattle:</Typography>
              <Typography>{currentReport.metrics.totalBreedingCattle}</Typography>
            </Grid>
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle2">Total Offspring Produced:</Typography>
              <Typography>{currentReport.metrics.totalOffspring}</Typography>
            </Grid>
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle2">Average Expense per Breeding Cattle:</Typography>
              <Typography>
                PKR {(currentReport.metrics.totalExpenses / currentReport.metrics.totalBreedingCattle).toLocaleString()}
              </Typography>
            </Grid>
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle2">Total Feed Consumed:</Typography>
              <Typography>{currentReport.metrics.feedConsumed.toLocaleString()} kg</Typography>
            </Grid>
          </Grid>

          <Typography variant="h6" sx={{ mt: 3, mb: 2 }}>
            Top Performers
          </Typography>
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Tag Number</TableCell>
                  <TableCell>Offspring Count</TableCell>
                  <TableCell>Success Rate</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {currentReport.topPerformers.map((performer) => (
                  <TableRow key={performer.cattle._id}>
                    <TableCell>{performer.cattle.tag}</TableCell>
                    <TableCell>{performer.offspringCount}</TableCell>
                    <TableCell>{(performer.successRate * 100).toFixed(1)}%</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>
    );
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
          Breeding Reports
        </Typography>
        
        <Paper sx={{ p: 3, mb: 3 }}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={4}>
              <FormControl fullWidth>
                <InputLabel>Report Type</InputLabel>
                <Select
                  value={reportType}
                  onChange={(e) => setReportType(e.target.value)}
                  label="Report Type"
                >
                  <MenuItem value="Farm">Farm Report</MenuItem>
                  <MenuItem value="Individual">Individual Report</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            {reportType === 'Individual' && (
              <Grid item xs={12} md={4}>
                <FormControl fullWidth>
                  <InputLabel>Select Cattle</InputLabel>
                  <Select
                    value={selectedCattle}
                    onChange={(e) => setSelectedCattle(e.target.value)}
                    label="Select Cattle"
                  >
                    {breedingCattle.map((cattle) => (
                      <MenuItem key={cattle._id} value={cattle._id}>
                        {cattle.tag} - {cattle.breedingRole}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
            )}
            <Grid item xs={12} md={4}>
              <DatePicker
                label="Start Date"
                value={startDate}
                onChange={setStartDate}
                renderInput={(params) => <TextField {...params} fullWidth />}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <DatePicker
                label="End Date"
                value={endDate}
                onChange={setEndDate}
                renderInput={(params) => <TextField {...params} fullWidth />}
              />
            </Grid>
            <Grid item xs={12}>
              <Button
                variant="contained"
                onClick={handleGenerateReport}
                disabled={loading || !startDate || !endDate || (reportType === 'Individual' && !selectedCattle)}
              >
                {loading ? <CircularProgress size={24} /> : 'Generate Report'}
              </Button>
            </Grid>
          </Grid>
        </Paper>

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
            <CircularProgress />
          </Box>
        ) : (
          <>
            {reportType === 'Individual' ? renderIndividualReport() : renderFarmReport()}
          </>
        )}
      </Box>
    </Container>
  );
};

export default BreedingReports; 