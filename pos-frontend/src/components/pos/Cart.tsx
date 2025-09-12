import { Minus, Plus, Trash2, ShoppingBag } from 'lucide-react';
import { usePos } from '@/context/PosContext';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { formatCurrency } from '@/utils/format';
import { useState } from 'react';

export function Cart() {
  const { state, removeFromCart, updateQuantity, clearCart, toggleCheckout, calculateTotal } = usePos();
  const { cart } = state;
  const [confirmClear, setConfirmClear] = useState(false);

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
      <Card className="flex flex-col h-[500px] p-4 sticky top-32 w-full">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold flex items-center">
            <ShoppingBag className="mr-4 h-10 w-10" />
            Grocery Items
          </h2>
          <Button
            variant="outline"
            size="sm"
            onClick={handleClearCart}
            disabled={cart.length === 0}
            className={confirmClear ? 'bg-red-100 text-red-600' : ''}
          >
            {confirmClear ? 'Confirm Clear' : 'Clear'}
          </Button>
        </div>

        <div className="flex-grow overflow-y-auto mb-4 pr-2">
          {cart.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
              <ShoppingBag className="h-12 w-12 mb-2" />
              <p className="text-lg font-medium">Cart is empty</p>
              <p className="text-sm text-muted-foreground">Click on products to add them to your cart</p>
            </div>
          ) : (
            <ul className="space-y-3">
              {cart.map(item => (
                <li key={item._id} className="border-b pb-3 hover:bg-accent/50 rounded-lg transition-colors p-2">
                  <div className="flex items-center justify-between">
                    <span className="font-medium truncate flex-1 mr-2">{item.name}</span>
                    <span className='text-pos-primary shrink-0'>{formatCurrency(item.price)}</span>
                  </div>
                  <div className="flex items-center justify-between mt-2">
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => updateQuantity(item._id, Math.max(1, item.quantity - 1))}
                      >
                        <Minus className="h-3 w-3" />
                      </Button>
                      <Input
                        type="number"
                        value={item.quantity}
                        onChange={(e) => updateQuantity(item._id, parseInt(e.target.value) || 1)}
                        className="w-16 h-7 text-center"
                        min="1"
                      />
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => updateQuantity(item._id, item.quantity + 1)}
                      >
                        <Plus className="h-3 w-3" />
                      </Button>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="font-medium text-pos-blue">{formatCurrency(item.price * item.quantity)}</span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-destructive"
                        onClick={() => removeFromCart(item._id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="border-t pt-4 space-y-4 mt-auto">
          <div className="flex flex-col space-y-2 text-sm text-muted-foreground">
            <div className="flex justify-between">
              <span>Items</span>
              <span>{cart.reduce((acc, item) => acc + item.quantity, 0)} items</span>
            </div>
          </div>
          <div className="flex items-center justify-between font-bold text-lg">
            <span>Total</span>
            <span className='text-pos-primary'>{formatCurrency(calculateTotal())}</span>
          </div>
          <Button
            className="w-full bg-pos-primary hover:bg-pos-primary/90"
            size="lg"
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