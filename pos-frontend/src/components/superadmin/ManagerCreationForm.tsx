import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  UserPlus, 
  Eye, 
  EyeOff, 
  CheckCircle, 
  AlertCircle,
  Shield,
  Mail,
  User,
  Lock
} from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { superadminAPI } from '@/lib/api';
import { useRefresh } from '@/context/RefreshContext';
import { PasswordHelpTooltip } from '@/components/ui/password-help-tooltip';
import { validatePassword, PasswordValidationResult, getPasswordStrengthColor } from '@/utils/passwordValidation';

interface ManagerFormData {
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
  firstName: string;
  lastName: string;
}

interface ManagerCreationFormProps {
  onManagerCreated?: () => void;
}

export default function ManagerCreationForm({ onManagerCreated }: ManagerCreationFormProps) {
  const [formData, setFormData] = useState<ManagerFormData>({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    firstName: '',
    lastName: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Partial<ManagerFormData>>({});
  const [passwordValidation, setPasswordValidation] = useState<PasswordValidationResult>({
    isValid: false,
    errors: [],
    strength: 'weak'
  });
  const { toast } = useToast();
  const { triggerRefresh } = useRefresh();

  const validateForm = (): boolean => {
    const newErrors: Partial<ManagerFormData> = {};

    // Username validation
    if (!formData.username.trim()) {
      newErrors.username = 'Username is required';
    } else if (formData.username.length < 3) {
      newErrors.username = 'Username must be at least 3 characters';
    } else if (!/^[a-zA-Z0-9_]+$/.test(formData.username)) {
      newErrors.username = 'Username can only contain letters, numbers, and underscores';
    }

    // Email validation
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    // Password validation
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else {
      const validation = validatePassword(formData.password);
      if (!validation.isValid) {
        newErrors.password = 'Password does not meet requirements';
      }
    }

    // Confirm password validation
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    // First name validation
    if (!formData.firstName.trim()) {
      newErrors.firstName = 'First name is required';
    }

    // Last name validation
    if (!formData.lastName.trim()) {
      newErrors.lastName = 'Last name is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (field: keyof ManagerFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
    
    // Validate password in real-time
    if (field === 'password') {
      const validation = validatePassword(value);
      setPasswordValidation(validation);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast({
        title: "Validation Error",
        description: "Please fix the errors before submitting",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    
    try {
      const response = await superadminAPI.createManager({
        username: formData.username,
        email: formData.email,
        password: formData.password,
        firstName: formData.firstName,
        lastName: formData.lastName,
      });

      if (response.success) {
        toast({
          title: "Success",
          description: `Manager account created successfully for ${response.data.user.firstName} ${response.data.user.lastName}`,
        });
        
        // Reset form
        setFormData({
          username: '',
          email: '',
          password: '',
          confirmPassword: '',
          firstName: '',
          lastName: '',
        });
        
        // Trigger refresh of quick stats
        triggerRefresh();
        onManagerCreated?.();
      } else {
        throw new Error(response.message || 'Failed to create manager account');
      }
    } catch (error) {
      console.error('Error creating manager:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : 'Failed to create manager account',
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6 p-4 sm:p-6">
      {/* Header - Responsive */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-3 sm:space-y-0 sm:space-x-3">
        <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
          <UserPlus className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
        </div>
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-white">Create Manager Account</h1>
          <p className="text-slate-400 text-sm sm:text-base">
            Create a new manager account with full system access
          </p>
        </div>
      </div>

      {/* Info Alert - Responsive */}
      <Alert className="bg-blue-900/20 border-blue-700">
        <Shield className="h-4 w-4 text-blue-400 flex-shrink-0" />
        <AlertDescription className="text-blue-200 text-sm sm:text-base">
          Manager accounts are automatically approved and have full access to the system.
          They can manage cashiers and access all administrative features.
        </AlertDescription>
      </Alert>

      {/* Form - Responsive */}
      <Card className="bg-slate-800/50 border-slate-700">
        <CardHeader className="pb-3">
          <CardTitle className="text-white flex items-center text-base sm:text-lg">
            <User className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
            Manager Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
            {/* Personal Information - Responsive */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName" className="text-slate-300 text-sm sm:text-base">
                  First Name *
                </Label>
                <Input
                  id="firstName"
                  type="text"
                  value={formData.firstName}
                  onChange={(e) => handleInputChange('firstName', e.target.value)}
                  className="bg-slate-700 border-slate-600 text-white text-sm sm:text-base"
                  placeholder="Enter first name"
                />
                {errors.firstName && (
                  <p className="text-xs sm:text-sm text-red-400 flex items-center">
                    <AlertCircle className="h-3 w-3 mr-1" />
                    {errors.firstName}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="lastName" className="text-slate-300 text-sm sm:text-base">
                  Last Name *
                </Label>
                <Input
                  id="lastName"
                  type="text"
                  value={formData.lastName}
                  onChange={(e) => handleInputChange('lastName', e.target.value)}
                  className="bg-slate-700 border-slate-600 text-white text-sm sm:text-base"
                  placeholder="Enter last name"
                />
                {errors.lastName && (
                  <p className="text-xs sm:text-sm text-red-400 flex items-center">
                    <AlertCircle className="h-3 w-3 mr-1" />
                    {errors.lastName}
                  </p>
                )}
              </div>
            </div>

            {/* Account Information - Responsive */}
            <div className="space-y-3 sm:space-y-4">
              <div className="space-y-2">
                <Label htmlFor="username" className="text-slate-300 text-sm sm:text-base">
                  Username *
                </Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input
                    id="username"
                    type="text"
                    value={formData.username}
                    onChange={(e) => handleInputChange('username', e.target.value)}
                    className="bg-slate-700 border-slate-600 text-white pl-10 text-sm sm:text-base"
                    placeholder="Enter username"
                  />
                </div>
                {errors.username && (
                  <p className="text-xs sm:text-sm text-red-400 flex items-center">
                    <AlertCircle className="h-3 w-3 mr-1" />
                    {errors.username}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="email" className="text-slate-300 text-sm sm:text-base">
                  Email Address *
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    className="bg-slate-700 border-slate-600 text-white pl-10 text-sm sm:text-base"
                    placeholder="Enter email address"
                  />
                </div>
                {errors.email && (
                  <p className="text-xs sm:text-sm text-red-400 flex items-center">
                    <AlertCircle className="h-3 w-3 mr-1" />
                    {errors.email}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-1">
                    <Label htmlFor="password" className="text-slate-300 text-sm sm:text-base">
                      Password *
                    </Label>
                    <PasswordHelpTooltip className="text-slate-400" />
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      value={formData.password}
                      onChange={(e) => handleInputChange('password', e.target.value)}
                      className="bg-slate-700 border-slate-600 text-white pl-10 pr-10 text-sm sm:text-base"
                      placeholder="Enter password"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4 text-slate-400" />
                      ) : (
                        <Eye className="h-4 w-4 text-slate-400" />
                      )}
                    </Button>
                  </div>
                  {/* Password validation feedback - reserved space to prevent layout shift */}
                  <div className="min-h-[3rem]">
                    {formData.password && (
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-slate-400">Strength:</span>
                          <span className={`text-xs font-medium ${getPasswordStrengthColor(passwordValidation.strength)}`}>
                            {passwordValidation.strength.charAt(0).toUpperCase() + passwordValidation.strength.slice(1)}
                          </span>
                        </div>
                        {passwordValidation.errors.length > 0 && (
                          <div className="text-xs text-red-400">
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
                  {errors.password && (
                    <p className="text-xs sm:text-sm text-red-400 flex items-center">
                      <AlertCircle className="h-3 w-3 mr-1" />
                      {errors.password}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword" className="text-slate-300 text-sm sm:text-base">
                    Confirm Password *
                  </Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input
                      id="confirmPassword"
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={formData.confirmPassword}
                      onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                      className="bg-slate-700 border-slate-600 text-white pl-10 pr-10 text-sm sm:text-base"
                      placeholder="Confirm password"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="h-4 w-4 text-slate-400" />
                      ) : (
                        <Eye className="h-4 w-4 text-slate-400" />
                      )}
                    </Button>
                  </div>
                  {errors.confirmPassword && (
                    <p className="text-xs sm:text-sm text-red-400 flex items-center">
                      <AlertCircle className="h-3 w-3 mr-1" />
                      {errors.confirmPassword}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Submit Button - Responsive */}
            <div className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-4">
              <Button
                type="button"
                variant="ghost"
                onClick={() => {
                  setFormData({
                    username: '',
                    email: '',
                    password: '',
                    confirmPassword: '',
                    firstName: '',
                    lastName: '',
                  });
                  setErrors({});
                }}
                className="text-slate-400 hover:text-white text-sm sm:text-base order-2 sm:order-1"
              >
                Clear Form
              </Button>
              <Button
                type="submit"
                disabled={loading || !passwordValidation.isValid}
                className="bg-blue-600 hover:bg-blue-700 text-white text-sm sm:text-base order-1 sm:order-2"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Creating...
                  </>
                ) : (
                  <>
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Create Manager
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
