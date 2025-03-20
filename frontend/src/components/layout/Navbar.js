import React from 'react';
import { AppBar, Toolbar, Button, Box, Container } from '@mui/material';
import { styled } from '@mui/material/styles';

const StyledAppBar = styled(AppBar)(({ theme }) => ({
  backgroundColor: 'white',
  boxShadow: 'none',
  borderBottom: '1px solid #E5E7EB',
}));

const NavButton = styled(Button)(({ theme }) => ({
  color: '#1F2937',
  textTransform: 'none',
  fontWeight: 500,
  '&:hover': {
    backgroundColor: 'transparent',
  },
}));

const Navbar = () => {
  return (
    <StyledAppBar position="fixed">
      <Container maxWidth="lg">
        <Toolbar disableGutters>
          <Box sx={{ flexGrow: 1, display: 'flex', alignItems: 'center' }}>
            <img src="/logo.png" alt="TapBill" height="40" />
          </Box>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <NavButton>Features</NavButton>
            <NavButton>How it works</NavButton>
            <NavButton>Pricing</NavButton>
            <NavButton>Contact</NavButton>
            <Button
              variant="contained"
              sx={{
                backgroundColor: '#3B82F6',
                color: 'white',
                textTransform: 'none',
                '&:hover': {
                  backgroundColor: '#2563EB',
                },
              }}
            >
              Get Started
            </Button>
          </Box>
        </Toolbar>
      </Container>
    </StyledAppBar>
  );
};

export default Navbar; 