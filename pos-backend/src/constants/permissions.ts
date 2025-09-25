// Role-based permissions and access control
export const PERMISSIONS = {
  superadmin: {
    canCreate: ['manager', 'cashier'] as const,
    canApprove: ['manager', 'cashier'] as const,
    canAccess: ['/superadmin', '/dashboard', '/pos'] as const,
    autoApprove: ['manager'] as const, // Managers auto-approved when created by superadmin
    canManage: ['all'] as const, // Can manage all users
    canView: ['all'] as const, // Can view all data
  },
  manager: {
    canCreate: ['cashier'] as const,
    canApprove: ['cashier'] as const,
    canAccess: ['/dashboard', '/pos'] as const,
    autoApprove: ['cashier'] as const, // Cashiers auto-approved when created by manager
    canManage: ['cashier'] as const, // Can only manage cashiers
    canView: ['cashier', 'products', 'transactions'] as const, // Can view cashier data and business data
  },
  cashier: {
    canCreate: [] as const,
    canApprove: [] as const,
    canAccess: ['/pos'] as const,
    autoApprove: [] as const,
    canManage: [] as const, // Cannot manage other users
    canView: ['own_transactions'] as const, // Can only view their own transactions
  },
} as const;

// Role hierarchy (higher number = higher authority)
export const ROLE_HIERARCHY = {
  superadmin: 3,
  manager: 2,
  cashier: 1,
} as const;

// Helper functions for permission checking
export const hasPermission = (userRole: keyof typeof PERMISSIONS, action: string, targetRole?: string): boolean => {
  const permissions = PERMISSIONS[userRole];
  
  switch (action) {
    case 'create':
      return targetRole ? (permissions.canCreate as readonly string[]).includes(targetRole) : false;
    case 'approve':
      return targetRole ? (permissions.canApprove as readonly string[]).includes(targetRole) : false;
    case 'access':
      return true; // Will be checked by route guards
    case 'manage':
      return targetRole ? (permissions.canManage as readonly string[]).includes(targetRole) || (permissions.canManage as readonly string[]).includes('all') : false;
    case 'view':
      return targetRole ? (permissions.canView as readonly string[]).includes(targetRole) || (permissions.canView as readonly string[]).includes('all') : false;
    default:
      return false;
  }
};

export const canAccessRoute = (userRole: keyof typeof PERMISSIONS, route: string): boolean => {
  const permissions = PERMISSIONS[userRole];
  return permissions.canAccess.some(allowedRoute => route.startsWith(allowedRoute));
};

export const shouldAutoApprove = (creatorRole: keyof typeof PERMISSIONS, targetRole: string): boolean => {
  const permissions = PERMISSIONS[creatorRole];
  return (permissions.autoApprove as readonly string[]).includes(targetRole);
};

export const hasHigherAuthority = (userRole: keyof typeof PERMISSIONS, targetRole: keyof typeof PERMISSIONS): boolean => {
  return ROLE_HIERARCHY[userRole] > ROLE_HIERARCHY[targetRole];
};

// Route access control
export const ROUTE_ACCESS = {
  '/superadmin': ['superadmin'],
  '/dashboard': ['superadmin', 'manager'],
  '/pos': ['superadmin', 'manager', 'cashier'],
  '/login': ['all'],
} as const;

export const canAccessRouteByRole = (userRole: keyof typeof PERMISSIONS, route: string): boolean => {
  const allowedRoles = ROUTE_ACCESS[route as keyof typeof ROUTE_ACCESS];
  if (!allowedRoles) return false;
  if ((allowedRoles as readonly string[]).includes('all')) return true;
  return (allowedRoles as readonly string[]).includes(userRole);
};
