export interface QuickStats {
  totalUsers: number;
  pendingApprovals: number;
  managerCount: number;
  cashierCount: number;
}

export interface NavigationItem {
  name: string;
  href: string;
  icon: React.ComponentType<any>;
  description: string;
}

export interface LayoutProps {
  children?: React.ReactNode;
}
