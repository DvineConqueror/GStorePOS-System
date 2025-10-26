import { Transaction } from '@/types';
import { formatCurrency } from '@/utils/format';
import { calculateVAT } from '@/utils/vat';
import { getDiscountLabel } from '@/utils/seniorPwdDiscount';
import './receipt.css';  // We'll create this file separately

interface ReceiptProps {
  transaction: Transaction;
}

export function TransactionReceipt({ transaction }: ReceiptProps) {
  const vatBreakdown = calculateVAT(transaction.total);
  const customerType = transaction.customerType || 'regular';
  const hasDiscount = customerType !== 'regular';
  const discountLabel = getDiscountLabel(customerType);
  
  return (
    <div className="flex justify-center w-full">
      <div className="receipt-container font-mono text-sm">
        <div className="text-center mb-4 text-black">
          <h2 className="font-bold">Grocery POS</h2>
          <div className="text-xs">
            <div>{new Date(transaction.timestamp).toLocaleString()}</div>
            <div>Cashier: {transaction.cashierName}</div>
            <div>Receipt #: {transaction.id.slice(0, 8)}</div>
            {hasDiscount && (
              <div className="font-semibold text-green-600 mt-1">
                {customerType === 'senior' ? 'SENIOR CITIZEN' : 'PWD'}
              </div>
            )}
          </div>
        </div>

        <div className="border-t border-b border-dashed py-2">
          {transaction.items.map((item, index) => {
            const hasItemDiscount = item.discountApplied || item.vatExempt;
            return (
              <div key={index} className="mb-2">
                <div className="flex justify-between">
                  <div className="text-black">
                    {item.name} x {item.quantity}
                  </div>
                  <div>{formatCurrency(item.price * item.quantity)}</div>
                </div>
                {hasDiscount && hasItemDiscount && (
                  <div className="text-xs text-gray-500 ml-2 space-y-0.5">
                    {item.vatExempt && (
                      <div className="flex justify-between">
                        <span>VAT Exempt (12%)</span>
                        <span>-{formatCurrency(item.discountAmount ? (item.price * item.quantity) - ((item.price * item.quantity) / 1.12) : 0)}</span>
                      </div>
                    )}
                    {item.discountApplied && (
                      <div className="flex justify-between">
                        <span>20% Discount</span>
                        <span>-{formatCurrency(item.discountAmount || 0)}</span>
                      </div>
                    )}
                    <div className="flex justify-between font-semibold text-green-600">
                      <span>Item Total</span>
                      <span>{formatCurrency(item.finalPrice || (item.price * item.quantity))}</span>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div className="mt-2 space-y-1">
          <div className="border-t border-dashed pt-2">
            <div className="flex justify-between text-xs font-semibold">
              <div className="text-gray-600">Subtotal</div>
              <div>{formatCurrency(transaction.subtotal)}</div>
            </div>
            {hasDiscount && transaction.totalVatExempt && transaction.totalVatExempt > 0 && (
              <div className="flex justify-between text-xs text-green-600">
                <div>Less VAT Exempt (12%)</div>
                <div>-{formatCurrency(transaction.totalVatExempt)}</div>
              </div>
            )}
            {hasDiscount && transaction.totalDiscountAmount && transaction.totalDiscountAmount > 0 && (
              <div className="flex justify-between text-xs text-green-600">
                <div>{discountLabel}</div>
                <div>-{formatCurrency(transaction.totalDiscountAmount)}</div>
              </div>
            )}
            {!hasDiscount && (
              <>
                <div className="flex justify-between text-xs">
                  <div className="text-gray-600">Net Sales</div>
                  <div>{formatCurrency(vatBreakdown.netSales)}</div>
                </div>
                <div className="flex justify-between text-xs">
                  <div className="text-gray-600">VAT ({vatBreakdown.vatRate}%)</div>
                  <div>{formatCurrency(vatBreakdown.vatAmount)}</div>
                </div>
              </>
            )}
          </div>
          <div className="flex justify-between font-bold border-t border-dashed pt-2">
            <div className="text-black">Total Amount Due</div>
            <div>{formatCurrency(transaction.total)}</div>
          </div>
          <div className="flex justify-between">
            <div className="text-gray-600">Cash</div>
            <div>{formatCurrency(transaction.cashReceived)}</div>
          </div>
          <div className="flex justify-between">
            <div className="text-gray-600">Change</div>
            <div>{formatCurrency(transaction.change)}</div>
          </div>
        </div>

        {hasDiscount && (
          <div className="text-center mt-3 text-xs text-gray-600 border-t border-dashed pt-2">
            <div className="font-semibold">Discount applied per RA 9994 & RA 10754</div>
            <div>20% discount + VAT exemption on eligible items</div>
          </div>
        )}

        <div className="text-center mt-4 text-xs text-gray-600">
          <div>Thank you for shopping!</div>
          <div>Please come again</div>
        </div>

      </div>
    </div>
  );
}