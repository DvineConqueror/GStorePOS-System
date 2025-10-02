import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/components/ui/use-toast';
import { useNavigate } from 'react-router-dom';
import Cookies from 'js-cookie';
import { validatePassword, PasswordValidationResult } from '@/utils/passwordValidation';

interface AuthFormData {
  email: string;
  emailOrUsername: string;
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
    emailOrUsername: '',
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
        const maintenanceMode = data.data.maintenanceMode;
        const maintenanceMessage = data.data.maintenanceMessage;
        
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
          
          // Check if maintenance mode is active for managers
          if (maintenanceMode && userRole === 'manager') {
            return { 
              success: true, 
              maintenanceMode: true,
              maintenanceMessage: maintenanceMessage || 'System is currently under maintenance. Some features may be unavailable.',
              role: 'manager',
              redirectTo: '/dashboard'
            };
          }
          
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
      console.log('Login error caught:', error.response?.data); // Debug log
      console.log('Error status:', error.response?.status); // Debug log
      // Handle maintenance mode for cashiers
      if (error.response?.status === 403) {
        const responseData = error.response.data;
        console.log('403 response data:', responseData); // Debug log
        console.log('Maintenance mode check:', responseData?.data?.maintenanceMode); // Debug log
        if (responseData?.data?.maintenanceMode) {
          console.log('Returning maintenance mode response for cashier'); // Debug log
          return { 
            success: false, 
            message: responseData.message || 'System is currently under maintenance. Please try again later.',
            maintenanceMode: true,
            role: responseData.data.role
          };
        }
      }
      
      const message = error.response?.data?.message || error.message || 'Login failed';
      // Don't show toast for maintenance mode errors - let the modal handle it
      if (!error.response?.data?.data?.maintenanceMode) {
        toast({
          title: "Login Failed",
          description: message,
          variant: "destructive",
        });
      }
      return { success: false, message };
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent): Promise<any> => {
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
          toast({
            title: "Registration Successful",
            description: "Your account has been created. Please wait for admin approval before logging in.",
          });
        } else {
          toast({
            title: "Registration Failed",
            description: result.message || "Failed to create account. Please try again.",
            variant: "destructive",
          });
        }
        return result;
      } else {
        const result = await handleLogin(formData.emailOrUsername, formData.password);
        // Return result to component for maintenance dialog handling
        return result;
      }
    } catch (error: any) {
      console.error('Authentication error:', error);
      toast({
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
      return { success: false, message: error.message || 'An unexpected error occurred' };
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
      emailOrUsername: '',
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
