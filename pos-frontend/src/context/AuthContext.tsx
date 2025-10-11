import { createContext, useContext, useEffect, useState } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { authAPI } from '@/lib/api';
import Cookies from 'js-cookie';

// User interface matching backend
interface User {
  id: string;
  username: string;
  email: string;
  role: 'superadmin' | 'manager' | 'cashier';
  firstName: string;
  lastName: string;
  status: 'active' | 'inactive' | 'deleted';
  isApproved: boolean;
  approvedBy?: string;
  approvedAt?: string;
  createdBy?: string;
  lastLogin?: string;
  createdAt: string;
}

interface AuthContextType {
  user: User | null;
  setup: (userData: {
    username: string;
    email: string;
    password: string;
    firstName: string;
    lastName: string;
  }) => Promise<{ success: boolean; message?: string }>;
  signIn: (emailOrUsername: string, password: string) => Promise<{ success: boolean; message?: string }>;
  signUpCashier: (userData: {
    username: string;
    email: string;
    password: string;
    firstName: string;
    lastName: string;
  }) => Promise<{ success: boolean; message?: string }>;
  signUp: (userData: {
    username: string;
    email: string;
    password: string;
    role: string;
    firstName: string;
    lastName: string;
  }) => Promise<{ success: boolean; message?: string }>;
  signOut: () => Promise<void>;
  loading: boolean;
  authLoading: boolean;
  refreshSession: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [authLoading, setAuthLoading] = useState(false);
  const { toast } = useToast();

