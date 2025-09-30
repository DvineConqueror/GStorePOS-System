import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuthForm } from '@/hooks/useAuthForm';
import { useLoginAnimation } from '@/hooks/useLoginAnimation';
import { getColorScheme } from '@/utils/colorSchemes';
import { LoginForm } from '@/components/auth/LoginForm';
import { LoginLogo } from '@/components/auth/LoginLogo';
import { useToast } from '@/hooks/use-toast';

export default function LoginPage() {
  const [isSignUp, setIsSignUp] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  
  const { isAdminMode, toggleRoleMode } = useLoginAnimation();
  const { formData, isLoading, passwordValidation, handleSubmit, updateFormData, resetForm } = useAuthForm({
    isAdminMode,
    isSignUp,
    rememberMe
  });
  
  const colors = getColorScheme();

  // Handle OAuth callback messages
  useEffect(() => {
    const message = searchParams.get('message');
    const error = searchParams.get('error');
    const approvalRequired = searchParams.get('approval_required');

    if (error === 'oauth_failed') {
      toast({
        title: "OAuth Login Failed",
        description: "There was an error with the OAuth login. Please try again.",
        variant: "destructive"
      });
    } else if (message === 'oauth_account_created') {
      toast({
        title: "Account Created Successfully",
        description: "Your account has been created via OAuth. Please wait for manager approval to access the system.",
        variant: "default"
      });
    } else if (message === 'oauth_account_pending_approval') {
      toast({
        title: "Account Pending Approval",
        description: "Your OAuth account is linked but still requires manager approval.",
        variant: "default"
      });
    }

    // Clean up URL parameters
    if (message || error || approvalRequired) {
      const newUrl = new URL(window.location.href);
      newUrl.searchParams.delete('message');
      newUrl.searchParams.delete('error');
      newUrl.searchParams.delete('approval_required');
      window.history.replaceState({}, '', newUrl.toString());
    }
  }, [searchParams, toast]);

  const handleToggleSignUp = () => {
    setIsSignUp(!isSignUp);
    resetForm();
  };

  // Ensure manager mode never shows signup UI
  const handleToggleRoleMode = () => {
    if (isSignUp) {
      setIsSignUp(false);
    }
    resetForm();
    toggleRoleMode();
  };

  const handleTogglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const handleToggleRememberMe = (checked: boolean) => {
    setRememberMe(checked);
  };

  const handleInputChange = (field: string, value: string) => {
    updateFormData(field as any, value);
  };

  return (
    <div className={`min-h-screen flex items-center justify-center bg-[#ececec] transition-all duration-500 ease-in-out`}>
      <div className="container mx-auto flex items-center justify-center px-4 py-4">
        <div className={`login-container grid md:grid-cols-2 gap-6 w-full max-w-[900px] ${colors.cardBg} rounded-2xl shadow-xl p-6 md:p-8 transition-all duration-500 ease-in-out`}>
          <LoginLogo isAdminMode={isAdminMode} colors={colors} />
          
          <LoginForm
            isAdminMode={isAdminMode}
            isSignUp={isSignUp}
            isLoading={isLoading}
            colors={colors}
            formData={formData}
            passwordValidation={passwordValidation}
            rememberMe={rememberMe}
            showPassword={showPassword}
            onFormSubmit={handleSubmit}
            onInputChange={handleInputChange}
            onToggleSignUp={handleToggleSignUp}
          onToggleRoleMode={handleToggleRoleMode}
            onTogglePasswordVisibility={handleTogglePasswordVisibility}
            onToggleRememberMe={handleToggleRememberMe}
          />
        </div>
      </div>
    </div>
  );
}