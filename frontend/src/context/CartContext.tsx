import React, { createContext, useContext, useState, useEffect } from 'react';
import { Cart } from '../types';
import { cartApi } from '../services/api';

interface CartContextType {
  cart: Cart | null;
  itemCount: number;
  totalPrice: number;
  isDrawerOpen: boolean;
  loading: boolean;
  addToCart: (productId: number, variantId?: number | null, quantity?: number) => Promise<void>;
  updateQuantity: (itemId: number, quantity: number) => Promise<void>;
  removeItem: (itemId: number) => Promise<void>;
  clearCart: () => Promise<void>;
  openDrawer: () => void;
  closeDrawer: () => void;
  toggleDrawer: () => void;
  refreshCart: () => Promise<void>;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [cart, setCart] = useState<Cart | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const refreshCart = async () => {
    try {
      const data = await cartApi.getCart();
      setCart(data);
    } catch (err) {
      console.error('Failed to load cart', err);
    }
  };

  useEffect(() => {
    refreshCart();
  }, []);

  const addToCart = async (productId: number, variantId: number | null = null, quantity: number = 1) => {
    setLoading(true);
    try {
      const updatedCart = await cartApi.addItem({
        product_id: productId,
        variant_id: variantId,
        quantity,
      });
      setCart(updatedCart);
      setIsDrawerOpen(true);
    } finally {
      setLoading(false);
    }
  };

  const updateQuantity = async (itemId: number, quantity: number) => {
    try {
      const updatedCart = await cartApi.updateItem(itemId, quantity);
      setCart(updatedCart);
    } catch (err) {
      console.error('Failed to update item quantity', err);
    }
  };

  const removeItem = async (itemId: number) => {
    try {
      const updatedCart = await cartApi.removeItem(itemId);
      setCart(updatedCart);
    } catch (err) {
      console.error('Failed to remove item', err);
    }
  };

  const clearCart = async () => {
    try {
      await cartApi.clearCart();
      await refreshCart();
    } catch (err) {
      console.error('Failed to clear cart', err);
    }
  };

  const itemCount = cart?.items?.reduce((acc, it) => acc + it.quantity, 0) || 0;
  const totalPrice = cart?.items?.reduce((acc, it) => acc + (Number(it.line_total) || 0), 0) || 0;

  return (
    <CartContext.Provider
      value={{
        cart,
        itemCount,
        totalPrice,
        isDrawerOpen,
        loading,
        addToCart,
        updateQuantity,
        removeItem,
        clearCart,
        openDrawer: () => setIsDrawerOpen(true),
        closeDrawer: () => setIsDrawerOpen(false),
        toggleDrawer: () => setIsDrawerOpen((prev) => !prev),
        refreshCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};
