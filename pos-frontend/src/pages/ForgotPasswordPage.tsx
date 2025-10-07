import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { ArrowLeft, Mail, CheckCircle, AlertCircle } from 'lucide-react';
import { AuthService } from '@/services/authService';
import { getColorScheme } from '@/utils/colorSchemes';
import { useToast } from '@/components/ui/use-toast';
import emailjs from '@emailjs/browser';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { toast } = useToast();
  const colors = getColorScheme();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setError('Please enter your email address');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      // First, get a real reset token from the backend
      const resetResponse = await AuthService.forgotPassword(email);
      
      if (!resetResponse.success) {
        setError(resetResponse.message || 'Failed to generate reset token');
        return;
      }

      // Initialize EmailJS with your public key
      emailjs.init(import.meta.env.VITE_EMAILJS_PUBLIC_KEY);

      // Use the real token from the backend response
      const realToken = resetResponse.data?.token || resetResponse.token;
      
      if (!realToken) {
        setError('Failed to get reset token from server');
        return;
      }
      
      // Send password reset email using EmailJS with the real token
      const templateParams = {
        email: email,  // Changed from to_email to email to match template
        reset_link: `${window.location.origin}/reset-password/${realToken}?email=${encodeURIComponent(email)}`,
        store_name: 'SmartGrocery',
        user_email: email,
        reply_to: email
      };

      const result = await emailjs.send(
        import.meta.env.VITE_EMAILJS_SERVICE_ID,
        import.meta.env.VITE_EMAILJS_TEMPLATE_ID,
        templateParams,
        {
          publicKey: import.meta.env.VITE_EMAILJS_PUBLIC_KEY,
        }
      );

      if (result.status === 200) {
        setIsSubmitted(true);
        toast({
          title: "Reset Link Sent",
          description: "Check your email for password reset instructions",
          variant: "success"
        });
      } else {
        throw new Error('Failed to send email');
      }
    } catch (error: any) {
      console.error('EmailJS error:', error);
      console.error('Error details:', {
        status: error.status,
        text: error.text,
        message: error.message
      });
      
      // Handle specific EmailJS errors
      if (error.status === 422) {
        setError('Template validation error. Please check your EmailJS template configuration.');
        toast({
          title: "Template Error",
          description: "Please check your EmailJS template configuration.",
          variant: "destructive"
        });
      } else if (error.text && error.text.includes('insufficient authentication scopes')) {
        setError('Gmail authentication issue. Please re-authorize your Gmail service in EmailJS dashboard.');
        toast({
          title: "Authentication Error",
          description: "Please re-authorize your Gmail service in EmailJS dashboard.",
          variant: "destructive"
        });
      } else {
        setError(`Failed to send reset link: ${error.text || error.message}`);
        toast({
          title: "Email Failed",
          description: `Failed to send reset link: ${error.text || error.message}`,
          variant: "destructive"
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (isSubmitted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#ececec]">
        <div className="container mx-auto flex items-center justify-center px-4 py-4">
          <Card className={`w-full max-w-md ${colors.cardBg} shadow-xl`}>
            <CardHeader className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
              <CardTitle className="text-2xl font-bold text-black">Check Your Email</CardTitle>
              <CardDescription className="text-gray-600">
                We've sent a password reset link to your email address
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-center text-sm text-gray-600">
                <p>If an account with the email <strong>{email}</strong> exists, you will receive a password reset link.</p>
                <p className="mt-2">The link will expire in 15 minutes.</p>
              </div>
              
              <div className="space-y-2">
                <Button
                  onClick={() => navigate('/login')}
                  className={`w-full ${colors.primaryButton} text-white`}
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back to Login
                </Button>
                
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsSubmitted(false);
                    setEmail('');
                  }}
                  className="w-full"
                >
                  Try Different Email
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
              <Mail className="h-8 w-8 text-green-600" />
            </div>
            <CardTitle className="text-2xl font-bold text-black">Forgot Password?</CardTitle>
            <CardDescription className="text-gray-600">
              Enter your email address and we'll send you a link to reset your password
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium text-black">
                  Email Address
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email address"
                  className={`${colors.primaryBorder} transition-all duration-300`}
                  required
                />
              </div>

              {error && (
                <div className="flex items-center space-x-2 text-red-600 text-sm">
                  <AlertCircle className="h-4 w-4" />
                  <span>{error}</span>
                </div>
              )}

              <Button
                type="submit"
                disabled={isLoading}
                className={`w-full ${colors.primaryButton} text-white`}
              >
                {isLoading ? 'Sending...' : 'Send Reset Link'}
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
