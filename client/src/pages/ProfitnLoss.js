import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
    Container,
    Grid,
    Paper,
    Typography,
    Box,
    Card,
    CardContent,
    CircularProgress,
    Alert,
    List,
    ListItem,
    ListItemText,
    Divider,
    TextField,
    MenuItem,
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import {
    TrendingUp as TrendingUpIcon,
    TrendingDown as TrendingDownIcon,
    AccountBalance as AccountBalanceIcon,
} from '@mui/icons-material';
import { fetchExpenseSummary } from '../store/slices/expenseSlice';
import { fetchCurrentMonthStatus } from '../store/slices/kundaRentalSlice';
import { fetchCattle } from '../store/slices/cattleSlice';
import { formatCurrency } from '../utils/format';

const SummaryCard = ({ title, value, icon, color = 'primary.main', loading }) => (
    <Card sx={{ height: '100%', boxShadow: 2, opacity: loading ? 0.5 : 1 }}>
        <CardContent>
            <Grid container spacing={3} sx={{ justifyContent: 'space-between', alignItems: 'center' }}>
                <Grid item>
                    <Typography color="textSecondary" gutterBottom variant="overline" sx={{ fontSize: '0.75rem', fontWeight: 600 }}>
                        {title}
                    </Typography>
                    <Typography color="textPrimary" variant="h4" sx={{ fontWeight: 600 }}>
                        {value}
                    </Typography>
                </Grid>
                <Grid item>
                    <Box sx={{
                        backgroundColor: `${color}15`,
                        borderRadius: '50%',
                        p: 1,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                    }}>
                        {React.cloneElement(icon, { sx: { fontSize: 32, color: color } })}
                    </Box>
                </Grid>
            </Grid>
        </CardContent>
    </Card>
);

const ProfitnLoss = () => {
    const dispatch = useDispatch();
    const [selectedMonth, setSelectedMonth] = useState(new Date());
    
    const { summary, loading: expenseLoading } = useSelector((state) => state.expense);
    const { currentMonthStatus: kundaStatus, loading: kundaLoading } = useSelector((state) => state.kundaRental || {});
    const { cattle, loading: cattleLoading } = useSelector((state) => state.cattle);
    
    useEffect(() => {
        const fetchData = async () => {
            try {
                await Promise.all([
                    dispatch(fetchExpenseSummary(selectedMonth)),
                    dispatch(fetchCurrentMonthStatus(selectedMonth)),
                    dispatch(fetchCattle()),
                ]);
            } catch (error) {
                console.error('Error fetching profit & loss data:', error);
            }
        };
        fetchData();
    }, [dispatch, selectedMonth]);

    const loading = expenseLoading || kundaLoading || cattleLoading;

    // Calculate cattle costs for the selected month
    const calculateCattleCosts = () => {
        if (!cattle) return 0;
        
        const startOfMonth = new Date(selectedMonth.getFullYear(), selectedMonth.getMonth(), 1);
        const endOfMonth = new Date(selectedMonth.getFullYear(), selectedMonth.getMonth() + 1, 0);

        return cattle.reduce((total, cattle) => {
            const purchaseDate = new Date(cattle.purchaseDate);
            if (purchaseDate >= startOfMonth && purchaseDate <= endOfMonth) {
                return total + (cattle.purchasePrice + (cattle.transportationCost || 0));
            }
            return total;
        }, 0);
    };

    const cattleCosts = calculateCattleCosts();

    // Calculate total income
    const totalIncome = (
        (summary?.custodyStats?.currentMonth?.paid || 0) +
        (kundaStatus?.paid || 0)
    );

    // Calculate total expenses including cattle costs
    const totalExpenses = (summary?.totalExpenses || 0) + cattleCosts;

    // Calculate net profit/loss
    const netAmount = totalIncome - totalExpenses;

    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
                <CircularProgress />
            </Box>
        );
    }

    return (
        <Container maxWidth={false}>
            <Box sx={{ pt: 3 }}>
                <Grid container spacing={3} alignItems="center" sx={{ mb: 3 }}>
                    <Grid item xs={12} md={6}>
                        <Typography variant="h4">Profit & Loss Statement</Typography>
                    </Grid>
                    <Grid item xs={12} md={6}>
                        <DatePicker
                            label="Select Month"
                            value={selectedMonth}
                            onChange={(newValue) => setSelectedMonth(newValue)}
                            views={['year', 'month']}
                            renderInput={(params) => <TextField {...params} fullWidth />}
                        />
                    </Grid>
                </Grid>

                <Grid container spacing={3}>
                    <Grid item xs={12} md={4}>
                        <SummaryCard
                            title="TOTAL INCOME"
                            value={formatCurrency(totalIncome)}
                            icon={<TrendingUpIcon />}
                            color="success.main"
                            loading={loading}
                        />
                    </Grid>
                    <Grid item xs={12} md={4}>
                        <SummaryCard
                            title="TOTAL EXPENSES"
                            value={formatCurrency(totalExpenses)}
                            icon={<TrendingDownIcon />}
                            color="error.main"
                            loading={loading}
                        />
                    </Grid>
                    <Grid item xs={12} md={4}>
                        <SummaryCard
                            title="NET PROFIT/LOSS"
                            value={formatCurrency(netAmount)}
                            icon={<AccountBalanceIcon />}
                            color={netAmount >= 0 ? 'success.main' : 'error.main'}
                            loading={loading}
                        />
                    </Grid>
                </Grid>

                <Grid container spacing={3} sx={{ mt: 2 }}>
                    <Grid item xs={12} md={6}>
                        <Paper sx={{ p: 3 }}>
                            <Typography variant="h6" gutterBottom>
                                Income Breakdown
                            </Typography>
                            <List>
                                <ListItem>
                                    <ListItemText
                                        primary="Custody Income"
                                        secondary={formatCurrency(summary?.custodyStats?.currentMonth?.paid || 0)}
                                    />
                                </ListItem>
                                <Divider />
                                <ListItem>
                                    <ListItemText
                                        primary="Kunda Rental Income"
                                        secondary={formatCurrency(kundaStatus?.paid || 0)}
                                    />
                                </ListItem>
                            </List>
                        </Paper>
                    </Grid>
                    <Grid item xs={12} md={6}>
                        <Paper sx={{ p: 3 }}>
                            <Typography variant="h6" gutterBottom>
                                Expense Breakdown
                            </Typography>
                            <List>
                                {cattleCosts > 0 && (
                                    <>
                                        <ListItem>
                                            <ListItemText
                                                primary="Cattle Purchases"
                                                secondary={formatCurrency(cattleCosts)}
                                            />
                                        </ListItem>
                                        <Divider />
                                    </>
                                )}
                                {summary?.categoryBreakdown && summary.categoryBreakdown.length > 0 ? (
                                    summary.categoryBreakdown.map((category, index) => (
                                        <React.Fragment key={category._id}>
                                            <ListItem>
                                                <ListItemText
                                                    primary={`${category.categoryName} (${category.categoryType})`}
                                                    secondary={formatCurrency(category.totalAmount)}
                                                />
                                            </ListItem>
                                            {index < summary.categoryBreakdown.length - 1 && <Divider />}
                                        </React.Fragment>
                                    ))
                                ) : (
                                    cattleCosts === 0 && <Alert severity="info">No expenses found for this period.</Alert>
                                )}
                            </List>
                        </Paper>
                    </Grid>
                </Grid>
            </Box>
        </Container>
    );
};

export default ProfitnLoss; 