  // Function to refresh session and user data
  const refreshSession = async () => {
    try {
      setLoading(true);
      const token = Cookies.get('auth_token');
      
      if (token) {
        // Extract sessionId from JWT token
        try {
          const payload = JSON.parse(atob(token.split('.')[1]));
          const sessionId = payload.sessionId;
          
          if (sessionId) {
            console.log('REFRESH DEBUG: Extracted sessionId from token:', sessionId);
            Cookies.set('session_id', sessionId, { 
              expires: 7,
              path: '/',
              secure: false,
              sameSite: 'lax'
            });
          } else {
            console.log('REFRESH DEBUG: No sessionId found in token payload');
          }
        } catch (tokenError) {
          console.error('REFRESH DEBUG: Error parsing token:', tokenError);
        }
        
        const response = await authAPI.getProfile();
        if (response.success) {
          setUser(response.data.user);
        } else {
          // Token is invalid, clear it
          Cookies.remove('auth_token');
          Cookies.remove('session_id');
          setUser(null);
        }
      } else {
        setUser(null);
      }
    } catch (error) {
      console.error('Error refreshing session:', error);
      Cookies.remove('auth_token');
      Cookies.remove('session_id');
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  // Initial session check
  useEffect(() => {
    refreshSession();
  }, []);

  // Listen for manual logout events (from concurrent login modal)
  useEffect(() => {
    const handleManualLogout = () => {
      setUser(null);
      setLoading(false);
      setAuthLoading(false);
    };

    window.addEventListener('manualLogout', handleManualLogout);
    
    return () => {
      window.removeEventListener('manualLogout', handleManualLogout);
    };
  }, []);

  const signIn = async (emailOrUsername: string, password: string) => {
    try {
      setAuthLoading(true);
      
      const response = await authAPI.login(emailOrUsername, password);
      
      // Store debug info in localStorage so it persists across navigation
      localStorage.setItem('LOGIN_DEBUG', JSON.stringify({
        success: response.success,
        hasData: !!response.data,
        hasSession: !!response.data?.session,
        sessionId: response.data?.session?.sessionId,
        timestamp: new Date().toISOString()
      }));
      
      console.log('LOGIN DEBUG: Full response:', response);
      console.log('LOGIN DEBUG: response.success:', response.success);
      console.log('LOGIN DEBUG: response.data:', response.data);
      
      if (response.success) {
        // Store the access token in cookies
        Cookies.set('auth_token', response.data.accessToken, { expires: 7 }); // 7 days
        // Store refresh token separately
        Cookies.set('refresh_token', response.data.refreshToken, { expires: 30 }); // 30 days
        // Store session ID for proper logout
        console.log('LOGIN DEBUG: response.data:', response.data);
        console.log('LOGIN DEBUG: response.data.session:', response.data.session);
        
        if (response.data.session?.sessionId) {
          console.log('LOGIN DEBUG: Storing sessionId in cookies:', response.data.session.sessionId);
          Cookies.set('session_id', response.data.session.sessionId, { 
            expires: 7,
            path: '/',
            secure: false, // Set to false for localhost development
            sameSite: 'lax'
          }); // 7 days
          console.log('LOGIN DEBUG: Cookie set, verifying:', Cookies.get('session_id'));
          console.log('LOGIN DEBUG: All cookies after setting:', document.cookie);
        } else {
          console.log('LOGIN DEBUG: No sessionId found in response:', response.data);
        }
        setUser(response.data.user);
        return { success: true };
      }
      
      return { success: false, message: response.message || 'Login failed' };
    } catch (error: any) {
      const message = error.response?.data?.message || error.message || 'Login failed';
      return { success: false, message };
    } finally {
      setAuthLoading(false);
    }
  };

  const setup = async (userData: {
    username: string;
    email: string;
    password: string;
    firstName: string;
    lastName: string;
  }) => {
    try {
      setAuthLoading(true);
      
      const response = await authAPI.setup(userData);
      
      if (response.success) {
        // Store the access token in cookies
        Cookies.set('auth_token', response.data.accessToken, { expires: 7 }); // 7 days
        // Store refresh token separately
        Cookies.set('refresh_token', response.data.refreshToken, { expires: 30 }); // 30 days
        setUser(response.data.user);
        toast({
          title: "Success",
          description: "Initial manager account created successfully.",
          variant: "success",
        });
        return { success: true };
      }
      
      return { success: false, message: response.message || 'Setup failed' };
    } catch (error: any) {
      const message = error.response?.data?.message || error.message || 'Setup failed';
      toast({
        title: "Error",
        description: message,
        variant: "destructive",
      });
      return { success: false, message };
    } finally {
      setAuthLoading(false);
    }
  };

  const signUpCashier = async (userData: {
    username: string;
    email: string;
    password: string;
    firstName: string;
    lastName: string;
  }) => {
    try {
      setAuthLoading(true);
      
      const response = await authAPI.registerCashier(userData);
      
      if (response.success) {
        toast({
          title: "Success",
          description: "Cashier account created successfully. Please wait for manager approval.",
          variant: "success",
        });
        return { success: true };
      }
      
      return { success: false, message: response.message || 'Registration failed' };
    } catch (error: any) {
      const message = error.response?.data?.message || error.message || 'Registration failed';
      toast({
        title: "Error",
        description: message,
        variant: "destructive",
      });
      return { success: false, message };
    } finally {
      setAuthLoading(false);
    }
  };

  const signUp = async (userData: {
    username: string;
    email: string;
    password: string;
    role: string;
    firstName: string;
    lastName: string;
  }) => {
    try {
      setAuthLoading(true);
      
      const response = await authAPI.register(userData);
      
      if (response.success) {
        toast({
          title: "Success",
          description: "Account created successfully.",
          variant: "success",
        });
        return { success: true };
      }
      
      return { success: false, message: response.message || 'Registration failed' };
    } catch (error: any) {
      const message = error.response?.data?.message || error.message || 'Registration failed';
      toast({
        title: "Error",
        description: message,
        variant: "destructive",
      });
      return { success: false, message };
    } finally {
      setAuthLoading(false);
    }
  };

  const signOut = async () => {
    try {
      setAuthLoading(true);
      
      // Debug all cookies
      console.log('LOGOUT DEBUG: All cookies:', document.cookie);
      
      // Get session ID for proper logout
      const sessionId = Cookies.get('session_id');
      console.log('LOGOUT DEBUG: Retrieved sessionId from cookies:', sessionId);
      
      // Also try to get it manually
      const manualSessionId = document.cookie
        .split('; ')
        .find(row => row.startsWith('session_id='))
        ?.split('=')[1];
      console.log('LOGOUT DEBUG: Manual sessionId retrieval:', manualSessionId);
      
      // Store debug info in localStorage
      localStorage.setItem('LOGOUT_DEBUG', JSON.stringify({
        allCookies: document.cookie,
        sessionIdFromCookies: sessionId,
        manualSessionId: manualSessionId,
        timestamp: new Date().toISOString()
      }));
      
      if (sessionId) {
        console.log('LOGOUT DEBUG: Calling logout API with sessionId:', sessionId);
        await authAPI.logout(sessionId);
      } else {
        console.log('LOGOUT DEBUG: No sessionId found, calling logout without sessionId');
        await authAPI.logout();
      }
      
      // Clear all auth-related cookies
      Cookies.remove('auth_token');
      Cookies.remove('refresh_token');
      Cookies.remove('session_id');
      setUser(null);
      
      // Show logout success toast
      toast({
        title: "Logged Out",
        description: "You have been successfully logged out.",
        variant: "success",
      });
    } catch (error: any) {
      // Even if logout fails on server, clear local data
      Cookies.remove('auth_token');
      Cookies.remove('refresh_token');
      Cookies.remove('session_id');
      setUser(null);
      console.error('Logout error:', error);
      
      // Show logout success toast even if server logout failed
      toast({
        title: "Logged Out",
        description: "You have been successfully logged out.",
        variant: "success",
      });
    } finally {
      setAuthLoading(false);
    }
  };

  return (
    <AuthContext.Provider value={{
      user,
      setup,
      signIn,
      signUpCashier,
      signUp,
      signOut,
      loading,
      authLoading,
      refreshSession
    }}>
      {children}
    </AuthContext.Provider>
  );
}