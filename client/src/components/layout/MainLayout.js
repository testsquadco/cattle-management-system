import React from 'react';
import { IconButton } from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';

const MainLayout = () => {
  const handleDrawerToggle = () => {
    // Implementation of handleDrawerToggle
  };

  return (
    <IconButton
      edge="start"
      color="inherit"
      aria-label="menu"
      onClick={handleDrawerToggle}
      sx={{ mr: 2, display: { sm: 'none' } }}
      button="true"
    >
      <MenuIcon />
    </IconButton>
  );
};

export default MainLayout; 