import React from 'react';
import { useSelector } from 'react-redux';

const SeasonBanner = () => {
  const { seasons, loading } = useSelector((state) => state.season);
  // Assume selected season is the first active, or first closed if none active, or null
  const selectedSeason = React.useMemo(() => {
    if (!seasons || seasons.length === 0) return null;
    const active = seasons.find(s => !s.isClosed);
    if (active) return active;
    return seasons[0];
  }, [seasons]);

  if (loading) {
    return (
      <div className="w-full sticky top-0 z-50 bg-yellow-100 text-yellow-800 py-2 px-4 text-center font-semibold shadow">
        Loading season data...
      </div>
    );
  }
  if (!selectedSeason) {
    return (
      <div className="w-full sticky top-0 z-50 bg-yellow-100 text-yellow-800 py-2 px-4 text-center font-semibold shadow">
        ⚠️ No season selected.
      </div>
    );
  }
  if (selectedSeason.isClosed) {
    return (
      <div className="w-full sticky top-0 z-50 bg-gray-200 text-red-700 py-2 px-4 text-center font-semibold shadow">
        <span role="img" aria-label="lock">🔒</span> Viewing season: <b>{selectedSeason.name}</b> (Closed - Read-only)
      </div>
    );
  }
  return (
    <div className="w-full sticky top-0 z-50 bg-green-100 text-green-800 py-2 px-4 text-center font-semibold shadow">
      <span role="img" aria-label="active">🟢</span> Viewing season: <b>{selectedSeason.name}</b> (Active)
    </div>
  );
};

export default SeasonBanner; 