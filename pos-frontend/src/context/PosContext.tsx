
import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { CartItem, Product, Transaction } from '@/types';
import { productsAPI, transactionsAPI } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { useDataPrefetch } from './DataPrefetchContext';
import { useRefresh } from './RefreshContext';

type PosState = {
  products: Product[];
  cart: CartItem[];
  transactions: Transaction[];
  isCheckoutOpen: boolean;
  currentTransactionId: string | null;
};

type PosAction =
  | { type: 'SET_PRODUCTS'; payload: Product[] }
  | { type: 'ADD_TO_CART'; payload: Product }
  | { type: 'REMOVE_FROM_CART'; payload: string }
  | { type: 'UPDATE_QUANTITY'; payload: { id: string; quantity: number } }
  | { type: 'CLEAR_CART' }
  | { type: 'TOGGLE_CHECKOUT'; payload: boolean }
  | { type: 'COMPLETE_TRANSACTION'; payload: Transaction }
  | { type: 'SET_TRANSACTIONS'; payload: Transaction[] }
  | { type: 'SET_CURRENT_TRANSACTION_ID'; payload: string | null };

const initialState: PosState = {
  products: [],
  cart: [],
  transactions: [],
  isCheckoutOpen: false,
  currentTransactionId: null,
};

function posReducer(state: PosState, action: PosAction): PosState {
  switch (action.type) {
    case 'SET_PRODUCTS':
      return {
        ...state,
        products: action.payload,
      };
    case 'SET_TRANSACTIONS':
      return {
        ...state,
        transactions: action.payload,
      };
    case 'ADD_TO_CART': {
      const existingItem = state.cart.find(item => item._id === action.payload._id);
      if (existingItem) {
        return {
          ...state,
          cart: state.cart.map(item => 
            item._id === action.payload._id
              ? { ...item, quantity: item.quantity + 1 }
              : item
          ),
        };
      }
      return {
        ...state,
        cart: [...state.cart, { ...action.payload, quantity: 1 }],
      };
    }
    case 'REMOVE_FROM_CART':
      return {
        ...state,
        cart: state.cart.filter(item => item._id !== action.payload),
      };
    case 'UPDATE_QUANTITY':
      return {
        ...state,
        cart: state.cart.map(item =>
          item._id === action.payload.id
            ? { ...item, quantity: action.payload.quantity }
            : item
        ),
      };
    case 'CLEAR_CART':
      return {
        ...state,
        cart: [],
      };
    case 'TOGGLE_CHECKOUT':
      return {
        ...state,
        isCheckoutOpen: action.payload,
      };
    case 'COMPLETE_TRANSACTION':
      return {
        ...state,
        transactions: [action.payload, ...state.transactions],
        cart: [],
      };
    case 'SET_CURRENT_TRANSACTION_ID':
      return {
        ...state,
        currentTransactionId: action.payload,
      };
    default:
      return state;
  }
}

type PosContextType = {
  state: PosState;
  addToCart: (product: Product) => void;
  removeFromCart: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;
  toggleCheckout: (isOpen: boolean) => void;
  completeTransaction: (transaction: Transaction) => Promise<boolean>;
  setCurrentTransactionId: (id: string | null) => void;
  calculateTotal: () => number;
  fetchProducts: () => Promise<void>;
  fetchTransactions: () => Promise<void>;
  validateCartStock: () => Promise<{ valid: boolean; errors: string[] }>;
};

const PosContext = createContext<PosContextType | undefined>(undefined);

