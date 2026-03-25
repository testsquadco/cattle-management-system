import React, { useEffect } from 'react';
import {
    Box,
    Typography,
    Grid,
    TextField,
    Button,
    Card,
    CardContent,
    MenuItem,
    Select,
    FormControl,
    InputLabel
} from '@mui/material';
import { useDispatch, useSelector } from 'react-redux';
import { fetchAnalytics, setAnalyticsFilters } from '../../store/slices/feedSlice';
import FeedChart from '../../components/feed/FeedChart';
import FeedStatus from '../../components/feed/FeedStatus';
import api from '../../utils/api';
import { debounce } from 'lodash';

const Analytics = () => {
    const dispatch = useDispatch();
    const { data, loading, error, filters } = useSelector((state) => state.feed.analytics);
    const feedItems = useSelector((state) => state.feed.items.data);

    useEffect(() => {
        const today = new Date();
        const start = new Date();
        if (filters.timeRange === 'week') {
            start.setDate(today.getDate() - 7);
        } else if (filters.timeRange === 'month') {
            start.setMonth(today.getMonth() - 1);
        } else if (filters.timeRange === 'year') {
            start.setFullYear(today.getFullYear() - 1);
        }
        
        dispatch(setAnalyticsFilters({
            startDate: start.toISOString().split('T')[0],
            endDate: today.toISOString().split('T')[0]
        }));
    }, [filters.timeRange, dispatch]);

    useEffect(() => {
        if (filters.startDate && filters.endDate) {
            dispatch(fetchAnalytics({
                startDate: filters.startDate,
                endDate: filters.endDate,
                feedItem: filters.feedItem !== 'all' ? filters.feedItem : undefined
            }));
        }
    }, [filters, dispatch]);

    const handleExport = async () => {
        try {
            const response = await api.get('/feed/export/analytics', {
                params: {
                    startDate: filters.startDate,
                    endDate: filters.endDate,
                    feedItem: filters.feedItem !== 'all' ? filters.feedItem : undefined
                },
                responseType: 'blob'
            });
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', 'feed-analytics.csv');
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (error) {
            console.error('Error exporting analytics:', error);
        }
    };

    const debouncedFilterChange = debounce((field, value) => {
        dispatch(setAnalyticsFilters({ [field]: value }));
    }, 300);

    return (
        <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
                <Typography variant="h5">Feed Analytics</Typography>
                <Button variant="contained" onClick={handleExport}>
                    Export Data
                </Button>
            </Box>

            <Grid container spacing={3} sx={{ mb: 3 }}>
                <Grid item xs={12} sm={6} md={3}>
                    <FormControl fullWidth>
                        <InputLabel>Time Range</InputLabel>
                        <Select
                            value={filters.timeRange}
                            label="Time Range"
                            onChange={(e) => debouncedFilterChange('timeRange', e.target.value)}
                        >
                            <MenuItem value="week">Last Week</MenuItem>
                            <MenuItem value="month">Last Month</MenuItem>
                            <MenuItem value="year">Last Year</MenuItem>
                            <MenuItem value="custom">Custom Range</MenuItem>
                        </Select>
                    </FormControl>
                </Grid>
                {filters.timeRange === 'custom' && (
                    <>
                        <Grid item xs={12} sm={6} md={3}>
                            <TextField
                                fullWidth
                                type="date"
                                label="Start Date"
                                value={filters.startDate}
                                onChange={(e) => debouncedFilterChange('startDate', e.target.value)}
                                InputLabelProps={{ shrink: true }}
                            />
                        </Grid>
                        <Grid item xs={12} sm={6} md={3}>
                            <TextField
                                fullWidth
                                type="date"
                                label="End Date"
                                value={filters.endDate}
                                onChange={(e) => debouncedFilterChange('endDate', e.target.value)}
                                InputLabelProps={{ shrink: true }}
                            />
                        </Grid>
                    </>
                )}
                <Grid item xs={12} sm={6} md={3}>
                    <FormControl fullWidth>
                        <InputLabel>Feed Item</InputLabel>
                        <Select
                            value={filters.feedItem}
                            label="Feed Item"
                            onChange={(e) => debouncedFilterChange('feedItem', e.target.value)}
                        >
                            <MenuItem value="all">All Items</MenuItem>
                            {feedItems.map((item) => (
                                <MenuItem key={item._id} value={item._id}>
                                    {item.name}
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                </Grid>
            </Grid>

            <FeedStatus
                loading={loading}
                error={error}
                empty={data.usageData.length === 0}
            />

            {!loading && !error && data.usageData.length > 0 && (
                <>
                    <Grid container spacing={3} sx={{ mb: 3 }}>
                        <Grid item xs={12} sm={6} md={3}>
                            <Card>
                                <CardContent>
                                    <Typography color="textSecondary" gutterBottom>
                                        Total Quantity
                                    </Typography>
                                    <Typography variant="h5">
                                        {data.summary.totalQuantity.toFixed(2)} kg
                                    </Typography>
                                </CardContent>
                            </Card>
                        </Grid>
                        <Grid item xs={12} sm={6} md={3}>
                            <Card>
                                <CardContent>
                                    <Typography color="textSecondary" gutterBottom>
                                        Total Cost
                                    </Typography>
                                    <Typography variant="h5">
                                        ${data.summary.totalCost.toFixed(2)}
                                    </Typography>
                                </CardContent>
                            </Card>
                        </Grid>
                        <Grid item xs={12} sm={6} md={3}>
                            <Card>
                                <CardContent>
                                    <Typography color="textSecondary" gutterBottom>
                                        Average Cost/Unit
                                    </Typography>
                                    <Typography variant="h5">
                                        ${data.summary.averageCostPerUnit.toFixed(2)}
                                    </Typography>
                                </CardContent>
                            </Card>
                        </Grid>
                        <Grid item xs={12} sm={6} md={3}>
                            <Card>
                                <CardContent>
                                    <Typography color="textSecondary" gutterBottom>
                                        Most Used Item
                                    </Typography>
                                    <Typography variant="h5">
                                        {data.summary.mostUsedItem}
                                    </Typography>
                                </CardContent>
                            </Card>
                        </Grid>
                    </Grid>

                    <Grid container spacing={3}>
                        <Grid item xs={12} md={8}>
                            <FeedChart
                                type="line"
                                title="Feed Usage Over Time"
                                data={data.usageData}
                                dataKey="quantity"
                                name="Quantity (kg)"
                                valueSuffix=" kg"
                            />
                        </Grid>
                        <Grid item xs={12} md={4}>
                            <FeedChart
                                type="pie"
                                title="Cost Distribution by Category"
                                data={data.categoryData}
                                pieDataKey="cost"
                                pieNameKey="category"
                                valuePrefix="$"
                            />
                        </Grid>
                        <Grid item xs={12}>
                            <FeedChart
                                type="bar"
                                title="Daily Feed Costs"
                                data={data.costData}
                                dataKey="cost"
                                name="Cost ($)"
                                valuePrefix="$"
                            />
                        </Grid>
                    </Grid>
                </>
            )}
        </Box>
    );
};

export default Analytics; 