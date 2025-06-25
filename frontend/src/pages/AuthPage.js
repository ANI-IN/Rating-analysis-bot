//frontend/src/pages/AuthPage.js
import React, { useState } from 'react';
import { Mail, Lock, User, CheckCircle } from 'lucide-react';
import { authAPI } from '../services/api';  // Make sure this import is correct
import LoadingSpinner from '../components/LoadingSpinner';

// Color palette
const colors = {
  primary: '#3da5f5',
  background: '#ffffff',
  darkText: '#1a202c',
  lightText: '#718096',
  cardBg: '#f7fafc',
  highlightBg: {
    pink: '#fef2f2',
    yellow: '#fef9c3',
    purple: '#f3e8ff',
    green: '#ecfdf5'
  }
};

const styles = {
  fontFamily: "'Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', sans-serif",
};

// In AuthPage.js, at the top of the component
console.log('authAPI object:', authAPI);
console.log('verifyOTP function:', authAPI.verifyOTP);

export default function AuthPage() {
  const [activeTab, setActiveTab] = useState('login');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    otp: ''
  });
  const [step, setStep] = useState('form'); // form, verify, forgot, reset
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      if (activeTab === 'register' && step === 'form') {
        // Validate passwords match
        if (formData.password !== formData.confirmPassword) {
          throw new Error('Passwords do not match');
        }
        
        const response = await authAPI.register({
          name: formData.name,
          email: formData.email,
          password: formData.password
        });
        
        if (response.success) {
          setSuccess('Registration successful! Please check your email for OTP.');
          setStep('verify');
        } else {
          throw new Error(response.message);
        }
      } 
      else if (activeTab === 'register' && step === 'verify') {
        const response = await authAPI.verifyOTP({
          email: formData.email,
          otp: formData.otp
        });
        
        if (response.success) {
          localStorage.setItem('token', response.token);
          setSuccess('Email verified successfully!');
          // Redirect to dashboard after delay
          setTimeout(() => {
            window.location.href = '/dashboard';
          }, 2000);
        } else {
          throw new Error(response.message);
        }
      }
      else if (activeTab === 'login' && step === 'form') {
        const response = await authAPI.login({
          email: formData.email,
          password: formData.password
        });
        
        if (response.success) {
          localStorage.setItem('token', response.token);
          setSuccess('Login successful!');
          // Redirect to dashboard after delay
          setTimeout(() => {
            window.location.href = '/dashboard';
          }, 2000);
        } else {
          throw new Error(response.message);
        }
      }
      else if (step === 'forgot') {
        const response = await authAPI.forgotPassword({
          email: formData.email
        });
        
        if (response.success) {
          setSuccess('Password reset OTP sent to your email.');
          setStep('reset');
        } else {
          throw new Error(response.message);
        }
      }
      else if (step === 'reset') {
        const response = await authAPI.resetPassword({
          email: formData.email,
          otp: formData.otp,
          newPassword: formData.password
        });
        
        if (response.success) {
          setSuccess('Password reset successful! Please login with your new password.');
          setStep('form');
          setActiveTab('login');
          setFormData(prev => ({ ...prev, password: '', otp: '' }));
        } else {
          throw new Error(response.message);
        }
      }
    } catch (err) {
      setError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    authAPI.googleLogin();
  };

  const renderAuthForm = () => (
    <div className="w-full max-w-md mx-auto p-8 bg-white rounded-2xl shadow-lg" style={styles}>
      {/* Logo */}
      <div className="flex items-center gap-2 mb-2">
          <img
            src="/interviewkickstart-logo.svg"
            alt="Interview Kickstart Logo"
            className="h-10"
            onError={(e) => {
              e.target.onerror = null;
              e.target.style.display = 'none';
            }}
          />
          <br />
          <br />
      </div>

      {/* Tab Navigation */}
      <div className="flex mb-6 p-1 bg-gray-100 rounded-lg">
        <button
          onClick={() => {
            setActiveTab('login');
            setStep('form');
            setError('');
            setSuccess('');
          }}
          className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all ${
            activeTab === 'login' 
              ? 'bg-white shadow-sm' 
              : 'hover:bg-gray-50'
          }`}
          style={{ 
            color: activeTab === 'login' ? colors.primary : colors.darkText 
          }}
        >
          Sign In
        </button>
        <button
          onClick={() => {
            setActiveTab('register');
            setStep('form');
            setError('');
            setSuccess('');
          }}
          className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all ${
            activeTab === 'register' 
              ? 'bg-white shadow-sm' 
              : 'hover:bg-gray-50'
          }`}
          style={{ 
            color: activeTab === 'register' ? colors.primary : colors.darkText 
          }}
        >
          Register
        </button>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
          {error}
        </div>
      )}

      {success && (
        <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg text-green-600 text-sm">
          {success}
        </div>
      )}

      {/* Form Content */}
      <form onSubmit={handleSubmit} className="space-y-4">
        {activeTab === 'register' && step === 'form' && (
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: colors.darkText }}>
              Full Name
            </label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-transparent outline-none"
                placeholder="Enter your full name"
                required
              />
            </div>
          </div>
        )}

        {(step === 'form' || step === 'forgot' || step === 'verify' || step === 'reset') && (
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: colors.darkText }}>
              Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-transparent outline-none"
                placeholder="Enter your email"
                required
                disabled={step === 'verify' || step === 'reset'}
              />
            </div>
          </div>
        )}

        {(step === 'form' || step === 'reset') && step !== 'forgot' && (
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: colors.darkText }}>
              {step === 'reset' ? 'New Password' : 'Password'}
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-transparent outline-none"
                placeholder={step === 'reset' ? 'Enter new password' : 'Enter your password'}
                required
              />
            </div>
          </div>
        )}

        {activeTab === 'register' && step === 'form' && (
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: colors.darkText }}>
              Confirm Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="password"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleInputChange}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-transparent outline-none"
                placeholder="Confirm your password"
                required
              />
            </div>
          </div>
        )}

        {(step === 'verify' || step === 'reset') && (
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: colors.darkText }}>
              Verification Code
            </label>
            <div className="relative">
              <CheckCircle className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="text"
                name="otp"
                value={formData.otp}
                onChange={handleInputChange}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-transparent outline-none"
                placeholder="Enter 6-digit code"
                maxLength={6}
                required
              />
            </div>
            <p className="mt-1 text-xs" style={{ color: colors.lightText }}>
              We've sent a verification code to your email
            </p>
          </div>
        )}

        {activeTab === 'login' && step === 'form' && (
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <input
                type="checkbox"
                id="remember"
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="remember" className="ml-2 block text-sm" style={{ color: colors.darkText }}>
                Remember me
              </label>
            </div>
            <button
              type="button"
              onClick={() => {
                setStep('forgot');
                setError('');
                setSuccess('');
              }}
              className="text-sm font-medium"
              style={{ color: colors.primary }}
            >
              Forgot password?
            </button>
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full py-2.5 px-4 rounded-lg text-white font-medium transition-all duration-200 flex items-center justify-center"
          style={{ 
            backgroundColor: loading ? colors.lightText : colors.primary,
            cursor: loading ? 'not-allowed' : 'pointer'
          }}
        >
          {loading ? (
            <LoadingSpinner size={20} color="#ffffff" />
          ) : (
            <>
              {step === 'verify' && 'Verify Email'}
              {step === 'reset' && 'Reset Password'}
              {step === 'forgot' && 'Send Reset Code'}
              {step === 'form' && (activeTab === 'login' ? 'Sign In' : 'Create Account')}
            </>
          )}
        </button>

        {step === 'forgot' && (
          <button
            type="button"
            onClick={() => {
              setStep('form');
              setError('');
              setSuccess('');
            }}
            className="w-full py-2.5 px-4 rounded-lg border border-gray-300 text-gray-700 font-medium transition-all duration-200"
          >
            Back to Login
          </button>
        )}
      </form>

      {/* Divider */}
      <div className="relative my-6">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-gray-300"></div>
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="px-2 bg-white" style={{ color: colors.lightText }}>
            Or continue with
          </span>
        </div>
      </div>

      {/* Google Sign In */}
      <button
        type="button"
        onClick={handleGoogleLogin}
        className="w-full flex items-center justify-center gap-3 py-2.5 px-4 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
      >
        <svg className="w-5 h-5" viewBox="0 0 48 48">
          <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
          <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
          <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
          <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
        </svg>
        <span style={{ color: colors.darkText }}>Sign in with Google</span>
      </button>

      {/* Footer Text */}
      <p className="mt-6 text-center text-sm" style={{ color: colors.lightText }}>
        {activeTab === 'login' ? (
          <>
            Don't have an account?{' '}
            <button
              type="button"
              onClick={() => {
                setActiveTab('register');
                setStep('form');
                setError('');
                setSuccess('');
              }}
              className="font-medium"
              style={{ color: colors.primary }}
            >
              Sign up
            </button>
          </>
        ) : (
          <>
            Already have an account?{' '}
            <button
              type="button"
              onClick={() => {
                setActiveTab('login');
                setStep('form');
                setError('');
                setSuccess('');
              }}
              className="font-medium"
              style={{ color: colors.primary }}
            >
              Sign in
            </button>
          </>
        )}
      </p>
    </div>
  );

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      {renderAuthForm()}
    </div>
  );
}