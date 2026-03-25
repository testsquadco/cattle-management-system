import React, { useEffect } from 'react';
import { Box, Tabs, Tab, Typography } from '@mui/material';
import { useNavigate, useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { fetchFeedItems, fetchDailyLogs, fetchMonthlySummary, fetchTemplates, fetchAnalytics } from '../../store/slices/feedSlice';
import FeedNavigation from '../../components/navigation/FeedNavigation';
import FeedStatus from '../../components/feed/FeedStatus';

const FeedManagement = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const dispatch = useDispatch();
    const { items, logs, monthlySummary, templates, analytics } = useSelector((state) => state.feed);

    useEffect(() => {
        // Fetch initial data
        dispatch(fetchFeedItems());
        dispatch(fetchDailyLogs({}));
        dispatch(fetchMonthlySummary({
            year: new Date().getFullYear(),
            month: new Date().getMonth() + 1
        }));
        dispatch(fetchTemplates());
        dispatch(fetchAnalytics({
            startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            endDate: new Date().toISOString().split('T')[0]
        }));
    }, [dispatch]);

    const handleTabChange = (event, newValue) => {
        navigate(newValue);
    };

    const getCurrentTab = () => {
        const path = location.pathname;
        if (path.includes('/items')) return '/feed/items';
        if (path.includes('/logs')) return '/feed/logs';
        if (path.includes('/summary')) return '/feed/summary';
        if (path.includes('/templates')) return '/feed/templates';
        if (path.includes('/analytics')) return '/feed/analytics';
        return '/feed/items';
    };

    return (
        <Box sx={{ width: '100%' }}>
            <FeedNavigation />
            
            <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
                <Tabs
                    value={getCurrentTab()}
                    onChange={handleTabChange}
                    aria-label="feed management tabs"
                    variant="scrollable"
                    scrollButtons="auto"
                >
                    <Tab
                        label="Feed Items"
                        value="/feed/items"
                    />
                    <Tab
                        label="Daily Logs"
                        value="/feed/logs"
                    />
                    <Tab
                        label="Monthly Summary"
                        value="/feed/summary"
                    />
                    <Tab
                        label="Feed Templates"
                        value="/feed/templates"
                    />
                    <Tab
                        label="Analytics"
                        value="/feed/analytics"
                    />
                </Tabs>
            </Box>

            {/* Show loading/error states for the current section */}
            {location.pathname.includes('/items') && (
                <FeedStatus
                    loading={items.loading}
                    error={items.error}
                    empty={items.data.length === 0}
                    emptyMessage="No feed items found. Add your first feed item to get started."
                />
            )}
            {location.pathname.includes('/logs') && (
                <FeedStatus
                    loading={logs.loading}
                    error={logs.error}
                    empty={logs.data.length === 0}
                    emptyMessage="No feed logs found for the selected period."
                />
            )}
            {location.pathname.includes('/summary') && (
                <FeedStatus
                    loading={monthlySummary.loading}
                    error={monthlySummary.error}
                    empty={monthlySummary.data.length === 0}
                    emptyMessage="No summary data available for the selected month."
                />
            )}
            {location.pathname.includes('/templates') && (
                <FeedStatus
                    loading={templates.loading}
                    error={templates.error}
                    empty={templates.data.length === 0}
                    emptyMessage="No feed templates found. Create your first template to get started."
                />
            )}
            {location.pathname.includes('/analytics') && (
                <FeedStatus
                    loading={analytics.loading}
                    error={analytics.error}
                    empty={analytics.data.usageData.length === 0}
                    emptyMessage="No analytics data available for the selected period."
                />
            )}
        </Box>
    );
};

export default FeedManagement; 