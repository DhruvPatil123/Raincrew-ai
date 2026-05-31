import { createClient } from '@supabase/supabase-js';

export interface User {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  provider?: 'google' | 'github' | 'magic-link';
  organization?: string;
}

let supabase: any = null;
let cachedAccessToken: string | null = null;
let cachedUser: User | null = null;
let listenerCallback: ((user: User | null) => void) | null = null;

// Dynamic client config fetcher with resilient retry behavior
export const getSupabaseClient = async () => {
  if (supabase) return supabase;
  
  const maxRetries = 4;
  let attempt = 0;
  
  while (attempt < maxRetries) {
    try {
      const res = await fetch('/api/supabase-client-config');
      if (res.ok) {
        const data = await res.json();
        if (data.supabaseUrl && data.supabaseKey) {
          const cleanUrl = String(data.supabaseUrl).trim();
          const cleanKey = String(data.supabaseKey).trim();
          if (cleanUrl !== "" && cleanKey !== "") {
            supabase = createClient(cleanUrl, cleanKey);
            return supabase;
          }
        }
        break; // Successfully fetched, but credentials are empty/not configured
      }
    } catch (e: any) {
      attempt++;
      if (attempt >= maxRetries) {
        console.warn("Failed to retrieve Supabase client config: connection could not be established.", e.message || e);
        break;
      }
      // Delay before retrying with exponential backoff (e.g., 500ms, 1000ms, 1500ms)
      await new Promise((resolve) => setTimeout(resolve, attempt * 500));
    }
  }
  return null;
};

// Check standard oauth state on load
if (typeof window !== 'undefined') {
  getSupabaseClient().then(client => {
    if (!client) {
      const savedUser = localStorage.getItem('foloup_google_user');
      const savedToken = localStorage.getItem('foloup_google_token');
      if (savedUser && savedToken) {
        cachedUser = JSON.parse(savedUser);
        cachedAccessToken = savedToken;
        if (listenerCallback) {
          listenerCallback(cachedUser);
        }
      }
      return;
    }
    
    client.auth.onAuthStateChange((event: string, session: any) => {
      if (session) {
        const fallbackName = session.user?.user_metadata?.full_name || session.user?.email?.split('@')[0] || "User";
        const metaOrg = session.user?.user_metadata?.organization || (session.user?.email ? session.user.email.split('@')[1].split('.')[0].toUpperCase() + " Workspace" : "Raincrew.AI Workspace");
        const rawProvider = session.user?.app_metadata?.provider || 'magic-link';
        const mappedProvider = (rawProvider === 'github' ? 'github' : (rawProvider === 'google' ? 'google' : 'magic-link')) as 'google' | 'github' | 'magic-link';

        cachedUser = {
          uid: session.user.id,
          email: session.user.email || null,
          displayName: fallbackName,
          photoURL: session.user?.user_metadata?.avatar_url || null,
          provider: mappedProvider,
          organization: metaOrg
        };
        cachedAccessToken = session.provider_token || session.access_token || "supabase-token";
        
        localStorage.setItem('foloup_google_user', JSON.stringify(cachedUser));
        if (cachedAccessToken) {
          localStorage.setItem('foloup_google_token', cachedAccessToken);
        }
      } else {
        cachedUser = null;
        cachedAccessToken = null;
        localStorage.removeItem('foloup_google_user');
        localStorage.removeItem('foloup_google_token');
      }
      
      if (listenerCallback) {
        listenerCallback(cachedUser);
      }
    });
  });
}

export const initAuth = (
  onAuthSuccess?: (user: User, token: string) => void,
  onAuthFailure?: () => void
) => {
  listenerCallback = (user) => {
    if (user && cachedAccessToken) {
      if (onAuthSuccess) onAuthSuccess(user, cachedAccessToken);
    } else {
      if (onAuthFailure) onAuthFailure();
    }
  };

  if (cachedUser && cachedAccessToken) {
    if (onAuthSuccess) onAuthSuccess(cachedUser, cachedAccessToken);
  } else {
    const savedUser = localStorage.getItem('foloup_google_user');
    const savedToken = localStorage.getItem('foloup_google_token');
    if (savedUser && savedToken) {
      cachedUser = JSON.parse(savedUser);
      cachedAccessToken = savedToken;
      if (onAuthSuccess) onAuthSuccess(cachedUser, cachedAccessToken);
    } else {
      if (onAuthFailure) onAuthFailure();
    }
  }

  return () => {
    listenerCallback = null;
  };
};

export const googleSignIn = async (forceLive: boolean = false): Promise<{ user: User; accessToken: string } | null> => {
  const client = await getSupabaseClient();
  
  if (forceLive) {
    if (!client) {
      throw new Error("Supabase is not configured! Please configure SUPABASE_URL and SUPABASE_ANON_KEY / SUPABASE_SERVICE_ROLE_KEY in your .env file or Settings panel to enable Live OAuth.");
    }
    const { data, error } = await client.auth.signInWithOAuth({
      provider: 'google',
      options: {
        scopes: 'https://www.googleapis.com/auth/calendar.events',
        redirectTo: window.location.origin
      }
    });
    if (error) throw error;
    return null;
  }

  // Fallback to beautiful simulated session
  const mockUser: User = {
    uid: `google-user-${Math.floor(Math.random() * 1000000)}`,
    email: `recruiter.${Math.floor(Math.random() * 1000)}@gmail.com`,
    displayName: "Alexander Recruiter",
    photoURL: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=256"
  };
  const mockToken = "ya29.simulated-recruiter-oauth-token-for-raincrew-ai";
  
  cachedUser = mockUser;
  cachedAccessToken = mockToken;
  
  localStorage.setItem('foloup_google_user', JSON.stringify(mockUser));
  localStorage.setItem('foloup_google_token', mockToken);
  
  if (listenerCallback) {
    listenerCallback(mockUser);
  }
  
  return { user: mockUser, accessToken: mockToken };
};

export const getAccessToken = async (): Promise<string | null> => {
  return cachedAccessToken;
};

export const logout = async () => {
  const client = await getSupabaseClient();
  if (client) {
    await client.auth.signOut();
  }
  cachedUser = null;
  cachedAccessToken = null;
  localStorage.removeItem('foloup_google_user');
  localStorage.removeItem('foloup_google_token');
  if (listenerCallback) {
    listenerCallback(null);
  }
};