export function PosProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(posReducer, initialState);
  const { toast } = useToast();
  const { data: prefetchedData, refreshData } = useDataPrefetch();
  const { triggerRefresh } = useRefresh();

  const fetchProducts = async () => {
    try {
      const response = await productsAPI.getProducts({ status: 'available' });
      
      if (response.success) {
        dispatch({ type: 'SET_PRODUCTS', payload: response.data });
      } else {
        throw new Error(response.message || 'Failed to fetch products');
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to load products",
        variant: "destructive"
      });
      console.error('Error fetching products:', error);
    }
  };

  const fetchTransactions = async () => {
    try {
      const response = await transactionsAPI.getTransactions();
      
      if (response.success) {
        const formattedTransactions: Transaction[] = response.data.map((t: any) => ({
          _id: t._id,
          id: t._id, // For backward compatibility
          transactionNumber: t.transactionNumber,
          total: t.total,
          subtotal: t.subtotal,
          tax: t.tax,
          discount: t.discount,
          paymentMethod: t.paymentMethod,
          cashReceived: t.cashReceived,
          change: t.change,
          status: t.status === 'voided' ? 'refunded' : (t.status as 'completed' | 'refunded'),
          timestamp: t.createdAt,
          createdAt: t.createdAt,
          updatedAt: t.updatedAt,
          cashierId: t.cashierId,
          cashierName: t.cashierName || 'Unknown',
          customerId: t.customerId,
          customerName: t.customerName,
          notes: t.notes,
          items: t.items.map((item: any) => ({
            _id: item.productId,
            id: item.productId, // For backward compatibility
            name: item.productName,
            price: item.unitPrice,
            category: '', // Will be populated from product data if needed
            image: '', // Will be populated from product data if needed
            quantity: item.quantity,
            stock: 0,
            // Required fields for Product interface
            sku: '',
            minStock: 0,
            unit: '',
            isActive: true,
            createdAt: '',
            updatedAt: ''
          }))
        }));
        
        dispatch({ type: 'SET_TRANSACTIONS', payload: formattedTransactions });
      } else {
        throw new Error(response.message || 'Failed to fetch transactions');
      }
    } catch (error: any) {
      console.error('Error fetching transactions:', error);
      toast({
        title: "Error",
        description: "Failed to load transactions. Please try refreshing the page.",
        variant: "destructive"
      });
    }
  };

  const completeTransaction = async (transaction: Transaction): Promise<boolean> => {
    try {
      const transactionData = {
        items: transaction.items.map(item => ({
          productId: item._id || item.id,
          quantity: item.quantity,
          unitPrice: item.price,
          discount: 0
        })),
        paymentMethod: transaction.paymentMethod,
        customerId: transaction.customerId,
        customerName: transaction.customerName,
        customerType: transaction.customerType,
        notes: transaction.notes,
        discount: transaction.discount || 0,
        tax: transaction.tax || 0
      };

      const response = await transactionsAPI.createTransaction(transactionData);
      
      if (response.success) {
        const completedTransaction = {
          ...transaction,
          _id: response.data._id,
          id: response.data._id, // For backward compatibility
          transactionNumber: response.data.transactionNumber,
          subtotal: response.data.subtotal,
          tax: response.data.tax,
          discount: response.data.discount,
          cashierId: response.data.cashierId,
          cashierName: response.data.cashierName,
          createdAt: response.data.createdAt,
          updatedAt: response.data.updatedAt
        };
        
        dispatch({ type: 'COMPLETE_TRANSACTION', payload: completedTransaction });
        
        // Refresh prefetched products to update stock levels
        await refreshData(['products']);
        
        // Fetch updated products to reflect new stock levels
        await fetchProducts();
        
        // Trigger global refresh for other components
        triggerRefresh();
        
        toast({
          title: "Success",
          description: "Transaction completed successfully",
          variant: "success",
        });
        
        return true;
      } else {
        throw new Error(response.message || 'Failed to complete transaction');
      }
    } catch (error: any) {
      console.error('Transaction error:', error);
      
      // Parse error message to provide better feedback
      let errorTitle = "Transaction Failed";
      let errorDescription = error.message || "Failed to complete transaction";
      
      // Check for specific error patterns
      if (errorDescription.includes('not available')) {
        errorTitle = "Product Unavailable";
        // Extract product name from error message like "Product Frozen Tocino is not available"
        const productMatch = errorDescription.match(/Product (.+?) is not available/);
        if (productMatch) {
          errorDescription = `${productMatch[1]} is no longer available. It may have been sold out by another cashier. Please remove it from cart and try again.`;
        }
      } else if (errorDescription.includes('Insufficient stock')) {
        errorTitle = "Insufficient Stock";
        // Error already contains details like "Insufficient stock for Frozen Tocino. Available: 5"
        errorDescription += " Another cashier may have just purchased this item. Please adjust the quantity.";
      } else if (errorDescription.includes('out of stock')) {
        errorTitle = "Out of Stock";
        errorDescription = `One or more items in your cart are out of stock. Please remove them and try again.`;
      }
      
      // Refresh products to show current stock levels
      await fetchProducts();
      
      toast({
        title: errorTitle,
        description: errorDescription,
        variant: "destructive",
        duration: 7000, // Longer duration for important errors
      });
      
      return false;
    }
  };

  useEffect(() => {
    // Use prefetched data if available, otherwise fetch
    if (prefetchedData.products.length > 0 && state.products.length === 0) {
      dispatch({ type: 'SET_PRODUCTS', payload: prefetchedData.products });
    } else if (prefetchedData.products.length === 0 && state.products.length === 0) {
      fetchProducts();
    }

    if (prefetchedData.transactions.length > 0 && state.transactions.length === 0) {
      // Convert prefetched transactions to POS format
      const formattedTransactions: Transaction[] = prefetchedData.transactions.map((t: any) => ({
        _id: t._id,
        id: t._id,
        transactionNumber: t.transactionNumber,
        total: t.total,
        subtotal: t.subtotal,
        tax: t.tax,
        discount: t.discount,
        paymentMethod: t.paymentMethod,
        cashReceived: t.cashReceived,
        change: t.change,
        status: t.status === 'voided' ? 'refunded' : (t.status as 'completed' | 'refunded'),
        timestamp: t.createdAt,
        createdAt: t.createdAt,
        updatedAt: t.updatedAt,
        cashierId: t.cashierId,
        cashierName: t.cashierName || 'Unknown',
        customerId: t.customerId,
        customerName: t.customerName,
        notes: t.notes,
        items: t.items?.map((item: any) => ({
          _id: item.productId,
          id: item.productId,
          name: item.productName,
          price: item.unitPrice,
          category: '',
          image: '',
          quantity: item.quantity,
          stock: 0,
          sku: '',
          minStock: 0,
          unit: '',
          isActive: true,
          createdAt: '',
          updatedAt: ''
        })) || []
      }));
      dispatch({ type: 'SET_TRANSACTIONS', payload: formattedTransactions });
    } else if (prefetchedData.transactions.length === 0 && state.transactions.length === 0) {
      fetchTransactions();
    }
  }, [prefetchedData.products.length, prefetchedData.transactions.length, state.products.length, state.transactions.length]);

  const addToCart = (product: Product) => {
    // Check if product has stock available
    if (product.stock <= 0) {
      toast({
        title: "Out of Stock",
        description: `${product.name} is currently out of stock.`,
        variant: "warning",
      });
      return;
    }

    const existingItem = state.cart.find(item => item._id === product._id);
    
    if (existingItem) {
      // Check if adding one more would exceed stock
      if (existingItem.quantity >= product.stock) {
        toast({
          title: "Stock Limit Reached",
          description: `Cannot add more ${product.name}. Only ${product.stock} available in stock.`,
          variant: "warning",
        });
        return;
      }
    }

    dispatch({ type: 'ADD_TO_CART', payload: product });
  };

  const removeFromCart = (id: string) => {
    dispatch({ type: 'REMOVE_FROM_CART', payload: id });
  };

  const updateQuantity = (id: string, quantity: number) => {
    // Find the product to get current stock
    const product = state.products.find(p => p._id === id);
    if (!product) return;

    // Ensure quantity is at least 1
    if (quantity < 1) {
      quantity = 1;
    }

    // Check if quantity exceeds available stock
    if (quantity > product.stock) {
      toast({
        title: "Stock Limit Exceeded",
        description: `Cannot set quantity to ${quantity}. Only ${product.stock} ${product.unit} available in stock.`,
        variant: "warning",
      });
      quantity = product.stock; // Set to maximum available
    }

    dispatch({ type: 'UPDATE_QUANTITY', payload: { id, quantity } });
  };

  const clearCart = () => {
    dispatch({ type: 'CLEAR_CART' });
  };

  const toggleCheckout = (isOpen: boolean) => {
    dispatch({ type: 'TOGGLE_CHECKOUT', payload: isOpen });
  };

  const setCurrentTransactionId = (id: string | null) => {
    dispatch({ type: 'SET_CURRENT_TRANSACTION_ID', payload: id });
  };

  const calculateTotal = (): number => {
    return state.cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  };

  const validateCartStock = async (): Promise<{ valid: boolean; errors: string[] }> => {
    try {
      // Fetch latest product data
      const response = await productsAPI.getProducts({ status: 'available' });
      
      if (!response.success) {
        return { valid: false, errors: ['Unable to validate stock. Please try again.'] };
      }
      
      const currentProducts = response.data;
      const errors: string[] = [];
      
      // Check each cart item against current stock
      for (const cartItem of state.cart) {
        const currentProduct = currentProducts.find((p: Product) => p._id === cartItem._id);
        
        if (!currentProduct) {
          errors.push(`${cartItem.name} is no longer available`);
        } else if (currentProduct.status !== 'available') {
          errors.push(`${cartItem.name} is currently unavailable`);
        } else if (currentProduct.stock < cartItem.quantity) {
          errors.push(`${cartItem.name}: Only ${currentProduct.stock} available (you have ${cartItem.quantity} in cart)`);
        }
      }
      
      // If there are errors, refresh the products to update the UI
      if (errors.length > 0) {
        dispatch({ type: 'SET_PRODUCTS', payload: currentProducts });
      }
      
      return { valid: errors.length === 0, errors };
    } catch (error) {
      console.error('Error validating cart stock:', error);
      return { valid: false, errors: ['Unable to validate stock. Please try again.'] };
    }
  };

  return (
    <PosContext.Provider
      value={{
        state,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        toggleCheckout,
        completeTransaction,
        setCurrentTransactionId,
        calculateTotal,
        fetchProducts,
        fetchTransactions,
        validateCartStock,
      }}
    >
      {children}
    </PosContext.Provider>
  );
}

export function usePos() {
  const context = useContext(PosContext);
  if (context === undefined) {
    throw new Error('usePos must be used within a PosProvider');
  }
  return context;
}
