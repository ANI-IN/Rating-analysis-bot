//frontend/src/components/RatingAnalyzer.js
import React, { useState } from 'react';
import { Search, BarChart, SendHorizontal, Loader } from 'lucide-react';
import { ratingAPI } from '../services/api';

const RatingAnalyzer = () => {
  const [query, setQuery] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showExamples, setShowExamples] = useState(false);

  // Example queries to help users get started
  const exampleQueries = [
    "What is the instructor-wise average rating in Q2?",
    "Which cohort had the highest average rating in Q1?",
    "List all topics taught by Siavash Alemzadeh along with their ratings.",
    "Which sessions were held on January 2, 2025?",
    "What is the average rating of sessions taken by Sanatan Sukhija?",
    "Which instructor received the highest overall average rating in Q1 2025?",
    "Which cohort had the lowest response rate in Q2 2025?",
  ];

  const handleQueryChange = (e) => {
    setQuery(e.target.value);
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!query.trim()) {
      setError('Please enter a query');
      return;
    }
    
    setLoading(true);
    setError('');
    setResult(null);
    
    try {
      const response = await ratingAPI.analyzeQuery(query);
      
      if (response.success) {
        setResult(response.data);
      } else {
        throw new Error(response.message || 'Failed to analyze query');
      }
    } catch (err) {
      setError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleExampleClick = (example) => {
    setQuery(example);
    setShowExamples(false);
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-5">
      <div className="mb-5">
        <h2 className="text-2xl font-bold text-gray-800 flex items-center">
          <BarChart className="mr-2" size={24} />
          Rating Analyzer
        </h2>
        <p className="text-gray-600 mt-1">
          Ask natural language questions about your ratings data
        </p>
      </div>

      <form onSubmit={handleSubmit} className="mb-4">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            value={query}
            onChange={handleQueryChange}
            placeholder="Enter your question (e.g., Which instructor had the highest rating in Q2?)"
            className="block w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
          />
          <div className="absolute inset-y-0 right-0 flex py-1.5 pr-1.5">
            <button
              type="button"
              onClick={() => setShowExamples(!showExamples)}
              className="inline-flex items-center px-2 border border-gray-200 rounded text-sm text-gray-600 hover:bg-gray-100"
            >
              Examples
            </button>
            <button
              type="submit"
              disabled={loading || !query.trim()}
              className={`ml-1 inline-flex items-center px-3 py-2 border border-transparent rounded-md text-white ${
                loading || !query.trim() ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'
              }`}
            >
              {loading ? <Loader className="animate-spin" size={18} /> : <SendHorizontal size={18} />}
            </button>
          </div>
        </div>
        
        {error && (
          <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
            {error}
          </div>
        )}
      </form>

      {/* Example queries dropdown */}
      {showExamples && (
        <div className="mb-5 bg-gray-50 rounded-lg p-3 border border-gray-200">
          <h3 className="text-sm font-semibold text-gray-700 mb-2">Example Questions</h3>
          <ul className="space-y-2">
            {exampleQueries.map((example, index) => (
              <li key={index}>
                <button
                  onClick={() => handleExampleClick(example)}
                  className="text-blue-600 hover:text-blue-800 text-sm text-left w-full truncate"
                >
                  {example}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Results section */}
      {result && (
        <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-800 mb-2">Analysis Result</h3>
          <div className="prose max-w-none">
            <p className="whitespace-pre-line text-gray-700">{result}</p>
          </div>
        </div>
      )}

      {/* Helpful tips */}
      <div className="mt-5 text-sm text-gray-500">
        <p className="font-medium mb-1">Tips for better queries:</p>
        <ul className="list-disc pl-5 space-y-1">
          <li>Be specific about time periods (e.g., "Q1 2025", "January", etc.)</li>
          <li>Specify instructors, cohorts, or topics by name when possible</li>
          <li>For comparisons, clearly state what you want to compare</li>
          <li>Keep queries focused on one analysis at a time for best results</li>
        </ul>
      </div>
    </div>
  );
};

export default RatingAnalyzer;