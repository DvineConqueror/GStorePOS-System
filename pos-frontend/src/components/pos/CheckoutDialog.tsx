import { useState } from 'react';
import { usePos } from '@/context/PosContext';
import { useAuth } from '@/context/AuthContext';
import { formatCurrency } from '@/utils/format';
import { calculateVAT } from '@/utils/vat';
import { calculateTransactionDiscount, getDiscountLabel } from '@/utils/seniorPwdDiscount';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { TransactionReceipt } from './TransactionReceipt';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Banknote, Receipt, User, Accessibility, AlertTriangle } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import { Transaction } from '@/types';
import { cn } from "@/lib/utils";
import { useToast } from '@/hooks/use-toast';

export function CheckoutDialog() {
  const { state, toggleCheckout, calculateTotal, completeTransaction, fetchProducts, validateCartStock } = usePos();
  const { user } = useAuth();
  const { toast } = useToast();
  const { isCheckoutOpen, cart } = state;
  const [cashAmount, setCashAmount] = useState<string>('');
  const [showCashInput, setShowCashInput] = useState(false);
  const [showReceipt, setShowReceipt] = useState(false);
  const [currentTransaction, setCurrentTransaction] = useState<Transaction | null>(null);
  const [customerType, setCustomerType] = useState<'regular' | 'senior' | 'pwd'>('regular');
  const [isValidating, setIsValidating] = useState(false);

  // Calculate discount based on customer type
  const discountResult = calculateTransactionDiscount(
    cart.map(item => ({
      _id: item._id,
      name: item.name,
      price: item.price,
      quantity: item.quantity,
      isDiscountable: item.isDiscountable !== undefined ? item.isDiscountable : true,
      isVatExemptable: item.isVatExemptable !== undefined ? item.isVatExemptable : true,
    })),
    customerType
  );

  const total = discountResult.amountDue;
  const vatBreakdown = customerType === 'regular' 
    ? calculateVAT(total)
    : {
        total: discountResult.amountDue,
        vatAmount: discountResult.totalVatExempt,
        netSales: discountResult.amountDue - discountResult.totalVatExempt,
        vatRate: 12
      };
  const cashReceived = parseFloat(cashAmount) || 0;
  const cashLimit = 10000;
  const change = cashReceived - total;

  const handleCashAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    // Allow only numbers and decimal point, max 10 digits before decimal
    if (/^\d*\.?\d{0,2}$/.test(value) && value.length <= 13) {
      const numValue = parseFloat(value) || 0;
      // Prevent numbers larger than 1 million
      if (numValue <= 1000000) {
        setCashAmount(value);
      }
    }
  };

  const handlePaymentMethodSelect = () => {
    setShowCashInput(true);
  };

  const handleCompleteTransaction = async () => {
    if (cashReceived >= total && cashReceived <= cashLimit) {
      // Validate stock before proceeding with transaction
      setIsValidating(true);
      const validation = await validateCartStock();
      setIsValidating(false);
      
      if (!validation.valid) {
        // Show detailed error message with all validation errors
        toast({
          title: "The following items have stock issues:",
          description: (
            <div className="space-y-1">
              <ul className="list-disc list-inside mt-2 space-y-1">
                {validation.errors.map((error, index) => (
                  <li key={index} className="text-sm">{error}</li>
                ))}
              </ul>
              <p className="mt-2 text-sm">Please adjust your cart and try again.</p>
            </div>
          ),
          variant: "destructive",
          duration: 10000, // Longer duration for critical errors
        });
        return; // Stop transaction
      }
      
      // Map cart items to include discount information
      const itemsWithDiscount = cart.map((cartItem, index) => {
        const discountItem = discountResult.items[index];
        return {
          ...cartItem,
          vatExempt: discountItem?.vatExempt || false,
          discountApplied: discountItem?.discountApplied || false,
          discountAmount: discountItem?.discountAmount || 0,
          finalPrice: discountItem?.finalPrice || cartItem.price * cartItem.quantity,
        };
      });

      const transaction = {
        _id: uuidv4(),
        id: uuidv4(),
        transactionNumber: `TXN-${Date.now()}`,
        items: itemsWithDiscount,
        subtotal: discountResult.subtotal,
        tax: 0,
        discount: 0,
        total: discountResult.amountDue,
        customerType,
        totalVatExempt: discountResult.totalVatExempt,
        totalDiscountAmount: discountResult.totalDiscountAmount,
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
      
      // Await transaction completion and only show receipt if successful
      const success = await completeTransaction(transaction);
      if (success) {
        setCurrentTransaction(transaction);
        setShowReceipt(true);
      }
    }
  };

  const resetCheckout = () => {
    setCashAmount('');
    setShowCashInput(false);
    setShowReceipt(false);
    setCurrentTransaction(null);
    setCustomerType('regular');
    toggleCheckout(false);
  };

  const handleClose = async () => {
    // Refresh products to show updated stock levels after transaction
    if (showReceipt) {
      await fetchProducts();
    }
    resetCheckout();
  };

  return (
    <Dialog 
      open={isCheckoutOpen} 
      onOpenChange={async (open) => {
        if (!open && !showReceipt) {
          resetCheckout();
        } else if (!open && showReceipt) {
          await handleClose();
        }
      }}
    >
      <DialogContent className={cn(
        "max-w-md p-0 max-h-[90vh] flex flex-col",
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
          <div className="flex flex-col flex-1 max-h-[80vh]">
            <div className="px-4 py-4 space-y-3 overflow-y-auto flex-1">
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
              <div className="bg-gray-50 p-3 rounded-lg space-y-2 border border-gray-200">
                <div className="flex justify-between text-sm text-gray-600">
                  <span>Subtotal</span>
                  <span>{formatCurrency(discountResult.subtotal)}</span>
                </div>
                {customerType !== 'regular' && discountResult.totalVatExempt > 0 && (
                  <div className="flex justify-between text-sm text-green-600">
                    <span>Less VAT Exempt (12%)</span>
                    <span>-{formatCurrency(discountResult.totalVatExempt)}</span>
                  </div>
                )}
                {customerType !== 'regular' && discountResult.totalDiscountAmount > 0 && (
                  <div className="flex justify-between text-sm text-green-600">
                    <span>{getDiscountLabel(customerType)}</span>
                    <span>-{formatCurrency(discountResult.totalDiscountAmount)}</span>
                  </div>
                )}
                {customerType === 'regular' && (
                  <>
                    <div className="flex justify-between text-sm text-gray-600">
                      <span>Net Sales</span>
                      <span>{formatCurrency(vatBreakdown.netSales)}</span>
                    </div>
                    <div className="flex justify-between text-sm text-gray-600">
                      <span>VAT ({vatBreakdown.vatRate}%)</span>
                      <span>{formatCurrency(vatBreakdown.vatAmount)}</span>
                    </div>
                  </>
                )}
                <div className="flex justify-between font-semibold text-base pt-1 border-t border-gray-300">
                  <span className="text-black">Total Amount Due</span>
                  <span className="text-green-600">{formatCurrency(total)}</span>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="text-center">
                  <Label className="text-sm font-medium text-black">Cash Received</Label>
                  <div className="text-xl font-bold text-green-700 truncate">{formatCurrency(cashReceived)}</div>
                </div>
                <div className="text-center">
                  <Label className="text-sm font-medium text-black">Change</Label>
                  <div className={`text-xl font-bold truncate ${change >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                    {formatCurrency(change >= 0 ? change : 0)}
                  </div>
                </div>
              </div>
              <div>
                <Label htmlFor="cashAmount" className="text-sm font-medium text-black">Enter Cash Amount</Label>
                <Input
                  id="cashAmount"
                  type="text"
                  inputMode="decimal"
                  value={cashAmount}
                  onChange={handleCashAmountChange}
                  placeholder="0.00"
                  maxLength={13}
                  autoFocus
                  className="mt-1 text-black text-lg"
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
                  disabled={cashReceived < total || cashReceived > cashLimit || isValidating}
                  onClick={handleCompleteTransaction}
                >
                  {isValidating ? 'Validating Stock...' : 'Complete Payment'}
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-col flex-1">
            <div className="px-4 py-4 space-y-3">
              {/* Customer Type Selector */}
              <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
                <Label className="text-sm font-semibold text-black flex items-center gap-2 mb-2">
                  <User className="h-4 w-4" />
                  Customer Type
                </Label>
                <Select value={customerType} onValueChange={(value: 'regular' | 'senior' | 'pwd') => setCustomerType(value)}>
                  <SelectTrigger className="w-full bg-white text-black">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="text-black">
                    <SelectItem value="regular">
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4" />
                        <span>Regular Customer</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="senior">
                      <div className="flex items-center gap-2">
                        <Accessibility className="h-4 w-4" />
                        <span>Senior Citizen (20% discount + VAT exempt)</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="pwd">
                      <div className="flex items-center gap-2">
                        <Accessibility className="h-4 w-4" />
                        <span>PWD (20% discount + VAT exempt)</span>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
                {customerType !== 'regular' && (
                  <p className="text-xs text-blue-600 mt-2">
                    ✓ Discount applied to eligible items only (RA 9994 & RA 10754)
                  </p>
                )}
              </div>

              <div className="max-h-[200px] overflow-y-auto space-y-2">
                {cart.map((item, index) => {
                  const discountItem = discountResult.items[index];
                  const hasDiscount = discountItem?.discountApplied || discountItem?.vatExempt;
                  
                  return (
                    <div 
                      key={item.id} 
                      className={cn(
                        "flex justify-between text-sm p-2 rounded",
                        hasDiscount && customerType !== 'regular' && "bg-green-50 border border-green-200"
                      )}
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-black">{item.name} × {item.quantity}</span>
                          {hasDiscount && customerType !== 'regular' && (
                            <span className="text-xs bg-green-600 text-white px-2 py-0.5 rounded">DISCOUNTED</span>
                          )}
                        </div>
                        {customerType !== 'regular' && discountItem && (
                          <div className="text-xs text-gray-500 mt-1 space-y-0.5">
                            {discountItem.vatExempt && (
                              <div>VAT Exempt: {formatCurrency(discountItem.vatAmount)}</div>
                            )}
                            {discountItem.discountApplied && (
                              <div>20% Discount: {formatCurrency(discountItem.discountAmount)}</div>
                            )}
                          </div>
                        )}
                      </div>
                      <div className="text-right">
                        {customerType !== 'regular' && hasDiscount ? (
                          <>
                            <div className="text-xs text-gray-400 line-through">{formatCurrency(item.price * item.quantity)}</div>
                            <div className="font-medium text-green-600">{formatCurrency(discountItem?.finalPrice || 0)}</div>
                          </>
                        ) : (
                          <div className="font-medium text-gray-500">{formatCurrency(item.price * item.quantity)}</div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="pt-2 border-t space-y-1">
                <div className="flex justify-between text-sm text-gray-600">
                  <span>Subtotal</span>
                  <span>{formatCurrency(discountResult.subtotal)}</span>
                </div>
                {customerType !== 'regular' && discountResult.totalVatExempt > 0 && (
                  <div className="flex justify-between text-sm text-green-600">
                    <span>Less VAT Exempt (12%)</span>
                    <span>-{formatCurrency(discountResult.totalVatExempt)}</span>
                  </div>
                )}
                {customerType !== 'regular' && discountResult.totalDiscountAmount > 0 && (
                  <div className="flex justify-between text-sm text-green-600">
                    <span>{getDiscountLabel(customerType)}</span>
                    <span>-{formatCurrency(discountResult.totalDiscountAmount)}</span>
                  </div>
                )}
                {customerType === 'regular' && (
                  <>
                    <div className="flex justify-between text-sm text-gray-600">
                      <span>Net Sales</span>
                      <span>{formatCurrency(vatBreakdown.netSales)}</span>
                    </div>
                    <div className="flex justify-between text-sm text-gray-600">
                      <span>VAT ({vatBreakdown.vatRate}%)</span>
                      <span>{formatCurrency(vatBreakdown.vatAmount)}</span>
                    </div>
                  </>
                )}
                <div className="flex justify-between font-bold text-lg pt-1 border-t text-black">
                  <span>Total Amount Due</span>
                  <span className="text-green-600">{formatCurrency(total)}</span>
                </div>
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