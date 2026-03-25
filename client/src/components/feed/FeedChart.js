import React from 'react';
import {
    Paper,
    Typography,
    Box,
    useTheme,
    useMediaQuery
} from '@mui/material';
import {
    LineChart,
    Line,
    BarChart,
    Bar,
    PieChart,
    Pie,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
    Cell
} from 'recharts';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

const CustomTooltip = ({ active, payload, label, valuePrefix = '', valueSuffix = '' }) => {
    if (active && payload && payload.length) {
        return (
            <Paper sx={{ p: 1.5, border: '1px solid #ccc' }}>
                <Typography variant="subtitle2">{label}</Typography>
                {payload.map((entry, index) => (
                    <Typography
                        key={index}
                        variant="body2"
                        sx={{ color: entry.color }}
                    >
                        {entry.name}: {valuePrefix}{entry.value}{valueSuffix}
                    </Typography>
                ))}
            </Paper>
        );
    }
    return null;
};

const FeedChart = ({
    type = 'line',
    title,
    data,
    dataKey,
    name,
    height = 300,
    valuePrefix = '',
    valueSuffix = '',
    showGrid = true,
    showLegend = true,
    pieDataKey,
    pieNameKey
}) => {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

    const renderChart = () => {
        switch (type) {
            case 'line':
                return (
                    <LineChart data={data}>
                        {showGrid && <CartesianGrid strokeDasharray="3 3" />}
                        <XAxis
                            dataKey="date"
                            tick={{ fontSize: isMobile ? 10 : 12 }}
                        />
                        <YAxis
                            tick={{ fontSize: isMobile ? 10 : 12 }}
                            tickFormatter={(value) => `${valuePrefix}${value}${valueSuffix}`}
                        />
                        <Tooltip
                            content={
                                <CustomTooltip
                                    valuePrefix={valuePrefix}
                                    valueSuffix={valueSuffix}
                                />
                            }
                        />
                        {showLegend && <Legend />}
                        <Line
                            type="monotone"
                            dataKey={dataKey}
                            name={name}
                            stroke={theme.palette.primary.main}
                            strokeWidth={2}
                            dot={{ r: 4 }}
                            activeDot={{ r: 6 }}
                        />
                    </LineChart>
                );
            case 'bar':
                return (
                    <BarChart data={data}>
                        {showGrid && <CartesianGrid strokeDasharray="3 3" />}
                        <XAxis
                            dataKey="date"
                            tick={{ fontSize: isMobile ? 10 : 12 }}
                        />
                        <YAxis
                            tick={{ fontSize: isMobile ? 10 : 12 }}
                            tickFormatter={(value) => `${valuePrefix}${value}${valueSuffix}`}
                        />
                        <Tooltip
                            content={
                                <CustomTooltip
                                    valuePrefix={valuePrefix}
                                    valueSuffix={valueSuffix}
                                />
                            }
                        />
                        {showLegend && <Legend />}
                        <Bar
                            dataKey={dataKey}
                            name={name}
                            fill={theme.palette.primary.main}
                        />
                    </BarChart>
                );
            case 'pie':
                return (
                    <PieChart>
                        <Pie
                            data={data}
                            dataKey={pieDataKey}
                            nameKey={pieNameKey}
                            cx="50%"
                            cy="50%"
                            outerRadius={isMobile ? 60 : 80}
                            label
                        >
                            {data.map((entry, index) => (
                                <Cell
                                    key={`cell-${index}`}
                                    fill={COLORS[index % COLORS.length]}
                                />
                            ))}
                        </Pie>
                        <Tooltip
                            content={
                                <CustomTooltip
                                    valuePrefix={valuePrefix}
                                    valueSuffix={valueSuffix}
                                />
                            }
                        />
                        {showLegend && <Legend />}
                    </PieChart>
                );
            default:
                return null;
        }
    };

    return (
        <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
                {title}
            </Typography>
            <Box sx={{ width: '100%', height }}>
                <ResponsiveContainer>
                    {renderChart()}
                </ResponsiveContainer>
            </Box>
        </Paper>
    );
};

export default FeedChart; 