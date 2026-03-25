import React, { useState, useEffect } from 'react';
import {
    Box,
    Paper,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Typography,
    Grid,
    Card,
    CardContent,
    Button,
    MenuItem,
    TextField
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { GetApp as ExportIcon } from '@mui/icons-material';
import api from '../../utils/api';

const MonthlySummary = () => {
    const [summary, setSummary] = useState([]);
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [totals, setTotals] = useState({
        totalQuantity: 0,
        totalCost: 0
    });

    useEffect(() => {
        fetchSummary();
    }, [selectedDate]);

    const fetchSummary = async () => {
        try {
            const year = selectedDate.getFullYear();
            const month = selectedDate.getMonth() + 1;
            const response = await api.get(`/api/feed/monthly-summary?year=${year}&month=${month}`);
            setSummary(response.data);

            // Calculate totals
            const totals = response.data.reduce((acc, item) => ({
                totalQuantity: acc.totalQuantity + item.totalQuantity,
                totalCost: acc.totalCost + item.totalCost
            }), { totalQuantity: 0, totalCost: 0 });

            setTotals(totals);
        } catch (error) {
            console.error('Error fetching monthly summary:', error);
        }
    };

    const handleExport = async () => {
        try {
            const year = selectedDate.getFullYear();
            const month = selectedDate.getMonth() + 1;
            const response = await api.get(`/api/feed/export/monthly-summary?year=${year}&month=${month}`, {
                responseType: 'blob'
            });
            
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `feed-summary-${year}-${month}.csv`);
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (error) {
            console.error('Error exporting summary:', error);
        }
    };

    return (
        <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
                <Typography variant="h5">Monthly Feed Summary</Typography>
                <Box sx={{ display: 'flex', gap: 2 }}>
                    <LocalizationProvider dateAdapter={AdapterDateFns}>
                        <DatePicker
                            views={['year', 'month']}
                            value={selectedDate}
                            onChange={(newValue) => setSelectedDate(newValue)}
                            renderInput={(params) => <TextField {...params} />}
                        />
                    </LocalizationProvider>
                    <Button
                        variant="contained"
                        startIcon={<ExportIcon />}
                        onClick={handleExport}
                    >
                        Export
                    </Button>
                </Box>
            </Box>

            <Grid container spacing={3} sx={{ mb: 3 }}>
                <Grid item xs={12} sm={6}>
                    <Card>
                        <CardContent>
                            <Typography color="textSecondary" gutterBottom>
                                Total Feed Used
                            </Typography>
                            <Typography variant="h4">
                                {totals.totalQuantity.toFixed(2)} kg
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>
                <Grid item xs={12} sm={6}>
                    <Card>
                        <CardContent>
                            <Typography color="textSecondary" gutterBottom>
                                Total Feed Cost
                            </Typography>
                            <Typography variant="h4">
                                ${totals.totalCost.toFixed(2)}
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>

            <TableContainer component={Paper}>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell>Feed Item</TableCell>
                            <TableCell>Category</TableCell>
                            <TableCell>Subcategory</TableCell>
                            <TableCell align="right">Total Quantity</TableCell>
                            <TableCell align="right">Total Cost</TableCell>
                            <TableCell align="right">Average Cost per Unit</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {summary.map((item) => (
                            <TableRow key={item._id.feedItem}>
                                <TableCell>{item._id.feedItem}</TableCell>
                                <TableCell>{item._id.category}</TableCell>
                                <TableCell>{item._id.subCategory}</TableCell>
                                <TableCell align="right">{item.totalQuantity.toFixed(2)}</TableCell>
                                <TableCell align="right">${item.totalCost.toFixed(2)}</TableCell>
                                <TableCell align="right">
                                    ${(item.totalCost / item.totalQuantity).toFixed(2)}
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>
        </Box>
    );
};

export default MonthlySummary; 