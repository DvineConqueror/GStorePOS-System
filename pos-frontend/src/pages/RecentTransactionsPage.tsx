import React, { useState, useCallback, useMemo } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { formatCurrency } from '@/utils/format';
import { useRoleBasedNavigation } from '@/utils/navigation';
import { useTransactions } from '@/hooks/useTransactions';
import { 
  Search, 
  Filter, 
  ArrowLeft, 
  Receipt, 
  CreditCard, 
  Banknote, 
  Smartphone,
  RotateCcw,
  Eye,
  ChevronDown,
  ChevronRight,
  Clock,
  Package,
  ChevronLeft,
  RefreshCw
} from 'lucide-react';

interface Transaction {
  _id: string;
  transactionNumber: string;
  items: Array<{
    productId: string;
    productName: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
    discount?: number;
  }>;
  subtotal: number;
  tax: number;
  discount: number;
  total: number;
  paymentMethod: 'cash' | 'card' | 'digital';
  cashierId: string;
  cashierName: string;
  status: 'completed' | 'refunded';
  createdAt: string;
  updatedAt: string;
  notes?: string;
}

const getStatusBadge = (status: string) => {
  switch (status) {
    case 'completed':
      return <Badge className="bg-green-100 text-green-800">Completed</Badge>;
    case 'refunded':
      return <Badge className="bg-orange-100 text-orange-800">Refunded</Badge>;
    default:
      return <Badge className="bg-gray-100 text-gray-800">{status}</Badge>;
  }
};


