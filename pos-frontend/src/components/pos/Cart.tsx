import { Minus, Plus, Trash2, ShoppingBag } from 'lucide-react';
import { usePos } from '@/context/PosContext';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { formatCurrency } from '@/utils/format';
import { calculateVAT } from '@/utils/vat';
import { useState } from 'react';

export function Cart() {
  const { state, removeFromCart, updateQuantity, clearCart, toggleCheckout, calculateTotal } = usePos();
  const { cart, products } = state;
  const [confirmClear, setConfirmClear] = useState(false);
  
  const total = calculateTotal();
  const vatBreakdown = calculateVAT(total);

  // Helper function to get product stock
  const getProductStock = (productId: string): number => {
    const product = products.find(p => p._id === productId);
    return product?.stock || 0;
  };

  // Helper function to check if item is at stock limit
  const isAtStockLimit = (item: any): boolean => {
    const stock = getProductStock(item._id);
    return item.quantity >= stock;
  };

  const handleClearCart = () => {
    if (confirmClear) {
      clearCart();
      setConfirmClear(false);
    } else {
      setConfirmClear(true);
      setTimeout(() => setConfirmClear(false), 3000); // Reset after 3 seconds
    }
  };

  const handleCheckout = () => {
    if (cart.length > 0) {
      toggleCheckout(true);
    }
  };

  return (
    <div className="relative h-full">
      <Card className="flex flex-col h-[400px] lg:h-[500px] p-3 lg:p-4 sticky top-16 lg:top-32 w-full">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg lg:text-xl font-bold text-black flex items-center">
            <ShoppingBag className="mr-2 lg:mr-4 h-8 w-8 lg:h-10 lg:w-10 text-gray-600" />
            <span className="hidden sm:inline">Grocery Items</span>
            <span className="sm:hidden">Cart</span>
          </h2>
          <Button
            variant="outline"
            size="sm"
            onClick={handleClearCart}
            disabled={cart.length === 0}
            className={`${confirmClear ? 'bg-red-100 text-red-600 border-red-300' : 'border-gray-300 hover:bg-gray-50'} text-xs lg:text-sm px-2 lg:px-4`}
          >
            {confirmClear ? 'Confirm Clear' : 'Clear'}
          </Button>
        </div>

        <div className="flex-grow overflow-y-auto mb-4 pr-2">
          {cart.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-500">
              <ShoppingBag className="h-12 w-12 mb-2 text-gray-400" />
              <p className="text-lg font-medium text-black">Cart is empty</p>
              <p className="text-sm text-gray-500">Click on products to add them to your cart</p>
            </div>
          ) : (
            <ul className="space-y-3">
              {cart.map(item => {
                const stock = getProductStock(item._id);
                const atStockLimit = isAtStockLimit(item);
                
                return (
                  <li key={item._id} className="border-b pb-3 hover:bg-accent/50 rounded-lg transition-colors p-2">
                    <div className="flex items-center justify-between">
                      <span className="font-medium truncate flex-1 mr-2 text-black text-sm lg:text-base">{item.name}</span>
                      <span className='text-gray-600 shrink-0 text-sm lg:text-base'>{formatCurrency(item.price)}</span>
                    </div>
                    
                    {/* Stock Information */}
                    <div className="text-xs text-gray-500 mt-1">
                      Stock: {stock} {products.find(p => p._id === item._id)?.unit || 'units'}
                      {atStockLimit && <span className="text-orange-600 font-medium ml-2">(Max reached)</span>}
                    </div>
                    
                    <div className="flex items-center justify-between mt-2">
                      <div className="flex items-center space-x-1 lg:space-x-2">
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-6 w-6 lg:h-7 lg:w-7"
                          onClick={() => updateQuantity(item._id, Math.max(1, item.quantity - 1))}
                        >
                          <Minus className="h-3 w-3" />
                        </Button>
                        <Input
                          type="number"
                          value={item.quantity}
                          onChange={(e) => updateQuantity(item._id, parseInt(e.target.value) || 1)}
                          className="w-12 lg:w-16 h-6 lg:h-7 text-center text-sm"
                          min="1"
                          max={stock}
                        />
                        <Button
                          variant="outline"
                          size="icon"
                          className={`h-6 w-6 lg:h-7 lg:w-7 ${atStockLimit ? 'opacity-50 cursor-not-allowed' : ''}`}
                          onClick={() => updateQuantity(item._id, item.quantity + 1)}
                          disabled={atStockLimit}
                        >
                          <Plus className="h-3 w-3" />
                        </Button>
                      </div>
                      <div className="flex items-center space-x-1 lg:space-x-2">
                        <span className="font-medium text-black text-sm lg:text-base">{formatCurrency(item.price * item.quantity)}</span>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 lg:h-7 lg:w-7 text-red-600 hover:text-red-700"
                          onClick={() => removeFromCart(item._id)}
                        >
                          <Trash2 className="h-3 w-3 lg:h-4 lg:w-4" />
                        </Button>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <div className="border-t pt-3 lg:pt-4 space-y-2 lg:space-y-3 mt-auto">
          <div className="flex flex-col space-y-1 text-xs lg:text-sm text-gray-600">
            <div className="flex justify-between">
              <span>Items</span>
              <span>{cart.reduce((acc, item) => acc + item.quantity, 0)} items</span>
            </div>
            <div className="flex justify-between">
              <span>Net Sales</span>
              <span>{formatCurrency(vatBreakdown.netSales)}</span>
            </div>
            <div className="flex justify-between">
              <span>VAT ({vatBreakdown.vatRate}%)</span>
              <span>{formatCurrency(vatBreakdown.vatAmount)}</span>
            </div>
          </div>
          <div className="flex items-center justify-between font-bold text-base lg:text-lg border-t pt-2">
            <span className="text-black">Total</span>
            <span className='text-green-600'>{formatCurrency(total)}</span>
          </div>
          <Button
            className="w-full bg-green-600 hover:bg-green-700 text-sm lg:text-base"
            size="default"
            onClick={handleCheckout}
            disabled={cart.length === 0}
          >
            Proceed to Checkout
          </Button>
        </div>
      </Card>
    </div>
  );
}