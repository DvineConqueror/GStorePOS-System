import { Navigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';

export default function AdminRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-pos-primary mx-auto"></div>
          <p className="mt-4 text-gray-500">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user || !user.isActive) {
    return <Navigate to="/login" />;
  }

  if (user.role !== 'manager') {
    return <Navigate to="/" />;
  }

  return <>{children}</>;
}
