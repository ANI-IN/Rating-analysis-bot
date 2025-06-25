//frontend/src/pages/Dashboard.js
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, LogOut, Shield, BarChart } from 'lucide-react';
import RatingAnalyzer from '../components/RatingAnalyzer';

const Dashboard = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/');
      return;
    }

    try {
      const tokenParts = token.split('.');
      const payload = JSON.parse(atob(tokenParts[1]));
      setUser(payload);
    } catch (error) {
      console.error('Error decoding token:', error);
      navigate('/');
    }
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              {/* Logo component */}
              <div className="flex items-center">
                {imageLoaded ? (
                  <img 
                    src="/interviewkickstart-logo.svg" 
                    alt="Interview Kickstart Logo" 
                    className="h-10" 
                    onError={() => {
                      console.error("Logo failed to load");
                      setImageLoaded(false);
                    }}
                  />
                ) : (
                  <div className="flex items-center gap-2">
                    <span className="text-blue-500 font-bold text-2xl">{'{'}<span className="font-bold">ik</span>{'}'}</span>
                    <span className="text-blue-500 font-medium text-xl">INTERVIEW KICKSTART</span>
                  </div>
                )}
              </div>
            </div>
            <div className="flex items-center">
              <button
                onClick={handleLogout}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <LogOut className="mr-2 h-4 w-4" />
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900">
              Welcome to Your Dashboard
            </h1>
            <p className="mt-2 text-lg text-gray-600">
              Your journey to mastering tech interviews starts here!
            </p>
            {/* Display user info if available */}
            {user && (
              <p className="mt-2 text-sm text-gray-500">
                Logged in as user ID: {user.id}
              </p>
            )}
          </div>

          {/* Rating Analyzer Section */}
          <div className="mb-8">
            <RatingAnalyzer />
          </div>

          {/* Additional Content */}
          <div className="mt-8">
            <div className="bg-white shadow overflow-hidden sm:rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <div className="space-y-4">
                  <p className="text-gray-700">
                    The Rating Analyzer helps you gain insights from session ratings using natural language queries. 
                    Simply type your question, and our AI-powered system will analyze the data and provide answers.
                  </p>
                  
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <h3 className="text-blue-800 font-medium">Example Questions You Can Ask:</h3>
                    <ul className="mt-2 text-blue-700 space-y-1 list-disc pl-5">
                      <li>What is the instructor-wise average rating in Q2?</li>
                      <li>Which cohort had the highest average rating in Q1?</li>
                      <li>List all topics taught by a specific instructor along with their ratings.</li>
                      <li>Which sessions were held on a specific date?</li>
                      <li>Compare feedback ratings between different cohorts.</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;