// This component will be populated in Part 2: Authentication & User Flow
import React from 'react';

interface SignupPageProps {
  telegramId: number;
  telegramFirstName: string;
  telegramLastName: string;
  telegramUsername: string;
  onSignupSuccess: () => void;
}

const SignupPage: React.FC<SignupPageProps> = () => {
  return (
    <div className="p-4 text-center bg-gray-50 min-h-screen flex flex-col justify-center items-center">
      <h1 className="text-2xl font-bold">Signup Page Loading...</h1>
    </div>
  );
};

export default SignupPage;