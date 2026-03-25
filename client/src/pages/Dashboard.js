import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
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
  Container,
  LinearProgress,
} from '@mui/material';
import {
  Pets as CattleIcon,
  Category as CategoryIcon,
  Receipt as ExpenseIcon,
  TrendingUp as TrendingUpIcon,
  AccountBalance as AccountBalanceIcon,
  Business as BusinessIcon,
  Calculate as CalculateIcon,
  Assessment as AssessmentIcon,
  MonetizationOn as IncomeIcon,
  PendingActions as PendingIcon,
  Warning as OverdueIcon,
  Inventory2 as KundaIcon,
  AccountBalanceWallet as PaymentStatusIcon,
  LocalAtm as OperationalExpenseIcon,
} from '@mui/icons-material';
import { fetchExpenseSummary } from '../store/slices/expenseSlice';
import { fetchCategories } from '../store/slices/categorySlice';
import { fetchCattle } from '../store/slices/cattleSlice';
import { fetchCurrentMonthStatus as fetchKundaStatus } from '../store/slices/kundaRentalSlice';
import { fetchCurrentMonthStatus as fetchCustodyStatus } from '../store/slices/custodyIncomeSlice';
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

const Dashboard = () => {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const { cattle, loading: cattleLoading } = useSelector((state) => state.cattle);
  const { categories, loading: categoryLoading } = useSelector((state) => state.category);
  const { summary, loading: expenseLoading } = useSelector((state) => state.expense);
  const { currentMonthStatus: kundaStatus, loading: kundaLoading } = useSelector((state) => state.kundaRental || {});
  const { currentMonthStatus: custodyStatus, loading: custodyLoading } = useSelector((state) => state.custodyIncome || {});

  useEffect(() => {
    const fetchData = async () => {
      try {
        await Promise.all([
          dispatch(fetchCattle()),
          dispatch(fetchCategories()),
          dispatch(fetchExpenseSummary()),
          dispatch(fetchKundaStatus()),
          dispatch(fetchCustodyStatus()),
        ]);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      }
    };
    fetchData();
  }, [dispatch]);

  useEffect(() => {
    console.log('Dashboard state:', {
      cattle,
      categories,
      summary,
      loading: { cattleLoading, categoryLoading, expenseLoading, kundaLoading, custodyLoading }
    });
  }, [cattle, categories, summary, cattleLoading, categoryLoading, expenseLoading, kundaLoading, custodyLoading]);

  const loading = cattleLoading || categoryLoading || expenseLoading || kundaLoading || custodyLoading;

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!summary) {
    return (
      <Container maxWidth={false}>
        <Box sx={{ pt: 3 }}>
          <Alert severity="error">
            Failed to load dashboard data. Please try refreshing the page.
          </Alert>
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth={false}>
      <Box sx={{ pt: 3 }}>
        <Typography variant="h4" gutterBottom>
          Expenses Overview
        </Typography>
        <Grid container spacing={3}>
          <Grid item lg={4} sm={6} xl={4} xs={12}>
            <SummaryCard
              title="TOTAL EXPENSES"
              value={formatCurrency(summary.totalExpenses || 0)}
              icon={<ExpenseIcon />}
              color="error.main"
              loading={loading}
            />
          </Grid>
          <Grid item lg={4} sm={6} xl={4} xs={12}>
            <SummaryCard
              title="TOTAL OPERATIONAL EXPENSES"
              value={formatCurrency(summary.totalOperationalExpenses || 0)}
              icon={<OperationalExpenseIcon />}
              color="warning.main"
              loading={loading}
            />
          </Grid>
          <Grid item lg={4} sm={6} xl={4} xs={12}>
            <SummaryCard
              title="FARM SETUP EXPENSES"
              value={formatCurrency(summary.totalFarmSetupExpenses || 0)}
              icon={<BusinessIcon />}
              color="info.main"
              loading={loading}
            />
          </Grid>
          <Grid item lg={6} sm={6} xl={6} xs={12}>
            <SummaryCard
              title="AVG EXPENSE PER CATTLE"
              value={formatCurrency(summary.averagePerCattle || 0)}
              icon={<CalculateIcon />}
              color="secondary.main"
              loading={loading}
            />
          </Grid>
          <Grid item lg={6} sm={6} xl={6} xs={12}>
            <SummaryCard
              title="MONTHLY AVG PER CATTLE"
              value={formatCurrency(summary.averagePerCattleMonthly || 0)}
              icon={<AssessmentIcon />}
              color="primary.dark"
              loading={loading}
            />
          </Grid>
        </Grid>

        <Typography variant="h4" sx={{ mt: 4, mb: 2 }}>
          Cattle Overview
        </Typography>
        <Grid container spacing={3}>
          <Grid item xs={12} sm={6} md={4}>
            <SummaryCard
              title="OWNED CATTLE"
              value={cattle?.filter(c => c.custodyType === 'Owned')?.length || 0}
              icon={<CattleIcon />}
              loading={loading}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={4}>
            <SummaryCard
              title="CUSTODY CATTLE"
              value={cattle?.filter(c => c.custodyType === 'Custody')?.length || 0}
              icon={<CattleIcon />}
              loading={loading}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={4}>
            <SummaryCard
              title="TOTAL CATTLE COST"
              value={formatCurrency(
                cattle
                  ?.filter(c => c.custodyType === 'Owned')
                  ?.reduce((sum, c) => sum + (c.purchasePrice + (c.transportationCost || 0)), 0) || 0
              )}
              icon={<AccountBalanceIcon />}
              color="secondary.main"
              loading={loading}
            />
          </Grid>
        </Grid>

        <Typography variant="h4" sx={{ mt: 4, mb: 2 }}>
          Kunda Income
        </Typography>
        <Grid container spacing={3}>
          <Grid item xs={12} sm={6} md={4}>
            <SummaryCard
              title="KUNDA RENTED"
              value={kundaStatus?.totalKundasRented || 0}
              icon={<KundaIcon />}
              loading={loading}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={8}>
            <Card sx={{ height: '100%', opacity: loading ? 0.5 : 1 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Current Month Payment Status
                </Typography>
                {kundaStatus ? (
                  <List>
                    <ListItem>
                      <ListItemText
                        primary={
                          <Typography variant="body1" sx={{ color: 'success.main', fontWeight: 'bold' }}>
                            Paid: {formatCurrency(kundaStatus.paid || 0)}
                          </Typography>
                        }
                      />
                    </ListItem>
                    <Divider />
                    <ListItem>
                      <ListItemText
                        primary={
                          <Typography variant="body1" sx={{ color: 'warning.main', fontWeight: 'bold' }}>
                            Pending: {formatCurrency(kundaStatus.pending || 0)}
                          </Typography>
                        }
                      />
                    </ListItem>
                    <Divider />
                    <ListItem>
                      <ListItemText
                        primary={
                          <Typography variant="body1" sx={{ color: 'error.main', fontWeight: 'bold' }}>
                            Overdue: {formatCurrency(kundaStatus.overdue || 0)}
                          </Typography>
                        }
                      />
                    </ListItem>
                  </List>
                ) : (
                  <Alert severity="info">No payment data available for the current month.</Alert>
                )}
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        <Typography variant="h4" sx={{ mt: 4, mb: 2 }}>
          Custody Income
        </Typography>
        <Grid container spacing={3}>
          <Grid item lg={4} sm={6} xl={4} xs={12}>
            <SummaryCard
              title="CATTLE IN CUSTODY"
              value={cattle?.filter(c => c.custodyType === 'Custody')?.length || 0}
              icon={<CattleIcon />}
              color="primary.main"
              loading={loading}
            />
          </Grid>
          <Grid item lg={4} sm={6} xl={4} xs={12}>
            <SummaryCard
              title="EXPECTED MONTHLY INCOME"
              value={formatCurrency(
                cattle
                  ?.filter(c => c.custodyType === 'Custody')
                  ?.reduce((sum, c) => sum + (c.custodyDetails?.monthlyFee || 0), 0) || 0
              )}
              icon={<IncomeIcon />}
              color="success.main"
              loading={loading}
            />
          </Grid>
          <Grid item lg={4} sm={6} xl={4} xs={12}>
            <SummaryCard
              title="THIS MONTH'S INCOME"
              value={formatCurrency(custodyStatus?.paid || 0)}
              icon={<IncomeIcon />}
              color="success.dark"
              loading={loading}
            />
          </Grid>
        </Grid>

        <Grid container spacing={3} sx={{ mt: 1 }}>
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Current Month Payment Status
              </Typography>
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle1" color="success.main" sx={{ display: 'flex', alignItems: 'center' }}>
                  <IncomeIcon sx={{ mr: 1 }} />
                  Paid: {formatCurrency(custodyStatus?.paid || 0)}
                </Typography>
                <LinearProgress
                  variant="determinate"
                  value={(custodyStatus?.paid || 0) / (custodyStatus?.totalAmount || 1) * 100}
                  color="success"
                  sx={{ mt: 1, mb: 2 }}
                />
                
                <Typography variant="subtitle1" color="warning.main" sx={{ display: 'flex', alignItems: 'center' }}>
                  <PendingIcon sx={{ mr: 1 }} />
                  Pending: {formatCurrency(custodyStatus?.pending || 0)}
                </Typography>
                <LinearProgress
                  variant="determinate"
                  value={(custodyStatus?.pending || 0) / (custodyStatus?.totalAmount || 1) * 100}
                  color="warning"
                  sx={{ mt: 1, mb: 2 }}
                />
                
                <Typography variant="subtitle1" color="error.main" sx={{ display: 'flex', alignItems: 'center' }}>
                  <OverdueIcon sx={{ mr: 1 }} />
                  Overdue: {formatCurrency(custodyStatus?.overdue || 0)}
                </Typography>
                <LinearProgress
                  variant="determinate"
                  value={(custodyStatus?.overdue || 0) / (custodyStatus?.totalAmount || 1) * 100}
                  color="error"
                  sx={{ mt: 1 }}
                />
              </Box>
            </Paper>
          </Grid>
          
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Monthly Income Trend
              </Typography>
              {custodyStatus?.monthlyTrend?.length > 0 ? (
                <List>
                  {custodyStatus.monthlyTrend.map((month, index) => (
                    <React.Fragment key={`${month._id.year}-${month._id.month}`}>
                      <ListItem>
                        <ListItemText
                          primary={`${new Date(month._id.year, month._id.month - 1).toLocaleString('default', { month: 'long' })} ${month._id.year}`}
                          secondary={formatCurrency(month.totalIncome)}
                        />
                      </ListItem>
                      {index < custodyStatus.monthlyTrend.length - 1 && <Divider />}
                    </React.Fragment>
                  ))}
                </List>
              ) : (
                <Alert severity="info">No income trend data available.</Alert>
              )}
            </Paper>
          </Grid>
        </Grid>

        <Grid container spacing={3} sx={{ mt: 2 }}>
          <Grid item xs={12}>
            <Paper sx={{ p: 3, mt: 3 }}>
              <Typography variant="h6" gutterBottom>
                Custody Overview
              </Typography>
              {console.log('Cattle data:', cattle)}
              {console.log('Filtered custody cattle:', cattle?.filter(c => c.custodyType === 'Custody'))}
              {cattle && cattle.filter(c => c.custodyType === 'Custody').length > 0 ? (
                <List>
                  {cattle
                    .filter(c => c.custodyType === 'Custody')
                    .map((custodyCattle, index) => (
                      <React.Fragment key={custodyCattle._id}>
                        <ListItem>
                          <ListItemText
                            primary={`${custodyCattle.tag} - ${custodyCattle.breed}`}
                            secondary={
                              <>
                                <Typography component="span" variant="body2" color="text.primary">
                                  {`Owner: ${custodyCattle.custodyDetails.ownerName}`}
                                </Typography>
                                <br />
                                {`Monthly Fee: ${formatCurrency(custodyCattle.custodyDetails.monthlyFee)}`}
                                <br />
                                {`Since: ${new Date(custodyCattle.custodyDetails.startDate).toLocaleDateString()}`}
                              </>
                            }
                          />
                        </ListItem>
                        {index < cattle.filter(c => c.custodyType === 'Custody').length - 1 && <Divider />}
                      </React.Fragment>
                    ))}
                </List>
              ) : (
                <Alert severity="info">No cattle in custody.</Alert>
              )}
            </Paper>
          </Grid>
        </Grid>
      </Box>
    </Container>
  );
};

export default Dashboard; 