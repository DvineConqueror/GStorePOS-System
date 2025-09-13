
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
        <CardTitle className="text-lg sm:text-xl text-white">Recent Transactions</CardTitle>
        <CardDescription className="text-xs sm:text-sm text-slate-400">Transaction history and details</CardDescription>
      </CardHeader>
      <CardContent className="p-0">
        <div className="border border-slate-700 rounded-md overflow-x-auto bg-slate-800">
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-700">
                <TableHead className="text-xs sm:text-sm text-white">Cashier</TableHead>
                <TableHead className="text-xs sm:text-sm text-white">Date</TableHead>
                <TableHead className="text-xs sm:text-sm text-white">Items</TableHead>
                <TableHead className="text-xs sm:text-sm text-right text-white">Amount</TableHead>
                <TableHead className="text-xs sm:text-sm text-right text-white">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {transactions.slice(0, 5).map((transaction) => {
                const date = new Date(transaction.timestamp || transaction.createdAt);
                const formattedDate = date.toLocaleDateString();
                const formattedTime = date.toLocaleTimeString();
                
                return (
                  <TableRow key={transaction._id} className="hover:bg-slate-700/50">
                    <TableCell className="font-medium text-white">
                      {transaction.cashierName}
                    </TableCell>
                    <TableCell className="text-slate-300">
                      <div>{formattedDate}</div>
                      <div className="text-xs text-slate-500">{formattedTime}</div>
                    </TableCell>
                    <TableCell className="text-slate-300">{transaction.items.length} items</TableCell>
                    <TableCell className="text-right text-slate-200 font-semibold">{formatCurrency(transaction.total)}</TableCell>
                    <TableCell className="text-right">
                      <Badge 
                        variant={transaction.status === 'completed' ? 'default' : 'destructive'}
                        className={transaction.status === 'completed' ? 'bg-slate-600 text-white border-slate-500' : ''}
                      >
                        {transaction.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                );
              })}
              {transactions.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-6 text-slate-500">
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
