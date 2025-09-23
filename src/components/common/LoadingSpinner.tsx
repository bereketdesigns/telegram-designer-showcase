import React from 'react';

const LoadingSpinner: React.FC = () => {
  return (
    <div className="flex flex-col justify-center items-center h-screen bg-gray-50">
      <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500"></div>
      <p className="ml-4 text-gray-700 mt-4 text-lg">Loading Telegram Mini App...</p>
    </div>
  );
};

export default LoadingSpinner;