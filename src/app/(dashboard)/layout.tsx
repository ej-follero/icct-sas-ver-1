"use client";

import React, { useState } from 'react';
import Menu from "@/components/Menu";
import Navbar from "@/components/Navbar";
import { Box, useTheme, Drawer, IconButton } from "@mui/material";
import MenuIcon from '@mui/icons-material/Menu';

const SIDEBAR_WIDTH = 280;
const HEADER_HEIGHT = 64;

export default function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const theme = useTheme();
  const [drawerOpen, setDrawerOpen] = useState(false);

  const handleDrawerToggle = () => setDrawerOpen((prev) => !prev);

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'transparent' }}>
      {/* Fixed Header */}
      <Box
        sx={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: HEADER_HEIGHT,
          zIndex: theme.zIndex.appBar,
          bgcolor: 'white',
          boxShadow: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          px: { xs: 2, md: 4 },
        }}
      >
        <Navbar />
        {/* Hamburger for mobile */}
        <Box sx={{ display: { xs: 'flex', md: 'none' } }}>
          <IconButton
            aria-label="Open sidebar menu"
            onClick={handleDrawerToggle}
            sx={{ color: 'black', ml: 1 }}
            edge="end"
          >
            <MenuIcon />
          </IconButton>
        </Box>
      </Box>
      {/* Fixed Sidebar for desktop */}
      <Box
        sx={{
          display: { xs: 'none', md: 'block' },
          position: 'fixed',
          top: HEADER_HEIGHT,
          left: 0,
          width: SIDEBAR_WIDTH,
          height: `calc(100vh - ${HEADER_HEIGHT}px)`,
          zIndex: theme.zIndex.drawer,
        }}
      >
        <Menu variant="sidebar" />
      </Box>
      {/* Drawer for mobile */}
      <Drawer
        anchor="left"
        open={drawerOpen}
        onClose={handleDrawerToggle}
        ModalProps={{ keepMounted: true }}
        sx={{ display: { xs: 'block', md: 'none' }, zIndex: theme.zIndex.drawer + 1 }}
        PaperProps={{ sx: { width: SIDEBAR_WIDTH, bgcolor: '#012970', color: 'white' } }}
      >
        <Menu variant="drawer" onNavigate={handleDrawerToggle} />
      </Drawer>
      {/* Main Content */}
      <Box
        component="main"
        sx={{
          ml: { xs: 0, md: `${SIDEBAR_WIDTH}px` },
          mt: `${HEADER_HEIGHT}px`,
          p: 4,
          minHeight: `calc(100vh - ${HEADER_HEIGHT}px)`,
          transition: 'margin 0.3s',
          bgcolor: 'transparent',
        }}
      >
        {children}
      </Box>
    </Box>
  );
}
