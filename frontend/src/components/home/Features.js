import React from 'react';
import { Box, Container, Typography, Grid, Paper } from '@mui/material';
import { styled } from '@mui/material/styles';
import ReceiptIcon from '@mui/icons-material/Receipt';
import NotificationsIcon from '@mui/icons-material/Notifications';
import AnalyticsIcon from '@mui/icons-material/Analytics';
import SecurityIcon from '@mui/icons-material/Security';

const FeaturesSection = styled(Box)(({ theme }) => ({
  padding: '80px 0',
  backgroundColor: 'white',
}));

const FeatureCard = styled(Paper)(({ theme }) => ({
  padding: '32px',
  height: '100%',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'flex-start',
  border: '1px solid #E5E7EB',
  borderRadius: '12px',
  transition: 'all 0.3s ease',
  '&:hover': {
    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
  },
}));

const FeatureIcon = styled(Box)(({ theme }) => ({
  width: '48px',
  height: '48px',
  borderRadius: '12px',
  backgroundColor: '#EFF6FF',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  marginBottom: '24px',
  '& svg': {
    fontSize: '24px',
    color: '#3B82F6',
  },
}));

const features = [
  {
    icon: <ReceiptIcon />,
    title: 'Bill Management',
    description: 'Organize and track all your bills in one place with our intuitive interface.',
  },
  {
    icon: <NotificationsIcon />,
    title: 'Smart Reminders',
    description: 'Never miss a payment with customizable reminders and notifications.',
  },
  {
    icon: <AnalyticsIcon />,
    title: 'Spending Analytics',
    description: 'Get insights into your spending patterns with detailed analytics and reports.',
  },
  {
    icon: <SecurityIcon />,
    title: 'Secure Payments',
    description: 'Your data is protected with bank-level security and encryption.',
  },
];

const Features = () => {
  return (
    <FeaturesSection>
      <Container maxWidth="lg">
        <Box sx={{ textAlign: 'center', mb: 6 }}>
          <Typography
            variant="h2"
            sx={{
              fontSize: '2.5rem',
              fontWeight: 700,
              color: '#111827',
              mb: 2,
            }}
          >
            Features that make TapBill special
          </Typography>
          <Typography
            variant="h6"
            sx={{
              color: '#6B7280',
              maxWidth: '600px',
              margin: '0 auto',
            }}
          >
            Everything you need to manage your bills efficiently and securely
          </Typography>
        </Box>
        <Grid container spacing={4}>
          {features.map((feature, index) => (
            <Grid item xs={12} sm={6} md={3} key={index}>
              <FeatureCard>
                <FeatureIcon>{feature.icon}</FeatureIcon>
                <Typography
                  variant="h6"
                  sx={{
                    fontWeight: 600,
                    color: '#111827',
                    mb: 2,
                  }}
                >
                  {feature.title}
                </Typography>
                <Typography
                  sx={{
                    color: '#6B7280',
                  }}
                >
                  {feature.description}
                </Typography>
              </FeatureCard>
            </Grid>
          ))}
        </Grid>
      </Container>
    </FeaturesSection>
  );
};

export default Features; 