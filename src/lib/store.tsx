import React, { createContext, useContext, useState, useCallback, ReactNode } from "react";
import {
  Product,
  Sale,
  SaleItem,
  InventoryAlert,
  User,
  initialProducts,
  initialSales,
  generateAlerts,
} from "./mock-data";

export interface CartItem {
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
}

interface StoreContextType {
  products: Product[];
  sales: Sale[];
  alerts: InventoryAlert[];
  cart: CartItem[];
  user: User | null;
  isAuthenticated: boolean;

  addToCart: (product: Product, qty?: number) => void;
  removeFromCart: (productId: string) => void;
  updateCartQty: (productId: string, qty: number) => void;
  clearCart: () => void;
  checkout: (paymentMethod: "cash" | "card" | "mobile") => Sale | null;
  addProduct: (product: Omit<Product, "id" | "dateAdded">) => void;
  updateProduct: (id: string, updates: Partial<Product>) => void;
  deleteProduct: (id: string) => void;
  resolveAlert: (alertId: string) => void;
  login: (username: string, password: string) => boolean;
  logout: () => void;

  cartSubtotal: number;
  cartTax: number;
  cartTotal: number;
  todaysSalesTotal: number;
  lowStockCount: number;
}

const StoreContext = createContext<StoreContextType | null>(null);

const TAX_RATE = 0.1;

export function StoreProvider({ children }: { children: ReactNode }) {
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [sales, setSales] = useState<Sale[]>(initialSales);
  const [alerts, setAlerts] = useState<InventoryAlert[]>(() => generateAlerts(initialProducts));
  const [cart, setCart] = useState<CartItem[]>([]);
  const [user, setUser] = useState<User | null>(null);

  const isAuthenticated = user !== null;

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
      return [
        ...prev,
        { productId: product.id, productName: product.name, quantity: qty, unitPrice: product.price },
      ];
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
    setCart((prev) =>
      prev.map((item) =>
        item.productId === productId ? { ...item, quantity: qty } : item
      )
    );
  }, []);

  const clearCart = useCallback(() => setCart([]), []);

  const cartSubtotal = cart.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
  const cartTax = cartSubtotal * TAX_RATE;
  const cartTotal = cartSubtotal + cartTax;

  const checkout = useCallback(
    (paymentMethod: "cash" | "card" | "mobile"): Sale | null => {
      if (cart.length === 0) return null;

      const saleItems: SaleItem[] = cart.map((item) => ({
        productId: item.productId,
        productName: item.productName,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        totalPrice: item.unitPrice * item.quantity,
      }));

      const subtotal = saleItems.reduce((s, i) => s + i.totalPrice, 0);
      const tax = subtotal * TAX_RATE;

      const newSale: Sale = {
        id: String(Date.now()),
        transactionId: `TXN-${String(sales.length + 1).padStart(4, "0")}`,
        items: saleItems,
        subtotal,
        tax,
        total: subtotal + tax,
        paymentMethod,
        cashier: user?.name ?? "Unknown",
        date: new Date().toISOString(),
      };

      setSales((prev) => [newSale, ...prev]);

      // Deduct stock
      setProducts((prev) => {
        const updated = prev.map((p) => {
          const cartItem = cart.find((c) => c.productId === p.id);
          if (cartItem) {
            return { ...p, quantity: Math.max(0, p.quantity - cartItem.quantity) };
          }
          return p;
        });
        // Regenerate alerts
        setAlerts(generateAlerts(updated));
        return updated;
      });

      setCart([]);
      return newSale;
    },
    [cart, sales.length, user]
  );

  const addProduct = useCallback((product: Omit<Product, "id" | "dateAdded">) => {
    const newProduct: Product = {
      ...product,
      id: String(Date.now()),
      dateAdded: new Date().toISOString().split("T")[0],
    };
    setProducts((prev) => {
      const updated = [...prev, newProduct];
      setAlerts(generateAlerts(updated));
      return updated;
    });
  }, []);

  const updateProduct = useCallback((id: string, updates: Partial<Product>) => {
    setProducts((prev) => {
      const updated = prev.map((p) => (p.id === id ? { ...p, ...updates } : p));
      setAlerts(generateAlerts(updated));
      return updated;
    });
  }, []);

  const deleteProduct = useCallback((id: string) => {
    setProducts((prev) => {
      const updated = prev.filter((p) => p.id !== id);
      setAlerts(generateAlerts(updated));
      return updated;
    });
  }, []);

  const resolveAlert = useCallback((alertId: string) => {
    setAlerts((prev) =>
      prev.map((a) => (a.id === alertId ? { ...a, resolved: true } : a))
    );
  }, []);

  const login = useCallback((username: string, _password: string): boolean => {
    if (!username.trim()) return false;
    const role = username.toLowerCase() === "admin"
      ? "admin"
      : username.toLowerCase() === "manager"
      ? "manager"
      : "cashier";
    setUser({
      id: String(Date.now()),
      name: username.charAt(0).toUpperCase() + username.slice(1),
      username: username.toLowerCase(),
      role,
    });
    return true;
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    setCart([]);
  }, []);

  const todaysSalesTotal = sales
    .filter((s) => {
      const saleDate = new Date(s.date).toDateString();
      return saleDate === new Date().toDateString();
    })
    .reduce((sum, s) => sum + s.total, 0);

  const lowStockCount = products.filter(
    (p) => p.quantity <= p.minThreshold
  ).length;

  return (
    <StoreContext.Provider
      value={{
        products, sales, alerts, cart, user, isAuthenticated,
        addToCart, removeFromCart, updateCartQty, clearCart, checkout,
        addProduct, updateProduct, deleteProduct, resolveAlert,
        login, logout,
        cartSubtotal, cartTax, cartTotal, todaysSalesTotal, lowStockCount,
      }}
    >
      {children}
    </StoreContext.Provider>
  );
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore must be used within StoreProvider");
  return ctx;
}
