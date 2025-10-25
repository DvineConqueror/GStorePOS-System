import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  UserPlus,
  Eye,
  EyeOff,
  CheckCircle,
  AlertCircle,
  Mail,
  User,
  Lock,
} from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { superadminAPI } from "@/lib/api";
import { useRefresh } from "@/context/RefreshContext";
import { PasswordHelpTooltip } from "@/components/ui/password-help-tooltip";
import {
  validatePassword,
  PasswordValidationResult,
  getPasswordStrengthColor,
} from "@/utils/passwordValidation";

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

export default function ManagerCreationForm({
  onManagerCreated,
}: ManagerCreationFormProps) {
  const [formData, setFormData] = useState<ManagerFormData>({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
    firstName: "",
    lastName: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Partial<ManagerFormData>>({});
  const [passwordValidation, setPasswordValidation] =
    useState<PasswordValidationResult>({
      isValid: false,
      errors: [],
      strength: "weak",
    });
  const { toast } = useToast();
  const { triggerRefresh } = useRefresh();

  const validateForm = (): boolean => {
    const newErrors: Partial<ManagerFormData> = {};

    // Username validation
    if (!formData.username.trim()) {
      newErrors.username = "Username is required";
    } else if (formData.username.length < 3) {
      newErrors.username = "Username must be at least 3 characters";
    } else if (!/^[a-zA-Z0-9_]+$/.test(formData.username)) {
      newErrors.username =
        "Username can only contain letters, numbers, and underscores";
    }

    // Email validation
    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Please enter a valid email address";
    }

    // Password validation
    if (!formData.password) {
      newErrors.password = "Password is required";
    } else {
      const validation = validatePassword(formData.password);
      if (!validation.isValid) {
        newErrors.password = "Password does not meet requirements";
      }
    }

    // Confirm password validation
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = "Please confirm your password";
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }

    // First name validation
    if (!formData.firstName.trim()) {
      newErrors.firstName = "First name is required";
    }

    // Last name validation
    if (!formData.lastName.trim()) {
      newErrors.lastName = "Last name is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (field: keyof ManagerFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));

    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }

    // Validate password in real-time
    if (field === "password") {
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
          variant: "success",
        });

        // Reset form
        setFormData({
          username: "",
          email: "",
          password: "",
          confirmPassword: "",
          firstName: "",
          lastName: "",
        });

        // Trigger refresh of quick stats
        triggerRefresh();
        onManagerCreated?.();
      } else {
        throw new Error(response.message || "Failed to create manager account");
      }
    } catch (error) {
      console.error("Error creating manager:", error);
      toast({
        title: "Error",
        description:
          error instanceof Error
            ? error.message
            : "Failed to create manager account",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-teal-50">
      <div className="space-y-4 p-6">
        {/* Authority Header */}
        <div className="border-b border-gray-200 pb-6">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-xl hidden sm:flex items-center justify-center shadow-lg shadow-green-500/25">
              <UserPlus className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-black tracking-tight">
                Create Manager Account
              </h1>
              <p className="text-gray-600 text-lg mt-1">
                Create a new manager account with full system access
              </p>
            </div>
          </div>
        </div>

        {/* Authority Info Alert */}
        <Alert className="bg-white border-green-200">
          <AlertDescription className="text-green-700 text-base">
            Manager accounts are automatically approved and have full access to
            the system. They can manage cashiers and access all administrative
            features.
          </AlertDescription>
        </Alert>

        {/* Manager Creation Form */}
        <Card className="bg-white border-green-200">
          <CardHeader>
            <CardTitle className="text-black flex items-center text-xl">
              <User className="h-5 w-5 mr-3 text-green-600" />
              Manager Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Personal Information */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <Label
                    htmlFor="firstName"
                    className="text-black text-base font-medium"
                  >
                    First Name *
                  </Label>
                  <Input
                    id="firstName"
                    type="text"
                    value={formData.firstName}
                    onChange={(e) =>
                      handleInputChange("firstName", e.target.value)
                    }
                    className="bg-white border-gray-300 text-black text-base focus:border-green-500"
                    placeholder="Enter first name"
                  />
                  {errors.firstName && (
                    <p className="text-sm text-red-600 flex items-center">
                      <AlertCircle className="h-4 w-4 mr-2" />
                      {errors.firstName}
                    </p>
                  )}
                </div>

                <div className="space-y-3">
                  <Label
                    htmlFor="lastName"
                    className="text-black text-base font-medium"
                  >
                    Last Name *
                  </Label>
                  <Input
                    id="lastName"
                    type="text"
                    value={formData.lastName}
                    onChange={(e) =>
                      handleInputChange("lastName", e.target.value)
                    }
                    className="bg-white border-gray-300 text-black text-base focus:border-green-500"
                    placeholder="Enter last name"
                  />
                  {errors.lastName && (
                    <p className="text-sm text-red-600 flex items-center">
                      <AlertCircle className="h-4 w-4 mr-2" />
                      {errors.lastName}
                    </p>
                  )}
                </div>
              </div>

              {/* Account Information */}
              <div className="space-y-6">
                <div className="space-y-3">
                  <Label
                    htmlFor="username"
                    className="text-black text-base font-medium"
                  >
                    Username *
                  </Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-green-600" />
                    <Input
                      id="username"
                      type="text"
                      value={formData.username}
                      onChange={(e) =>
                        handleInputChange("username", e.target.value)
                      }
                      className="bg-white border-gray-300 text-black pl-12 text-base focus:border-green-500"
                      placeholder="Enter username"
                    />
                  </div>
                  {errors.username && (
                    <p className="text-sm text-red-600 flex items-center">
                      <AlertCircle className="h-4 w-4 mr-2" />
                      {errors.username}
                    </p>
                  )}
                </div>

                <div className="space-y-3">
                  <Label
                    htmlFor="email"
                    className="text-black text-base font-medium"
                  >
                    Email Address *
                  </Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-green-600" />
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) =>
                        handleInputChange("email", e.target.value)
                      }
                      className="bg-white border-gray-300 text-black pl-12 text-base focus:border-green-500"
                      placeholder="Enter email address"
                    />
                  </div>
                  {errors.email && (
                    <p className="text-sm text-red-600 flex items-center">
                      <AlertCircle className="h-4 w-4 mr-2" />
                      {errors.email}
                    </p>
                  )}
                </div>

                {/* Password Fields */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Label
                        htmlFor="password"
                        className="text-black text-base font-medium"
                      >
                        Password *
                      </Label>
                      <PasswordHelpTooltip className="text-gray-600" />
                    </div>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-green-600" />
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        value={formData.password}
                        onChange={(e) =>
                          handleInputChange("password", e.target.value)
                        }
                        className="bg-white border-gray-300 text-black pl-12 pr-12 text-base focus:border-green-500"
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
                          <EyeOff className="h-5 w-5 text-gray-600" />
                        ) : (
                          <Eye className="h-5 w-5 text-gray-600" />
                        )}
                      </Button>
                    </div>
                    {/* Password validation feedback */}
                    <div>
                      {formData.password && (
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-slate-400">
                              Strength:
                            </span>
                            <span
                              className={`text-sm font-medium ${getPasswordStrengthColor(
                                passwordValidation.strength
                              )}`}
                            >
                              {passwordValidation.strength
                                .charAt(0)
                                .toUpperCase() +
                                passwordValidation.strength.slice(1)}
                            </span>
                          </div>
                          {passwordValidation.errors.length > 0 && (
                            <div className="text-sm text-red-400">
                              <ul className="list-disc list-inside space-y-1">
                                {passwordValidation.errors.map(
                                  (error, index) => (
                                    <li key={index}>{error}</li>
                                  )
                                )}
                              </ul>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                    {errors.password && (
                      <p className="text-sm text-red-400 flex items-center">
                        <AlertCircle className="h-4 w-4 mr-2" />
                        {errors.password}
                      </p>
                    )}
                  </div>

                  <div className="space-y-3">
                    <Label
                      htmlFor="confirmPassword"
                      className="text-black text-base font-medium"
                    >
                      Confirm Password *
                    </Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-green-600" />
                      <Input
                        id="confirmPassword"
                        type={showConfirmPassword ? "text" : "password"}
                        value={formData.confirmPassword}
                        onChange={(e) =>
                          handleInputChange("confirmPassword", e.target.value)
                        }
                        className="bg-white border-gray-300 text-black pl-12 pr-12 text-base focus:border-green-500"
                        placeholder="Confirm password"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                        onClick={() =>
                          setShowConfirmPassword(!showConfirmPassword)
                        }
                      >
                        {showConfirmPassword ? (
                          <EyeOff className="h-5 w-5 text-gray-600" />
                        ) : (
                          <Eye className="h-5 w-5 text-gray-600" />
                        )}
                      </Button>
                    </div>
                    {errors.confirmPassword && (
                      <p className="text-sm text-red-400 flex items-center">
                        <AlertCircle className="h-4 w-4 mr-2" />
                        {errors.confirmPassword}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Submit Actions */}
              <div className="flex justify-end space-x-4">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => {
                    setFormData({
                      username: "",
                      email: "",
                      password: "",
                      confirmPassword: "",
                      firstName: "",
                      lastName: "",
                    });
                    setErrors({});
                  }}
                  className="text-slate-400 hover:text-black"
                >
                  Clear Form
                </Button>
                <Button
                  type="submit"
                  disabled={loading || !passwordValidation.isValid}
                  className="bg-green-600 hover:bg-green-700 text-white font-semibold px-8"
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                      Creating...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="h-5 w-5 mr-2" />
                      Create Manager
                    </>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
