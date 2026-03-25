import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Container, Paper, Typography, CircularProgress, Box } from '@mui/material';
import WeightTracker from './WeightTracker';
import api from '../../utils/api';

const CattleWeightPage = () => {
    const { id } = useParams();
    const [cattle, setCattle] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchCattle = async () => {
            try {
                const response = await api.get(`/api/cattle/${id}`);
                setCattle(response.data);
                setLoading(false);
            } catch (error) {
                console.error('Error fetching cattle:', error);
                setError('Error loading cattle information');
                setLoading(false);
            }
        };

        fetchCattle();
    }, [id]);

    if (loading) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
                <CircularProgress />
            </Box>
        );
    }

    if (error) {
        return (
            <Container>
                <Typography color="error" variant="h6" align="center">
                    {error}
                </Typography>
            </Container>
        );
    }

    if (!cattle) {
        return (
            <Container>
                <Typography variant="h6" align="center">
                    Cattle not found
                </Typography>
            </Container>
        );
    }

    return (
        <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
            <Paper sx={{ p: 3 }}>
                <Typography variant="h5" gutterBottom>
                    Weight Tracking - {cattle.tag} ({cattle.breed})
                </Typography>
                <WeightTracker cattleId={cattle._id} cattleTag={cattle.tag} />
            </Paper>
        </Container>
    );
};

export default CattleWeightPage; 