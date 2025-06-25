//frontend/src/components/LoadingSpinner.js
import React from 'react';
import { Loader } from 'lucide-react';

const LoadingSpinner = ({ size = 20, color = '#3da5f5' }) => {
  return (
    <div className="flex items-center justify-center">
      <Loader 
        className="animate-spin" 
        size={size} 
        color={color}
      />
    </div>
  );
};

export default LoadingSpinner;