
import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { CartItem, Product, Transaction } from '@/types';
import { productsAPI, transactionsAPI } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { useDataPrefetch } from './DataPrefetchContext';

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
  completeTransaction: (transaction: Transaction) => Promise<void>;
  setCurrentTransactionId: (id: string | null) => void;
  calculateTotal: () => number;
  fetchProducts: () => Promise<void>;
  fetchTransactions: () => Promise<void>;
};

const PosContext = createContext<PosContextType | undefined>(undefined);

export function PosProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(posReducer, initialState);
  const { toast } = useToast();
  const { data: prefetchedData, refreshData } = useDataPrefetch();

  const fetchProducts = async () => {
    try {
      const response = await productsAPI.getProducts({ isActive: true });
      
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

  const completeTransaction = async (transaction: Transaction) => {
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
        
        toast({
          title: "Success",
          description: "Transaction completed successfully",
        });
      } else {
        throw new Error(response.message || 'Failed to complete transaction');
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to complete transaction",
        variant: "destructive"
      });
      console.error('Error completing transaction:', error);
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
