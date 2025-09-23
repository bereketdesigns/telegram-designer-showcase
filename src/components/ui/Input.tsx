// This component will be populated in Part 2: Authentication & User Flow
import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  className?: string;
}

const Input: React.FC<InputProps> = ({ className, ...props }) => {
  return (
    <input
      className={`mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 text-gray-900 ${className}`}
      {...props}
    />
  );
};

export default Input;