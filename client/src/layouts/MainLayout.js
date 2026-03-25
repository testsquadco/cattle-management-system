import React, { useState } from 'react';
import { useNavigate, Outlet } from 'react-router-dom';
import {
  AppBar,
  Box,
  CssBaseline,
  Drawer,
  IconButton,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Typography,
  useTheme,
  Collapse,
} from '@mui/material';
import {
  Menu as MenuIcon,
  Dashboard as DashboardIcon,
  Pets as CattleIcon,
  Category as CategoryIcon,
  Receipt as ExpenseIcon,
  Assessment as ReportsIcon,
  Logout as LogoutIcon,
  Payment as PaymentIcon,
  Store as StoreIcon,
  AccountBalance as AccountBalanceIcon,
  MonitorHeart as BreedingIcon,
  ExpandLess,
  ExpandMore,
  History as HistoryIcon,
  Analytics as AnalyticsIcon,
  Restaurant as RestaurantIcon,
  ListAlt as ListAltIcon,
  Summarize as SummarizeIcon,
  ViewList as ViewListIcon,
  Timeline as TimelineIcon,
  Settings as SettingsIcon,
} from '@mui/icons-material';
import { useDispatch } from 'react-redux';
import { logout } from '../store/slices/authSlice';
import SeasonBanner from '../components/SeasonBanner';

const drawerWidth = 240;

