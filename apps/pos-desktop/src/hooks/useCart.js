import { useState, useMemo } from 'react';

export const useCart = () => {
  const [cart, setCart] = useState([]);

  const addToCart = (product, quantity = 1) => {
    if (!product || !product.id) return;
    const qty = Number(quantity);
    if (isNaN(qty) || qty <= 0) return;

    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        return prev.map(item => item.id === product.id ? { ...item, qty: item.qty + qty } : item);
      }
      return [...prev, { ...product, qty }];
    });
  };

  const removeFromCart = (productId) => { // Decrement
    setCart(prev => prev.map(item =>
      item.id === productId ? { ...item, qty: Math.max(0, item.qty - 1) } : item
    ).filter(item => item.qty > 0));
  };

  const removeItem = (productId) => { // Full remove
    setCart(prev => prev.filter(item => item.id !== productId));
  };

  const clearCart = () => setCart([]);

  // Avtomatik hisoblash (useMemo - optimizatsiya uchun)
  const cartTotal = useMemo(() => cart.reduce((acc, item) => acc + (item.price * item.qty), 0), [cart]);
  const cartCount = useMemo(() => cart.reduce((acc, item) => acc + item.qty, 0), [cart]);

  return { cart, addToCart, removeFromCart, removeItem, clearCart, cartTotal, cartCount };
};