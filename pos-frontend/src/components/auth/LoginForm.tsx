import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Eye, EyeOff, ShieldCheck, Users, Facebook, Chrome } from 'lucide-react';
import { PasswordHelpTooltip } from '@/components/ui/password-help-tooltip';
import { ColorScheme } from '@/utils/colorSchemes';
import { PasswordValidationResult, getPasswordStrengthColor } from '@/utils/passwordValidation';

interface LoginFormProps {
  isAdminMode: boolean;
  isSignUp: boolean;
  isLoading: boolean;
  colors: ColorScheme;
  formData: {
    email: string;
    password: string;
    username: string;
    firstName: string;
    lastName: string;
  };
  passwordValidation: PasswordValidationResult;
  rememberMe: boolean;
  showPassword: boolean;
  onFormSubmit: (e: React.FormEvent) => void;
  onInputChange: (field: string, value: string) => void;
  onToggleSignUp: () => void;
  onToggleRoleMode: () => void;
  onTogglePasswordVisibility: () => void;
  onToggleRememberMe: (checked: boolean) => void;
}

export const LoginForm: React.FC<LoginFormProps> = ({
  isAdminMode,
  isSignUp,
  isLoading,
  colors,
  formData,
  passwordValidation,
  rememberMe,
  showPassword,
  onFormSubmit,
  onInputChange,
  onToggleSignUp,
  onToggleRoleMode,
  onTogglePasswordVisibility,
  onToggleRememberMe
}) => {
  return (
    <div className={`form-section flex flex-col justify-center transition-all duration-500 ease-in-out ${isAdminMode ? 'order-1' : 'order-2'}`}>
      <Card className="border-0 shadow-none">
        <CardHeader className={`${isSignUp ? 'space-y-1 pb-2' : 'space-y-1 pb-4'}`}>
          <CardTitle className={`${isSignUp && !isAdminMode ? 'text-xl' : 'text-2xl'} font-bold ${colors.primaryText} transition-colors duration-500 text-center`}>
            {isSignUp && !isAdminMode ? 'Create Account' : 'Welcome Back'}
          </CardTitle>
          <CardDescription className={`${isSignUp ? 'text-xs' : 'text-sm'} text-center`}>
            {isSignUp && !isAdminMode
            ? `Create a new cashier account` 
            : `Sign in to continue to your ${isAdminMode ? 'manager dashboard' : 'POS system'}`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={onFormSubmit} className={`${isSignUp ? 'space-y-2' : 'space-y-4'}`}>
            {isSignUp && !isAdminMode && (
              <>
                <div className="space-y-0.5">
                  <Label htmlFor="username" className="text-xs font-medium text-black">
                    Username
                  </Label>
                  <Input
                    id="username"
                    value={formData.username}
                    onChange={(e) => onInputChange('username', e.target.value)}
                    className={`h-8 px-3 text-black text-sm ${colors.primaryBorder} transition-all duration-300`}
                    placeholder="johndoe"
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-0.5">
                    <Label htmlFor="firstName" className="text-xs font-medium text-black">
                      First Name
                    </Label>
                    <Input
                      id="firstName"
                      value={formData.firstName}
                      onChange={(e) => onInputChange('firstName', e.target.value)}
                      className={`h-8 px-3 text-black text-sm ${colors.primaryBorder} transition-all duration-300`}
                      placeholder="John"
                      required
                    />
                  </div>
                  <div className="space-y-0.5">
                    <Label htmlFor="lastName" className="text-xs font-medium text-black">
                      Last Name
                    </Label>
                    <Input
                      id="lastName"
                      value={formData.lastName}
                      onChange={(e) => onInputChange('lastName', e.target.value)}
                      className={`h-8 px-3 text-black text-sm ${colors.primaryBorder} transition-all duration-300`}
                      placeholder="Doe"
                      required
                    />
                  </div>
                </div>
              </>
            )}
            <div className={`${isSignUp ? 'space-y-0.5' : 'space-y-1'}`}>
              <Label htmlFor="email" className="text-xs font-medium text-black">
                {isSignUp && !isAdminMode ? 'Email' : 'Email or Username'}
              </Label>
              <Input
                id="email"
                type={isSignUp && !isAdminMode ? 'email' : 'text'}
                value={formData.email}
                onChange={(e) => onInputChange('email', e.target.value)}
                className="h-8 px-3 text-black text-sm border-gray-300 focus:outline-none focus:ring-0 focus:border-gray-300 transition-all duration-300"
                placeholder={isSignUp && !isAdminMode ? 'you@example.com' : 'email@example.com or username'}
                required
              />
            </div>
            <div className={`${isSignUp ? 'space-y-0.5' : 'space-y-1'}`}>
              <div className="flex items-center gap-1">
                <Label htmlFor="password" className="text-xs font-medium text-black">
                  Password
                </Label>
                {isSignUp && !isAdminMode && <PasswordHelpTooltip />}
              </div>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={(e) => onInputChange('password', e.target.value)}
                  className="h-8 px-3 pr-8 text-black text-sm border-gray-300 focus:outline-none focus:ring-0 focus:border-gray-300 transition-all duration-300"
                  placeholder="••••••••"
                  required
                />
                <button 
                  type="button"
                  className={`absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:${colors.primaryText} transition-colors duration-300`}
                  onClick={onTogglePasswordVisibility}
                >
                  {showPassword ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
                </button>
              </div>
              {/* Password validation feedback for signup only - no reserved space when empty */}
              {isSignUp && !isAdminMode && formData.password && (
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-600">Strength:</span>
                    <span className={`text-xs font-medium ${getPasswordStrengthColor(passwordValidation.strength)}`}>
                      {passwordValidation.strength.charAt(0).toUpperCase() + passwordValidation.strength.slice(1)}
                    </span>
                  </div>
                  {passwordValidation.errors.length > 0 && (
                    <div className="text-xs text-red-500">
                      <ul className="list-disc list-inside space-y-0.5">
                        {passwordValidation.errors.map((error, index) => (
                          <li key={index}>{error}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </div>
            
            {/* Remember Me checkbox - only show for login, not signup */}
            {!isSignUp && (
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <input
                    id="remember-me"
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => onToggleRememberMe(e.target.checked)}
                    className="h-3 w-3 border-gray-300 rounded focus:outline-none focus:ring-0 focus:border-gray-300"
                  />
                  <Label htmlFor="remember-me" className="text-xs font-medium text-gray-700">
                    Remember me for 30 days
                  </Label>
                </div>
                <Link
                  to="/forgot-password"
                  className={`text-xs font-semibold ${colors.primaryText} hover:underline`}
                >
                  Forgot password?
                </Link>
              </div>
            )}
            
            <div className={`flex flex-col ${isSignUp ? 'gap-1' : 'gap-2'}`}>
              <Button 
                type="submit" 
                disabled={isLoading || (isSignUp && !isAdminMode && !passwordValidation.isValid)}
                className={`w-full ${isSignUp ? 'h-8' : 'h-9'} text-sm ${colors.primaryButton} duration-500 text-white font-medium transition-all`}
              >
                {isLoading ? 'Loading...' : (isSignUp && !isAdminMode ? 'Create Cashier Account' : 'Sign In')}
              </Button>
            </div>

            {/* OAuth Buttons - only show for login, not signup */}
            {!isSignUp && !isAdminMode && (
              <>
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t border-gray-300" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-white px-2 text-gray-500">Or continue with</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full h-9 text-sm border-gray-300 bg-white hover:bg-gray-200"
                    onClick={() => window.location.href = `${import.meta.env.VITE_API_URL}/oauth/google`}
                  >
                    <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                    </svg>
                    Google
                  </Button>
                  
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full h-9 text-sm border-gray-300 bg-white hover:bg-gray-200"
                    onClick={() => window.location.href = `${import.meta.env.VITE_API_URL}/oauth/facebook`}
                  >
                    <svg className="w-4 h-4 mr-2" fill="#1877F2" viewBox="0 0 24 24">
                      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                    </svg>
                    Facebook
                  </Button>
                </div>
              </>
            )}
            
            {/* Role Toggle Button - moved below Sign In button */}
            <div className="flex justify-center">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={onToggleRoleMode}
                className={`${isSignUp ? 'h-7' : 'h-8'} text-xs ${colors.primaryHover} ${colors.primaryBorder} transition-all duration-300 transform hover:scale-105 active:scale-95`}
              >
                {isAdminMode ? (
                  <>
                    <Users className="mr-1 h-3 w-3 transition-transform duration-300" />
                    <span className="transition-all duration-300">Switch to Cashier Mode</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck className="mr-1 h-3 w-3 transition-transform duration-300" />
                    <span className="transition-all duration-300">Switch to Manager Mode</span>
                  </>
                )}
              </Button>
            </div>
            
            {!isAdminMode && (
              <Button
                type="button"
                variant="link"
                className={`w-full ${isSignUp ? 'text-xs' : 'text-xs'} ${colors.primaryText} hover:${colors.primaryText}/80 duration-500 transition-colors`}
                onClick={onToggleSignUp}
              >
                {isSignUp 
                  ? 'Already have an account? Sign in' 
                  : "Don't have an account? Sign up as Cashier"}
              </Button>
            )}
            {isAdminMode && (
              <p className="text-[11px] text-center text-gray-600 pt-2">
                Managers cannot self-register. Please contact a superadmin to create your account.
              </p>
            )}
          </form>
        </CardContent>
      </Card>
    </div>
  );
};
