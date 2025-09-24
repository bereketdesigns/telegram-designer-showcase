import React, { useEffect, useState } from 'react';
import { supabase } from '../../api/supabaseClient';
import Homepage from '../Homepage';
import SignupPage from '../SignupPage';
import LoadingSpinner from './LoadingSpinner';

// --- Local Type Definitions for Telegram WebApp ---
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

// Define the interface for a designer profile, matching Supabase table
export interface DesignerProfile { // This was missing and caused a warning in Homepage.tsx
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


const WebAppRouter: React.FC = () => {
  // Safely access window.Telegram?.WebApp only if window is defined (i.e., in a browser)
  const webApp = typeof window !== 'undefined' ? (window as TelegramWindow).Telegram?.WebApp : undefined;

  const [isLoading, setIsLoading] = useState(true);
  const [isNewUser, setIsNewUser] = useState(false);
  const [currentUserProfile, setCurrentUserProfile] = useState<DesignerProfile | null>(null);
  const [telegramUserData, setTelegramUserData] = useState<TelegramUser | null>(null);
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
      setTelegramUserData(user);
      const telegramId = user.id;

      try {
        // 2. Try to fetch the user's profile from Supabase
        const { data, error } = await supabase
          .from('designers')
          .select('*')
          .eq('telegram_id', telegramId)
          .single();

        if (error && error.code === 'PGRST116') {
          setIsNewUser(true);
        } else if (error) {
          console.error('Error fetching user profile from Supabase:', error);
          setError(`Failed to load profile: ${error.message}`);
          setIsNewUser(true);
        } else if (data) {
          setCurrentUserProfile(data as DesignerProfile);
        }
      } catch (err) {
        console.error('Supabase client error during user check:', err);
        setError('An unexpected network error occurred during user check.');
        setIsNewUser(true);
      } finally {
        setIsLoading(false);
      }
    };

    // Only attempt to check user if webApp is actually defined (i.e., in browser context)
    if (webApp && webApp.initDataUnsafe) {
      checkUser();
    } else if (typeof window !== 'undefined') { // If window is defined but webApp isn't ready yet,
                                                // give it a short moment for the Telegram script to inject it.
      const timeout = setTimeout(() => {
        if ((window as TelegramWindow).Telegram?.WebApp?.initDataUnsafe?.user) {
          checkUser();
        } else {
          setError("Telegram WebApp initialization timed out or user data unavailable. Please try again.");
          setIsLoading(false);
        }
      }, 1000); // 1 second delay

      return () => clearTimeout(timeout);
    } else {
      // If window is not defined (SSR context), we cannot proceed.
      // The component should gracefully handle this initial server render.
      // For now, we'll let it stay in loading or show a generic message.
      setIsLoading(false); // Make sure it eventually stops loading if window isn't present
      setError("This app must be opened in a browser with Telegram WebApp support.");
    }

  }, [webApp]);

  // --- Render Logic ---
  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (error && error !== "This app must be opened in a browser with Telegram WebApp support.") {
    return (
      <div className="p-4 bg-gray-50 min-h-screen text-center flex flex-col justify-center items-center">
        <p className="text-red-600 text-lg font-semibold">{error}</p>
        <p className="text-gray-500 mt-2">Please ensure you are opening the app via Telegram.</p>
      </div>
    );
  }

  // If we made it here, telegramUserData must exist because of the initial check
  if (isNewUser && telegramUserData) {
    return (
      <SignupPage
        telegramId={telegramUserData.id}
        telegramFirstName={telegramUserData.first_name}
        telegramLastName={telegramUserData.last_name || ''}
        telegramUsername={telegramUserData.username || ''}
        onSignupSuccess={() => {
            window.location.reload();
        }}
      />
    );
  }
  
  // If we are here, it means we are a returning user or an error occurred during initialization.
  // If it's a server-side render without window, show the error.
  if (error === "This app must be opened in a browser with Telegram WebApp support.") {
      return (
        <div className="p-4 bg-gray-50 min-h-screen text-center flex flex-col justify-center items-center">
            <p className="text-red-600 text-lg font-semibold">{error}</p>
            <p className="text-gray-500 mt-2">Please launch the app via your Telegram bot.</p>
        </div>
      );
  }

  return <Homepage currentUserProfile={currentUserProfile} />;
};

export default WebAppRouter;