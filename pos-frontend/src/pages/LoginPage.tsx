import { useState } from 'react';
import { useAuthForm } from '@/hooks/useAuthForm';
import { useLoginAnimation } from '@/hooks/useLoginAnimation';
import { getColorScheme } from '@/utils/colorSchemes';
import { LoginForm } from '@/components/auth/LoginForm';
import { LoginLogo } from '@/components/auth/LoginLogo';

export default function LoginPage() {
  const [isSignUp, setIsSignUp] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
  const { isAdminMode, toggleRoleMode } = useLoginAnimation();
  const { formData, isLoading, passwordValidation, handleSubmit, updateFormData, resetForm } = useAuthForm({
    isAdminMode,
    isSignUp,
    rememberMe
  });
  
  const colors = getColorScheme();

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
    <div className={`min-h-screen flex items-center justify-center bg-gradient-to-br ${colors.primary} transition-all duration-500 ease-in-out`}>
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