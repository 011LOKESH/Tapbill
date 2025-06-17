import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";

const FOOD_IMAGE_URL = "https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=800&q=80"; // Unsplash ramen image
const IMAGE_ATTRIBUTION = "Photo by Monika Grabkowska on Unsplash";
const IMAGE_ATTRIBUTION_URL = "https://unsplash.com/photos/3ZLDdR7x52w";

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    // Check if user is already logged in
    const session = localStorage.getItem('userSession');
    if (session) {
      const { timestamp } = JSON.parse(session);
      const now = new Date().getTime();
      // Check if session is less than 12 hours old
      if (now - timestamp < 12 * 60 * 60 * 1000) {
        navigate('/dashboard');
      } else {
        localStorage.removeItem('userSession');
      }
    }
  }, [navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch('http://localhost:5000/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });

      if (response.ok) {
        const data = await response.json();
        // Store session with timestamp
        localStorage.setItem('userSession', JSON.stringify({
          token: data.token,
          timestamp: new Date().getTime()
        }));
        toast.success('Login successful!');
        navigate('/dashboard');
      } else {
        toast.error('Invalid credentials');
      }
    } catch (error) {
      toast.error('An error occurred during login');
    }
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      {/* Left: Food Image */}
      <div className="hidden md:flex w-1/2 h-screen items-center justify-center bg-gradient-to-br from-red-700 via-orange-600 to-yellow-400 relative">
        <img
          src={FOOD_IMAGE_URL}
          alt="Ramen bowl"
          className="object-cover w-full h-full brightness-90"
        />
        <div className="absolute bottom-2 right-4 text-xs text-white/80 bg-black/40 px-2 py-1 rounded">
          <a href={IMAGE_ATTRIBUTION_URL} target="_blank" rel="noopener noreferrer">
            {IMAGE_ATTRIBUTION}
          </a>
        </div>
      </div>
      {/* Right: Login Form */}
      <div className="flex w-full md:w-1/2 min-h-screen items-center justify-center bg-gradient-to-br from-red-700 via-orange-600 to-yellow-400">
        <div className="max-w-md w-full mx-4">
          <Card className="p-10 shadow-2xl border-0 bg-white/90 backdrop-blur-xl">
            <div className="text-center mb-8">
              <h1 className="text-5xl font-extrabold text-red-700 drop-shadow-lg">Tapbill</h1>
              <p className="text-lg text-orange-700 mt-2 font-semibold">It's that simple.</p>
              <p className="text-gray-600 mt-2">Sign in to continue</p>
            </div>
            <form onSubmit={handleLogin} className="space-y-6">
              <div className="space-y-2">
                <label htmlFor="username" className="text-sm font-medium text-gray-700">
                  Username
                </label>
                <Input
                  id="username"
                  type="text"
                  placeholder="Enter your username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  className="w-full bg-white/70 border-gray-200 focus:border-red-500 focus:ring-red-500"
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="password" className="text-sm font-medium text-gray-700">
                  Password
                </label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full bg-white/70 border-gray-200 focus:border-red-500 focus:ring-red-500"
                />
              </div>
              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-red-700 via-orange-600 to-yellow-400 hover:from-red-800 hover:to-yellow-500 text-white font-bold py-2.5 rounded-lg text-lg transition-all duration-200 transform hover:scale-[1.03] shadow-lg"
              >
                Sign In
              </Button>
            </form>
            <div className="mt-6 text-center">
              <p className="text-sm text-gray-600">
                Don't have an account?{' '}
                <a href="/register" className="text-red-700 hover:text-orange-700 font-medium hover:underline">
                  Sign up
                </a>
              </p>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Login; 