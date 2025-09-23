import React, { useEffect, useState } from 'react';
// REMOVED: import { useWebApp } from '@telegram-apps/sdk-react';
import { supabase } from '../../api/supabaseClient';
import Homepage from '../Homepage';
import SignupPage from '../SignupPage';
import LoadingSpinner from './LoadingSpinner';

// Define the interface for a designer profile, matching Supabase table
export interface DesignerProfile {
  id: string; // Supabase UUID
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

// --- Local Type Definitions for Telegram WebApp ---
// We put these here because global declarations are proving problematic.
// This ensures TypeScript knows about Telegram.WebApp structure within this file.
interface TelegramUser {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  language_code?: string;
  is_bot?: boolean;
  is_premium?: boolean;
  added_to_attachment_menu?: boolean;
}

interface TelegramInitDataUnsafe {
  query_id?: string;
  user?: TelegramUser;
  receiver?: { id: number; first_name: string; last_name?: string; username?: string; language_code?: string; is_bot?: boolean; is_premium?: boolean; added_to_attachment_menu?: boolean; };
  chat?: { id: number; type: string; title: string; username?: string; photo_url?: string; };
  chat_type?: string;
  chat_instance?: string;
  start_param?: string;
  auth_date: number;
  hash: string;
}

interface TelegramWebAppInterface {
  initData: string;
  initDataUnsafe: TelegramInitDataUnsafe;
  version: string;
  platform: string;
  colorScheme: string;
  themeParams: object; // Simplified for brevity here, can be detailed if needed
  isExpanded: boolean;
  viewportHeight: number;
  viewportStableHeight: number;
  isClosingConfirmationEnabled: boolean;
  headerColor: string;
  backgroundColor: string;
  BackButton: object; // Simplified
  MainButton: object; // Simplified
  HapticFeedback: object; // Simplified
  isVersionAtLeast: (version: string) => boolean;
  setHeaderColor: (color: string) => void;
  setBackgroundColor: (color: string) => void;
  showScanQrPopup: (...args: any[]) => void; // Simplified
  closeScanQrPopup: () => void;
  showPopup: (...args: any[]) => void; // Simplified
  showAlert: (message: string, callback?: () => void) => void;
  showConfirm: (message: string, callback?: (confirmed: boolean) => void) => void;
  ready: () => void;
  expand: () => void;
  close: () => void;
  sendData: (data: object) => void;
  switchInlineQuery: (query: string, chatTypes?: ('users' | 'bots' | 'groups' | 'channels')[]) => void;
  openLink: (url: string, options?: { try_instant_view?: boolean }) => void;
  openTelegramLink: (url: string) => void;
  openInvoice: (url: string, callback?: (status: string) => void) => void;
  setClosingConfirmation: (enabled: boolean) => void;
  readTextFromClipboard: (callback: (text: string) => void) => void;
  requestWriteAccess: (callback?: (allowed: boolean) => void) => void;
  requestContact: (callback?: (allowed: boolean) => void) => void;
  CloudStorage: {
    setItem: (key: string, value: string, callback?: (error: string | null, success: boolean) => void) => void;
    getItem: (key: string, callback?: (error: string | null, value: string | null) => void) => void;
    getItems: (keys: string[], callback?: (error: string | null, values: { [key: string]: string | null }) => void) => void;
    removeItems: (keys: string[], callback?: (error: string | null, success: boolean) => void) => void;
    getKeys: (callback?: (error: string | null, keys: string[]) => void) => void;
  };
  sendFeedback: (queryId: string, ok: boolean, info?: { type: 'text' | 'webhook'; text: string }) => void;
}

interface TelegramWindow extends Window {
  Telegram?: {
    WebApp?: TelegramWebAppInterface;
  };
}
// --- End Local Type Definitions ---

const WebAppRouter: React.FC = () => {
  // Use type assertion to tell TypeScript that window might have Telegram.WebApp
  // This bypasses global type declaration issues if tsconfig isn't picking them up.
  const webApp = (window as TelegramWindow).Telegram?.WebApp;

  const [isLoading, setIsLoading] = useState(true);
  const [isNewUser, setIsNewUser] = useState(false);
  const [currentUserProfile, setCurrentUserProfile] = useState<DesignerProfile | null>(null);
  const [telegramUserData, setTelegramUserData] = useState<TelegramUser | null>(null); // Use TelegramUser interface
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const checkUser = async () => {
      // 1. Ensure Telegram WebApp and user data are available
      if (!webApp || !webApp.initDataUnsafe || !webApp.initDataUnsafe.user) {
        console.error("Telegram user data is not available. This app must be opened via Telegram.");
        setError("This app must be opened through Telegram. Please use the bot's menu button.");
        setIsLoading(false);
        return;
      }

      const user = webApp.initDataUnsafe.user;
      setTelegramUserData(user); // Store Telegram user data
      const telegramId = user.id;

      try {
        // 2. Try to fetch the user's profile from Supabase
        const { data, error } = await supabase
          .from('designers')
          .select('*')
          .eq('telegram_id', telegramId)
          .single(); // Use single() to expect one row or null

        if (error && error.code === 'PGRST116') { // Supabase error code for "No rows found"
          // User not found, so they are a new user
          setIsNewUser(true);
        } else if (error) {
          console.error('Error fetching user profile from Supabase:', error);
          setError(`Failed to load profile: ${error.message}`);
          setIsNewUser(true); // Default to signup if we can't confirm due to error
        } else if (data) {
          // User found, they are a returning user
          setCurrentUserProfile(data as DesignerProfile);
        }
      } catch (err) {
        console.error('Supabase client error during user check:', err);
        setError('An unexpected network error occurred during user check.');
        setIsNewUser(true); // Treat as new user on client error, or show error page
      } finally {
        setIsLoading(false); // Stop loading regardless of outcome
      }
    };

    // This effect runs once on mount. We now directly check `window.Telegram?.WebApp`
    // We'll add a minimal check to delay if webApp isn't immediately available.
    if (webApp && webApp.initDataUnsafe) {
      checkUser();
    } else {
      // Add a small timeout to allow Telegram.WebApp to be injected
      const timeout = setTimeout(() => {
        // Use type assertion here too
        if ((window as TelegramWindow).Telegram?.WebApp?.initDataUnsafe?.user) {
          checkUser();
        } else {
          setError("Telegram WebApp initialization timed out or user data unavailable. Please try again.");
          setIsLoading(false);
        }
      }, 1000); // 1 second delay

      return () => clearTimeout(timeout); // Cleanup on unmount
    }

  }, [webApp]); // `webApp` dependency ensures effect reacts if `window.Telegram.WebApp` changes (unlikely, but safe)

  // --- Render Logic ---
  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (error) {
    return (
      <div className="p-4 bg-gray-50 min-h-screen text-center flex flex-col justify-center items-center">
        <p className="text-red-600 text-lg font-semibold">{error}</p>
        <p className="text-gray-500 mt-2">Please ensure you are opening the app via Telegram.</p>
      </div>
    );
  }

  // If we made it here, telegramUserData must exist because of the initial check
  if (isNewUser && telegramUserData) {
    // Render SignupPage for new users, passing auto-detected Telegram data
    return (
      <SignupPage
        telegramId={telegramUserData.id}
        telegramFirstName={telegramUserData.first_name}
        telegramLastName={telegramUserData.last_name || ''}
        telegramUsername={telegramUserData.username || ''}
        onSignupSuccess={() => {
            // On successful signup, we reload the window. This forces WebAppRouter
            // to re-evaluate the user, now recognizing them as returning.
            window.location.reload();
        }}
      />
    );
  }

  // Render Homepage for returning users, optionally passing their profile
  return <Homepage currentUserProfile={currentUserProfile} />;
};

export default WebAppRouter;