import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Eye, EyeOff, ShieldCheck, Users, Github, Chrome } from 'lucide-react';
import { ColorScheme } from '@/utils/colorSchemes';

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
          <CardTitle className={`${isSignUp ? 'text-xl' : 'text-2xl'} font-bold ${colors.primaryText} transition-colors duration-500 text-center`}>
            {isSignUp ? 'Create Account' : 'Welcome Back'}
          </CardTitle>
          <CardDescription className={`${isSignUp ? 'text-xs' : 'text-sm'} text-center`}>
            {isSignUp 
            ? `Create a new cashier account` 
            : `Sign in to continue to your ${isAdminMode ? 'manager dashboard' : 'POS system'}`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* OAuth Buttons for Cashiers */}
          {!isAdminMode && (
            <div className={`${isSignUp ? 'space-y-2 mb-3' : 'space-y-3 mb-4'}`}>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  type="button"
                  variant="outline"
                  className={`w-full ${isSignUp ? 'h-8' : 'h-9'} text-xs border-gray-300 hover:bg-gray-50 transition-all duration-300`}
                  disabled
                >
                  <Github className="mr-1 h-3 w-3" />
                  GitHub
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className={`w-full ${isSignUp ? 'h-8' : 'h-9'} text-xs border-gray-300 hover:bg-gray-50 transition-all duration-300`}
                  disabled
                >
                  <Chrome className="mr-1 h-3 w-3" />
                  Google
                </Button>
              </div>
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <Separator className="w-full" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-white px-2 text-gray-500">Or continue with email</span>
                </div>
              </div>
            </div>
          )}

          <form onSubmit={onFormSubmit} className={`${isSignUp ? 'space-y-2' : 'space-y-4'}`}>
            {isSignUp && (
              <>
                <div className="space-y-0.5">
                  <Label htmlFor="username" className="text-xs font-medium">
                    Username
                  </Label>
                  <Input
                    id="username"
                    value={formData.username}
                    onChange={(e) => onInputChange('username', e.target.value)}
                    className={`h-8 px-3 text-sm ${colors.primaryBorder} transition-all duration-300`}
                    placeholder="johndoe"
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-0.5">
                    <Label htmlFor="firstName" className="text-xs font-medium">
                      First Name
                    </Label>
                    <Input
                      id="firstName"
                      value={formData.firstName}
                      onChange={(e) => onInputChange('firstName', e.target.value)}
                      className={`h-8 px-3 text-sm ${colors.primaryBorder} transition-all duration-300`}
                      placeholder="John"
                      required
                    />
                  </div>
                  <div className="space-y-0.5">
                    <Label htmlFor="lastName" className="text-xs font-medium">
                      Last Name
                    </Label>
                    <Input
                      id="lastName"
                      value={formData.lastName}
                      onChange={(e) => onInputChange('lastName', e.target.value)}
                      className={`h-8 px-3 text-sm ${colors.primaryBorder} transition-all duration-300`}
                      placeholder="Doe"
                      required
                    />
                  </div>
                </div>
              </>
            )}
            <div className={`${isSignUp ? 'space-y-0.5' : 'space-y-1'}`}>
              <Label htmlFor="email" className="text-xs font-medium">
                Email
              </Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => onInputChange('email', e.target.value)}
                className={`h-8 px-3 text-sm ${colors.primaryBorder} transition-all duration-300`}
                placeholder="you@example.com"
                required
              />
            </div>
            <div className={`${isSignUp ? 'space-y-0.5' : 'space-y-1'}`}>
              <Label htmlFor="password" className="text-xs font-medium">
                Password
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={(e) => onInputChange('password', e.target.value)}
                  className={`h-8 px-3 pr-8 text-sm ${colors.primaryBorder} transition-all duration-300`}
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
            </div>
            
            {/* Remember Me checkbox - only show for login, not signup */}
            {!isSignUp && (
              <div className="flex items-center space-x-2">
                <input
                  id="remember-me"
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => onToggleRememberMe(e.target.checked)}
                  className="h-3 w-3 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <Label htmlFor="remember-me" className="text-xs font-medium text-gray-700">
                  Remember me for 30 days
                </Label>
              </div>
            )}
            
            <div className={`flex flex-col ${isSignUp ? 'gap-1' : 'gap-2'}`}>
              <Button 
                type="submit" 
                disabled={isLoading}
                className={`w-full ${isSignUp ? 'h-8' : 'h-9'} text-sm ${colors.primaryButton} duration-500 text-white font-medium transition-all`}
              >
                {isLoading ? 'Loading...' : (isSignUp ? 'Create Cashier Account' : 'Sign In')}
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
          </form>
        </CardContent>
      </Card>
    </div>
  );
};
