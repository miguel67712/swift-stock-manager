import { useState, useMemo } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useProducts } from "@/hooks/useProducts";
import { useSales } from "@/hooks/useSales";
import { useCart } from "@/hooks/useCart";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import {
  Search,
  Plus,
  Minus,
  Trash2,
  CreditCard,
  Banknote,
  Smartphone,
  ShoppingCart,
  CheckCircle2,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";

const CATEGORIES = [
  "Dairy", "Bakery", "Meat", "Seafood", "Produce", "Grains",
  "Beverages", "Canned", "Cooking", "Household", "Snacks", "Frozen",
];

export default function POS() {
  const { user, profile } = useAuth();
  const { products } = useProducts();
  const { sales, createSale } = useSales();
  const {
    cart, addToCart, removeFromCart, updateCartQty, clearCart,
    cartSubtotal, cartTax, cartTotal,
  } = useCart();

  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [receiptSale, setReceiptSale] = useState<any>(null);
  const [mobileCartOpen, setMobileCartOpen] = useState(false);

  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase()) || (p.barcode || "").includes(search);
      const matchesCategory = !selectedCategory || p.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [products, search, selectedCategory]);

  const activeCategories = useMemo(() => {
    const cats = new Set(products.map((p) => p.category));
    return CATEGORIES.filter((c) => cats.has(c));
  }, [products]);

  const handleCheckout = async (method: "cash" | "card" | "mobile") => {
    if (!user || !profile) return;

    const items = cart.map((item) => ({
      productId: item.productId,
      productName: item.productName,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      totalPrice: item.unitPrice * item.quantity,
    }));

    try {
      const sale = await createSale.mutateAsync({
        transactionId: `TXN-${String(sales.length + 1).padStart(4, "0")}-${Date.now().toString(36)}`,
        items,
        subtotal: cartSubtotal,
        tax: cartTax,
        total: cartTotal,
        paymentMethod: method,
        cashierId: user.id,
        cashierName: profile.full_name,
      });

      setCheckoutOpen(false);
      setMobileCartOpen(false);
      setReceiptSale(sale);
      clearCart();
      toast.success(`Transaction completed!`);
    } catch (err: any) {
      toast.error(err.message || "Checkout failed");
    }
  };

  const CartPanel = () => (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-foreground flex items-center gap-2">
            <ShoppingCart className="h-4 w-4" />
            Current Sale
          </h2>
          {cart.length > 0 && (
            <button onClick={clearCart} className="text-xs text-destructive hover:underline font-medium">Clear all</button>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-auto p-4 space-y-2">
        <AnimatePresence mode="popLayout">
          {cart.length === 0 ? (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center justify-center py-16 text-muted-foreground">
              <ShoppingCart className="h-10 w-10 mb-3 opacity-20" />
              <p className="text-sm">No items in cart</p>
              <p className="text-xs mt-1">Click a product to add it</p>
            </motion.div>
          ) : (
            cart.map((item) => (
              <motion.div key={item.productId} layout initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="flex items-center gap-3 rounded-lg border bg-background p-3">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{item.productName}</p>
                  <p className="text-xs text-muted-foreground font-mono">${item.unitPrice.toFixed(2)} each</p>
                </div>
                <div className="flex items-center gap-1.5">
                  <button onClick={() => updateCartQty(item.productId, item.quantity - 1)} className="flex h-7 w-7 items-center justify-center rounded-md border bg-background hover:bg-muted transition-colors">
                    <Minus className="h-3 w-3" />
                  </button>
                  <span className="w-8 text-center text-sm font-bold font-mono">{item.quantity}</span>
                  <button onClick={() => updateCartQty(item.productId, item.quantity + 1)} className="flex h-7 w-7 items-center justify-center rounded-md border bg-background hover:bg-muted transition-colors">
                    <Plus className="h-3 w-3" />
                  </button>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold font-mono w-16 text-right">${(item.unitPrice * item.quantity).toFixed(2)}</span>
                  <button onClick={() => removeFromCart(item.productId)} className="rounded-md p-1 text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors">
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>

      <div className="border-t border-border p-4 bg-card">
        <div className="space-y-2 mb-4">
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>Subtotal</span>
            <span className="font-mono">${cartSubtotal.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>Tax (10%)</span>
            <span className="font-mono">${cartTax.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-lg font-bold border-t pt-2">
            <span>Total</span>
            <span className="font-mono">${cartTotal.toFixed(2)}</span>
          </div>
        </div>
        <Button className="w-full h-12 text-base font-bold" disabled={cart.length === 0 || createSale.isPending} onClick={() => setCheckoutOpen(true)}>
          {createSale.isPending ? "Processing..." : "Checkout"}
        </Button>
      </div>
    </div>
  );

  return (
    <div className="flex h-[calc(100vh-56px)] md:h-screen overflow-hidden">
      {/* Product Selection */}
      <div className="flex-1 flex flex-col min-w-0 border-r border-border">
        <div className="p-3 sm:p-4 border-b border-border bg-card">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search products or scan barcode..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10 h-10 sm:h-11 bg-background" />
          </div>
          <div className="flex gap-2 mt-3 overflow-x-auto pb-1 scrollbar-hide">
            <button onClick={() => setSelectedCategory(null)} className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${!selectedCategory ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground hover:bg-secondary/80"}`}>All</button>
            {activeCategories.map((cat) => (
              <button key={cat} onClick={() => setSelectedCategory(selectedCategory === cat ? null : cat)} className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${selectedCategory === cat ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground hover:bg-secondary/80"}`}>{cat}</button>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-auto p-3 sm:p-4">
          <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-2 sm:gap-3">
            {filteredProducts.map((product) => {
              const inCart = cart.find((c) => c.productId === product.id);
              const isOutOfStock = product.quantity === 0;
              const isLowStock = product.quantity > 0 && product.quantity <= product.min_threshold;

              return (
                <motion.button key={product.id} whileTap={{ scale: 0.97 }} onClick={() => { if (!isOutOfStock) addToCart(product); }} disabled={isOutOfStock}
                  className={`relative rounded-xl border p-3 sm:p-4 text-left transition-all shadow-card hover:shadow-card-hover ${isOutOfStock ? "opacity-50 cursor-not-allowed bg-muted" : inCart ? "border-primary bg-primary/5" : "bg-card hover:border-primary/30"}`}>
                  {inCart && (
                    <div className="absolute -top-2 -right-2 flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-bold shadow-sm">{inCart.quantity}</div>
                  )}
                  <p className="text-xs sm:text-sm font-semibold text-foreground truncate">{product.name}</p>
                  <p className="text-[10px] sm:text-xs text-muted-foreground mt-0.5">{product.category}</p>
                  <div className="flex items-end justify-between mt-2 sm:mt-3">
                    <span className="text-base sm:text-lg font-bold font-mono text-foreground">${Number(product.price).toFixed(2)}</span>
                    <span className={`text-[9px] sm:text-[10px] font-semibold px-1.5 py-0.5 rounded ${isOutOfStock ? "stock-critical" : isLowStock ? "stock-warning" : "stock-good"}`}>
                      {isOutOfStock ? "OUT" : `${product.quantity} left`}
                    </span>
                  </div>
                </motion.button>
              );
            })}
          </div>
          {filteredProducts.length === 0 && (
            <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
              <Search className="h-10 w-10 mb-3 opacity-30" />
              <p className="text-sm">No products found</p>
            </div>
          )}
        </div>

        {/* Mobile cart FAB */}
        <div className="md:hidden fixed bottom-4 right-4 z-50">
          <Sheet open={mobileCartOpen} onOpenChange={setMobileCartOpen}>
            <SheetTrigger asChild>
              <button className="relative flex h-14 w-14 items-center justify-center rounded-full gradient-brand text-primary-foreground shadow-lg">
                <ShoppingCart className="h-6 w-6" />
                {cart.length > 0 && (
                  <span className="absolute -top-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-destructive text-destructive-foreground text-xs font-bold">{cart.reduce((s, c) => s + c.quantity, 0)}</span>
                )}
              </button>
            </SheetTrigger>
            <SheetContent side="right" className="p-0 w-full sm:w-96">
              <CartPanel />
            </SheetContent>
          </Sheet>
        </div>
      </div>

      {/* Desktop Cart */}
      <div className="hidden md:flex w-80 lg:w-96 flex-col bg-card">
        <CartPanel />
      </div>

      {/* Checkout Dialog */}
      <Dialog open={checkoutOpen} onOpenChange={setCheckoutOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Select Payment Method</DialogTitle>
            <DialogDescription>Total: <span className="font-mono font-bold text-foreground">${cartTotal.toFixed(2)}</span></DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-3 gap-3 py-4">
            {[
              { method: "cash" as const, icon: Banknote, label: "Cash" },
              { method: "card" as const, icon: CreditCard, label: "Card" },
              { method: "mobile" as const, icon: Smartphone, label: "Mobile" },
            ].map(({ method, icon: Icon, label }) => (
              <button key={method} onClick={() => handleCheckout(method)} disabled={createSale.isPending}
                className="flex flex-col items-center gap-2 rounded-xl border-2 border-border p-4 sm:p-5 hover:border-primary hover:bg-primary/5 transition-all disabled:opacity-50">
                <Icon className="h-6 w-6 sm:h-8 sm:w-8 text-primary" />
                <span className="text-xs sm:text-sm font-semibold">{label}</span>
              </button>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      {/* Receipt Dialog */}
      <Dialog open={!!receiptSale} onOpenChange={() => setReceiptSale(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-success">
              <CheckCircle2 className="h-5 w-5" />
              Sale Complete
            </DialogTitle>
            <DialogDescription>Transaction recorded successfully</DialogDescription>
          </DialogHeader>
          {receiptSale && (
            <div className="space-y-4 py-2">
              <div className="text-center border-b pb-3">
                <p className="font-mono text-xs text-muted-foreground">{receiptSale.transaction_id}</p>
                <p className="text-xs text-muted-foreground mt-1">{new Date(receiptSale.created_at).toLocaleString()}</p>
              </div>
              <div className="space-y-2">
                {receiptSale.sale_items?.map((item: any, i: number) => (
                  <div key={i} className="flex justify-between text-sm">
                    <span>{item.quantity}x {item.product_name}</span>
                    <span className="font-mono">${Number(item.total_price).toFixed(2)}</span>
                  </div>
                ))}
              </div>
              <div className="border-t pt-2 space-y-1">
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>Subtotal</span><span className="font-mono">${Number(receiptSale.subtotal).toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>Tax</span><span className="font-mono">${Number(receiptSale.tax).toFixed(2)}</span>
                </div>
                <div className="flex justify-between font-bold">
                  <span>Total</span><span className="font-mono">${Number(receiptSale.total).toFixed(2)}</span>
                </div>
              </div>
              <div className="text-center"><Badge variant="secondary" className="capitalize">{receiptSale.payment_method}</Badge></div>
              <Button variant="outline" className="w-full" onClick={() => setReceiptSale(null)}>Close</Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
