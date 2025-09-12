import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { authAPI } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { Eye, EyeOff, ShieldCheck, Users, UserCheck } from 'lucide-react';
import Cookies from 'js-cookie';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [type, setType] = useState('password');
  const [icon, setIcon] = useState(<EyeOff />);
  const [isSignUp, setIsSignUp] = useState(false);
  const [isSetup, setIsSetup] = useState(false);
  const [isAdminMode, setIsAdminMode] = useState(false);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [username, setUsername] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { signIn, signUp, signUpCashier, setup } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const togglePasswordVisibility = () => {
    if (type === 'password') {
      setType('text');
      setIcon(<Eye />);
    } else {
      setType('password');
      setIcon(<EyeOff />);
    }
  };

  // Custom login function to avoid AuthContext re-renders
  const handleLogin = async (emailOrUsername: string, password: string) => {
    try {
      setIsLoading(true);
      
      // Direct API call without going through AuthContext
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api/v1'}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          emailOrUsername,
          password,
        }),
      });
      
      const data = await response.json();
      
      if (data.success) {
        // Store the token in cookies
        Cookies.set('auth_token', data.data.token, { expires: 7 });
        
        // Role-based redirect
        const userRole = data.data.user.role;
        if (userRole === 'admin') {
          window.location.href = '/dashboard';
        } else {
          window.location.href = '/pos';
        }
        return { success: true };
      }
      
      return { success: false, message: data.message || 'Login failed' };
    } catch (error: any) {
      const message = error.message || 'Login failed';
      return { success: false, message };
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (isSetup) {
        const result = await setup({
          username,
          email,
          password,
          firstName,
          lastName
        });
        if (result.success) {
          navigate('/dashboard');
        }
      } else if (isSignUp) {
        if (isAdminMode) {
          // Admin signup - only allow if no admin exists
          const result = await signUp({
            username,
            email,
            password,
            role: 'admin',
            firstName,
            lastName
          });
          if (result.success) {
            navigate('/dashboard');
          }
        } else {
          // Cashier signup
          const result = await signUpCashier({
            username,
            email,
            password,
            firstName,
            lastName
          });
          if (result.success) {
            // Cashier accounts require admin approval, so don't auto-login
            // Reset form and switch back to login mode
            setIsSignUp(false);
            setEmail('');
            setPassword('');
            setUsername('');
            setFirstName('');
            setLastName('');
          }
        }
      } else {
        const result = await handleLogin(email, password);
        if (!result.success) {
          // Show error toast for failed login
          toast({
            title: "Login Failed",
            description: result.message || 'Invalid credentials or account not activated',
            variant: "destructive",
          });
        }
      }
    } catch (error) {
      console.error('Authentication error:', error);
      toast({
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    }
  };

  const toggleRoleMode = () => {
    // Add smooth transition effect
    const container = document.querySelector('.login-container');
    if (container) {
      container.classList.add('transitioning');
    }
    
    // Delay the state change for smooth animation
    setTimeout(() => {
      setIsAdminMode(!isAdminMode);
      // Reset form when switching modes
      setEmail('');
      setPassword('');
      setUsername('');
      setFirstName('');
      setLastName('');
      setIsSignUp(false);
      setIsSetup(false);
      
      // Remove transition class after animation
      setTimeout(() => {
        if (container) {
          container.classList.remove('transitioning');
        }
      }, 300);
    }, 150);
  };

  // Dynamic color schemes based on role
  const cashierColors = {
    primary: 'from-blue-500/20 to-blue-100',
    cardBg: 'bg-white',
    primaryButton: 'bg-blue-600 hover:bg-blue-700',
    primaryText: 'text-blue-600',
    primaryBorder: 'border-blue-200 focus:border-blue-500 focus:ring-blue-500/20',
    primaryHover: 'hover:bg-blue-600/10',
    logoBg: 'bg-blue-500/10',
    logoIcon: 'bg-blue-500/20'
  };

  const adminColors = {
    primary: 'from-slate-800/20 to-slate-900/10',
    cardBg: 'bg-slate-50',
    primaryButton: 'bg-slate-800 hover:bg-slate-900',
    primaryText: 'text-slate-800',
    primaryBorder: 'border-slate-300 focus:border-slate-600 focus:ring-slate-600/20',
    primaryHover: 'hover:bg-slate-800/10',
    logoBg: 'bg-slate-800/10',
    logoIcon: 'bg-slate-800/20'
  };

  const colors = isAdminMode ? adminColors : cashierColors;

  return (
    <div className={`min-h-screen flex items-center justify-center bg-gradient-to-br ${colors.primary} transition-all duration-700`}>
      <div className="container mx-auto flex items-center justify-center px-4">
        <div className={`login-container grid md:grid-cols-2 gap-8 w-full max-w-[1000px] ${colors.cardBg} rounded-2xl shadow-2xl p-8 transition-all duration-700 ease-in-out`}>
          {/* Logo/Info Section - Position changes based on role */}
          <div className={`hidden md:flex flex-col items-center justify-center p-8 ${colors.logoBg} rounded-xl transition-all duration-500 ${isAdminMode ? 'order-2' : 'order-1'}`}>
            <div className={`w-48 h-48 mb-8 ${colors.logoIcon} rounded-full flex items-center justify-center transition-all duration-500`}>
              <img
                src="/images/BlesseStoreIcon.png"
                alt="Store Logo"
                className="w-40 h-40 object-contain mix-blend-multiply contrast-125"
              />
            </div>
            <div className="text-center space-y-4">
              <h2 className={`text-2xl font-bold ${colors.primaryText} transition-colors duration-500`}>
                {isAdminMode ? 'Admin Dashboard' : 'Cashier POS'}
              </h2>
              <p className="text-gray-600">
                {isAdminMode 
                  ? 'Manage your store operations and analytics' 
                  : 'Process sales and manage transactions'}
              </p>
            </div>
          </div>

          {/* Form Section - Position changes based on role */}
          <div className={`flex flex-col justify-center transition-all duration-500 ${isAdminMode ? 'order-1' : 'order-2'}`}>
            <Card className="border-0 shadow-none">
              <CardHeader className="space-y-2">
                <div className="flex items-center justify-between">
                  <CardTitle className={`text-3xl font-bold ${colors.primaryText} transition-colors duration-500`}>
                    {isSetup ? 'Initial Setup' : isSignUp ? 'Create Account' : 'Welcome Back'}
                  </CardTitle>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={toggleRoleMode}
                    className={`${colors.primaryHover} ${colors.primaryBorder} transition-all duration-300`}
                  >
                    {isAdminMode ? (
                      <>
                        <Users className="mr-2 h-4 w-4" />
                        Cashier Mode
                      </>
                    ) : (
                      <>
                        <ShieldCheck className="mr-2 h-4 w-4" />
                        Admin Mode
                      </>
                    )}
                  </Button>
                </div>
                <CardDescription className="text-base">
                  {isSetup 
                    ? 'Create the initial admin account to get started' 
                    : isSignUp 
                    ? `Create a new ${isAdminMode ? 'admin' : 'cashier'} account` 
                    : `Sign in to continue to your ${isAdminMode ? 'admin dashboard' : 'POS system'}`}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  {(isSignUp || isSetup) && (
                    <>
                      <div className="space-y-2">
                        <Label htmlFor="username" className="text-sm font-medium">
                          Username
                        </Label>
                        <Input
                          id="username"
                          value={username}
                          onChange={(e) => setUsername(e.target.value)}
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
                            value={firstName}
                            onChange={(e) => setFirstName(e.target.value)}
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
                            value={lastName}
                            onChange={(e) => setLastName(e.target.value)}
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
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
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
                        type={type}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className={`h-11 px-4 pr-10 ${colors.primaryBorder} transition-all duration-300`}
                        placeholder="••••••••"
                        required
                      />
                      <button 
                        type="button"
                        className={`absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:${colors.primaryText} transition-colors duration-300`}
                        onClick={togglePasswordVisibility}
                      >
                        {icon}
                      </button>
                    </div>
                  </div>
                  <div className="flex flex-col gap-3">
                    <Button 
                      type="submit" 
                      disabled={isLoading}
                      className={`w-full h-11 ${colors.primaryButton} duration-500 text-white font-medium transition-all`}
                    >
                      {isLoading ? 'Loading...' : (isSetup ? 'Setup Admin Account' : isSignUp ? `Create ${isAdminMode ? 'Admin' : 'Cashier'} Account` : 'Sign In')}
                    </Button>
                    
                    {!isSignUp && !isSetup && (
                      <Button 
                        type="button" 
                        variant="outline"
                        className={`w-full h-11 border-green-600 text-green-600 hover:bg-green-600/10 duration-500 font-medium`}
                        onClick={() => setIsSetup(true)}
                      >
                        <ShieldCheck className="mr-2 h-4 w-4" />
                        Initial Setup
                      </Button>
                    )}
                  </div>
                  
                  {!isSetup && (
                    <Button
                      type="button"
                      variant="link"
                      className={`w-full ${colors.primaryText} hover:${colors.primaryText}/80 duration-500 transition-colors`}
                      onClick={() => setIsSignUp(!isSignUp)}
                    >
                      {isSignUp 
                        ? 'Already have an account? Sign in' 
                        : `Don't have an account? Sign up as ${isAdminMode ? 'Admin' : 'Cashier'}`}
                    </Button>
                  )}
                  
                  {isSetup && (
                    <Button
                      type="button"
                      variant="link"
                      className="w-full text-gray-500 hover:text-gray-700 duration-500"
                      onClick={() => setIsSetup(false)}
                    >
                      Back to Login
                    </Button>
                  )}
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}