export default function RecentTransactionsPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { backRoute } = useRoleBasedNavigation();
  
  // Local state
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');
  const [expandedTransactions, setExpandedTransactions] = useState<Set<string>>(new Set());
  const [currentPage, setCurrentPage] = useState(1);
  
  const transactionsPerPage = 8; // 4 rows × 2 columns

  // Build API parameters for server-side filtering
  const apiParams = useMemo(() => {
    const params: any = {
      page: currentPage,
      limit: transactionsPerPage,
      sort: 'createdAt',
      order: 'desc'
    };

    // Add status filter to API call
    if (statusFilter !== 'all') {
      params.status = statusFilter;
    }

    // Add date range filter to API call
    if (dateFilter !== 'all') {
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);

      switch (dateFilter) {
        case 'today':
          params.startDate = today.toISOString();
          params.endDate = now.toISOString();
          break;
        case 'week':
          params.startDate = weekAgo.toISOString();
          params.endDate = now.toISOString();
          break;
        case 'all':
          // No date filter - get all transactions
          break;
      }
    }

    // Add search term to API call
    if (debouncedSearchTerm) {
      params.search = debouncedSearchTerm;
    }

    return params;
  }, [currentPage, statusFilter, dateFilter, debouncedSearchTerm]);

  // React Query hook
  const { data: transactionsData, isLoading: loading, error } = useTransactions(apiParams);
  
  // Extract data from API response
  const transactions = transactionsData?.data || [];
  const totalPages = transactionsData?.pagination?.pages || 1;
  const totalTransactions = transactionsData?.pagination?.total || 0;

  // Debounce search term
  const debounceSearch = useCallback(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 500); // 500ms delay

    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Effect for debounced search
  React.useEffect(() => {
    const cleanup = debounceSearch();
    return cleanup;
  }, [debounceSearch]);

  // Reset to first page when filters change
  React.useEffect(() => {
    setCurrentPage(1);
  }, [statusFilter, dateFilter, debouncedSearchTerm]);

  const handleRefundTransaction = (transactionId: string) => {
    navigate(`/transactions/${transactionId}/refund`);
  };

  const toggleTransactionExpansion = (transactionId: string) => {
    const newExpanded = new Set(expandedTransactions);
    if (newExpanded.has(transactionId)) {
      newExpanded.delete(transactionId);
    } else {
      newExpanded.add(transactionId);
    }
    setExpandedTransactions(newExpanded);
  };

  const getTotalQuantity = (items: any[]) => {
    return items.reduce((total, item) => total + item.quantity, 0);
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
          {[...Array(8)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-4">
                <div className="space-y-3">
                  <div className="flex justify-between items-start">
                    <div className="space-y-2 flex-1">
                      <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                      <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                    </div>
                    <div className="h-6 w-6 bg-gray-200 rounded"></div>
                  </div>
                  <div className="space-y-2">
                    <div className="h-3 bg-gray-200 rounded"></div>
                    <div className="h-3 bg-gray-200 rounded"></div>
                    <div className="h-3 bg-gray-200 rounded"></div>
                    <div className="h-3 bg-gray-200 rounded"></div>
                  </div>
                  <div className="flex gap-2">
                    <div className="h-7 bg-gray-200 rounded flex-1"></div>
                    <div className="h-7 w-7 bg-gray-200 rounded"></div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(backRoute)}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Recent Transactions</h1>
            <p className="text-gray-600">View and manage transaction history</p>
          </div>
        </div>
        
        {/* Refresh Button for Managers */}
        {(user?.role === 'manager' || user?.role === 'superadmin') && (
          <Button
            onClick={() => {
              // Clear any cached transaction data and force refresh
              sessionStorage.removeItem('analyticsData');
              sessionStorage.removeItem('prefetchedData');
              // React Query will automatically refetch when the query key changes
              window.location.reload();
            }}
            variant="outline"
            className="flex items-center gap-2 border-green-300 text-green-700 hover:bg-green-50"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh Data
          </Button>
        )}
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 justify-between">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search transactions..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-white text-gray-700"
              />
            </div>

            {/* Status Filter */}
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="bg-white text-gray-700">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all" className="text-gray-700">All Status</SelectItem>
                <SelectItem value="completed" className="text-gray-700">Completed</SelectItem>
                <SelectItem value="refunded" className="text-gray-700">Refunded</SelectItem>
              </SelectContent>
            </Select>


            {/* Date Filter */}
            <Select value={dateFilter} onValueChange={setDateFilter}>
              <SelectTrigger className="bg-white text-gray-700">
                <SelectValue placeholder="Date Range" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all" className="text-gray-700">All Time</SelectItem>
                <SelectItem value="today" className="text-gray-700">Today</SelectItem>
                <SelectItem value="week" className="text-gray-700">This Week</SelectItem>
              </SelectContent>
            </Select>

            {/* Results Count */}
            <div className="flex items-center justify-center">
              <span className="text-sm text-gray-600">
                {totalTransactions} transaction{totalTransactions !== 1 ? 's' : ''}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Transactions Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-start">
        {transactions.length === 0 ? (
          <div className="col-span-full">
            <Card>
              <CardContent className="p-8 text-center">
                <Receipt className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No Transactions Found</h3>
                <p className="text-gray-600">No transactions match your current filters.</p>
              </CardContent>
            </Card>
          </div>
        ) : (
          transactions.map((transaction) => (
            <Card key={transaction._id} className="hover:shadow-lg transition-all duration-200 border-l-4 border-l-green-500">
              <CardContent className="p-4">
                {/* Header */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900 text-sm truncate">
                      {transaction.transactionNumber}
                    </h3>
                    <div className="mt-1">
                      {getStatusBadge(transaction.status)}
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => toggleTransactionExpansion(transaction._id)}
                    className="text-gray-500 hover:text-gray-700 p-1 h-6 w-6"
                  >
                    {expandedTransactions.has(transaction._id) ? (
                      <ChevronDown className="h-3 w-3" />
                    ) : (
                      <ChevronRight className="h-3 w-3" />
                    )}
                  </Button>
                </div>

                {/* Transaction Details */}
                <div className="space-y-2 text-xs text-gray-600">
                  <div className="flex justify-between">
                    <span className="font-medium">Cashier:</span>
                    <span className="truncate ml-2">{transaction.cashierName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">Total:</span>
                    <span className="font-semibold text-green-600">{formatCurrency(transaction.total)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">Payment:</span>
                    <span className="capitalize">{transaction.paymentMethod}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">Date:</span>
                    <span>{new Date(transaction.createdAt).toLocaleDateString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">Items:</span>
                    <span>{getTotalQuantity(transaction.items)}</span>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="mt-3 pt-3 border-t border-gray-100">
                  <div className="flex gap-2">
                    {(user?.role === 'manager' || user?.role === 'superadmin') && transaction.status === 'completed' && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleRefundTransaction(transaction._id)}
                        className="text-xs h-7 bg-orange-50 border-orange-200 text-orange-700 hover:bg-orange-100"
                      >
                        <RotateCcw className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                </div>

                {/* Expanded Details */}
                {expandedTransactions.has(transaction._id) && (
                  <div className="mt-3 pt-3 border-t border-gray-100">
                    <div className="space-y-2">
                      {/* Transaction Time */}
                      <div className="flex items-center gap-1 text-xs text-gray-600">
                        <Clock className="h-3 w-3" />
                        <span>{new Date(transaction.createdAt).toLocaleString()}</span>
                      </div>

                      {/* Items Summary */}
                      <div className="text-xs">
                        <div className="flex items-center gap-1 text-gray-600 mb-1">
                          <Package className="h-3 w-3" />
                          <span className="font-medium">Items:</span>
                        </div>
                        <div className="space-y-1 max-h-20 overflow-y-auto text-gray-600">
                          {transaction.items.slice(0, 3).map((item, index) => (
                            <div key={index} className="flex justify-between bg-gray-50 p-1 rounded text-xs">
                              <span className="truncate">{item.productName}</span>
                              <span className="ml-1">×{item.quantity}</span>
                            </div>
                          ))}
                          {transaction.items.length > 3 && (
                            <div className="text-gray-500 text-xs text-center">
                              +{transaction.items.length - 3} more
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Transaction Summary */}
                      <div className="bg-gray-50 p-2 rounded text-xs text-gray-600">
                        <div className="flex justify-between">
                          <span>Subtotal:</span>
                          <span className="text-green-600">{formatCurrency(transaction.subtotal)}</span>
                        </div>
                        {transaction.tax > 0 && (
                          <div className="flex justify-between">
                            <span>Tax:</span>
                            <span>{formatCurrency(transaction.tax)}</span>
                          </div>
                        )}
                        {transaction.discount > 0 && (
                          <div className="flex justify-between">
                            <span>Discount:</span>
                            <span>-{formatCurrency(transaction.discount)}</span>
                          </div>
                        )}
                        <div className="flex justify-between font-medium border-t border-gray-300 pt-1 mt-1">
                          <span>Total:</span>
                          <span className="text-green-600">{formatCurrency(transaction.total)}</span>
                        </div>
                      </div>

                      {/* Refund Information */}
                      {transaction.status === 'refunded' && transaction.notes && (
                        <div className="bg-orange-50 p-2 rounded border border-orange-200 text-xs">
                          <div className="flex items-center gap-1 text-orange-800 mb-1">
                            <RotateCcw className="h-3 w-3" />
                            <span className="font-medium">Refund Reason:</span>
                          </div>
                          <p className="text-orange-700">{transaction.notes}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-8 pt-6 border-t border-gray-200">
          <div className="text-sm text-gray-600">
            Showing {((currentPage - 1) * transactionsPerPage) + 1} to {Math.min(currentPage * transactionsPerPage, totalTransactions)} of {totalTransactions} transactions
          </div>
          <div className="flex items-center space-x-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className="bg-white border-green-300 text-green-700 hover:bg-green-50"
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              Previous
            </Button>
            <div className="flex items-center space-x-1">
              {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                const page = i + 1;
                return (
                  <Button
                    key={page}
                    variant={page === currentPage ? "default" : "outline"}
                    size="sm"
                    onClick={() => setCurrentPage(page)}
                    className="w-8 h-8 p-0"
                  >
                    {page}
                  </Button>
                );
              })}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
              className="bg-white border-green-300 text-green-700 hover:bg-green-50"
            >
              Next
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
