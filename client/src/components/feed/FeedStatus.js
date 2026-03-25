import React from 'react';
import {
    Box,
    CircularProgress,
    Typography,
    Paper,
    Alert,
    AlertTitle
} from '@mui/material';
import {
    Error as ErrorIcon,
    Warning as WarningIcon,
    Info as InfoIcon
} from '@mui/icons-material';

const FeedStatus = ({ loading, error, empty, emptyMessage = 'No data found for the selected filters.' }) => {
    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                <CircularProgress />
            </Box>
        );
    }

    if (error) {
        return (
            <Alert severity="error" sx={{ mb: 2 }}>
                <AlertTitle>Error</AlertTitle>
                {error}
            </Alert>
        );
    }

    if (empty) {
        return (
            <Paper sx={{ p: 3, textAlign: 'center', bgcolor: 'background.default' }}>
                <InfoIcon color="info" sx={{ fontSize: 48, mb: 2 }} />
                <Typography variant="h6" color="text.secondary" gutterBottom>
                    No Data Available
                </Typography>
                <Typography color="text.secondary">
                    {emptyMessage}
                </Typography>
            </Paper>
        );
    }

    return null;
};

export default FeedStatus; 