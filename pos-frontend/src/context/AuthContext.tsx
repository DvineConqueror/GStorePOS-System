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
  isActive: boolean;
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
        const response = await authAPI.getProfile();
        if (response.success) {
          setUser(response.data.user);
        } else {
          // Token is invalid, clear it
          Cookies.remove('auth_token');
          setUser(null);
        }
      } else {
        setUser(null);
      }
    } catch (error) {
      console.error('Error refreshing session:', error);
      Cookies.remove('auth_token');
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  // Initial session check
  useEffect(() => {
    refreshSession();
  }, []);

  const signIn = async (emailOrUsername: string, password: string) => {
    try {
      setAuthLoading(true);
      
      const response = await authAPI.login(emailOrUsername, password);
      
      if (response.success) {
        // Store the token in cookies
        Cookies.set('auth_token', response.data.token, { expires: 7 }); // 7 days
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
        // Store the token in cookies
        Cookies.set('auth_token', response.data.token, { expires: 7 }); // 7 days
        setUser(response.data.user);
        toast({
          title: "Success",
          description: "Initial admin account created successfully.",
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
          description: "Cashier account created successfully. Please wait for admin approval.",
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
      await authAPI.logout();
      Cookies.remove('auth_token');
      setUser(null);
    } catch (error: any) {
      // Even if logout fails on server, clear local data
      Cookies.remove('auth_token');
      setUser(null);
      console.error('Logout error:', error);
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