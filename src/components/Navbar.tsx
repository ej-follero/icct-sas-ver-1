import React, { useState } from 'react';
import Image from "next/image"
import FaceIcon from '@mui/icons-material/Face';
import Notifications from "@mui/icons-material/Notifications";
import Message from "@mui/icons-material/Message";
import MenuIcon from '@mui/icons-material/Menu';
import CloseIcon from '@mui/icons-material/Close';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import SettingsIcon from '@mui/icons-material/Settings';
import PersonIcon from '@mui/icons-material/Person';
import LogoutIcon from '@mui/icons-material/Logout';
import HelpIcon from '@mui/icons-material/Help';
import DoneAllIcon from '@mui/icons-material/DoneAll';
import { 
  AppBar, 
  Toolbar, 
  Box, 
  Badge, 
  Typography, 
  useTheme, 
  Avatar, 
  IconButton, 
  Drawer, 
  List, 
  ListItem, 
  ListItemButton, 
  ListItemIcon, 
  ListItemText, 
  Divider, 
  MenuItem,
  Tooltip,
  Popover,
  Button,
  alpha,
  Menu as MuiMenu
} from '@mui/material';
import Logo from '@/components/Logo';
import Link from 'next/link';
import CustomMenu from '@/components/Menu';

const HEADER_HEIGHT = 64;

// Mock notifications data
const notifications = [
  { id: 1, title: 'New attendance record', message: 'Class ICT101 attendance has been recorded', time: '5m ago', unread: true },
  { id: 2, title: 'System Update', message: 'System maintenance scheduled for tonight', time: '1h ago', unread: true },
  { id: 3, title: 'Welcome!', message: 'Welcome to ICCT Smart Attendance System', time: '2h ago', unread: false },
];

// Mock messages data
const messages = [
  { id: 1, from: 'John Doe', message: 'When is the next meeting?', time: '10m ago', unread: true },
  { id: 2, from: 'Jane Smith', message: 'Please check the attendance records', time: '30m ago', unread: true },
  { id: 3, from: 'Admin', message: 'Your account has been updated', time: '1h ago', unread: false },
];

const navLinks: { label: string; href: string; icon: React.ReactNode }[] = [
  // Add more links as needed
];

type MenuAction = 'profile' | 'settings' | 'help' | 'logout';

type UserMenuItem = {
  label: string;
  icon: React.ReactNode;
  action: MenuAction;
  type?: never;
} | {
  type: 'divider';
  label?: never;
  icon?: never;
  action?: never;
};

const userMenuItems: UserMenuItem[] = [
  { label: 'Profile', icon: <PersonIcon />, action: 'profile' },
  { label: 'Settings', icon: <SettingsIcon />, action: 'settings' },
  { label: 'Help', icon: <HelpIcon />, action: 'help' },
  { type: 'divider' },
  { label: 'Logout', icon: <LogoutIcon />, action: 'logout' },
];

