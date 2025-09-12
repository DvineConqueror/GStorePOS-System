import { Transaction } from '@/types';
import { formatCurrency } from '@/utils/format';
import './receipt.css';  // We'll create this file separately

interface ReceiptProps {
  transaction: Transaction;
}

export function TransactionReceipt({ transaction }: ReceiptProps) {
  return (
    <div className="flex justify-center w-full">
      <div className="receipt-container font-mono text-sm">
        <div className="text-center mb-4">
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
              <div>
                {item.name} x {item.quantity}
              </div>
              <div>{formatCurrency(item.price * item.quantity)}</div>
            </div>
          ))}
        </div>

        <div className="mt-2">
          <div className="flex justify-between font-bold">
            <div>Total</div>
            <div>{formatCurrency(transaction.total)}</div>
          </div>
          <div className="flex justify-between">
            <div>Cash</div>
            <div>{formatCurrency(transaction.cashReceived)}</div>
          </div>
          <div className="flex justify-between">
            <div>Change</div>
            <div>{formatCurrency(transaction.change)}</div>
          </div>
        </div>

        <div className="text-center mt-4 text-xs">
          <div>Thank you for shopping!</div>
          <div>Please come again</div>
        </div>

      </div>
    </div>
  );
}