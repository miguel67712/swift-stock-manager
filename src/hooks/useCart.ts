import { useState, useCallback, useMemo } from "react";
import type { Product } from "./useProducts";

export interface CartItem {
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
}

const TAX_RATE = 0.1;

export function useCart() {
  const [cart, setCart] = useState<CartItem[]>([]);

  const addToCart = useCallback((product: Product, qty = 1) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.productId === product.id);
      if (existing) {
        return prev.map((item) =>
          item.productId === product.id
            ? { ...item, quantity: item.quantity + qty }
            : item
        );
      }
      return [...prev, { productId: product.id, productName: product.name, quantity: qty, unitPrice: Number(product.price) }];
    });
  }, []);

  const removeFromCart = useCallback((productId: string) => {
    setCart((prev) => prev.filter((item) => item.productId !== productId));
  }, []);

  const updateCartQty = useCallback((productId: string, qty: number) => {
    if (qty <= 0) {
      setCart((prev) => prev.filter((item) => item.productId !== productId));
      return;
    }
    setCart((prev) => prev.map((item) => (item.productId === productId ? { ...item, quantity: qty } : item)));
  }, []);

  const clearCart = useCallback(() => setCart([]), []);

  const cartSubtotal = useMemo(() => cart.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0), [cart]);
  const cartTax = cartSubtotal * TAX_RATE;
  const cartTotal = cartSubtotal + cartTax;

  return { cart, addToCart, removeFromCart, updateCartQty, clearCart, cartSubtotal, cartTax, cartTotal };
}