const Navbar = () => {
  const theme = useTheme();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [userMenuAnchor, setUserMenuAnchor] = useState<null | HTMLElement>(null);
  const [notificationsAnchor, setNotificationsAnchor] = useState<null | HTMLElement>(null);
  const [messagesAnchor, setMessagesAnchor] = useState<null | HTMLElement>(null);
  
  const handleDrawerToggle = () => setDrawerOpen(prev => !prev);
  const handleUserMenuOpen = (event: React.MouseEvent<HTMLElement>) => setUserMenuAnchor(event.currentTarget);
  const handleUserMenuClose = () => setUserMenuAnchor(null);
  const handleNotificationsOpen = (event: React.MouseEvent<HTMLElement>) => setNotificationsAnchor(event.currentTarget);
  const handleNotificationsClose = () => setNotificationsAnchor(null);
  const handleMessagesOpen = (event: React.MouseEvent<HTMLElement>) => setMessagesAnchor(event.currentTarget);
  const handleMessagesClose = () => setMessagesAnchor(null);

  const handleMenuAction = (action: MenuAction) => {
    handleUserMenuClose();
    // Handle different menu actions
    console.log('Menu action:', action);
  };

  return (
    <AppBar
      position="fixed"
      sx={{
        top: 0,
        left: 0,
        width: '100%',
        height: HEADER_HEIGHT,
        bgcolor: 'grey.100',
        zIndex: theme.zIndex.appBar,
        boxShadow: 1,
        display: 'flex',
        justifyContent: 'center',
      }}
      elevation={1}
    >
      <Toolbar 
        sx={{ 
          minHeight: HEADER_HEIGHT, 
          px: { xs: 1, sm: 2, md: 4 }, 
          display: 'flex', 
          justifyContent: 'space-between',
          gap: 2
        }}
      >
        {/* Left: Logo */}
        <Box 
          sx={{ 
            display: 'flex', 
            alignItems: 'center',
            height: '100%',
            width: { xs: 160, md: 260 },
            pl: { xs: 1, sm: 1.5, md: 0 },
            pr: { xs: 1, sm: 2, md: 0 },
            mr: { xs: 0, sm: 2, md: 0 },
            borderRight: { xs: '1px solid', md: 'none' },
            borderColor: { xs: 'grey.200', md: 'none' },
            justifyContent: { xs: 'flex-start', md: 'center' }
          }}
        >
          <Logo variant="compact" />
        </Box>

        {/* Right: Actions & User */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 0.5, sm: 1 } }}>
          {/* Messages */}
          <Tooltip title="Messages">
            <IconButton 
              aria-label="Messages" 
              onClick={handleMessagesOpen}
              sx={{ 
                mr: { xs: 0.5, sm: 1 },
                '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.08) }
              }}
            >
              <Badge badgeContent={messages.filter(m => m.unread).length} color="error">
                <Message sx={{ fontSize: 20, color: 'black' }} />
              </Badge>
            </IconButton>
          </Tooltip>

          {/* Notifications */}
          <Tooltip title="Notifications">
            <IconButton 
              aria-label="Notifications" 
              onClick={handleNotificationsOpen}
              sx={{ 
                mr: { xs: 0.5, sm: 1 },
                '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.08) }
              }}
            >
              <Badge badgeContent={notifications.filter(n => n.unread).length} color="error">
                <Notifications sx={{ fontSize: 20, color: 'black' }} />
              </Badge>
            </IconButton>
          </Tooltip>

          {/* User Info & Menu */}
          <Box sx={{ display: { xs: 'none', sm: 'flex' }, flexDirection: 'column', alignItems: 'flex-end', mr: 1 }}>
            <Typography variant="body2" sx={{ fontWeight: 500, color: 'black', lineHeight: 1.1 }}>EJ Yu</Typography>
            <Typography variant="caption" sx={{ color: 'grey.700', fontSize: 11 }}>Admin</Typography>
          </Box>
          
          <Tooltip title="Account settings">
            <IconButton 
              onClick={handleUserMenuOpen}
              sx={{ 
                p: 0.5,
                ml: 0.5,
                '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.08) }
              }}
              aria-label="User menu"
            >
              <Avatar sx={{ width: 36, height: 36, bgcolor: 'grey.200' }}>
                <FaceIcon sx={{ fontSize: 28, color: theme.palette.primary.main }} />
              </Avatar>
              <KeyboardArrowDownIcon sx={{ color: 'black', ml: 0.5 }} />
            </IconButton>
          </Tooltip>

          {/* User Menu */}
          <MuiMenu
            anchorEl={userMenuAnchor}
            open={Boolean(userMenuAnchor)}
            onClose={handleUserMenuClose}
            MenuListProps={{
              sx: {
                p: 0,
              },
            }}
          >
            {userMenuItems.map((item, index) => (
              item.type === 'divider' ? (
                <Divider key={`divider-${index}`} />
              ) : (
                <MenuItem 
                  key={item.label} 
                  onClick={() => handleMenuAction(item.action)}
                  sx={{ 
                    py: 1,
                    '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.08) }
                  }}
                >
                  <ListItemIcon sx={{ minWidth: 36 }}>{item.icon}</ListItemIcon>
                  <ListItemText primary={item.label} />
                </MenuItem>
              )
            ))}
          </MuiMenu>

          {/* Notifications Popover */}
          <Popover
            open={Boolean(notificationsAnchor)}
            anchorEl={notificationsAnchor}
            onClose={handleNotificationsClose}
            anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            transformOrigin={{ vertical: 'top', horizontal: 'right' }}
            PaperProps={{
              sx: {
                mt: 1,
                width: 320,
                boxShadow: theme.shadows[3],
              }
            }}
          >
            <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="h6">Notifications</Typography>
              <Button 
                startIcon={<DoneAllIcon />} 
                size="small"
                sx={{ textTransform: 'none' }}
              >
                Mark all as read
              </Button>
            </Box>
            <Divider />
            <List sx={{ py: 0 }}>
              {notifications.map((notification) => (
                <ListItem 
                  key={notification.id} 
                  sx={{ 
                    bgcolor: notification.unread ? alpha(theme.palette.primary.main, 0.04) : 'transparent',
                    '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.08) }
                  }}
                >
                  <ListItemText
                    primary={notification.title}
                    secondary={
                      <React.Fragment>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                          {notification.message}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {notification.time}
                        </Typography>
                      </React.Fragment>
                    }
                  />
                </ListItem>
              ))}
            </List>
          </Popover>

          {/* Messages Popover */}
          <Popover
            open={Boolean(messagesAnchor)}
            anchorEl={messagesAnchor}
            onClose={handleMessagesClose}
            anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            transformOrigin={{ vertical: 'top', horizontal: 'right' }}
            PaperProps={{
              sx: {
                mt: 1,
                width: 320,
                boxShadow: theme.shadows[3],
              }
            }}
          >
            <Box sx={{ p: 2 }}>
              <Typography variant="h6">Messages</Typography>
            </Box>
            <Divider />
            <List sx={{ py: 0 }}>
              {messages.map((message) => (
                <ListItem 
                  key={message.id}
                  sx={{ 
                    bgcolor: message.unread ? alpha(theme.palette.primary.main, 0.04) : 'transparent',
                    '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.08) }
                  }}
                >
                  <ListItemText
                    primary={message.from}
                    secondary={
                      <React.Fragment>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                          {message.message}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {message.time}
                        </Typography>
                      </React.Fragment>
                    }
                  />
                </ListItem>
              ))}
            </List>
          </Popover>

          {/* Mobile Menu Button */}
          <Box sx={{ display: { xs: 'flex', md: 'none' }, ml: 1 }}>
            <IconButton
              aria-label="Open navigation menu"
              onClick={handleDrawerToggle}
              sx={{ 
                color: 'black',
                '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.08) }
              }}
              edge="end"
            >
              <MenuIcon />
            </IconButton>
          </Box>
        </Box>
      </Toolbar>

      {/* Mobile Drawer */}
      <Drawer
        anchor="right"
        open={drawerOpen}
        onClose={handleDrawerToggle}
        PaperProps={{ 
          sx: { 
            width: 280,
            bgcolor: 'grey.100',
            color: 'black'
          } 
        }}
      >
        <Box 
          sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'space-between',
            height: HEADER_HEIGHT,
            px: { xs: 2, sm: 3 },
            borderBottom: '1px solid',
            borderColor: 'grey.200'
          }}
        >
          <Box 
            sx={{ 
              display: 'flex', 
              alignItems: 'center',
              height: '100%',
              width: 160,
              py: 2
            }}
          >
            <Logo variant="compact" />
          </Box>
          <IconButton  
            onClick={handleDrawerToggle} 
            sx={{ 
              color: 'black',
              '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.08) }
            }} 
            aria-label="Close navigation menu"
          >
            <CloseIcon />
          </IconButton>
        </Box>
        <Divider />
        {/* Render the Menu sidebar for mobile */}
        <CustomMenu variant="drawer" onNavigate={handleDrawerToggle} />
      </Drawer>
    </AppBar>
  );
};

export default Navbar;