const MainLayout = ({ children }) => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [breedingOpen, setBreedingOpen] = useState(false);
  const [feedOpen, setFeedOpen] = useState(false);
  const theme = useTheme();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const isAuthenticated = JSON.parse(localStorage.getItem('persist:root') || '{}').auth ?
    JSON.parse(JSON.parse(localStorage.getItem('persist:root')).auth).isAuthenticated : true;

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleLogout = () => {
    dispatch(logout());
    navigate('/login');
  };

  const handleBreedingClick = () => {
    setBreedingOpen(!breedingOpen);
  };

  const handleFeedClick = () => {
    setFeedOpen(!feedOpen);
  };

  const menuItems = [
    { text: 'Dashboard', icon: <DashboardIcon />, path: '/' },
    { text: 'Cattle', icon: <CattleIcon />, path: '/cattle' },
    { text: 'Categories', icon: <CategoryIcon />, path: '/categories' },
    { text: 'Expenses', icon: <ExpenseIcon />, path: '/expenses' },
    { text: 'Custody Payments', icon: <PaymentIcon />, path: '/custody-payments' },
    { text: 'Kunda Rentals', icon: <StoreIcon />, path: '/kunda-rentals' },
    { text: 'Kunda Payments', icon: <PaymentIcon />, path: '/kunda-payments' },
    {
      text: 'Feed Management',
      icon: <RestaurantIcon />,
      children: [
        { text: 'Feed Items', icon: <ViewListIcon />, path: '/feed/items' },
        { text: 'Daily Logs', icon: <ListAltIcon />, path: '/feed/logs' },
        { text: 'Monthly Summary', icon: <SummarizeIcon />, path: '/feed/summary' },
        { text: 'Feed Templates', icon: <ViewListIcon />, path: '/feed/templates' },
        { text: 'Analytics', icon: <TimelineIcon />, path: '/feed/analytics' },
      ],
    },
    {
      text: 'Breeding',
      icon: <BreedingIcon />,
      children: [
        { text: 'Reports', icon: <AnalyticsIcon />, path: '/breeding' },
        { text: 'History', icon: <HistoryIcon />, path: '/breeding/history' },
      ],
    },
    { text: 'Profit & Loss', icon: <AccountBalanceIcon />, path: '/profit-loss' },
    { text: 'Reports', icon: <ReportsIcon />, path: '/reports' },
    ...(isAuthenticated ? [{ text: 'Season Management', icon: <SettingsIcon />, path: '/season-management' }] : []),
  ];

  const drawer = (
    <div>
      <Toolbar>
        <Typography variant="h6" noWrap component="div">
          Cattle Expense
        </Typography>
      </Toolbar>
      <List>
        {menuItems.map((item) => (
          item.children && item.text === 'Feed Management' ? (
            <React.Fragment key={item.text}>
              <ListItem button onClick={handleFeedClick}>
                <ListItemIcon>{item.icon}</ListItemIcon>
                <ListItemText primary={item.text} />
                {feedOpen ? <ExpandLess /> : <ExpandMore />}
              </ListItem>
              <Collapse in={feedOpen} timeout="auto" unmountOnExit>
                <List component="div" disablePadding>
                  {item.children.map((child) => (
                    <ListItem
                      button
                      key={child.text}
                      onClick={() => {
                        navigate(child.path);
                        setMobileOpen(false);
                      }}
                      sx={{ pl: 4 }}
                    >
                      <ListItemIcon>{child.icon}</ListItemIcon>
                      <ListItemText primary={child.text} />
                    </ListItem>
                  ))}
                </List>
              </Collapse>
            </React.Fragment>
          ) : item.children ? (
            <React.Fragment key={item.text}>
              <ListItem button onClick={handleBreedingClick}>
                <ListItemIcon>{item.icon}</ListItemIcon>
                <ListItemText primary={item.text} />
                {breedingOpen ? <ExpandLess /> : <ExpandMore />}
              </ListItem>
              <Collapse in={breedingOpen} timeout="auto" unmountOnExit>
                <List component="div" disablePadding>
                  {item.children.map((child) => (
                    <ListItem
                      button
                      key={child.text}
                      onClick={() => {
                        navigate(child.path);
                        setMobileOpen(false);
                      }}
                      sx={{ pl: 4 }}
                    >
                      <ListItemIcon>{child.icon}</ListItemIcon>
                      <ListItemText primary={child.text} />
                    </ListItem>
                  ))}
                </List>
              </Collapse>
            </React.Fragment>
          ) : (
            <ListItem
              button
              key={item.text}
              onClick={() => {
                navigate(item.path);
                setMobileOpen(false);
              }}
            >
              <ListItemIcon>{item.icon}</ListItemIcon>
              <ListItemText primary={item.text} />
            </ListItem>
          )
        ))}
        <ListItem button onClick={handleLogout}>
          <ListItemIcon>
            <LogoutIcon />
          </ListItemIcon>
          <ListItemText primary="Logout" />
        </ListItem>
      </List>
    </div>
  );

  return (
    <>
      <Box sx={{ display: 'flex' }}>
        <CssBaseline />
        <AppBar
          position="fixed"
          sx={{
            width: { sm: `calc(100% - ${drawerWidth}px)` },
            ml: { sm: `${drawerWidth}px` },
            zIndex: 2000,
          }}
        >
          <SeasonBanner />
          <Toolbar>
            <IconButton
              color="inherit"
              aria-label="open drawer"
              edge="start"
              onClick={handleDrawerToggle}
              sx={{ mr: 2, display: { sm: 'none' } }}
            >
              <MenuIcon />
            </IconButton>
            <Typography variant="h6" noWrap component="div">
              Cattle Expense Tracker
            </Typography>
          </Toolbar>
        </AppBar>
        <Box
          component="nav"
          sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 } }}
        >
          <Drawer
            variant="temporary"
            open={mobileOpen}
            onClose={handleDrawerToggle}
            ModalProps={{
              keepMounted: true,
            }}
            sx={{
              display: { xs: 'block', sm: 'none' },
              '& .MuiDrawer-paper': {
                boxSizing: 'border-box',
                width: drawerWidth,
              },
            }}
          >
            {drawer}
          </Drawer>
          <Drawer
            variant="permanent"
            sx={{
              display: { xs: 'none', sm: 'block' },
              '& .MuiDrawer-paper': {
                boxSizing: 'border-box',
                width: drawerWidth,
              },
            }}
            open
          >
            {drawer}
          </Drawer>
        </Box>
        <Box
          component="main"
          sx={{
            flexGrow: 1,
            p: 3,
            width: { sm: `calc(100% - ${drawerWidth}px)` },
          }}
        >
          <Toolbar />
          <Outlet />
        </Box>
      </Box>
      {children}
    </>
  );
};

export default MainLayout; 