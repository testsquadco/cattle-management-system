import React from 'react';
import { useLocation, Link as RouterLink } from 'react-router-dom';
import {
    Breadcrumbs,
    Link,
    Typography,
    Box,
    Paper
} from '@mui/material';
import {
    Home as HomeIcon,
    Feed as FeedIcon,
    List as ListIcon,
    Assessment as AssessmentIcon,
    ViewList as ViewListIcon,
    Timeline as TimelineIcon
} from '@mui/icons-material';

const FeedNavigation = () => {
    const location = useLocation();
    const pathnames = location.pathname.split('/').filter((x) => x);

    const getPageTitle = (path) => {
        switch (path) {
            case 'items':
                return 'Feed Items';
            case 'logs':
                return 'Daily Logs';
            case 'summary':
                return 'Monthly Summary';
            case 'templates':
                return 'Feed Templates';
            case 'analytics':
                return 'Analytics';
            default:
                return 'Feed Management';
        }
    };

    const getPageIcon = (path) => {
        switch (path) {
            case 'items':
                return <FeedIcon />;
            case 'logs':
                return <ListIcon />;
            case 'summary':
                return <AssessmentIcon />;
            case 'templates':
                return <ViewListIcon />;
            case 'analytics':
                return <TimelineIcon />;
            default:
                return <FeedIcon />;
        }
    };

    return (
        <Paper sx={{ p: 2, mb: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <FeedIcon sx={{ mr: 1 }} />
                <Typography variant="h6">Feed Management</Typography>
            </Box>
            <Breadcrumbs aria-label="breadcrumb">
                <Link
                    component={RouterLink}
                    to="/"
                    color="inherit"
                    sx={{ display: 'flex', alignItems: 'center' }}
                >
                    <HomeIcon sx={{ mr: 0.5 }} fontSize="inherit" />
                    Home
                </Link>
                {pathnames.map((value, index) => {
                    const last = index === pathnames.length - 1;
                    const to = `/${pathnames.slice(0, index + 1).join('/')}`;

                    return last ? (
                        <Typography
                            color="text.primary"
                            key={to}
                            sx={{ display: 'flex', alignItems: 'center' }}
                        >
                            {getPageIcon(value)}
                            <Box component="span" sx={{ ml: 0.5 }}>
                                {getPageTitle(value)}
                            </Box>
                        </Typography>
                    ) : (
                        <Link
                            component={RouterLink}
                            color="inherit"
                            to={to}
                            key={to}
                            sx={{ display: 'flex', alignItems: 'center' }}
                        >
                            {getPageIcon(value)}
                            <Box component="span" sx={{ ml: 0.5 }}>
                                {getPageTitle(value)}
                            </Box>
                        </Link>
                    );
                })}
            </Breadcrumbs>
        </Paper>
    );
};

export default FeedNavigation; 