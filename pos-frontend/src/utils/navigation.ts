import { useAuth } from '@/context/AuthContext';

/**
 * Get the appropriate dashboard route based on user role
 */
export const getDashboardRoute = (userRole: string): string => {
  switch (userRole) {
    case 'manager':
      return '/dashboard';
    case 'superadmin':
      return '/superadmin';
    case 'cashier':
    default:
      return '/pos';
  }
};

/**
 * Get the appropriate back route based on user role
 * Used for back buttons and cancel actions
 */
export const getBackRoute = (userRole: string): string => {
  switch (userRole) {
    case 'manager':
      return '/dashboard';
    case 'superadmin':
      return '/superadmin';
    case 'cashier':
    default:
      return '/pos';
  }
};

/**
 * Hook to get role-based navigation routes
 */
export const useRoleBasedNavigation = () => {
  const { user } = useAuth();
  
  const dashboardRoute = getDashboardRoute(user?.role || 'cashier');
  const backRoute = getBackRoute(user?.role || 'cashier');
  
  return {
    dashboardRoute,
    backRoute,
    userRole: user?.role || 'cashier'
  };
};
