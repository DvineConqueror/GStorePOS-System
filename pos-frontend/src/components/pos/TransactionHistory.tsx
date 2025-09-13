
import { usePos } from '@/context/PosContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { formatCurrency } from '@/utils/format';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';

export function TransactionHistory() {
  const { state } = usePos();
  const { transactions } = state;

  return (
    <Card className="h-full bg-transparent border-0 shadow-none">
      <CardHeader className="pb-4">
        <CardTitle className="text-lg sm:text-xl text-blue-800">Recent Transactions</CardTitle>
        <CardDescription className="text-xs sm:text-sm text-blue-600">Transaction history and details</CardDescription>
      </CardHeader>
      <CardContent className="p-0">
        <div className="border border-blue-200 rounded-md overflow-x-auto bg-white">
          <Table>
            <TableHeader>
              <TableRow className="bg-blue-50">
                <TableHead className="text-xs sm:text-sm text-blue-800">Cashier</TableHead>
                <TableHead className="text-xs sm:text-sm text-blue-800">Date</TableHead>
                <TableHead className="text-xs sm:text-sm text-blue-800">Items</TableHead>
                <TableHead className="text-xs sm:text-sm text-right text-blue-800">Amount</TableHead>
                <TableHead className="text-xs sm:text-sm text-right text-blue-800">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {transactions.slice(0, 5).map((transaction) => {
                const date = new Date(transaction.timestamp || transaction.createdAt);
                const formattedDate = date.toLocaleDateString();
                const formattedTime = date.toLocaleTimeString();
                
                return (
                  <TableRow key={transaction._id} className="hover:bg-blue-50/50">
                    <TableCell className="font-medium text-blue-800">
                      {transaction.cashierName}
                    </TableCell>
                    <TableCell className="text-blue-700">
                      <div>{formattedDate}</div>
                      <div className="text-xs text-blue-500">{formattedTime}</div>
                    </TableCell>
                    <TableCell className="text-blue-700">{transaction.items.length} items</TableCell>
                    <TableCell className="text-right text-blue-600 font-semibold">{formatCurrency(transaction.total)}</TableCell>
                    <TableCell className="text-right">
                      <Badge 
                        variant={transaction.status === 'completed' ? 'default' : 'destructive'}
                        className={transaction.status === 'completed' ? 'bg-blue-100 text-blue-800 border-blue-200' : ''}
                      >
                        {transaction.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                );
              })}
              {transactions.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-6 text-blue-500">
                    No transactions yet
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
