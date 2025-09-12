import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { authAPI } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { Eye, EyeOff, ShieldCheck } from 'lucide-react';
import Cookies from 'js-cookie';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [type, setType] = useState('password');
  const [icon, setIcon] = useState(<EyeOff />);
  const [isSignUp, setIsSignUp] = useState(false);
  const [isSetup, setIsSetup] = useState(false);
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
        // Use window.location.href to avoid React re-renders
        window.location.href = '/';
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
          navigate('/');
        }
      } else if (isSignUp) {
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

  const handleAdminLogin = async () => {
    try {
      // Navigate to admin page after successful login
      const result = await handleLogin(email, password);
      if (result.success) {
        // Check if user is admin before redirecting
        const token = Cookies.get('auth_token');
        if (token) {
          // Decode token to check role (simple approach)
          try {
            const payload = JSON.parse(atob(token.split('.')[1]));
            if (payload.role === 'admin') {
              window.location.href = '/admin';
            } else {
              toast({
                title: "Access Denied",
                description: "Admin privileges required",
                variant: "destructive",
              });
            }
          } catch (e) {
            window.location.href = '/';
          }
        }
      } else {
        // Show error toast for failed admin login
        toast({
          title: "Admin Login Failed",
          description: result.message || 'Invalid credentials or insufficient permissions',
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Admin authentication error:', error);
      toast({
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-pos-primary/20 to-pos-background">
      <div className="container mx-auto flex items-center justify-center px-4">
        <div className="grid md:grid-cols-2 gap-8 w-full max-w-[1000px] bg-white rounded-2xl shadow-2xl p-8">
          {/* Left side - Image/Logo Section */}
          <div className="hidden md:flex flex-col items-center justify-center p-8 bg-pos-primary/10 rounded-xl">
            <div className="w-48 h-48 mb-8 bg-pos-primary/20 rounded-full flex items-center justify-center">
              {/* Placeholder for logo */}
              <img
                src="/images/BlesseStoreIcon.png"
                alt="Store Logo"
                className="w-40 h-40 object-contain mix-blend-multiply contrast-125"
              />
            </div>
            <div className="text-center space-y-4">
              <h2 className="text-2xl font-bold text-pos-primary">Welcome to Grocery POS</h2>
              <p className="text-gray-600">Manage your store with ease and efficiency</p>
            </div>
          </div>

          {/* Right side - Login Form */}
          <div className="flex flex-col justify-center">
            <Card className="border-0 shadow-none">
              <CardHeader className="space-y-2">
                <CardTitle className="text-3xl font-bold text-pos-primary">
                  {isSetup ? 'Initial Setup' : isSignUp ? 'Create Account' : 'Welcome Back'}
                </CardTitle>
                <CardDescription className="text-base">
                  {isSetup 
                    ? 'Create the initial admin account to get started' 
                    : isSignUp 
                    ? 'Create a new account to get started' 
                    : 'Sign in to continue to your dashboard'}
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
                          className="h-11 px-4 border-gray-200 focus:border-pos-primary focus:ring-pos-primary/20"
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
                            className="h-11 px-4 border-gray-200 focus:border-pos-primary focus:ring-pos-primary/20"
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
                            className="h-11 px-4 border-gray-200 focus:border-pos-primary focus:ring-pos-primary/20"
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
                      className="h-11 px-4 border-gray-200 focus:border-pos-primary focus:ring-pos-primary/20"
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
                        className="h-11 px-4 pr-10 border-gray-200 focus:border-pos-primary focus:ring-pos-primary/20"
                        placeholder="••••••••"
                        required
                      />
                      <button 
                        type="button"
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-pos-primary transition-colors duration-300"
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
                      className="w-full h-11 bg-pos-primary hover:bg-pos-primary/90 duration-500 text-white font-medium"
                    >
                      {isLoading ? 'Loading...' : (isSetup ? 'Setup Admin Account' : isSignUp ? 'Create Account' : 'Sign In')}
                    </Button>
                    
                    {!isSignUp && !isSetup && (
                      <Button 
                        type="button" 
                        variant="outline"
                        className="w-full h-11 border-pos-primary text-pos-primary hover:bg-pos-primary/10 duration-500 font-medium"
                        onClick={handleAdminLogin}
                      >
                        <ShieldCheck className="mr-2 h-4 w-4" />
                        Sign In as Admin
                      </Button>
                    )}
                    
                    {!isSignUp && !isSetup && (
                      <Button 
                        type="button" 
                        variant="outline"
                        className="w-full h-11 border-green-600 text-green-600 hover:bg-green-600/10 duration-500 font-medium"
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
                      className="w-full text-pos-primary hover:text-pos-primary/80 duration-500"
                      onClick={() => setIsSignUp(!isSignUp)}
                    >
                      {isSignUp 
                        ? 'Already have an account? Sign in' 
                        : "Don't have an account? Sign up"}
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