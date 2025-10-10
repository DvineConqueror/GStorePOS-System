import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useNavigate, useParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { transactionsAPI } from '@/lib/api';
import { formatCurrency } from '@/utils/format';
import { useRoleBasedNavigation } from '@/utils/navigation';
import { 
  ArrowLeft, 
  Receipt, 
  CreditCard, 
  Banknote, 
  Smartphone,
  RotateCcw,
  AlertTriangle,
  CheckCircle,
  XCircle
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

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

const getPaymentIcon = (method: string) => {
  switch (method) {
    case 'cash':
      return <Banknote className="h-4 w-4" />;
    case 'card':
      return <CreditCard className="h-4 w-4" />;
    case 'digital':
      return <Smartphone className="h-4 w-4" />;
    default:
      return <Receipt className="h-4 w-4" />;
  }
};

export default function VoidRefundPage() {
  const { user } = useAuth();
  const { transactionId } = useParams();
  const navigate = useNavigate();
  const { backRoute } = useRoleBasedNavigation();
  const { toast } = useToast();
  
  const [transaction, setTransaction] = useState<Transaction | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [reason, setReason] = useState('');

  // Check if user has permission to refund
  const canRefund = user?.role === 'manager' || user?.role === 'superadmin';

  const fetchTransaction = async () => {
    if (!transactionId) return;

    try {
      setLoading(true);
      const response = await transactionsAPI.getTransaction(transactionId);
      
      if (response.success) {
        setTransaction(response.data);
      } else {
        toast({
          title: "Error",
          description: "Transaction not found",
          variant: "destructive"
        });
        navigate(backRoute);
      }
    } catch (error) {
      console.error('Error fetching transaction:', error);
      toast({
        title: "Error",
        description: "Failed to fetch transaction details",
        variant: "destructive"
      });
      navigate('/transactions');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransaction();
  }, [transactionId]);

  const handleRefund = async () => {
    if (!transaction || !reason.trim()) {
      toast({
        title: "Error",
        description: "Please provide a reason for the refund",
        variant: "destructive"
      });
      return;
    }

    try {
      setProcessing(true);
      const response = await transactionsAPI.refundTransaction(transaction._id, reason);
      
      if (response.success) {
        toast({
          title: "Success",
          description: "Transaction refunded successfully",
        });
        navigate(backRoute);
      } else {
        toast({
          title: "Error",
          description: response.message || "Failed to refund transaction",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error refunding transaction:', error);
      toast({
        title: "Error",
        description: "Failed to refund transaction",
        variant: "destructive"
      });
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-6">
        <div className="space-y-4">
          <div className="h-8 bg-slate-100 animate-pulse rounded-lg w-1/4" />
          <div className="h-64 bg-slate-100 animate-pulse rounded-lg" />
        </div>
      </div>
    );
  }

  if (!transaction) {
    return (
      <div className="container mx-auto px-4 py-6">
        <div className="text-center py-12">
          <XCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Transaction Not Found</h3>
          <p className="text-gray-600">The requested transaction could not be found.</p>
        </div>
      </div>
    );
  }

  if (!canRefund) {
    return (
      <div className="container mx-auto px-4 py-6">
        <div className="text-center py-12">
          <AlertTriangle className="h-12 w-12 text-orange-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Access Denied</h3>
          <p className="text-gray-600">You don't have permission to refund transactions.</p>
        </div>
      </div>
    );
  }

  if (transaction.status === 'refunded') {
    return (
      <div className="container mx-auto px-4 py-6">
        <div className="text-center py-12">
          <CheckCircle className="h-12 w-12 text-green-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Already Refunded</h3>
          <p className="text-gray-600">This transaction has already been refunded.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
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
          <h1 className="text-2xl font-bold text-gray-900">Refund Transaction</h1>
          <p className="text-gray-600">Process a refund for this transaction</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Transaction Details */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-3 text-gray-700">
              <Receipt className="h-5 w-5 text-green-700" />
              Transaction Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="font-medium text-gray-700">Transaction Number:</span>
              <span className="font-mono">{transaction.transactionNumber}</span>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="font-medium text-gray-700">Status:</span>
              {getStatusBadge(transaction.status)}
            </div>
            
            <div className="flex items-center justify-between">
              <span className="font-medium text-gray-700">Cashier:</span>
              <span>{transaction.cashierName}</span>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="font-medium text-gray-700">Payment Method:</span>
              <div className="flex items-center gap-2">
                {getPaymentIcon(transaction.paymentMethod)}
                <span className="capitalize">{transaction.paymentMethod}</span>
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="font-medium text-gray-700">Date:</span>
              <span>{new Date(transaction.createdAt).toLocaleString()}</span>
            </div>

            <hr className="my-4" />

            <div className="space-y-2">
              <h4 className="font-medium text-gray-700">Items:</h4>
              {transaction.items.map((item, index) => (
                <div key={index} className="flex justify-between text-sm">
                  <span className="text-gray-700">{item.productName} x{item.quantity}</span>
                  <span>{formatCurrency(item.totalPrice)}</span>
                </div>
              ))}
            </div>

            <hr className="my-4" />

            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-700">Subtotal:</span>
                <span>{formatCurrency(transaction.subtotal)}</span>
              </div>
              {transaction.tax > 0 && (
                <div className="flex justify-between">
                  <span className="text-gray-700">Tax:</span>
                  <span>{formatCurrency(transaction.tax)}</span>
                </div>
              )}
              {transaction.discount > 0 && (
                <div className="flex justify-between">
                  <span className="text-gray-700">Discount:</span>
                  <span>-{formatCurrency(transaction.discount)}</span>
                </div>
              )}
              <div className="flex justify-between font-bold text-lg">
                <span className="text-gray-700">Total:</span>
                <span>{formatCurrency(transaction.total)}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Refund Form */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-3 text-gray-700">
              <RotateCcw className="h-5 w-5 text-green-700" />
              Refund Processing
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-orange-600 mt-0.5" />
                <div>
                  <h4 className="font-medium text-orange-900">Important Notice</h4>
                  <p className="text-sm text-orange-700 mt-1">
                    This action will refund the entire transaction amount and restore product stock. 
                    This action cannot be undone.
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="reason">Refund Reason *</Label>
              <Textarea
                id="reason"
                placeholder="Please provide a reason for this refund..."
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows={4}
                className="resize-none text-gray-700 bg-cream-50 border-gray-300"
              />
            </div>

            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="font-medium mb-2">Refund Summary</h4>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-700">Transaction Total:</span>
                  <span>{formatCurrency(transaction.total)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-700">Items to Restore:</span>
                  <span>{transaction.items.length} items</span>
                </div>
                <div className="flex justify-between font-medium">
                  <span className="text-gray-700">Refund Amount:</span>
                  <span>{formatCurrency(transaction.total)}</span>
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => navigate(backRoute)}
                className="flex-1"
                disabled={processing}
              >
                Cancel
              </Button>
              <Button
                onClick={handleRefund}
                disabled={processing || !reason.trim()}
                className="flex-1 bg-orange-600 hover:bg-orange-700"
              >
                {processing ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                    Processing...
                  </>
                ) : (
                  <>
                    <RotateCcw className="h-4 w-4 mr-2" />
                    Process Refund
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
