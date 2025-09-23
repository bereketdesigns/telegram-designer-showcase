import React, { useState } from 'react';
import { supabase } from '../api/supabaseClient';
import Button from './ui/Button'; // Our UI Button
import Input from './ui/Input';   // Our UI Input

interface SignupPageProps {
  telegramId: number;
  telegramFirstName: string;
  telegramLastName: string;
  telegramUsername: string;
  onSignupSuccess: () => void; // Callback to notify parent on successful signup
}

const SignupPage: React.FC<SignupPageProps> = ({
  telegramId,
  telegramFirstName,
  telegramLastName,
  telegramUsername,
  onSignupSuccess,
}) => {
  const [portfolioLink, setPortfolioLink] = useState('');
  const [bio, setBio] = useState('');
  const [skillsInput, setSkillsInput] = useState(''); // Raw input for comma-separated skills
  const [profileImage, setProfileImage] = useState<File | null>(null);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    const skillsArray = skillsInput.split(',').map(s => s.trim()).filter(s => s !== '');

    // Basic validation
    if (!portfolioLink || !bio || skillsArray.length === 0) {
      setError('Please fill in all required fields (Portfolio, Bio, Skills).');
      setIsSubmitting(false);
      return;
    }

    let profile_image_url: string | undefined;
    const profileImagesBucket = 'profile_images'; // Name of our Supabase Storage bucket

    // 1. Optional: Handle profile image upload to Supabase Storage
    if (profileImage) {
      const fileExt = profileImage.name.split('.').pop();
      const fileName = `${telegramId}-${Date.now()}.${fileExt}`; // Unique filename
      const filePath = `${fileName}`; // Path within the bucket

      try {
        const { data, error: uploadError } = await supabase.storage
          .from(profileImagesBucket)
          .upload(filePath, profileImage, {
            cacheControl: '3600',
            upsert: false, // Don't replace if file exists
          });

        if (uploadError) {
          console.error('Error uploading profile image:', uploadError);
          setError(`Failed to upload profile image: ${uploadError.message}`);
          setIsSubmitting(false);
          return;
        }
        // Get public URL of the uploaded image
        const { data: publicUrlData } = supabase.storage
          .from(profileImagesBucket)
          .getPublicUrl(filePath);
        profile_image_url = publicUrlData.publicUrl;

      } catch (storageErr) {
        console.error('Supabase Storage operation failed:', storageErr);
        setError('An unexpected error occurred during image upload.');
        setIsSubmitting(false);
        return;
      }
    }

    // 2. Insert user data into Supabase
    try {
      const { error: dbError } = await supabase
        .from('designers')
        .insert({
          telegram_id: telegramId,
          telegram_first_name: telegramFirstName,
          telegram_last_name: telegramLastName,
          telegram_username: telegramUsername,
          portfolio_link: portfolioLink,
          bio: bio,
          skills: skillsArray,
          profile_image_url: profile_image_url, // Will be undefined if no image uploaded
        });

      if (dbError) {
        console.error('Error saving profile:', dbError);
        if (dbError.code === '23505' && dbError.message.includes('telegram_id')) {
          setError('It looks like a profile with this Telegram ID already exists. Please contact support if you need to update it.');
        } else {
          setError(`Failed to save your profile: ${dbError.message}`);
        }
      } else {
        alert('Profile created successfully! Welcome!');
        onSignupSuccess(); // Trigger parent (WebAppRouter) to re-check user status
      }
    } catch (dbErr) {
      console.error('Supabase client error during profile insert:', dbErr);
      setError('An unexpected error occurred while saving your profile.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-4 bg-gray-50 min-h-screen flex items-center justify-center">
      <div className="max-w-md w-full bg-white p-6 rounded-lg shadow-xl border border-gray-200">
        <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">Create Your Designer Profile</h2>
        {error && <p className="text-red-500 text-center mb-4 text-sm">{error}</p>}
        <form onSubmit={handleSignup} className="space-y-4">
          <div>
            <label htmlFor="telegramName" className="block text-sm font-medium text-gray-700">Telegram Name</label>
            <Input
              id="telegramName"
              value={`${telegramFirstName} ${telegramLastName}`.trim()}
              readOnly
              disabled
              className="bg-gray-100 cursor-not-allowed"
            />
          </div>
          <div>
            <label htmlFor="portfolioLink" className="block text-sm font-medium text-gray-700">Portfolio Link (Required)</label>
            <Input
              type="url"
              id="portfolioLink"
              value={portfolioLink}
              onChange={(e) => setPortfolioLink(e.target.value)}
              placeholder="https://yourportfolio.com"
              required
            />
          </div>
          <div>
            <label htmlFor="bio" className="block text-sm font-medium text-gray-700">Bio (Required)</label>
            <textarea
              id="bio"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              rows={4}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
              placeholder="Tell us about yourself and your design philosophy..."
              required
            ></textarea>
          </div>
          <div>
            <label htmlFor="skills" className="block text-sm font-medium text-gray-700">Skills (Comma-separated, e.g., UI/UX, Branding, Illustration)</label>
            <Input
              type="text"
              id="skills"
              value={skillsInput}
              onChange={(e) => setSkillsInput(e.target.value)}
              placeholder="UI/UX, Branding, Web Design"
              required
            />
          </div>
          <div>
            <label htmlFor="profileImage" className="block text-sm font-medium text-gray-700">Profile Image (Optional)</label>
            <input
              type="file"
              id="profileImage"
              accept="image/*"
              onChange={(e) => setProfileImage(e.target.files ? e.target.files[0] : null)}
              className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
            />
          </div>
          <Button type="submit" disabled={isSubmitting} className="w-full">
            {isSubmitting ? 'Saving Profile...' : 'Create Profile'}
          </Button>
        </form>
      </div>
    </div>
  );
};

export default SignupPage;