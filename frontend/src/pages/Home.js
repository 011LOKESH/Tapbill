import React from 'react';
import { Box } from '@mui/material';
import Navbar from '../components/layout/Navbar';
import Hero from '../components/home/Hero';
import Features from '../components/home/Features';

const Home = () => {
  return (
    <Box>
      <Navbar />
      <Hero />
      <Features />
    </Box>
  );
};

export default Home; 