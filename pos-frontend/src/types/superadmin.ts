export interface SystemStats {
  totalUsers: number;
  activeUsers: number;
  approvedUsers: number;
  pendingApprovals: number;
  superadminCount: number;
  managerCount: number;
  cashierCount: number;
}

export interface RecentUser {
  _id: string;
  username: string;
  email: string;
  role: string;
  firstName: string;
  lastName: string;
  status: 'active' | 'inactive' | 'deleted';
  isApproved: boolean;
  createdAt: string;
}

export interface QuickAction {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<any>;
  href: string;
  color: string;
  bgColor: string;
}
