import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  Box,
  Button,
  Typography,
  CircularProgress,
  Alert,
  Paper,
  Grid,
  Card,
  CardContent,
  Divider,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tabs,
  Tab,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  IconButton,
  Tooltip,
  TextField,
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import {
  FilterList as FilterIcon,
  Clear as ClearIcon,
  FileDownload as ExportIcon,
  PictureAsPdf as PdfIcon,
  TableChart as ExcelIcon,
} from '@mui/icons-material';
import {
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar,
} from 'recharts';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import {
  fetchExpenses,
  fetchExpenseSummary,
} from '../../store/slices/expenseSlice';
import { fetchCategories } from '../../store/slices/categorySlice';
import { fetchCattle } from '../../store/slices/cattleSlice';
import api from '../../utils/api';

// Summary card component for displaying key metrics
const SummaryCard = ({ title, value, subtitle }) => (
  <Card sx={{ height: '100%' }}>
    <CardContent>
      <Typography color="textSecondary" gutterBottom>
        {title}
      </Typography>
      <Typography variant="h4" component="div">
        {value}
      </Typography>
      {subtitle && (
        <Typography variant="body2" color="textSecondary">
          {subtitle}
        </Typography>
      )}
    </CardContent>
  </Card>
);

const Reports = () => {
  const dispatch = useDispatch();
  const { expenses, summary, loading, error } = useSelector((state) => state.expense);
  const { categories } = useSelector((state) => state.category);
  const { cattle } = useSelector((state) => state.cattle);
  
  const [filters, setFilters] = useState({
    startDate: null,
    endDate: null,
    category: '',
    cattle: '',
  });
  const [filterOpen, setFilterOpen] = useState(false);
  const [activeTab, setActiveTab] = useState(0);
  const [selectedCattle, setSelectedCattle] = useState('');
  const [weightData, setWeightData] = useState([]);
  const [weightLoading, setWeightLoading] = useState(false);
  const [weightError, setWeightError] = useState(null);

  useEffect(() => {
    dispatch(fetchExpenses());
    dispatch(fetchExpenseSummary());
    dispatch(fetchCategories());
    dispatch(fetchCattle());
  }, [dispatch]);

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleDateFilterChange = (name, date) => {
    setFilters((prev) => ({
      ...prev,
      [name]: date,
    }));
  };

  const applyFilters = () => {
    dispatch(fetchExpenses(filters));
    dispatch(fetchExpenseSummary(filters));
    setFilterOpen(false);
  };

  const clearFilters = () => {
    setFilters({
      startDate: null,
      endDate: null,
      category: '',
      cattle: '',
    });
    dispatch(fetchExpenses());
    dispatch(fetchExpenseSummary());
  };

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  const filteredExpenses = expenses?.filter((expense) => {
    if (filters.category && expense.category._id !== filters.category) return false;
    if (filters.cattle && expense.cattle._id !== filters.cattle) return false;
    
    const expenseDate = new Date(expense.date);
    if (filters.startDate && expenseDate < filters.startDate) return false;
    if (filters.endDate && expenseDate > filters.endDate) return false;
    
    return true;
  });

  // Prepare data for charts based on active tab
  const prepareChartData = () => {
    if (!filteredExpenses || filteredExpenses.length === 0) return [];

    switch (activeTab) {
      case 0: // Category Distribution
        const categoryData = {};
        filteredExpenses.forEach((expense) => {
          const categoryName = expense.category.name;
          if (!categoryData[categoryName]) {
            categoryData[categoryName] = 0;
          }
          categoryData[categoryName] += expense.amount;
        });
        return Object.entries(categoryData).map(([name, value]) => ({
          name,
          value,
        }));
      
      case 1: // Monthly Trend
        const monthlyData = {};
        filteredExpenses.forEach((expense) => {
          const date = new Date(expense.date);
          const monthYear = `${date.getMonth() + 1}/${date.getFullYear()}`;
          if (!monthlyData[monthYear]) {
            monthlyData[monthYear] = 0;
          }
          monthlyData[monthYear] += expense.amount;
        });
        return Object.entries(monthlyData)
          .map(([name, value]) => ({
            name,
            value,
          }))
          .sort((a, b) => {
            const [aMonth, aYear] = a.name.split('/');
            const [bMonth, bYear] = b.name.split('/');
            return new Date(aYear, aMonth - 1) - new Date(bYear, bMonth - 1);
          });
      
      case 2: // Cattle Distribution
        const cattleData = {};
        filteredExpenses.forEach((expense) => {
          const cattleIdentifier = expense.cattle ? `${expense.cattle.tag} - ${expense.cattle.breed}` : '-';
          if (!cattleData[cattleIdentifier]) {
            cattleData[cattleIdentifier] = 0;
          }
          cattleData[cattleIdentifier] += expense.amount;
        });
        return Object.entries(cattleData).map(([name, value]) => ({
          name,
          value,
        }));
      
      default:
        return [];
    }
  };

  // Generate random colors for charts
  const COLORS = [
    '#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', 
    '#82CA9D', '#FFC658', '#FF7C43', '#A4DE6C', '#D0ED57'
  ];

  // Export to Excel
  const exportToExcel = () => {
    const data = filteredExpenses.map(expense => ({
      Date: new Date(expense.date).toLocaleDateString(),
      Category: expense.category.name,
      Subcategory: expense.subcategory?.name || '-',
      Cattle: `${expense.cattle.tag} - ${expense.cattle.breed}`,
      Amount: expense.amount,
      Description: expense.description || '-'
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Expenses');
    XLSX.writeFile(wb, 'cattle_expenses.xlsx');
  };

  // Export to PDF
  const exportToPdf = () => {
    const doc = new jsPDF();
    
    // Add title
    doc.setFontSize(16);
    doc.text('Cattle Expense Report', 14, 15);
    
    // Add date range if filters are applied
    if (filters.startDate || filters.endDate) {
      doc.setFontSize(10);
      const dateRange = `Date Range: ${filters.startDate ? new Date(filters.startDate).toLocaleDateString() : 'All'} - ${filters.endDate ? new Date(filters.endDate).toLocaleDateString() : 'All'}`;
      doc.text(dateRange, 14, 22);
    }
    
    // Add summary
    doc.setFontSize(12);
    doc.text('Summary', 14, 30);
    doc.setFontSize(10);
    doc.text(`Total Expenses: PKR ${summary?.totalExpenses?.toLocaleString() || 0}`, 14, 37);
    doc.text(`Average Expense: PKR ${summary?.averageExpense?.toLocaleString() || 0}`, 14, 44);
    doc.text(`Number of Expenses: ${summary?.expenseCount || 0}`, 14, 51);
    
    // Add table
    const tableColumn = ['Date', 'Category', 'Cattle', 'Amount'];
    const tableRows = filteredExpenses.map(expense => [
      new Date(expense.date).toLocaleDateString(),
      expense.category.name,
      `${expense.cattle.tag} - ${expense.cattle.breed}`,
      `PKR ${expense.amount.toLocaleString()}`
    ]);
    
    doc.autoTable({
      head: [tableColumn],
      body: tableRows,
      startY: 60,
      theme: 'grid',
      headStyles: { fillColor: [66, 139, 202] },
    });
    
    doc.save('cattle_expenses.pdf');
  };

  // Add new function to fetch weight data
  const fetchWeightData = async (cattleId) => {
    if (!cattleId) {
      setWeightData([]);
      return;
    }
    
    setWeightLoading(true);
    setWeightError(null);
    try {
      const response = await api.get(`/api/weights/cattle/${cattleId}`);
      const sortedWeights = response.data
        .sort((a, b) => new Date(a.date) - new Date(b.date))
        .map(weight => ({
          date: new Date(weight.date).toLocaleDateString(),
          weight: weight.weight,
          change: weight.weightChange || 0
        }));
      setWeightData(sortedWeights);
    } catch (error) {
      setWeightError('Error fetching weight data');
      console.error('Error fetching weight data:', error);
    } finally {
      setWeightLoading(false);
    }
  };

  const handleCattleChange = (event) => {
    const cattleId = event.target.value;
    setSelectedCattle(cattleId);
    fetchWeightData(cattleId);
  };

  const chartData = prepareChartData();
  const totalExpenses = summary?.totalExpenses || 0;
  const averageExpense = summary?.averageExpense || 0;
  const expenseCount = summary?.expenseCount || 0;
  const cattleCount = summary?.cattleCount || 0;

  return (
    <Box sx={{ height: '100%', width: '100%', p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h4" component="h1">
          Reports & Analytics
        </Typography>
        <Box>
          <Button
            variant="outlined"
            startIcon={<FilterIcon />}
            onClick={() => setFilterOpen(true)}
            sx={{ mr: 1 }}
          >
            Filters
          </Button>
          <Button
            variant="outlined"
            startIcon={<ExcelIcon />}
            onClick={exportToExcel}
            sx={{ mr: 1 }}
          >
            Export Excel
          </Button>
          <Button
            variant="outlined"
            startIcon={<PdfIcon />}
            onClick={exportToPdf}
          >
            Export PDF
          </Button>
        </Box>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
          <CircularProgress />
        </Box>
      ) : (
        <>
          {/* Summary Cards */}
          <Grid container spacing={3} sx={{ mb: 3 }}>
            <Grid item xs={12} sm={6} md={3}>
              <SummaryCard
                title="Total Expenses"
                value={`PKR ${totalExpenses.toLocaleString()}`}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <SummaryCard
                title="Average Expense"
                value={`PKR ${averageExpense.toLocaleString()}`}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <SummaryCard
                title="Number of Expenses"
                value={expenseCount}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <SummaryCard
                title="Cattle Count"
                value={cattleCount}
              />
            </Grid>
          </Grid>

          {/* Charts */}
          <Paper sx={{ p: 3, mb: 3 }}>
            <Tabs
              value={activeTab}
              onChange={handleTabChange}
              indicatorColor="primary"
              textColor="primary"
              variant="fullWidth"
              sx={{ mb: 2 }}
            >
              <Tab label="Category Distribution" />
              <Tab label="Monthly Trend" />
              <Tab label="Cattle Distribution" />
            </Tabs>

            <Box sx={{ height: 400 }}>
              {chartData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  {activeTab === 0 ? (
                    <PieChart>
                      <Pie
                        data={chartData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                        outerRadius={150}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {chartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <RechartsTooltip formatter={(value) => `PKR ${value.toLocaleString()}`} />
                      <Legend />
                    </PieChart>
                  ) : activeTab === 1 ? (
                    <LineChart
                      data={chartData}
                      margin={{
                        top: 5,
                        right: 30,
                        left: 20,
                        bottom: 5,
                      }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <RechartsTooltip formatter={(value) => `PKR ${value.toLocaleString()}`} />
                      <Legend />
                      <Line
                        type="monotone"
                        dataKey="value"
                        stroke="#8884d8"
                        activeDot={{ r: 8 }}
                      />
                    </LineChart>
                  ) : (
                    <BarChart
                      data={chartData}
                      margin={{
                        top: 5,
                        right: 30,
                        left: 20,
                        bottom: 5,
                      }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <RechartsTooltip formatter={(value) => `PKR ${value.toLocaleString()}`} />
                      <Legend />
                      <Bar dataKey="value" fill="#8884d8" />
                    </BarChart>
                  )}
                </ResponsiveContainer>
              ) : (
                <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                  <Typography variant="body1" color="textSecondary">
                    No data available for the selected filters
                  </Typography>
                </Box>
              )}
            </Box>
          </Paper>

          {/* Weight Trend Section */}
          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              Cattle Weight Trend
            </Typography>
            <Divider sx={{ mb: 2 }} />
            
            <FormControl fullWidth sx={{ mb: 3 }}>
              <InputLabel>Select Cattle</InputLabel>
              <Select
                value={selectedCattle}
                onChange={handleCattleChange}
                label="Select Cattle"
              >
                <MenuItem value="">
                  <em>Select a cattle</em>
                </MenuItem>
                {cattle?.map((cow) => (
                  <MenuItem key={cow._id} value={cow._id}>
                    {`${cow.tag} - ${cow.name || cow.breed}`}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <Box sx={{ height: 400 }}>
              {weightLoading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                  <CircularProgress />
                </Box>
              ) : weightError ? (
                <Alert severity="error" sx={{ mb: 2 }}>
                  {weightError}
                </Alert>
              ) : weightData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={weightData}
                    margin={{
                      top: 5,
                      right: 30,
                      left: 20,
                      bottom: 5,
                    }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <RechartsTooltip 
                      formatter={(value, name) => {
                        if (name === 'weight') return `${value} kg`;
                        return `${value >= 0 ? '+' : ''}${value} kg`;
                      }}
                    />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="weight"
                      name="Weight"
                      stroke="#8884d8"
                      activeDot={{ r: 8 }}
                    />
                    <Line
                      type="monotone"
                      dataKey="change"
                      name="Weight Change"
                      stroke="#82ca9d"
                      strokeDasharray="3 3"
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                  <Typography variant="body1" color="textSecondary">
                    {selectedCattle ? 'No weight data available' : 'Select a cattle to view weight trend'}
                  </Typography>
                </Box>
              )}
            </Box>
          </Paper>

          {/* Filter Dialog */}
          <Dialog open={filterOpen} onClose={() => setFilterOpen(false)} maxWidth="sm" fullWidth>
            <DialogTitle>Filter Reports</DialogTitle>
            <DialogContent>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
                <LocalizationProvider dateAdapter={AdapterDateFns}>
                  <DatePicker
                    label="Start Date"
                    value={filters.startDate}
                    onChange={(date) => handleDateFilterChange('startDate', date)}
                    renderInput={(params) => <TextField {...params} fullWidth />}
                  />
                  <DatePicker
                    label="End Date"
                    value={filters.endDate}
                    onChange={(date) => handleDateFilterChange('endDate', date)}
                    renderInput={(params) => <TextField {...params} fullWidth />}
                  />
                </LocalizationProvider>

                <FormControl fullWidth>
                  <InputLabel>Category</InputLabel>
                  <Select
                    name="category"
                    value={filters.category}
                    onChange={handleFilterChange}
                    label="Category"
                  >
                    <MenuItem value="">All Categories</MenuItem>
                    {categories?.map((category) => (
                      <MenuItem key={category._id} value={category._id}>
                        {category.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                <FormControl fullWidth>
                  <InputLabel>Cattle</InputLabel>
                  <Select
                    name="cattle"
                    value={filters.cattle}
                    onChange={handleFilterChange}
                    label="Cattle"
                  >
                    <MenuItem value="">All Cattle</MenuItem>
                    {cattle?.map((cow) => (
                      <MenuItem key={cow._id} value={cow._id}>
                        {`${cow.tag} - ${cow.breed}`}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Box>
            </DialogContent>
            <DialogActions>
              <Button startIcon={<ClearIcon />} onClick={clearFilters}>
                Clear Filters
              </Button>
              <Button onClick={() => setFilterOpen(false)}>Cancel</Button>
              <Button onClick={applyFilters} variant="contained">
                Apply Filters
              </Button>
            </DialogActions>
          </Dialog>
        </>
      )}
    </Box>
  );
};

export default Reports; 