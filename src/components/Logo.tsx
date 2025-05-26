'use client';

import { School, Radio } from 'lucide-react';
import Link from 'next/link';
import { Box, Typography } from '@mui/material';

interface LogoProps {
  variant?: 'default' | 'compact';
}

export default function Logo({ variant = 'default' }: LogoProps) {
  return (
    <Link href="/dashboard" style={{ textDecoration: 'none' }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, transition: 'opacity 0.2s', '&:hover': { opacity: 0.9 } }}>
        <Box
          sx={{
            background: 'linear-gradient(135deg, #1a237e 0%, #1976d2 100%)',
            p: 1.5,
            borderRadius: 2,
            boxShadow: 1,
            position: 'relative',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            minWidth: 44,
            minHeight: 44,
          }}
        >
          <School style={{ width: 28, height: 28, color: '#fff' }} />
          <Box
            sx={{
              position: 'absolute',
              top: 2,
              right: 2,
              background: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
              p: 0.5,
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Radio style={{ width: 12, height: 12, color: '#fff' }} />
          </Box>
        </Box>
        <Box sx={{ display: variant === 'compact' ? 'block' : { xs: 'none', lg: 'block' } }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <Typography
              variant="h6"
              sx={{
                fontWeight: 700,
                background: 'linear-gradient(90deg, #212121 0%, #616161 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
                fontSize: 22,
                letterSpacing: 1,
              }}
            >
              ICCT
            </Typography>
            <Typography variant="h6" sx={{ fontWeight: 700, color: 'primary.main', fontSize: 22, letterSpacing: 1 }}>
              RFID
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <Typography variant="body2" sx={{ fontWeight: 600, color: 'grey.700' }}>Smart</Typography>
            <Typography variant="body2" sx={{ fontWeight: 600, color: 'grey.700' }}>Attendance</Typography>
            <Typography variant="body2" sx={{ fontWeight: 600, color: 'grey.700' }}>System</Typography>
          </Box>
        </Box>
      </Box>
    </Link>
  );
} 