import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { FormControl, InputLabel, Select, MenuItem, Box } from '@mui/material';
import { setSelectedSeason } from '../store/slices/seasonSlice';

const SeasonFilter = ({ onChange, sx }) => {
  const dispatch = useDispatch();
  const { seasons, selectedSeason, loading } = useSelector((state) => state.season);

  React.useEffect(() => {
    // Auto-select the most recent active season if none is selected
    if (!selectedSeason && seasons.length > 0) {
      const active = seasons.find(s => !s.isClosed);
      dispatch(setSelectedSeason(active ? active._id : seasons[0]._id));
    }
  }, [selectedSeason, seasons, dispatch]);

  const handleChange = (e) => {
    const seasonId = e.target.value;
    dispatch(setSelectedSeason(seasonId));
    if (onChange) {
      const seasonObj = seasons.find(s => s._id === seasonId);
      onChange(seasonObj);
    }
  };

  return (
    <Box sx={{ minWidth: 220, ...sx }}>
      <FormControl fullWidth size="small" disabled={loading || seasons.length === 0}>
        <InputLabel id="season-filter-label">Season</InputLabel>
        <Select
          labelId="season-filter-label"
          value={selectedSeason || ''}
          label="Season"
          onChange={handleChange}
        >
          {seasons.map(season => (
            <MenuItem key={season._id} value={season._id}>
              {season.name} ({new Date(season.startDate).toLocaleDateString()} - {new Date(season.endDate).toLocaleDateString()})
              {season.isClosed ? ' [Closed]' : ''}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
    </Box>
  );
};

export default SeasonFilter; 