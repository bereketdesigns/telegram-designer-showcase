// This component will be populated in Part 3: Homepage & Designer Profiles
import React from 'react';

interface DesignerProfile { // Define the interface for a designer profile, matching Supabase table
  id: string;
  telegram_id: number;
  telegram_first_name: string;
  telegram_last_name?: string;
  telegram_username?: string;
  portfolio_link: string;
  bio: string;
  skills: string[];
  profile_image_url?: string;
  created_at: string;
}

interface HomepageProps {
  currentUserProfile?: DesignerProfile | null;
}

const Homepage: React.FC<HomepageProps> = () => {
  return (
    <div className="p-4 text-center bg-gray-50 min-h-screen flex flex-col justify-center items-center">
      <h1 className="text-2xl font-bold">Homepage Loading...</h1>
      <p>Profiles will appear here.</p>
    </div>
  );
};

export default Homepage;