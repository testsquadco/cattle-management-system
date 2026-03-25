import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
    Box,
    List,
    ListItem,
    ListItemButton,
    ListItemIcon,
    ListItemText,
    Divider,
    Collapse
} from '@mui/material';
import {
    Dashboard as DashboardIcon,
    People as PeopleIcon,
    LocalHospital as HealthIcon,
    AttachMoney as FinanceIcon,
    Feed as FeedIcon,
    ExpandLess,
    ExpandMore,
    Inventory as InventoryIcon,
    Assessment as AssessmentIcon,
    ViewList as ViewListIcon,
    Timeline as TimelineIcon
} from '@mui/icons-material';

const MainNavigation = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const [open, setOpen] = React.useState({
        cattle: true,
        health: true,
        finance: true,
        feed: true
    });

    const handleClick = (section) => {
        setOpen({ ...open, [section]: !open[section] });
    };

    const isActive = (path) => {
        return location.pathname.startsWith(path);
    };

    return (
        <Box sx={{ width: 240, flexShrink: 0 }}>
            <List>
                <ListItem disablePadding>
                    <ListItemButton
                        selected={location.pathname === '/'}
                        onClick={() => navigate('/')}
                    >
                        <ListItemIcon>
                            <DashboardIcon />
                        </ListItemIcon>
                        <ListItemText primary="Dashboard" />
                    </ListItemButton>
                </ListItem>

                {/* Cattle Management */}
                <ListItem disablePadding>
                    <ListItemButton
                        selected={isActive('/cattle')}
                        onClick={() => handleClick('cattle')}
                    >
                        <ListItemIcon>
                            <PeopleIcon />
                        </ListItemIcon>
                        <ListItemText primary="Cattle Management" />
                        {open.cattle ? <ExpandLess /> : <ExpandMore />}
                    </ListItemButton>
                </ListItem>
                <Collapse in={open.cattle} timeout="auto" unmountOnExit>
                    <List component="div" disablePadding>
                        <ListItemButton
                            sx={{ pl: 4 }}
                            selected={location.pathname === '/cattle/list'}
                            onClick={() => navigate('/cattle/list')}
                        >
                            <ListItemIcon>
                                <ViewListIcon />
                            </ListItemIcon>
                            <ListItemText primary="Cattle List" />
                        </ListItemButton>
                        <ListItemButton
                            sx={{ pl: 4 }}
                            selected={location.pathname === '/cattle/groups'}
                            onClick={() => navigate('/cattle/groups')}
                        >
                            <ListItemIcon>
                                <PeopleIcon />
                            </ListItemIcon>
                            <ListItemText primary="Cattle Groups" />
                        </ListItemButton>
                    </List>
                </Collapse>

                {/* Health Management */}
                <ListItem disablePadding>
                    <ListItemButton
                        selected={isActive('/health')}
                        onClick={() => handleClick('health')}
                    >
                        <ListItemIcon>
                            <HealthIcon />
                        </ListItemIcon>
                        <ListItemText primary="Health Management" />
                        {open.health ? <ExpandLess /> : <ExpandMore />}
                    </ListItemButton>
                </ListItem>
                <Collapse in={open.health} timeout="auto" unmountOnExit>
                    <List component="div" disablePadding>
                        <ListItemButton
                            sx={{ pl: 4 }}
                            selected={location.pathname === '/health/records'}
                            onClick={() => navigate('/health/records')}
                        >
                            <ListItemIcon>
                                <ViewListIcon />
                            </ListItemIcon>
                            <ListItemText primary="Health Records" />
                        </ListItemButton>
                        <ListItemButton
                            sx={{ pl: 4 }}
                            selected={location.pathname === '/health/vaccinations'}
                            onClick={() => navigate('/health/vaccinations')}
                        >
                            <ListItemIcon>
                                <HealthIcon />
                            </ListItemIcon>
                            <ListItemText primary="Vaccinations" />
                        </ListItemButton>
                    </List>
                </Collapse>

                {/* Feed Management */}
                <ListItem disablePadding>
                    <ListItemButton
                        selected={isActive('/feed')}
                        onClick={() => handleClick('feed')}
                    >
                        <ListItemIcon>
                            <FeedIcon />
                        </ListItemIcon>
                        <ListItemText primary="Feed Management" />
                        {open.feed ? <ExpandLess /> : <ExpandMore />}
                    </ListItemButton>
                </ListItem>
                <Collapse in={open.feed} timeout="auto" unmountOnExit>
                    <List component="div" disablePadding>
                        <ListItemButton
                            sx={{ pl: 4 }}
                            selected={location.pathname === '/feed/items'}
                            onClick={() => navigate('/feed/items')}
                        >
                            <ListItemIcon>
                                <InventoryIcon />
                            </ListItemIcon>
                            <ListItemText primary="Feed Items" />
                        </ListItemButton>
                        <ListItemButton
                            sx={{ pl: 4 }}
                            selected={location.pathname === '/feed/logs'}
                            onClick={() => navigate('/feed/logs')}
                        >
                            <ListItemIcon>
                                <ViewListIcon />
                            </ListItemIcon>
                            <ListItemText primary="Daily Logs" />
                        </ListItemButton>
                        <ListItemButton
                            sx={{ pl: 4 }}
                            selected={location.pathname === '/feed/summary'}
                            onClick={() => navigate('/feed/summary')}
                        >
                            <ListItemIcon>
                                <AssessmentIcon />
                            </ListItemIcon>
                            <ListItemText primary="Monthly Summary" />
                        </ListItemButton>
                        <ListItemButton
                            sx={{ pl: 4 }}
                            selected={location.pathname === '/feed/templates'}
                            onClick={() => navigate('/feed/templates')}
                        >
                            <ListItemIcon>
                                <ViewListIcon />
                            </ListItemIcon>
                            <ListItemText primary="Feed Templates" />
                        </ListItemButton>
                        <ListItemButton
                            sx={{ pl: 4 }}
                            selected={location.pathname === '/feed/analytics'}
                            onClick={() => navigate('/feed/analytics')}
                        >
                            <ListItemIcon>
                                <TimelineIcon />
                            </ListItemIcon>
                            <ListItemText primary="Analytics" />
                        </ListItemButton>
                    </List>
                </Collapse>

                {/* Financial Management */}
                <ListItem disablePadding>
                    <ListItemButton
                        selected={isActive('/finance')}
                        onClick={() => handleClick('finance')}
                    >
                        <ListItemIcon>
                            <FinanceIcon />
                        </ListItemIcon>
                        <ListItemText primary="Financial Management" />
                        {open.finance ? <ExpandLess /> : <ExpandMore />}
                    </ListItemButton>
                </ListItem>
                <Collapse in={open.finance} timeout="auto" unmountOnExit>
                    <List component="div" disablePadding>
                        <ListItemButton
                            sx={{ pl: 4 }}
                            selected={location.pathname === '/finance/expenses'}
                            onClick={() => navigate('/finance/expenses')}
                        >
                            <ListItemIcon>
                                <FinanceIcon />
                            </ListItemIcon>
                            <ListItemText primary="Expenses" />
                        </ListItemButton>
                        <ListItemButton
                            sx={{ pl: 4 }}
                            selected={location.pathname === '/finance/reports'}
                            onClick={() => navigate('/finance/reports')}
                        >
                            <ListItemIcon>
                                <AssessmentIcon />
                            </ListItemIcon>
                            <ListItemText primary="Financial Reports" />
                        </ListItemButton>
                    </List>
                </Collapse>
            </List>
        </Box>
    );
};

export default MainNavigation; 