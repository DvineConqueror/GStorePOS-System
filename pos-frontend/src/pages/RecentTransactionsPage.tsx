import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { transactionsAPI } from '@/lib/api';
import { formatCurrency } from '@/utils/format';
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
  Package
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
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');
  const [expandedTransactions, setExpandedTransactions] = useState<Set<string>>(new Set());

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      
      // Build API parameters for server-side filtering
      const apiParams: any = {
        limit: 1000, // Get more transactions to ensure we have all data
        sort: 'createdAt',
        order: 'desc'
      };

      // Add status filter to API call
      if (statusFilter !== 'all') {
        apiParams.status = statusFilter;
      }

      // Payment method filter removed - system only accepts cash

      // Add date range filter to API call
      if (dateFilter !== 'all') {
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);

        switch (dateFilter) {
          case 'today':
            apiParams.startDate = today.toISOString();
            apiParams.endDate = now.toISOString();
            break;
          case 'week':
            apiParams.startDate = weekAgo.toISOString();
            apiParams.endDate = now.toISOString();
            break;
          case 'all':
            // No date filter - get all transactions
            break;
        }
      }

      const response = await transactionsAPI.getTransactions(apiParams);

      if (response.success) {
        let filteredTransactions = response.data;

        // Apply client-side search filter (since API doesn't support search)
        if (searchTerm) {
          filteredTransactions = filteredTransactions.filter((t: Transaction) =>
            t.transactionNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
            t.cashierName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            t.items.some(item => item.productName.toLowerCase().includes(searchTerm.toLowerCase()))
          );
        }

        setTransactions(filteredTransactions);
      }
    } catch (error) {
      console.error('Error fetching transactions:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, [statusFilter, dateFilter, searchTerm]);

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

  const handleViewTransaction = (transactionId: string) => {
    navigate(`/transactions/${transactionId}`);
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-6">
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-24 bg-slate-100 animate-pulse rounded-lg" />
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
            onClick={() => navigate(-1)}
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
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search transactions..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-white"
              />
            </div>

            {/* Status Filter */}
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="bg-white">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="refunded">Refunded</SelectItem>
              </SelectContent>
            </Select>


            {/* Date Filter */}
            <Select value={dateFilter} onValueChange={setDateFilter}>
              <SelectTrigger className="bg-white">
                <SelectValue placeholder="Date Range" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Time</SelectItem>
                <SelectItem value="today">Today</SelectItem>
                <SelectItem value="week">This Week</SelectItem>
              </SelectContent>
            </Select>

            {/* Results Count */}
            <div className="flex items-center justify-center">
              <span className="text-sm text-gray-600">
                {transactions.length} transaction{transactions.length !== 1 ? 's' : ''}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Transactions List */}
      <div className="space-y-3">
        {transactions.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <Receipt className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No Transactions Found</h3>
              <p className="text-gray-600">No transactions match your current filters.</p>
            </CardContent>
          </Card>
        ) : (
          transactions.map((transaction) => (
            <Card key={transaction._id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-semibold text-gray-900">
                        {transaction.transactionNumber}
                      </h3>
                      {getStatusBadge(transaction.status)}
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm text-gray-600">
                      <div>
                        <span className="font-medium">Cashier:</span> {transaction.cashierName}
                      </div>
                      <div>
                        <span className="font-medium">Total:</span> {formatCurrency(transaction.total)}
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="font-medium">Payment:</span>
                        <span className="capitalize">{transaction.paymentMethod}</span>
                      </div>
                      <div>
                        <span className="font-medium">Date:</span> {new Date(transaction.createdAt).toLocaleDateString()}
                      </div>
                    </div>

                    <div className="mt-2">
                      <span className="text-sm text-gray-500">
                        {getTotalQuantity(transaction.items)} item{getTotalQuantity(transaction.items) !== 1 ? 's' : ''} total
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 min-w-[120px] justify-end">
                    {/* Expand Button */}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleTransactionExpansion(transaction._id)}
                      className="text-gray-500 hover:text-gray-700 p-1"
                    >
                      {expandedTransactions.has(transaction._id) ? (
                        <ChevronDown className="h-4 w-4" />
                      ) : (
                        <ChevronRight className="h-4 w-4" />
                      )}
                    </Button>

                    {/* Refund Button - Only for managers/superadmins */}
                    {(user?.role === 'manager' || user?.role === 'superadmin') && transaction.status === 'completed' ? (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleRefundTransaction(transaction._id)}
                        className="flex items-center gap-2 text-orange-600 bg-[#ececec] border-green-200 hover:bg-white-50"
                      >
                        <RotateCcw className="h-4 w-4" />
                        Refund
                      </Button>
                    ) : (
                      <div className="w-[80px]"></div>
                    )}
                  </div>
                </div>

                {/* Transaction Details Dropdown */}
                {expandedTransactions.has(transaction._id) && (
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <div className="space-y-3">
                      {/* Transaction Time */}
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Clock className="h-4 w-4" />
                        <span className="font-medium">Time:</span>
                        <span>{new Date(transaction.createdAt).toLocaleString()}</span>
                      </div>

                      {/* Items Details */}
                      <div>
                        <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                          <Package className="h-4 w-4" />
                          <span className="font-medium">Items:</span>
                        </div>
                        <div className="space-y-2">
                          {transaction.items.map((item, index) => (
                            <div key={index} className="flex justify-between items-center bg-gray-50 p-2 rounded text-sm">
                              <div>
                                <span className="font-medium">{item.productName}</span>
                                <span className="text-gray-500 ml-2">× {item.quantity}</span>
                              </div>
                              <div className="text-right">
                                <div className="font-medium">{formatCurrency(item.totalPrice)}</div>
                                <div className="text-gray-500 text-xs">
                                  {formatCurrency(item.unitPrice)} each
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Refund Information */}
                      {transaction.status === 'refunded' && transaction.notes && (
                        <div className="bg-orange-50 p-3 rounded border border-orange-200">
                          <div className="flex items-center gap-2 text-sm text-orange-800">
                            <RotateCcw className="h-4 w-4" />
                            <span className="font-medium">Refund Reason:</span>
                          </div>
                          <p className="text-sm text-orange-700 mt-1">{transaction.notes}</p>
                        </div>
                      )}

                      {/* Transaction Summary */}
                      <div className="bg-gray-50 p-3 rounded">
                        <div className="flex justify-between text-sm">
                          <span>Subtotal:</span>
                          <span>{formatCurrency(transaction.subtotal)}</span>
                        </div>
                        {transaction.tax > 0 && (
                          <div className="flex justify-between text-sm">
                            <span>Tax:</span>
                            <span>{formatCurrency(transaction.tax)}</span>
                          </div>
                        )}
                        {transaction.discount > 0 && (
                          <div className="flex justify-between text-sm">
                            <span>Discount:</span>
                            <span>-{formatCurrency(transaction.discount)}</span>
                          </div>
                        )}
                        <div className="flex justify-between text-sm font-medium border-t border-gray-300 pt-2 mt-2">
                          <span>Total:</span>
                          <span>{formatCurrency(transaction.total)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
