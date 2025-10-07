import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { ArrowLeft, Lock, CheckCircle, AlertCircle, Eye, EyeOff } from 'lucide-react';
import { AuthService } from '@/services/authService';
import { getColorScheme } from '@/utils/colorSchemes';
import { useToast } from '@/components/ui/use-toast';
import { validatePassword, getPasswordStrengthColor } from '@/utils/passwordValidation';

export default function ResetPasswordPage() {
  const { token } = useParams<{ token: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const colors = getColorScheme();

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isVerifying, setIsVerifying] = useState(true);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState('');
  const [tokenValid, setTokenValid] = useState(false);
  const [userEmail, setUserEmail] = useState('');

  const passwordValidation = validatePassword(newPassword);
  const passwordsMatch = newPassword === confirmPassword && confirmPassword.length > 0;

  useEffect(() => {
    if (token) {
      // Get email from query parameters for display
      const email = searchParams.get('email');
      if (email) {
        setUserEmail(email);
      }
      // Verify the token with the backend
      verifyToken();
    } else {
      setError('Invalid reset link');
      setIsVerifying(false);
    }
  }, [token, searchParams]);

  const verifyToken = async () => {
    if (!token) return;

    try {
      const response = await AuthService.verifyResetToken(token);
      
      if (response.success && response.data?.user) {
        setTokenValid(true);
        // Use the email from the backend response if available, otherwise use query param
        if (response.data.user.email) {
          setUserEmail(response.data.user.email);
        }
      } else {
        setError(response.message || 'Invalid or expired reset link');
      }
    } catch (error: any) {
      console.error('Token verification error:', error);
      setError(error.response?.data?.message || 'Invalid or expired reset link');
    } finally {
      setIsVerifying(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newPassword || !confirmPassword) {
      setError('Please fill in all fields');
      return;
    }

    if (!passwordValidation.isValid) {
      setError('Password does not meet requirements');
      return;
    }

    if (!passwordsMatch) {
      setError('Passwords do not match');
      return;
    }

    if (!token) {
      setError('Invalid reset link');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      // Use the real backend password reset functionality
      const response = await AuthService.resetPassword(token, newPassword);
      
      if (response.success) {
        setIsSuccess(true);
        toast({
          title: "Password Reset Successful",
          description: response.message || "Your password has been reset successfully. Please log in with your new password.",
          variant: "success"
        });
      } else {
        setError(response.message || 'Failed to reset password');
      }
    } catch (error: any) {
      console.error('Reset password error:', error);
      setError(error.response?.data?.message || 'Failed to reset password. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (isVerifying) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#ececec]">
        <div className="container mx-auto flex items-center justify-center px-4 py-4">
          <Card className={`w-full max-w-md ${colors.cardBg} shadow-xl`}>
            <CardContent className="p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Verifying reset link...</p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (isSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#ececec]">
        <div className="container mx-auto flex items-center justify-center px-4 py-4">
          <Card className={`w-full max-w-md ${colors.cardBg} shadow-xl`}>
            <CardHeader className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
              <CardTitle className="text-2xl font-bold text-black">Password Reset Successful</CardTitle>
              <CardDescription className="text-gray-600">
                Your password has been successfully reset
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-center text-sm text-gray-600">
                <p>You can now log in with your new password.</p>
              </div>
              
              <Button
                onClick={() => navigate('/login')}
                className={`w-full ${colors.primaryButton} text-white`}
              >
                Continue to Login
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (!tokenValid) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#ececec]">
        <div className="container mx-auto flex items-center justify-center px-4 py-4">
          <Card className={`w-full max-w-md ${colors.cardBg} shadow-xl`}>
            <CardHeader className="text-center">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertCircle className="h-8 w-8 text-red-600" />
              </div>
              <CardTitle className="text-2xl font-bold text-black">Invalid Reset Link</CardTitle>
              <CardDescription className="text-gray-600">
                This password reset link is invalid or has expired
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {error && (
                <div className="text-center text-sm text-red-600">
                  {error}
                </div>
              )}
              
              <div className="space-y-2">
                <Button
                  onClick={() => navigate('/forgot-password')}
                  className={`w-full ${colors.primaryButton} text-white`}
                >
                  Request New Reset Link
                </Button>
                
                <Button
                  variant="outline"
                  onClick={() => navigate('/login')}
                  className="w-full"
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back to Login
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#ececec]">
      <div className="container mx-auto flex items-center justify-center px-4 py-4">
        <Card className={`w-full max-w-md ${colors.cardBg} shadow-xl`}>
          <CardHeader className="text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Lock className="h-8 w-8 text-green-600" />
            </div>
            <CardTitle className="text-2xl font-bold text-black">Reset Your Password</CardTitle>
            <CardDescription className="text-gray-600">
              Enter a new password for {userEmail}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="newPassword" className="text-sm font-medium text-black">
                  New Password
                </Label>
                <div className="relative">
                  <Input
                    id="newPassword"
                    type={showPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Enter new password"
                    className={`pr-10 ${colors.primaryBorder} transition-all duration-300`}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                
                {newPassword && (
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

              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="text-sm font-medium text-black">
                  Confirm New Password
                </Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm new password"
                    className={`pr-10 ${colors.primaryBorder} transition-all duration-300`}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  >
                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                
                {confirmPassword && (
                  <div className="text-xs">
                    {passwordsMatch ? (
                      <span className="text-green-600">✓ Passwords match</span>
                    ) : (
                      <span className="text-red-600">✗ Passwords do not match</span>
                    )}
                  </div>
                )}
              </div>

              {error && (
                <div className="flex items-center space-x-2 text-red-600 text-sm">
                  <AlertCircle className="h-4 w-4" />
                  <span>{error}</span>
                </div>
              )}

              <Button
                type="submit"
                disabled={isLoading || !passwordValidation.isValid || !passwordsMatch}
                className={`w-full ${colors.primaryButton} text-white`}
              >
                {isLoading ? 'Resetting...' : 'Reset Password'}
              </Button>

              <div className="text-center">
                <Link
                  to="/login"
                  className={`text-sm ${colors.primaryText} hover:underline`}
                >
                  <ArrowLeft className="inline mr-1 h-3 w-3" />
                  Back to Login
                </Link>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
