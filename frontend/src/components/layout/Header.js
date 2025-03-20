import React from 'react';
import { AppBar, Toolbar, Typography, Box, Button } from '@mui/material';

const Header = () => {
  return (
    <AppBar 
      position="fixed" 
      sx={{ 
        bgcolor: 'white', 
        color: '#1A1A1A',
        boxShadow: 'none',
        borderBottom: '1px solid #E5E7EB'
      }}
    >
      <Toolbar sx={{ justifyContent: 'space-between', minHeight: '56px' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography sx={{ fontSize: '20px', fontWeight: 500 }}>
              ≡
            </Typography>
            <Typography sx={{ fontSize: '16px', fontWeight: 500 }}>
              TapBill
            </Typography>
          </Box>
          <Typography 
            sx={{ 
              fontSize: '14px', 
              color: '#4B5563',
              cursor: 'pointer'
            }}
          >
            Menu
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
          <Button
            sx={{
              bgcolor: '#4ADE80',
              color: '#1A1A1A',
              textTransform: 'none',
              fontSize: '14px',
              fontWeight: 500,
              borderRadius: '6px',
              padding: '6px 12px',
              '&:hover': {
                bgcolor: '#22C55E'
              }
            }}
          >
            Version 1.0
          </Button>
          <Typography sx={{ color: '#4B5563', fontSize: '14px' }}>
            {new Date().toLocaleString('en-US', {
              year: 'numeric',
              month: '2-digit',
              day: '2-digit',
              hour: '2-digit',
              minute: '2-digit',
              hour12: false
            })}
          </Typography>
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default Header; 