//frontend/src/pages/AuthCallback.js
import { useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import LoadingSpinner from '../components/LoadingSpinner';

const AuthCallback = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  useEffect(() => {
    const token = searchParams.get('token');
    if (token) {
      localStorage.setItem('token', token);
      // Redirect to dashboard or home page
      navigate('/dashboard'); // Change this to your desired route
    } else {
      navigate('/');
    }
  }, [searchParams, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <LoadingSpinner size={40} />
        <p className="mt-4 text-gray-600">Authenticating...</p>
      </div>
    </div>
  );
};

export default AuthCallback;