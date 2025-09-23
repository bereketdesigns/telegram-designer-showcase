// This component will be populated in Part 2: Authentication & User Flow
import React from 'react';

const LoadingSpinner: React.FC = () => {
  return (
    <div className="flex flex-col justify-center items-center h-screen bg-gray-50">
      <p className="text-gray-700 text-lg">Loading...</p>
    </div>
  );
};

export default LoadingSpinner;