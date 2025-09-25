
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';

const Index = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && user) {
      // Redirect based on user role
      if (user.role === 'manager') {
        navigate('/admin/dashboard');
      } else {
        navigate('/pos');
      }
    }
  }, [user, loading, navigate]);

  // Show loading while determining redirect
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-pos-primary mx-auto"></div>
          <p className="mt-4 text-gray-500">Loading...</p>
        </div>
      </div>
    );
  }

  // This should not be reached due to redirect, but just in case
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-pos-primary mx-auto"></div>
        <p className="mt-4 text-gray-500">Redirecting...</p>
      </div>
    </div>
  );
};

export default Index;
