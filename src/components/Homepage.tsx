import React from 'react';
// Import DesignerProfile interface from WebAppRouter for consistency.
// WebAppRouter.tsx will be created in the next step, so this import might
// show a temporary error until that file is populated. That's expected.
import { DesignerProfile } from './common/WebAppRouter';

interface HomepageProps {
  currentUserProfile?: DesignerProfile | null; // Profile of the logged-in user, if exists
}

const Homepage: React.FC<HomepageProps> = ({ currentUserProfile }) => {
  return (
    <div className="p-4 bg-gray-50 min-h-screen flex flex-col items-center justify-center">
      <h1 className="text-3xl font-bold text-gray-800 mb-4">Designer Showcase</h1>
      {currentUserProfile ? (
        <p className="text-lg text-gray-700 text-center">
          Welcome back, {currentUserProfile.telegram_first_name}!
          <br />
          (Your profile will be shown here along with others in Part 3)
        </p>
      ) : (
        <p className="text-lg text-gray-700 text-center">
          Loading designers...
          <br />
          (This is the homepage for all profiles, loading will be implemented in Part 3)
        </p>
      )}
      <p className="mt-8 text-gray-500 text-center">
        If you're new, you'll see a signup page first.
      </p>
    </div>
  );
};

export default Homepage;