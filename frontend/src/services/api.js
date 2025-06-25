//frontend/src/services/api.js
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001/api';

export const authAPI = {
  test: async () => {
    try {
      const response = await fetch(`${API_URL.replace('/api', '')}/test`);
      const data = await response.json();
      console.log('Test response:', data);
      return data;
    } catch (error) {
      console.error('Test failed:', error);
      throw error;
    }
  },

  register: async (data) => {
    try {
      const response = await fetch(`${API_URL}/auth/register`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Registration failed');
      }
      
      return response.json();
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    }
  },

  verifyOTP: async (data) => {
    try {
      const response = await fetch(`${API_URL}/auth/verify-otp`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'OTP verification failed');
      }
      
      return response.json();
    } catch (error) {
      console.error('OTP verification error:', error);
      throw error;
    }
  },

  login: async (data) => {
    try {
      const response = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Login failed');
      }
      
      return response.json();
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  },

  forgotPassword: async (data) => {
    try {
      const response = await fetch(`${API_URL}/auth/forgot-password`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Password reset request failed');
      }
      
      return response.json();
    } catch (error) {
      console.error('Forgot password error:', error);
      throw error;
    }
  },

  resetPassword: async (data) => {
    try {
      const response = await fetch(`${API_URL}/auth/reset-password`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Password reset failed');
      }
      
      return response.json();
    } catch (error) {
      console.error('Reset password error:', error);
      throw error;
    }
  },

  googleLogin: () => {
    window.location.href = `${API_URL}/auth/google`;
  },
};

export const ratingAPI = {
  analyzeQuery: async (query) => {
    try {
      const token = localStorage.getItem('token');
      
      if (!token) {
        throw new Error('Authentication required');
      }
      
      const response = await fetch(`${API_URL}/rating-analyzer`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ query }),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Query analysis failed');
      }
      
      return response.json();
    } catch (error) {
      console.error('Rating analyzer error:', error);
      throw error;
    }
  },
};