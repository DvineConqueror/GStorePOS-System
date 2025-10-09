import { useState } from 'react';
import { usePos } from '@/context/PosContext';
import { useAuth } from '@/context/AuthContext';
import { formatCurrency } from '@/utils/format';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { TransactionReceipt } from './TransactionReceipt';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Banknote, Receipt } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import { Transaction } from '@/types';
import { cn } from "@/lib/utils";

export function CheckoutDialog() {
  const { state, toggleCheckout, calculateTotal, completeTransaction } = usePos();
  const { user } = useAuth();
  const { isCheckoutOpen, cart } = state;
  const [cashAmount, setCashAmount] = useState<string>('');
  const [showCashInput, setShowCashInput] = useState(false);
  const [showReceipt, setShowReceipt] = useState(false);
  const [currentTransaction, setCurrentTransaction] = useState<Transaction | null>(null);

  const total = calculateTotal();
  const cashReceived = parseFloat(cashAmount) || 0;
  const cashLimit = 10000;
  const change = cashReceived - total;

  const handleCashAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (/^\d*\.?\d*$/.test(value)) {
      setCashAmount(value);
    }
  };

  const handlePaymentMethodSelect = () => {
    setShowCashInput(true);
  };

  const handleCompleteTransaction = () => {
    if (cashReceived >= total && cashReceived <= cashLimit) {
      const transaction = {
        _id: uuidv4(),
        id: uuidv4(),
        transactionNumber: `TXN-${Date.now()}`,
        items: [...cart],
        subtotal: total,
        tax: 0,
        discount: 0,
        total,
        paymentMethod: 'cash' as const,
        cashierId: user?.id || '',
        cashierName: user ? `${user.firstName} ${user.lastName}` : 'Unknown Cashier',
        status: 'completed' as const,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        cashReceived,
        change,
        timestamp: new Date().toISOString(),
      };
      
      completeTransaction(transaction);
      setCurrentTransaction(transaction);
      setShowReceipt(true);
    }
  };

  const resetCheckout = () => {
    setCashAmount('');
    setShowCashInput(false);
    setShowReceipt(false);
    setCurrentTransaction(null);
    toggleCheckout(false);
  };

  const handleClose = () => {
    resetCheckout();
  };

  return (
    <Dialog 
      open={isCheckoutOpen} 
      onOpenChange={(open) => {
        if (!open && !showReceipt) {
          resetCheckout();
        }
      }}
    >
      <DialogContent className={cn(
        "max-w-md p-0",
        showReceipt && "max-w-lg"
      )}>
        <DialogHeader className="px-4 pt-4 pb-2 border-b flex-shrink-0">
          <DialogTitle className="text-lg font-semibold text-black">
            {showReceipt 
              ? "Transaction Complete" 
              : showCashInput 
                ? "Cash Payment" 
                : "Checkout"}
          </DialogTitle>
        </DialogHeader>
        
        {showReceipt ? (
          <div className="flex flex-col flex-1">
            <div className="px-4 py-4 space-y-3">
              <div className="flex flex-col items-center py-2 space-y-2">
                <Receipt className="h-12 w-12 text-green-600" />
                <p className="text-lg font-medium text-black">Payment Successful</p>
              </div>
              {currentTransaction && (
                <TransactionReceipt transaction={currentTransaction} />
              )}
            </div>
            <div className="px-4 pb-4 border-t bg-background flex-shrink-0">
              <div className="flex space-x-2 mt-3">
                <Button 
                  className="flex-1 bg-green-600 hover:bg-green-700"
                  onClick={() => window.print()}
                >
                  Print Receipt
                </Button>
                <Button 
                  variant="outline" 
                  className="flex-1"
                  onClick={handleClose}
                >
                  Close
                </Button>
              </div>
            </div>
          </div>
        ) : showCashInput ? (
          <div className="flex flex-col flex-1">
            <div className="px-4 py-4 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-sm font-medium text-black">Total Amount</Label>
                  <div className="text-xl font-bold text-green-600">{formatCurrency(total)}</div>
                </div>
                <div>
                  <Label className="text-sm font-medium text-black">Change</Label>
                  <div className={`text-xl font-bold ${change >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                    {formatCurrency(change >= 0 ? change : 0)}
                  </div>
                </div>
              </div>
              <div>
                <Label htmlFor="cashAmount" className="text-sm font-medium text-black">Cash Received</Label>
                <Input
                  id="cashAmount"
                  value={cashAmount}
                  onChange={handleCashAmountChange}
                  placeholder="0.00"
                  autoFocus
                  className="mt-1 text-black"
                />
                {cashReceived > cashLimit && (
                  <p className="text-sm text-red-500 mt-1">
                    Cash received exceeds the limit of {formatCurrency(cashLimit)}
                  </p>
                )}
              </div>
            </div>
            <div className="px-4 pb-4 border-t bg-background flex-shrink-0">
              <div className="flex space-x-2 mt-3">
                <Button variant="outline" className="flex-1" onClick={resetCheckout}>
                  Cancel
                </Button>
                <Button 
                  className="flex-1 bg-green-600 hover:bg-green-700" 
                  disabled={cashReceived < total || cashReceived > cashLimit}
                  onClick={handleCompleteTransaction}
                >
                  Complete Payment
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-col flex-1">
            <div className="px-4 py-4 space-y-3">
              <div className="max-h-[200px] overflow-y-auto space-y-2">
                {cart.map(item => (
                  <div key={item.id} className="flex justify-between text-sm">
                    <span className="text-black">{item.name} × {item.quantity}</span>
                    <span className="font-medium text-gray-500">{formatCurrency(item.price * item.quantity)}</span>
                  </div>
                ))}
              </div>
              <div className="flex justify-between font-bold text-lg pt-2 border-t text-black">
                <span>Total</span>
                <span className="text-green-600">{formatCurrency(total)}</span>
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-500">Select payment method:</Label>
                <Button
                  className="w-full flex items-center justify-center mt-2 bg-green-600 hover:bg-green-700"
                  onClick={handlePaymentMethodSelect}
                >
                  <Banknote className="mr-2 h-4 w-4" />
                  Cash
                </Button>
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}