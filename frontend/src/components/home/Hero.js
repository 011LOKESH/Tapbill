import React from 'react';
import { Box, Container, Typography, Button, Grid } from '@mui/material';
import { styled } from '@mui/material/styles';

const HeroSection = styled(Box)(({ theme }) => ({
  paddingTop: '120px',
  paddingBottom: '80px',
  backgroundColor: '#F9FAFB',
}));

const HeroTitle = styled(Typography)(({ theme }) => ({
  fontSize: '3.5rem',
  fontWeight: 700,
  color: '#111827',
  marginBottom: '1.5rem',
  lineHeight: 1.2,
}));

const HeroSubtitle = styled(Typography)(({ theme }) => ({
  fontSize: '1.25rem',
  color: '#4B5563',
  marginBottom: '2rem',
}));

const Hero = () => {
  return (
    <HeroSection>
      <Container maxWidth="lg">
        <Grid container spacing={4} alignItems="center">
          <Grid item xs={12} md={6}>
            <HeroTitle>
              Simplify Your Bill Payments with TapBill
            </HeroTitle>
            <HeroSubtitle>
              Manage all your bills in one place. Get reminders, pay instantly, and track your spending with ease.
            </HeroSubtitle>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <Button
                variant="contained"
                size="large"
                sx={{
                  backgroundColor: '#3B82F6',
                  color: 'white',
                  textTransform: 'none',
                  padding: '12px 24px',
                  '&:hover': {
                    backgroundColor: '#2563EB',
                  },
                }}
              >
                Get Started Free
              </Button>
              <Button
                variant="outlined"
                size="large"
                sx={{
                  borderColor: '#3B82F6',
                  color: '#3B82F6',
                  textTransform: 'none',
                  padding: '12px 24px',
                  '&:hover': {
                    borderColor: '#2563EB',
                    backgroundColor: 'rgba(59, 130, 246, 0.04)',
                  },
                }}
              >
                Watch Demo
              </Button>
            </Box>
          </Grid>
          <Grid item xs={12} md={6}>
            <Box
              component="img"
              src="/hero-image.png"
              alt="TapBill Dashboard"
              sx={{
                width: '100%',
                maxWidth: '600px',
                height: 'auto',
                display: 'block',
                margin: '0 auto',
              }}
            />
          </Grid>
        </Grid>
      </Container>
    </HeroSection>
  );
};

export default Hero; 