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
    emailOrUsername: string;
    password: string;
    confirmPassword: string;
    username: string;
    firstName: string;
    lastName: string;
  };
  passwordValidation: PasswordValidationResult;
  passwordsMatch: boolean;
  rememberMe: boolean;
  showPassword: boolean;
  showConfirmPassword: boolean;
  onFormSubmit: (e: React.FormEvent) => void;
  onInputChange: (field: string, value: string) => void;
  onToggleSignUp: () => void;
  onToggleRoleMode: () => void;
  onTogglePasswordVisibility: () => void;
  onToggleConfirmPasswordVisibility: () => void;
  onToggleRememberMe: (checked: boolean) => void;
}

export const LoginForm: React.FC<LoginFormProps> = ({
  isAdminMode,
  isSignUp,
  isLoading,
  colors,
  formData,
  passwordValidation,
  passwordsMatch,
  rememberMe,
  showPassword,
  showConfirmPassword,
  onFormSubmit,
  onInputChange,
  onToggleSignUp,
  onToggleRoleMode,
  onTogglePasswordVisibility,
  onToggleConfirmPasswordVisibility,
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
                value={isSignUp ? formData.email : formData.emailOrUsername}
                onChange={(e) => onInputChange(isSignUp ? 'email' : 'emailOrUsername', e.target.value)}
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

            {isSignUp && !isAdminMode && (
              <div className="space-y-0.5">
                <Label htmlFor="confirmPassword" className="text-xs font-medium text-black">
                  Confirm Password
                </Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={formData.confirmPassword}
                    onChange={(e) => onInputChange('confirmPassword', e.target.value)}
                    className={`h-8 px-3 pr-8 text-black text-sm transition-all duration-300 ${
                      formData.confirmPassword && !passwordsMatch
                        ? 'border-red-500 focus:border-red-500' 
                        : 'border-gray-300 focus:border-gray-300'
                    } focus:outline-none focus:ring-0`}
                    placeholder="••••••••"
                    required
                  />
                  <button 
                    type="button"
                    className={`absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:${colors.primaryText} transition-colors duration-300`}
                    onClick={onToggleConfirmPasswordVisibility}
                  >
                    {showConfirmPassword ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
                  </button>
                </div>
                {/* Password match feedback */}
                {formData.confirmPassword && (
                  <div className="flex items-center gap-1 mt-1">
                    {passwordsMatch ? (
                      <span className="text-xs text-green-600 flex items-center gap-1">
                        <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        Passwords match
                      </span>
                    ) : (
                      <span className="text-xs text-red-500 flex items-center gap-1">
                        <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                        </svg>
                        Passwords do not match
                      </span>
                    )}
                  </div>
                )}
              </div>
            )}
            
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
                disabled={isLoading || (isSignUp && !isAdminMode && (!passwordValidation.isValid || !passwordsMatch))}
                className={`w-full ${isSignUp ? 'h-8' : 'h-9'} text-sm ${colors.primaryButton} duration-500 text-white font-medium transition-all`}
              >
                {isLoading ? 'Loading...' : (isSignUp && !isAdminMode ? 'Create Cashier Account' : 'Sign In')}
              </Button>
            </div>
            
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
