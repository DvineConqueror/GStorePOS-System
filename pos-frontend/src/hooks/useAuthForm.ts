import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/components/ui/use-toast';
import { useNavigate } from 'react-router-dom';
import Cookies from 'js-cookie';
import { validatePassword, PasswordValidationResult } from '@/utils/passwordValidation';

interface AuthFormData {
  email: string;
  password: string;
  username: string;
  firstName: string;
  lastName: string;
}

interface UseAuthFormProps {
  isAdminMode: boolean;
  isSignUp: boolean;
  rememberMe: boolean;
}

export const useAuthForm = ({ isAdminMode, isSignUp, rememberMe }: UseAuthFormProps) => {
  const [formData, setFormData] = useState<AuthFormData>({
    email: '',
    password: '',
    username: '',
    firstName: '',
    lastName: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [passwordValidation, setPasswordValidation] = useState<PasswordValidationResult>({
    isValid: false,
    errors: [],
    strength: 'weak'
  });
  
  const { signIn, signUp, signUpCashier, setup, refreshSession } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  // Custom login function to avoid AuthContext re-renders
  const handleLogin = async (emailOrUsername: string, password: string) => {
    try {
      setIsLoading(true);
      
      // Direct API call without going through AuthContext
      const response = await fetch(`${import.meta.env.VITE_API_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          emailOrUsername,
          password,
        }),
      });
      
      const data = await response.json();
      
      if (data.success) {
        const userRole = data.data.user.role;
        
        // Set cookie expiration based on "Remember Me" option
        const cookieExpiration = rememberMe ? 30 : 7; // 30 days if remember me, 7 days otherwise
        
        // Enforce role-based access
        if (!isAdminMode && userRole === 'cashier') {
          // Cashiers can only login in cashier mode
          Cookies.set('auth_token', data.data.accessToken, { expires: cookieExpiration });
          Cookies.set('refresh_token', data.data.refreshToken, { expires: 30 }); // 30 days
          // Refresh AuthContext to update user state
          await refreshSession();
          window.location.href = '/pos';
          return { success: true };
        } else if (isAdminMode && (userRole === 'manager' || userRole === 'superadmin')) {
          // Managers and superadmins can login in admin mode
          Cookies.set('auth_token', data.data.accessToken, { expires: cookieExpiration });
          Cookies.set('refresh_token', data.data.refreshToken, { expires: 30 }); // 30 days
          // Refresh AuthContext to update user state
          await refreshSession();
          // Redirect based on role
          if (userRole === 'superadmin') {
            window.location.href = '/superadmin';
          } else {
            window.location.href = '/dashboard';
          }
          return { success: true };
        } else {
          // Invalid role/mode combination
          return { 
            success: false, 
            message: (userRole === 'manager' || userRole === 'superadmin')
              ? 'Manager/Superadmin access required. Please use Manager Mode to login.' 
              : 'Cashier access required. Please use Cashier Mode to login.' 
          };
        }
      }
      
      return { success: false, message: data.message || 'Login failed' };
    } catch (error: any) {
      const message = error.message || 'Login failed';
      return { success: false, message };
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (isSignUp) {
        // Only cashier signup is allowed - managers are created by superadmin
        const result = await signUpCashier({
          username: formData.username,
          email: formData.email,
          password: formData.password,
          firstName: formData.firstName,
          lastName: formData.lastName
        });
        if (result.success) {
          // Cashier accounts require manager approval, so don't auto-login
          // Reset form and switch back to login mode
          resetForm();
        }
      } else {
        const result = await handleLogin(formData.email, formData.password);
        if (!result.success) {
          // Show error toast for failed login
          toast({
            title: "Login Failed",
            description: result.message || 'Invalid credentials or account not activated',
            variant: "destructive",
          });
        }
      }
    } catch (error) {
      console.error('Authentication error:', error);
      toast({
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    }
  };

  const updateFormData = (field: keyof AuthFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Validate password when it changes
    if (field === 'password' && isSignUp) {
      const validation = validatePassword(value);
      setPasswordValidation(validation);
    }
  };

  const resetForm = () => {
    setFormData({
      email: '',
      password: '',
      username: '',
      firstName: '',
      lastName: ''
    });
    setPasswordValidation({
      isValid: false,
      errors: [],
      strength: 'weak'
    });
  };

  return {
    formData,
    isLoading,
    passwordValidation,
    handleSubmit,
    updateFormData,
    resetForm
  };
};
