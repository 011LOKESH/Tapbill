import React, { useState, useMemo } from 'react';
import {
  Box,
  TextField,
  IconButton,
  Typography,
  Button,
  Paper,
  Grid,
  List,
  ListItem,
  ListItemText,
  Divider,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';
import ShareIcon from '@mui/icons-material/Share';
import Header from '../components/layout/Header';

const menuCategories = [
  { id: 1, name: 'Tiffen & Roast' },
  { id: 2, name: 'Biryani' },
  { id: 3, name: 'Parotta' },
  { id: 4, name: 'Rice' },
  { id: 5, name: 'Noodles' },
  { id: 6, name: 'Egg' },
  { id: 7, name: 'Grill & Tandoori' },
  { id: 8, name: 'Roti & Naan' },
  { id: 9, name: 'Non-Veg Gravy & Dry' },
  { id: 10, name: 'Veg Gravy & Dry' },
  { id: 11, name: 'Soup' },
];

const menuItems = [
  { id: 1, name: 'IDLY', price: 10.00, category: 1 },
  { id: 2, name: 'PONGAL', price: 30.00, category: 1 },
  { id: 3, name: 'POORI', price: 20.00, category: 1 },
  { id: 4, name: 'CHOLA POORI', price: 40.00, category: 1 },
  { id: 5, name: 'UTHAPAM', price: 15.00, category: 1 },
  { id: 6, name: 'ROAST', price: 40.00, category: 1 },
  { id: 7, name: 'MASALA ROAST', price: 50.00, category: 1 },
  { id: 8, name: 'EGG ROAST', price: 50.00, category: 6 },
];

const Dashboard = () => {
  const [selectedCategory, setSelectedCategory] = useState(1);
  const [cart, setCart] = useState([]);
  const [customerName, setCustomerName] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredMenuItems = useMemo(() => 
    menuItems.filter(item => item.category === selectedCategory),
    [selectedCategory]
  );

  const total = useMemo(() => 
    cart.reduce((sum, item) => sum + item.price * item.quantity, 0),
    [cart]
  );

  const addToCart = (item) => {
    setCart(prevCart => {
      const existingItem = prevCart.find(cartItem => cartItem.id === item.id);
      if (existingItem) {
        return prevCart.map(cartItem =>
          cartItem.id === item.id
            ? { ...cartItem, quantity: cartItem.quantity + 1 }
            : cartItem
        );
      }
      return [...prevCart, { ...item, quantity: 1 }];
    });
  };

  const removeFromCart = (itemId) => {
    setCart(prevCart => {
      const existingItem = prevCart.find(cartItem => cartItem.id === itemId);
      if (existingItem.quantity === 1) {
        return prevCart.filter(cartItem => cartItem.id !== itemId);
      }
      return prevCart.map(cartItem =>
        cartItem.id === itemId
          ? { ...cartItem, quantity: cartItem.quantity - 1 }
          : cartItem
      );
    });
  };

  return (
    <Box>
      <Header />
      <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: '#F9FAFB', pt: '57px' }}>
        {/* Left Panel - Cart */}
        <Box sx={{ width: 400, bgcolor: 'white', borderRight: '1px solid #E5E7EB', p: 2 }}>
          <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
            <TextField
              placeholder="Add Customer +"
              size="small"
              fullWidth
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: '6px',
                  fontSize: '14px',
                }
              }}
            />
            <TextField
              placeholder="Customer Name"
              size="small"
              fullWidth
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: '6px',
                  fontSize: '14px',
                }
              }}
            />
          </Box>

          <TextField
            placeholder="Search by Code/Barcode/Name"
            size="small"
            fullWidth
            sx={{
              mb: 2,
              '& .MuiOutlinedInput-root': {
                borderRadius: '6px',
                fontSize: '14px',
              }
            }}
            InputProps={{
              startAdornment: <SearchIcon sx={{ color: '#9CA3AF', mr: 1 }} />,
            }}
          />

          <Box sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'space-between',
            py: 1,
            borderBottom: '1px solid #E5E7EB',
            color: '#4B5563',
            fontSize: '14px'
          }}>
            <Typography sx={{ flex: 1 }}>Item</Typography>
            <Typography sx={{ width: 40, textAlign: 'center' }}>Qty</Typography>
            <Typography sx={{ width: 80, textAlign: 'right' }}>Price</Typography>
            <Typography sx={{ width: 80, textAlign: 'right' }}>Total</Typography>
          </Box>

          <Box sx={{ flex: 1, overflow: 'auto' }}>
            {cart.map((item) => (
              <Box
                key={item.id}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  py: 1,
                  borderBottom: '1px solid #E5E7EB',
                }}
              >
                <Typography sx={{ flex: 1, fontSize: '14px' }}>{item.name}</Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, width: 40, justifyContent: 'center' }}>
                  <IconButton size="small" onClick={() => removeFromCart(item.id)}>
                    <RemoveIcon sx={{ fontSize: 16 }} />
                  </IconButton>
                  <Typography sx={{ fontSize: '14px' }}>{item.quantity}</Typography>
                  <IconButton size="small" onClick={() => addToCart(item)}>
                    <AddIcon sx={{ fontSize: 16 }} />
                  </IconButton>
                </Box>
                <Typography sx={{ width: 80, textAlign: 'right', fontSize: '14px' }}>
                  ₹{item.price.toFixed(2)}
                </Typography>
                <Typography sx={{ width: 80, textAlign: 'right', fontSize: '14px' }}>
                  ₹{(item.price * item.quantity).toFixed(2)}
                </Typography>
              </Box>
            ))}
          </Box>

          <Box sx={{ mt: 2 }}>
            <Typography sx={{ textAlign: 'right', fontSize: '16px', fontWeight: 500 }}>
              Net Amount: ₹{total.toFixed(2)}
            </Typography>
          </Box>
        </Box>

        {/* Right Panel - Menu */}
        <Box sx={{ flex: 1, p: 2 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
            <Button
              variant="contained"
              sx={{
                bgcolor: '#4ADE80',
                color: '#1A1A1A',
                fontSize: '14px',
                fontWeight: 500,
                borderRadius: '6px',
                textTransform: 'none',
                '&:hover': { bgcolor: '#22C55E' }
              }}
            >
              PAY ₹{total.toFixed(2)}
            </Button>
            <Button
              variant="contained"
              sx={{
                bgcolor: '#4ADE80',
                color: '#1A1A1A',
                fontSize: '14px',
                fontWeight: 500,
                borderRadius: '6px',
                textTransform: 'none',
                '&:hover': { bgcolor: '#22C55E' }
              }}
            >
              Print Bill
            </Button>
          </Box>

          <Box sx={{ display: 'flex', gap: 2 }}>
            <Box sx={{ width: 280 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <Box sx={{ width: 32, height: 32, borderRadius: '6px', bgcolor: '#E5E7EB', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Typography sx={{ fontSize: '20px' }}>≡</Typography>
                </Box>
                <Typography sx={{ fontSize: '14px', fontWeight: 500 }}>Menu Categories</Typography>
                <Typography sx={{ fontSize: '12px', color: '#6B7280' }}>Select a category</Typography>
              </Box>
              <List sx={{ 
                bgcolor: 'white', 
                borderRadius: '6px',
                border: '1px solid #E5E7EB',
                '& .MuiListItem-root': {
                  borderRadius: '4px',
                  mb: 0.5,
                }
              }}>
                {menuCategories.map((category) => (
                  <ListItem
                    key={category.id}
                    button
                    selected={selectedCategory === category.id}
                    onClick={() => setSelectedCategory(category.id)}
                    sx={{
                      '&.Mui-selected': {
                        bgcolor: '#F3F4F6',
                        '&:hover': {
                          bgcolor: '#F3F4F6',
                        }
                      }
                    }}
                  >
                    <ListItemText 
                      primary={category.name} 
                      primaryTypographyProps={{
                        fontSize: '14px',
                        color: selectedCategory === category.id ? '#1A1A1A' : '#6B7280'
                      }}
                    />
                  </ListItem>
                ))}
              </List>
            </Box>

            <Box sx={{ flex: 1 }}>
              <Typography sx={{ position: 'absolute', right: 24, color: '#6B7280', fontSize: '14px' }}>
                MENU CARD
              </Typography>
              <Grid container spacing={2} sx={{ mt: 4 }}>
                {filteredMenuItems.map((item) => (
                  <Grid item xs={4} key={item.id}>
                    <Paper
                      sx={{
                        p: 2,
                        textAlign: 'center',
                        cursor: 'pointer',
                        border: '1px solid #E5E7EB',
                        borderRadius: '6px',
                        boxShadow: 'none',
                        '&:hover': { bgcolor: '#F9FAFB' },
                      }}
                      onClick={() => addToCart(item)}
                    >
                      <Typography sx={{ fontSize: '16px', fontWeight: 500, mb: 1 }}>
                        {item.name}
                      </Typography>
                      <Typography sx={{ color: '#4B5563', fontSize: '14px' }}>
                        ₹{item.price.toFixed(2)}
                      </Typography>
                    </Paper>
                  </Grid>
                ))}
              </Grid>
            </Box>
          </Box>

          <Button
            variant="contained"
            startIcon={<ShareIcon />}
            sx={{
              position: 'fixed',
              bottom: 16,
              left: 416,
              bgcolor: '#4ADE80',
              color: '#1A1A1A',
              fontSize: '14px',
              fontWeight: 500,
              borderRadius: '6px',
              textTransform: 'none',
              '&:hover': { bgcolor: '#22C55E' }
            }}
          >
            ₹120.00 Last Bill
          </Button>
        </Box>
      </Box>
    </Box>
  );
};

export default Dashboard; 