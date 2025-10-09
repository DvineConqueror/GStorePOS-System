export interface UserStats {
  totalUsers: number;
  activeUsers: number;
  inactiveUsers: number;
  managerUsers: number;
  cashierUsers: number;
  totalCashierUsers: number;
  activeCashierUsers: number;
}

export interface SalesStats {
  totalSales: number;
  totalTransactions: number;
  averageTransactionValue: number;
}

export interface ApprovalStats {
  pendingApprovals: number;
  approvedToday: number;
  rejectedToday: number;
}

export interface DashboardStats {
  userStats: UserStats;
  salesStats: SalesStats;
  approvalStats: ApprovalStats;
}
