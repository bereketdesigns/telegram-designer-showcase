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
  themeParams: object;
  isExpanded: boolean;
  viewportHeight: number;
  viewportStableHeight: number;
  isClosingConfirmationEnabled: boolean;
  headerColor: string;
  backgroundColor: string;
  BackButton: object;
  MainButton: object;
  hapticFeedback: object; // Lowercase h in hapticFeedback
  isVersionAtLeast: (version: string) => boolean;
  setHeaderColor: (color: string) => void;
  setBackgroundColor: (color: string) => void;
  showScanQrPopup: (...args: any[]) => void;
  closeScanQrPopup: () => void;
  showPopup: (...args: any[]) => void;
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
export interface DesignerProfile {
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


const WebAppRouter: React.FC = () => {
  // --- DEEP DEBUG LOG ---
  console.log("WebAppRouter rendering. Initial window.Telegram:", typeof window !== 'undefined' ? (window as TelegramWindow).Telegram : 'window undefined (SSR)');

  // webApp state will be initialized in useEffect, preventing SSR window access issues
  const [webApp, setWebApp] = useState<TelegramWebAppInterface | undefined>(undefined);

  const [isLoading, setIsLoading] = useState(true);
  const [isNewUser, setIsNewUser] = useState(false);
  const [currentUserProfile, setCurrentUserProfile] = useState<DesignerProfile | null>(null);
  const [telegramUserData, setTelegramUserData] = useState<TelegramUser | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    let intervalId: NodeJS.Timeout | undefined;
    let timeoutId: NodeJS.Timeout | undefined;

    // --- DEEP DEBUG LOG ---
    console.log("WebAppRouter useEffect fired. Initial window.Telegram in useEffect:", typeof window !== 'undefined' ? (window as TelegramWindow).Telegram : 'window undefined (SSR)');

    // Only proceed if running in a browser environment
    if (typeof window === 'undefined') {
        console.log("Server-side render: window is undefined. Setting initial error.");
        if (isMounted) {
            setError("This app must be opened in a browser with Telegram WebApp support.");
            setIsLoading(false);
        }
        return; // Exit useEffect if SSR
    }

    const currentWebAppInstance = (window as TelegramWindow).Telegram?.WebApp;
    setWebApp(currentWebAppInstance); // Set the webApp instance in state for future renders

    const attemptInit = async (attemptCount: number = 0) => {
      const currentWebApp = (window as TelegramWindow).Telegram?.WebApp;
      
      if (currentWebApp && currentWebApp.initDataUnsafe && currentWebApp.initDataUnsafe.user) {
        // --- DEEP DEBUG LOG ---
        console.log("Telegram WebApp and user data found! User:", currentWebApp.initDataUnsafe.user);
        if (!isMounted) return;

        const user = currentWebApp.initDataUnsafe.user;
        setTelegramUserData(user);
        const telegramId = user.id;

        // Clear any pending checks/timeouts once we've successfully initialized
        if (intervalId) clearInterval(intervalId);
        if (timeoutId) clearTimeout(timeoutId);

        try {
          const { data, error: dbError } = await supabase
            .from('designers')
            .select('*')
            .eq('telegram_id', telegramId)
            .single();

          if (!isMounted) return;

          if (dbError && dbError.code === 'PGRST116') {
            setIsNewUser(true);
          } else if (dbError) {
            console.error('Error fetching user profile from Supabase:', dbError);
            setError(`Failed to load profile: ${dbError.message}`);
            setIsNewUser(true);
          } else if (data) {
            setCurrentUserProfile(data as DesignerProfile);
          }
        } catch (err) {
          console.error('Supabase client error during user check:', err);
          setError('An unexpected network error occurred during user check.');
          setIsNewUser(true);
        } finally {
          if (isMounted) setIsLoading(false);
        }
      } else {
        console.log(`Telegram WebApp or user data not ready yet. Retrying (${attemptCount})... window.Telegram:`, (window as TelegramWindow).Telegram);
        // If it's not ready yet, the interval will keep calling this.
        // The timeout will eventually fire if it never becomes ready.
      }
    };

    // Initial attempt outside of interval to potentially speed up first check
    attemptInit(0);

    // Set up a polling interval to check if WebApp becomes available
    intervalId = setInterval(() => attemptInit(1), 500); // Check every 0.5 seconds

    // Set a total timeout after which we give up
    timeoutId = setTimeout(() => {
        if (!((window as TelegramWindow).Telegram?.WebApp?.initDataUnsafe?.user)) {
            console.error("Timeout reached. WebApp still not ready or user data missing.");
            if (isMounted) {
                setError("Telegram WebApp initialization timed out or user data unavailable. Please try again.");
                setIsLoading(false);
            }
        }
        if (intervalId) clearInterval(intervalId); // Clear interval after timeout
    }, 5000); // 5 seconds timeout

    return () => {
      isMounted = false;
      if (intervalId) clearInterval(intervalId);
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, []); // Empty dependency array: only run once on mount

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