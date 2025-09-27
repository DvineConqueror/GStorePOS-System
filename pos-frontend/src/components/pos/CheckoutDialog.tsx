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
  const cashLimit = 10000; // Adjust this limit as needed
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
        id: uuidv4(), // For backward compatibility
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
        // Legacy fields for backward compatibility
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
        if (!open && !showReceipt) {  // Only allow closing if not showing receipt
          resetCheckout();
        }
      }}
    >
      <DialogContent className={cn(
        "sm:max-w-[425px]",
        showReceipt && "sm:max-w-[600px]"
      )}>
        <DialogHeader>
          <DialogTitle>
            {showReceipt 
              ? "Transaction Complete" 
              : showCashInput 
                ? "Cash Payment" 
                : "Checkout"}
          </DialogTitle>
        </DialogHeader>
        
        {showReceipt ? (
          <div className="space-y-4">
            <div className="flex flex-col items-center py-4 space-y-4">
              <Receipt className="h-16 w-16 text-pos-success" />
              <p className="text-xl font-medium">Payment Successful</p>
            </div>
            {currentTransaction && (
              <>
                <TransactionReceipt transaction={currentTransaction} />
                <div className="flex space-x-2 mt-4">
                  <Button 
                    className="flex-1 bg-green-600 hover:bg-green-700"
                    onClick={() => window.print()}
                  >
                    Print Receipt
                  </Button>
                  <Button 
                    variant="outline" 
                    className="flex-1"
                    onClick={handleClose}  // Just use resetCheckout directly
                  >
                    Close
                  </Button>
                </div>
              </>
            )}
          </div>
        ) : showCashInput ? (
          <div className="space-y-6">
            <div className="space-y-2">
              <div className="flex justify-between">
                <Label>Total Amount:</Label>
                <span className="font-bold">{formatCurrency(total)}</span>
              </div>
              <div className="space-y-1">
                <Label htmlFor="cashAmount">Cash Received:</Label>
                <Input
                  id="cashAmount"
                  value={cashAmount}
                  onChange={handleCashAmountChange}
                  placeholder="0.00"
                  autoFocus
                />
                {cashReceived > cashLimit && (
                  <p className="text-sm text-destructive mt-1">
                    Cash received exceeds the limit of {formatCurrency(cashLimit)}
                  </p>
                )}
              </div>
              {cashReceived > 0 && (
                <div className="flex justify-between pt-2">
                  <Label>Change:</Label>
                  <span className={`font-bold ${change >= 0 ? 'text-pos-success' : 'text-destructive'}`}>
                    {formatCurrency(change >= 0 ? change : 0)}
                  </span>
                </div>
              )}
            </div>
            
            <div className="flex space-x-2">
              <Button variant="outline" className="flex-1" onClick={resetCheckout}>
                Cancel
              </Button>
              <Button 
                className="flex-1 bg-pos-success hover:bg-pos-success/90" 
                disabled={cashReceived < total || cashReceived > cashLimit}
                onClick={handleCompleteTransaction}
              >
                Complete Payment
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <div className="max-h-[300px] overflow-y-auto space-y-2">
                {cart.map(item => (
                  <div key={item.id} className="flex justify-between">
                    <span>{item.name} × {item.quantity}</span>
                    <span>{formatCurrency(item.price * item.quantity)}</span>
                  </div>
                ))}
              </div>
              <div className="flex justify-between font-bold pt-2 border-t">
                <span>Total</span>
                <span>{formatCurrency(total)}</span>
              </div>
            </div>
            
            <div className="pt-4">
              <p className="mb-2 text-sm text-muted-foreground">Select payment method:</p>
              <Button
                className="w-full flex items-center justify-start mb-2 bg-green-600 hover:bg-green-700"
                onClick={handlePaymentMethodSelect}
              >
                <Banknote className="mr-2 h-4 w-4" />
                Cash
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}