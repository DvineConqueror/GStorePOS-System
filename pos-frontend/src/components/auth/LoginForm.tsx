import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Eye, EyeOff, ShieldCheck, Users } from 'lucide-react';
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
        <CardHeader className="space-y-2">
          <div className="flex items-center justify-between">
            <CardTitle className={`text-3xl font-bold ${colors.primaryText} transition-colors duration-500`}>
              {isSignUp ? 'Create Account' : 'Welcome Back'}
            </CardTitle>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onToggleRoleMode}
              className={`${colors.primaryHover} ${colors.primaryBorder} transition-all duration-300 transform hover:scale-105 active:scale-95`}
            >
              {isAdminMode ? (
                <>
                  <Users className="mr-2 h-4 w-4 transition-transform duration-300" />
                  <span className="transition-all duration-300">Cashier Mode</span>
                </>
              ) : (
                <>
                  <ShieldCheck className="mr-2 h-4 w-4 transition-transform duration-300" />
                  <span className="transition-all duration-300">Manager Mode</span>
                </>
              )}
            </Button>
          </div>
          <CardDescription className="text-base">
            {isSignUp 
            ? `Create a new ${isAdminMode ? 'manager' : 'cashier'} account` 
            : `Sign in to continue to your ${isAdminMode ? 'manager dashboard' : 'POS system'}`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={onFormSubmit} className="space-y-6">
            {isSignUp && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="username" className="text-sm font-medium">
                    Username
                  </Label>
                  <Input
                    id="username"
                    value={formData.username}
                    onChange={(e) => onInputChange('username', e.target.value)}
                    className={`h-11 px-4 ${colors.primaryBorder} transition-all duration-300`}
                    placeholder="johndoe"
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName" className="text-sm font-medium">
                      First Name
                    </Label>
                    <Input
                      id="firstName"
                      value={formData.firstName}
                      onChange={(e) => onInputChange('firstName', e.target.value)}
                      className={`h-11 px-4 ${colors.primaryBorder} transition-all duration-300`}
                      placeholder="John"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName" className="text-sm font-medium">
                      Last Name
                    </Label>
                    <Input
                      id="lastName"
                      value={formData.lastName}
                      onChange={(e) => onInputChange('lastName', e.target.value)}
                      className={`h-11 px-4 ${colors.primaryBorder} transition-all duration-300`}
                      placeholder="Doe"
                      required
                    />
                  </div>
                </div>
              </>
            )}
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium">
                Email
              </Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => onInputChange('email', e.target.value)}
                className={`h-11 px-4 ${colors.primaryBorder} transition-all duration-300`}
                placeholder="you@example.com"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-medium">
                Password
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={(e) => onInputChange('password', e.target.value)}
                  className={`h-11 px-4 pr-10 ${colors.primaryBorder} transition-all duration-300`}
                  placeholder="••••••••"
                  required
                />
                <button 
                  type="button"
                  className={`absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:${colors.primaryText} transition-colors duration-300`}
                  onClick={onTogglePasswordVisibility}
                >
                  {showPassword ? <Eye /> : <EyeOff />}
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
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <Label htmlFor="remember-me" className="text-sm font-medium text-gray-700">
                  Remember me for 30 days
                </Label>
              </div>
            )}
            
            <div className="flex flex-col gap-3">
              <Button 
                type="submit" 
                disabled={isLoading}
                className={`w-full h-11 ${colors.primaryButton} duration-500 text-white font-medium transition-all`}
              >
                {isLoading ? 'Loading...' : (isSignUp ? `Create ${isAdminMode ? 'Manager' : 'Cashier'} Account` : 'Sign In')}
              </Button>
            </div>
            
            {!isAdminMode && (
              <Button
                type="button"
                variant="link"
                className={`w-full ${colors.primaryText} hover:${colors.primaryText}/80 duration-500 transition-colors`}
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
