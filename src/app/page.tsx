'use client';

import { Box, Button, Container, Grid, Typography, useTheme, Card, CardContent, Avatar, TextField, Accordion, AccordionSummary, AccordionDetails, IconButton, Link as MuiLink, AppBar, Toolbar, Drawer, List, ListItem, ListItemButton, ListItemText, Divider } from '@mui/material';
import { motion } from 'framer-motion';
import { 
  School, 
  AccessTime, 
  Analytics, 
  Security, 
  Speed, 
  Group,
  ArrowForward,
  ExpandMore,
  Email,
  Phone,
  LocationOn,
  Facebook,
  Twitter,
  LinkedIn,
  YouTube,
  PlayCircle,
  Menu
} from '@mui/icons-material';
import Link from 'next/link';
import { useState } from 'react';

export default function LandingPage() {
  const theme = useTheme();
  const [drawerOpen, setDrawerOpen] = useState(false);

  const stats = [
    {
      number: "100%",
      label: "Automated",
      description: "ICCT-exclusive attendance system"
    },
    {
      number: "24/7",
      label: "Real-time",
      description: "Instant attendance tracking"
    },
    {
      number: "99.9%",
      label: "Accuracy",
      description: "Reliable attendance records"
    }
  ];

  const solutions = [
    {
      title: "Students",
      description: "Track attendance with your ICCT ID card and access your records anytime.",
      icon: <School sx={{ fontSize: 48 }} />,
      features: [
        "One-tap attendance with ICCT ID",
        "Real-time attendance status",
        "Personal attendance history",
      ]
    },
    {
      title: "Faculty",
      description: "Manage class attendance efficiently with automated tracking and real-time monitoring.",
      icon: <Group sx={{ fontSize: 48 }} />,
      features: [
        "Automated class attendance",
        "Real-time class monitoring",
        "Attendance analytics",
        "Student performance tracking"
      ]
    },
    {
      title: "Administration",
      description: "Access comprehensive analytics and manage the attendance system campus-wide.",
      icon: <Analytics sx={{ fontSize: 48 }} />,
      features: [
        "Campus-wide analytics",
        "Custom report generation",
        "System management",
        "Data security"
      ]
    }
  ];

  const testimonials = [
    {
      name: "Prof. Sarah Johnson",
      role: "ICCT Department Head",
      avatar: "/avatars/prof1.jpg",
      quote: "ICCT-SAS has streamlined our attendance tracking process, saving valuable teaching time."
    },
    {
      name: "Mark Chen",
      role: "ICCT Student",
      avatar: "/avatars/student1.jpg",
      quote: "The system makes attendance tracking effortless. Just tap your ICCT ID and you're done."
    },
    {
      name: "Dr. Michael Rodriguez",
      role: "ICCT Academic Coordinator",
      avatar: "/avatars/prof2.jpg",
      quote: "The analytics help us make data-driven decisions about student engagement."
    }
  ];

  const faqs = [
    {
      question: "How do I use ICCT-SAS?",
      answer: "Simply tap your ICCT ID card on the reader when entering class. The system automatically records your attendance."
    },
    {
      question: "Is my attendance data secure?",
      answer: "Yes, ICCT-SAS uses advanced encryption and secure authentication to protect all attendance records."
    },
    {
      question: "Can I check my attendance records?",
      answer: "Yes, you can access your attendance history anytime through the ICCT-SAS portal."
    },
    {
      question: "What if I forget my ICCT ID?",
      answer: "Contact your class adviser for manual attendance recording. Remember to bring your ICCT ID next time."
    }
  ];

  const navLinks = [
    { label: 'Solutions', href: '#solutions' },
    { label: 'Stats', href: '#stats' },
    { label: 'Testimonials', href: '#testimonials' },
    { label: 'FAQ', href: '#faq' },
  ];

  return (
    <Box sx={{ overflow: 'hidden', bgcolor: 'grey.50' }}>
      {/* Responsive Fixed Header */}
      <AppBar position="fixed" color="inherit" elevation={1} sx={{ zIndex: 1200 }}>
        <Toolbar sx={{ justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Box component={Link} href="/" sx={{ display: 'flex', alignItems: 'center', textDecoration: 'none' }}>
              <Box
                component="img"
                src="/icct-logo.png"
                alt="ICCT Logo"
                sx={{ height: 40, mr: 1 }}
              />
              <Typography variant="h6" sx={{ fontWeight: 800, color: 'primary.main', letterSpacing: 1 }}>
                ICCT-SAS
              </Typography>
            </Box>
          </Box>
          {/* Desktop Nav */}
          <Box sx={{ display: { xs: 'none', md: 'flex' }, gap: 3, alignItems: 'center' }}>
            {navLinks.map((link) => (
              <MuiLink key={link.href} href={link.href} color="text.primary" underline="none" sx={{ fontWeight: 500 }}>
                {link.label}
              </MuiLink>
            ))}
            <Button
              variant="contained"
              component={Link}
              href="/login"
              sx={{ ml: 2, fontWeight: 600 }}
            >
              Login
            </Button>
          </Box>
          {/* Mobile Nav */}
          <Box sx={{ display: { xs: 'flex', md: 'none' } }}>
            <IconButton edge="end" color="inherit" onClick={() => setDrawerOpen(true)}>
              <Menu />
            </IconButton>
          </Box>
        </Toolbar>
        {/* Drawer for mobile nav */}
        <Drawer
          anchor="right"
          open={drawerOpen}
          onClose={() => setDrawerOpen(false)}
          PaperProps={{ sx: { width: 240 } }}
        >
          <Box sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
            <Box
              component="img"
              src="/icct-logo.png"
              alt="ICCT Logo"
              sx={{ height: 32, mr: 1 }}
            />
            <Typography variant="h6" sx={{ fontWeight: 800, color: 'primary.main', letterSpacing: 1 }}>
              ICCT-SAS
            </Typography>
          </Box>
          <Divider />
          <List>
            {navLinks.map((link) => (
              <ListItem key={link.href} disablePadding>
                <ListItemButton component="a" href={link.href} onClick={() => setDrawerOpen(false)}>
                  <ListItemText primary={link.label} />
                </ListItemButton>
              </ListItem>
            ))}
            <ListItem disablePadding>
              <ListItemButton component={Link} href="/login" onClick={() => setDrawerOpen(false)}>
                <ListItemText primary="Login" />
              </ListItemButton>
            </ListItem>
          </List>
        </Drawer>
      </AppBar>

      {/* Add top margin to offset fixed header */}
      <Box sx={{ mt: { xs: 7, md: 8 } }}>
        {/* Hero Section */}
        <Box 
          sx={{ 
            background: 'linear-gradient(135deg, #1a237e 0%, #0d47a1 100%)',
            color: 'white',
            py: { xs: 8, md: 12 },
            position: 'relative',
            overflow: 'hidden'
          }}
        >
          <Container maxWidth="lg">
            <Grid container spacing={4} alignItems="center" justifyContent="center">
              <Grid item xs={12} md={6} sx={{ textAlign: { xs: 'center', md: 'left' } }}>
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8 }}
                >
                  <Typography 
                    variant="h1" 
                    component="h1" 
                    sx={{ 
                      fontWeight: 800,
                      mb: 2,
                      fontSize: { xs: '2.5rem', md: '3.5rem' },
                      lineHeight: 1.2
                    }}
                  >
                    ICCT Smart Attendance System
                  </Typography>
                  <Typography 
                    variant="h5" 
                    sx={{ 
                      mb: 4,
                      opacity: 0.9,
                      fontSize: { xs: '1.2rem', md: '1.5rem' },
                      lineHeight: 1.5
                    }}
                  >
                    Streamline attendance tracking at ICCT Colleges Cainta with RFID technology
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                    <Button 
                      variant="contained" 
                      size="large"
                      component={Link}
                      href="/login"
                      endIcon={<ArrowForward />}
                      sx={{ 
                        backgroundColor: 'white',
                        color: 'primary.main',
                        '&:hover': {
                          backgroundColor: 'grey.100',
                          transform: 'translateY(-2px)',
                        },
                        px: 6,
                        py: 2,
                        fontSize: '1.1rem',
                        fontWeight: 600,
                        transition: 'all 0.3s ease',
                        boxShadow: '0 4px 20px rgba(0,0,0,0.2)'
                      }}
                    >
                      ICCT Login
                    </Button>
                    <Button 
                      variant="outlined" 
                      size="large"
                      component={Link}
                      href="/demo"
                      sx={{ 
                        borderColor: 'white',
                        color: 'white',
                        '&:hover': {
                          borderColor: 'white',
                          backgroundColor: 'rgba(255,255,255,0.1)',
                          transform: 'translateY(-2px)',
                        },
                        px: 6,
                        py: 2,
                        fontSize: '1.1rem',
                        fontWeight: 600,
                        transition: 'all 0.3s ease'
                      }}
                    >
                      View Demo
                    </Button>
                  </Box>
                </motion.div>
              </Grid>
              <Grid item xs={12} md={6}>
                <motion.div
                  initial={{ opacity: 0, x: 50 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.8 }}
                >
                  {/* Hero Image Placeholder */}
                  <Box
                    sx={{
                      width: '100%',
                      maxWidth: 500,
                      height: 320,
                      borderRadius: 3,
                      background: 'linear-gradient(135deg, #e3eafc 0%, #b6ccfa 100%)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
                      mx: 'auto',
                      position: 'relative',
                    }}
                  >
                    <Box
                      component="img"
                      src="/hero-placeholder.svg"
                      alt="Attendance system illustration"
                      sx={{ width: '70%', height: 'auto', opacity: 0.9 }}
                    />
                  </Box>
                </motion.div>
              </Grid>
            </Grid>
          </Container>
        </Box>

        {/* Stats Section */}
        <Box id="stats" sx={{ py: { xs: 6, md: 8 }, bgcolor: 'white' }}>
          <Container maxWidth="lg">
            <Typography 
              variant="h3" 
              component="h2" 
              align="center" 
              sx={{ 
                mb: 6, 
                fontWeight: 700,
                color: 'text.primary'
              }}
            >
              ICCT-SAS at a Glance
            </Typography>
            <Grid container spacing={4} justifyContent="center">
              {stats.map((stat, index) => (
                <Grid item xs={12} sm={4} key={index}>
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: index * 0.1 }}
                  >
                    <Box sx={{ textAlign: 'center' }}>
                      <Typography 
                        variant="h2" 
                        sx={{ 
                          color: 'primary.main',
                          fontWeight: 700,
                          mb: 1
                        }}
                      >
                        {stat.number}
                      </Typography>
                      <Typography 
                        variant="h5" 
                        sx={{ 
                          fontWeight: 600,
                          mb: 1
                        }}
                      >
                        {stat.label}
                      </Typography>
                      <Typography 
                        variant="body1" 
                        color="text.secondary"
                      >
                        {stat.description}
                      </Typography>
                    </Box>
                  </motion.div>
                </Grid>
              ))}
            </Grid>
          </Container>
        </Box>

        {/* Solutions Section */}
        <Box id="solutions" sx={{ py: { xs: 6, md: 10 }, bgcolor: 'grey.50' }}>
          <Container maxWidth="lg">
            <Typography 
              variant="h3" 
              component="h2" 
              align="center" 
              sx={{ 
                mb: 8, 
                fontWeight: 700,
                color: 'text.primary'
              }}
            >
              ICCT-SAS for Our Community
            </Typography>
            <Grid container spacing={4}>
              {solutions.map((solution, index) => (
                <Grid item xs={12} md={4} key={index} sx={{ height: '100%', display: 'flex' }}>
                  <motion.div
                    style={{ flex: 1, display: 'flex' }}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: index * 0.1 }}
                  >
                    <Card
                      sx={{
                        height: '100%',
                        width: '100%',
                        display: 'flex',
                        flexDirection: 'column',
                        borderRadius: 3,
                        boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
                        transition: 'all 0.3s ease-in-out',
                        '&:hover': {
                          transform: 'translateY(-8px)',
                          boxShadow: '0 8px 30px rgba(0,0,0,0.15)',
                        },
                      }}
                    >
                      <CardContent sx={{ p: 4, display: 'flex', flexDirection: 'column', height: '100%' }}>
                        <Box sx={{ color: 'primary.main', mb: 3, display: 'flex', justifyContent: 'center' }}>
                          {solution.icon}
                        </Box>
                        <Typography 
                          variant="h5" 
                          component="h3" 
                          sx={{ mb: 2, fontWeight: 600, textAlign: 'center' }}
                        >
                          {solution.title}
                        </Typography>
                        <Typography 
                          variant="body1" 
                          color="text.secondary"
                          sx={{ mb: 3, textAlign: 'center', lineHeight: 1.6 }}
                        >
                          {solution.description}
                        </Typography>
                        <Box component="ul" sx={{ pl: 2, flexGrow: 1 }}>
                          {solution.features.map((feature, idx) => (
                            <Typography 
                              component="li" 
                              key={idx}
                              sx={{ mb: 1, color: 'text.secondary' }}
                            >
                              {feature}
                            </Typography>
                          ))}
                        </Box>
                      </CardContent>
                    </Card>
                  </motion.div>
                </Grid>
              ))}
            </Grid>
          </Container>
        </Box>

        {/* Video Demo Section */}
        <Box sx={{ py: { xs: 6, md: 10 }, bgcolor: 'white' }}>
          <Container maxWidth="lg">
            <Grid container spacing={4} alignItems="center">
              <Grid item xs={12} md={6}>
                <Typography 
                  variant="h3" 
                  component="h2" 
                  sx={{ mb: 3, fontWeight: 700, color: 'text.primary' }}
                >
                  See ICCT-SAS in Action
                </Typography>
                <Typography 
                  variant="body1" 
                  sx={{ mb: 4, color: 'text.secondary', fontSize: '1.1rem', lineHeight: 1.6 }}
                >
                  Watch our short demo video to see how ICCT-SAS streamlines attendance tracking and classroom management.
                </Typography>
                <Button
                  variant="contained"
                  size="large"
                  startIcon={<PlayCircle />}
                  sx={{ px: 4, py: 1.5, fontSize: '1.1rem', fontWeight: 600 }}
                >
                  Watch Demo
                </Button>
              </Grid>
              <Grid item xs={12} md={6}>
                {/* Video Placeholder */}
                <Box
                  sx={{
                    position: 'relative',
                    paddingTop: '56.25%', // 16:9 Aspect Ratio
                    borderRadius: 3,
                    overflow: 'hidden',
                    boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
                    background: 'linear-gradient(135deg, #e3eafc 0%, #b6ccfa 100%)',
                  }}
                >
                  <Box
                    component="img"
                    src="/video-placeholder.svg"
                    alt="ICCT-SAS Demo Video Placeholder"
                    sx={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                      opacity: 0.8
                    }}
                  />
                  <Box
                    sx={{
                      position: 'absolute',
                      top: '50%',
                      left: '50%',
                      transform: 'translate(-50%, -50%)',
                      bgcolor: 'rgba(255,255,255,0.8)',
                      borderRadius: '50%',
                      p: 2,
                      boxShadow: 2,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <PlayCircle sx={{ fontSize: 56, color: 'primary.main' }} />
                  </Box>
                </Box>
              </Grid>
            </Grid>
          </Container>
        </Box>

        {/* Testimonials Section */}
        <Box id="testimonials" sx={{ py: { xs: 6, md: 10 }, bgcolor: 'white' }}>
          <Container maxWidth="lg">
            <Typography 
              variant="h3" 
              component="h2" 
              align="center" 
              sx={{ mb: 8, fontWeight: 700, color: 'text.primary' }}
            >
              What Our Community Says
            </Typography>
            <Grid container spacing={4}>
              {testimonials.map((testimonial, index) => (
                <Grid item xs={12} md={4} key={index}>
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: index * 0.1 }}
                  >
                    <Card
                      sx={{
                        height: '100%',
                        borderRadius: 3,
                        boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
                      }}
                    >
                      <CardContent sx={{ p: 4 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                          {/* Testimonial Avatar Placeholder */}
                          <Avatar 
                            src={testimonial.avatar || '/avatar-placeholder.svg'} 
                            alt={testimonial.name}
                            sx={{ width: 56, height: 56, mr: 2, bgcolor: 'grey.200' }}
                          />
                          <Box>
                            <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                              {testimonial.name}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              {testimonial.role}
                            </Typography>
                          </Box>
                        </Box>
                        <Typography 
                          variant="body1" 
                          sx={{ fontStyle: 'italic', lineHeight: 1.6 }}
                        >
                          "{testimonial.quote}"
                        </Typography>
                      </CardContent>
                    </Card>
                  </motion.div>
                </Grid>
              ))}
            </Grid>
          </Container>
        </Box>

        {/* FAQ Section */}
        <Box sx={{ py: { xs: 6, md: 10 }, bgcolor: 'grey.50' }}>
          <Container maxWidth="md">
            <Typography 
              variant="h3" 
              component="h2" 
              align="center" 
              sx={{ 
                mb: 6, 
                fontWeight: 700,
                color: 'text.primary'
              }}
            >
              Frequently Asked Questions
            </Typography>
            {faqs.map((faq, index) => (
              <Accordion 
                key={index}
                sx={{
                  mb: 2,
                  borderRadius: '8px !important',
                  '&:before': { display: 'none' },
                  boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                }}
              >
                <AccordionSummary expandIcon={<ExpandMore />}>
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    {faq.question}
                  </Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <Typography variant="body1" color="text.secondary">
                    {faq.answer}
                  </Typography>
                </AccordionDetails>
              </Accordion>
            ))}
          </Container>
        </Box>

        {/* Contact Section */}
        <Box sx={{ py: { xs: 6, md: 10 }, bgcolor: 'white' }}>
          <Container maxWidth="md">
            <Typography 
              variant="h3" 
              component="h2" 
              align="center" 
              sx={{ 
                mb: 6, 
                fontWeight: 700,
                color: 'text.primary'
              }}
            >
              Need Help?
            </Typography>
            <Grid container spacing={4}>
              <Grid item xs={12} md={6}>
                <Card sx={{ p: 4, height: '100%' }}>
                  <Typography variant="h5" sx={{ mb: 3, fontWeight: 600 }}>
                    Contact Us
                  </Typography>
                  <Box sx={{ mb: 3 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      <Email sx={{ mr: 2, color: 'primary.main' }} />
                      <Typography>support@icct-sas.edu.ph</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      <Phone sx={{ mr: 2, color: 'primary.main' }} />
                      <Typography>(02) 123-4567</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <LocationOn sx={{ mr: 2, color: 'primary.main' }} />
                      <Typography>ICCT Colleges Cainta, Rizal</Typography>
                    </Box>
                  </Box>
                  <Typography variant="body1" color="text.secondary">
                    Our support team is ready to assist you with any questions about ICCT-SAS.
                  </Typography>
                </Card>
              </Grid>
              <Grid item xs={12} md={6}>
                <Card sx={{ p: 4 }}>
                  <form>
                    <TextField
                      fullWidth
                      label="Full Name"
                      variant="outlined"
                      margin="normal"
                      required
                    />
                    <TextField
                      fullWidth
                      label="Email Address"
                      variant="outlined"
                      margin="normal"
                      required
                      type="email"
                    />
                    <TextField
                      fullWidth
                      label="Message"
                      variant="outlined"
                      margin="normal"
                      multiline
                      rows={4}
                    />
                    <Button
                      variant="contained"
                      size="large"
                      fullWidth
                      sx={{ mt: 3 }}
                    >
                      Send Message
                    </Button>
                  </form>
                </Card>
              </Grid>
            </Grid>
          </Container>
        </Box>

        {/* Footer */}
        <Box 
          sx={{ 
            bgcolor: 'primary.main',
            color: 'white',
            py: 6
          }}
        >
          <Container maxWidth="lg">
            <Grid container spacing={4}>
              <Grid item xs={12} md={4}>
                <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                  ICCT Smart Attendance System
                </Typography>
                <Typography variant="body2" sx={{ mb: 2, opacity: 0.8 }}>
                  Transforming classroom management at ICCT Colleges Cainta.
                </Typography>
                <Box sx={{ display: 'flex', gap: 2 }}>
                  <IconButton color="inherit">
                    <Facebook />
                  </IconButton>
                  <IconButton color="inherit">
                    <Twitter />
                  </IconButton>
                  <IconButton color="inherit">
                    <LinkedIn />
                  </IconButton>
                  <IconButton color="inherit">
                    <YouTube />
                  </IconButton>
                </Box>
              </Grid>
              <Grid item xs={12} md={4}>
                <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                  Quick Links
                </Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  <MuiLink href="/about" color="inherit" underline="hover">About ICCT-SAS</MuiLink>
                  <MuiLink href="/features" color="inherit" underline="hover">Features</MuiLink>
                  <MuiLink href="/support" color="inherit" underline="hover">Support</MuiLink>
                  <MuiLink href="/contact" color="inherit" underline="hover">Contact</MuiLink>
                </Box>
              </Grid>
              <Grid item xs={12} md={4}>
                <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                  Legal
                </Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  <MuiLink href="/privacy" color="inherit" underline="hover">Privacy Policy</MuiLink>
                  <MuiLink href="/terms" color="inherit" underline="hover">Terms of Service</MuiLink>
                  <MuiLink href="/cookies" color="inherit" underline="hover">Cookie Policy</MuiLink>
                </Box>
              </Grid>
            </Grid>
            <Box 
              sx={{ 
                mt: 4, 
                pt: 4, 
                borderTop: '1px solid rgba(255,255,255,0.1)',
                textAlign: 'center'
              }}
            >
              <Typography variant="body2" sx={{ opacity: 0.8 }}>
                © {new Date().getFullYear()} ICCT Colleges Cainta. All rights reserved.
              </Typography>
            </Box>
          </Container>
        </Box>
      </Box>
    </Box>
  );
} 