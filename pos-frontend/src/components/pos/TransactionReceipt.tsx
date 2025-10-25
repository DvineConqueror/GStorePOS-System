import { Transaction } from '@/types';
import { formatCurrency } from '@/utils/format';
import { calculateVAT } from '@/utils/vat';
import './receipt.css';  // We'll create this file separately

interface ReceiptProps {
  transaction: Transaction;
}

export function TransactionReceipt({ transaction }: ReceiptProps) {
  const vatBreakdown = calculateVAT(transaction.total);
  
  return (
    <div className="flex justify-center w-full">
      <div className="receipt-container font-mono text-sm">
        <div className="text-center mb-4 text-black">
          <h2 className="font-bold">Grocery POS</h2>
          <div className="text-xs">
            <div>{new Date(transaction.timestamp).toLocaleString()}</div>
            <div>Cashier: {transaction.cashierName}</div>
            <div>Receipt #: {transaction.id.slice(0, 8)}</div>
          </div>
        </div>

        <div className="border-t border-b border-dashed py-2">
          {transaction.items.map((item, index) => (
            <div key={index} className="flex justify-between">
              <div className="text-black">
                {item.name} x {item.quantity}
              </div>
              <div>{formatCurrency(item.price * item.quantity)}</div>
            </div>
          ))}
        </div>

        <div className="mt-2 space-y-1">
          <div className="border-t border-dashed pt-2">
            <div className="flex justify-between text-xs">
              <div className="text-gray-600">Net Sales</div>
              <div>{formatCurrency(vatBreakdown.netSales)}</div>
            </div>
            <div className="flex justify-between text-xs">
              <div className="text-gray-600">VAT ({vatBreakdown.vatRate}%)</div>
              <div>{formatCurrency(vatBreakdown.vatAmount)}</div>
            </div>
          </div>
          <div className="flex justify-between font-bold border-t border-dashed pt-2">
            <div className="text-black">Total (VAT Inc.)</div>
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

        <div className="text-center mt-4 text-xs text-gray-600">
          <div>Thank you for shopping!</div>
          <div>Please come again</div>
        </div>

      </div>
    </div>
  );
}