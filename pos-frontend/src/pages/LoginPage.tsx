import { useState } from 'react';
import { useAuthForm } from '@/hooks/useAuthForm';
import { useLoginAnimation } from '@/hooks/useLoginAnimation';
import { getColorScheme } from '@/utils/colorSchemes';
import { LoginForm } from '@/components/auth/LoginForm';
import { LoginLogo } from '@/components/auth/LoginLogo';
import { MaintenanceDialog } from '@/components/system/MaintenanceDialog';

export default function LoginPage() {
  const [isSignUp, setIsSignUp] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showMaintenanceDialog, setShowMaintenanceDialog] = useState(false);
  const [maintenanceMessage, setMaintenanceMessage] = useState('');
  const [maintenanceRole, setMaintenanceRole] = useState<'cashier' | 'manager'>('cashier');
  
  const { isAdminMode, toggleRoleMode } = useLoginAnimation();
  const { formData, isLoading, passwordValidation, handleSubmit, updateFormData, resetForm } = useAuthForm({
    isAdminMode,
    isSignUp,
    rememberMe
  });
  
  const colors = getColorScheme();

  // Check if passwords match
  const passwordsMatch = formData.password === formData.confirmPassword && formData.confirmPassword.length > 0;

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

  const handleToggleConfirmPasswordVisibility = () => {
    setShowConfirmPassword(!showConfirmPassword);
  };

  const handleToggleRememberMe = (checked: boolean) => {
    setRememberMe(checked);
  };

  const handleInputChange = (field: string, value: string) => {
    updateFormData(field as any, value);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    const result = await handleSubmit(e);
    console.log('Login result:', result); // Debug log
    
    // Check if login was successful but system is in maintenance mode (for managers)
    if (result && result.success && (result as any).maintenanceMode) {
      console.log('Manager maintenance mode detected'); // Debug log
      setMaintenanceMessage((result as any).maintenanceMessage || 'System is currently under maintenance. Some features may be unavailable.');
      setMaintenanceRole('manager');
      setShowMaintenanceDialog(true);
      // Store redirect URL for after user acknowledges
      (window as any).__maintenanceRedirect = (result as any).redirectTo || '/dashboard';
    }
    // Check if login failed due to maintenance mode (for cashiers)
    else if (result && !result.success && (result as any).maintenanceMode) {
      console.log('Cashier maintenance mode detected'); // Debug log
      setMaintenanceMessage(result.message || 'System is currently under maintenance.');
      setMaintenanceRole((result as any).role || 'cashier');
      setShowMaintenanceDialog(true);
    }
    // Fallback: Check if message contains maintenance keywords (in case maintenanceMode flag is missing)
    else if (result && !result.success && result.message && result.message.toLowerCase().includes('maintenance')) {
      console.log('Maintenance detected via message fallback'); // Debug log
      setMaintenanceMessage(result.message);
      setMaintenanceRole('cashier'); // Assume cashier if not specified
      setShowMaintenanceDialog(true);
    }
  };

  const handleCloseMaintenanceDialog = () => {
    setShowMaintenanceDialog(false);
    setMaintenanceMessage('');
  };

  const handleProceedToDashboard = () => {
    setShowMaintenanceDialog(false);
    const redirectUrl = (window as any).__maintenanceRedirect || '/dashboard';
    window.location.href = redirectUrl;
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
            passwordsMatch={passwordsMatch}
            rememberMe={rememberMe}
            showPassword={showPassword}
            showConfirmPassword={showConfirmPassword}
            onFormSubmit={handleFormSubmit}
            onInputChange={handleInputChange}
            onToggleSignUp={handleToggleSignUp}
            onToggleRoleMode={handleToggleRoleMode}
            onTogglePasswordVisibility={handleTogglePasswordVisibility}
            onToggleConfirmPasswordVisibility={handleToggleConfirmPasswordVisibility}
            onToggleRememberMe={handleToggleRememberMe}
          />
        </div>
      </div>

      {/* Maintenance Dialog */}
      <MaintenanceDialog
        open={showMaintenanceDialog}
        onClose={handleCloseMaintenanceDialog}
        role={maintenanceRole}
        message={maintenanceMessage}
        onProceed={maintenanceRole === 'manager' ? handleProceedToDashboard : undefined}
      />
    </div>
  );
}