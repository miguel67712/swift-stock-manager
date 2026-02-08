import { useState, useMemo } from "react";
import { useStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
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
  X,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { CATEGORIES } from "@/lib/mock-data";
import { toast } from "sonner";

export default function POS() {
  const {
    products, cart, addToCart, removeFromCart, updateCartQty, clearCart, checkout,
    cartSubtotal, cartTax, cartTotal,
  } = useStore();
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [receiptSale, setReceiptSale] = useState<ReturnType<typeof checkout>>(null);

  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchesSearch =
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.barcode.includes(search);
      const matchesCategory = !selectedCategory || p.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [products, search, selectedCategory]);

  const activeCategories = useMemo(() => {
    const cats = new Set(products.map((p) => p.category));
    return CATEGORIES.filter((c) => cats.has(c));
  }, [products]);

  const handleCheckout = (method: "cash" | "card" | "mobile") => {
    const sale = checkout(method);
    if (sale) {
      setCheckoutOpen(false);
      setReceiptSale(sale);
      toast.success(`Transaction ${sale.transactionId} completed!`);
    }
  };

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Left: Product Selection */}
      <div className="flex-1 flex flex-col min-w-0 border-r border-border">
        {/* Search */}
        <div className="p-4 border-b border-border bg-card">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search products or scan barcode..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 h-11 bg-background"
            />
          </div>
          {/* Categories */}
          <div className="flex gap-2 mt-3 overflow-x-auto pb-1 scrollbar-hide">
            <button
              onClick={() => setSelectedCategory(null)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
                !selectedCategory
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
              }`}
            >
              All
            </button>
            {activeCategories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(selectedCategory === cat ? null : cat)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
                  selectedCategory === cat
                    ? "bg-primary text-primary-foreground"
                    : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Product Grid */}
        <div className="flex-1 overflow-auto p-4">
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3">
            {filteredProducts.map((product) => {
              const inCart = cart.find((c) => c.productId === product.id);
              const isOutOfStock = product.quantity === 0;
              const isLowStock = product.quantity > 0 && product.quantity <= product.minThreshold;

              return (
                <motion.button
                  key={product.id}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => {
                    if (!isOutOfStock) addToCart(product);
                  }}
                  disabled={isOutOfStock}
                  className={`relative rounded-xl border p-4 text-left transition-all shadow-card hover:shadow-card-hover ${
                    isOutOfStock
                      ? "opacity-50 cursor-not-allowed bg-muted"
                      : inCart
                      ? "border-primary bg-primary/5"
                      : "bg-card hover:border-primary/30"
                  }`}
                >
                  {inCart && (
                    <div className="absolute -top-2 -right-2 flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-bold shadow-sm">
                      {inCart.quantity}
                    </div>
                  )}
                  <p className="text-sm font-semibold text-foreground truncate">{product.name}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{product.category}</p>
                  <div className="flex items-end justify-between mt-3">
                    <span className="text-lg font-bold font-mono text-foreground">
                      ${product.price.toFixed(2)}
                    </span>
                    <span
                      className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${
                        isOutOfStock
                          ? "stock-critical"
                          : isLowStock
                          ? "stock-warning"
                          : "stock-good"
                      }`}
                    >
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
      </div>

      {/* Right: Cart */}
      <div className="w-80 lg:w-96 flex flex-col bg-card">
        <div className="p-4 border-b border-border">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-foreground flex items-center gap-2">
              <ShoppingCart className="h-4 w-4" />
              Current Sale
            </h2>
            {cart.length > 0 && (
              <button
                onClick={clearCart}
                className="text-xs text-destructive hover:underline font-medium"
              >
                Clear all
              </button>
            )}
          </div>
        </div>

        {/* Cart Items */}
        <div className="flex-1 overflow-auto p-4 space-y-2">
          <AnimatePresence mode="popLayout">
            {cart.length === 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex flex-col items-center justify-center py-16 text-muted-foreground"
              >
                <ShoppingCart className="h-10 w-10 mb-3 opacity-20" />
                <p className="text-sm">No items in cart</p>
                <p className="text-xs mt-1">Click a product to add it</p>
              </motion.div>
            ) : (
              cart.map((item) => (
                <motion.div
                  key={item.productId}
                  layout
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="flex items-center gap-3 rounded-lg border bg-background p-3"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{item.productName}</p>
                    <p className="text-xs text-muted-foreground font-mono">
                      ${item.unitPrice.toFixed(2)} each
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => updateCartQty(item.productId, item.quantity - 1)}
                      className="flex h-7 w-7 items-center justify-center rounded-md border bg-background hover:bg-muted transition-colors"
                    >
                      <Minus className="h-3 w-3" />
                    </button>
                    <span className="w-8 text-center text-sm font-bold font-mono">
                      {item.quantity}
                    </span>
                    <button
                      onClick={() => updateCartQty(item.productId, item.quantity + 1)}
                      className="flex h-7 w-7 items-center justify-center rounded-md border bg-background hover:bg-muted transition-colors"
                    >
                      <Plus className="h-3 w-3" />
                    </button>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold font-mono w-16 text-right">
                      ${(item.unitPrice * item.quantity).toFixed(2)}
                    </span>
                    <button
                      onClick={() => removeFromCart(item.productId)}
                      className="rounded-md p-1 text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </motion.div>
              ))
            )}
          </AnimatePresence>
        </div>

        {/* Cart totals & checkout */}
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
          <Button
            className="w-full h-12 text-base font-bold"
            disabled={cart.length === 0}
            onClick={() => setCheckoutOpen(true)}
          >
            Checkout
          </Button>
        </div>
      </div>

      {/* Checkout Dialog */}
      <Dialog open={checkoutOpen} onOpenChange={setCheckoutOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Select Payment Method</DialogTitle>
            <DialogDescription>
              Total: <span className="font-mono font-bold text-foreground">${cartTotal.toFixed(2)}</span>
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-3 gap-3 py-4">
            {[
              { method: "cash" as const, icon: Banknote, label: "Cash" },
              { method: "card" as const, icon: CreditCard, label: "Card" },
              { method: "mobile" as const, icon: Smartphone, label: "Mobile" },
            ].map(({ method, icon: Icon, label }) => (
              <button
                key={method}
                onClick={() => handleCheckout(method)}
                className="flex flex-col items-center gap-2 rounded-xl border-2 border-border p-5 hover:border-primary hover:bg-primary/5 transition-all"
              >
                <Icon className="h-8 w-8 text-primary" />
                <span className="text-sm font-semibold">{label}</span>
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
                <p className="font-mono text-xs text-muted-foreground">{receiptSale.transactionId}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {new Date(receiptSale.date).toLocaleString()}
                </p>
              </div>
              <div className="space-y-2">
                {receiptSale.items.map((item, i) => (
                  <div key={i} className="flex justify-between text-sm">
                    <span>
                      {item.quantity}x {item.productName}
                    </span>
                    <span className="font-mono">${item.totalPrice.toFixed(2)}</span>
                  </div>
                ))}
              </div>
              <div className="border-t pt-2 space-y-1">
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>Subtotal</span>
                  <span className="font-mono">${receiptSale.subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>Tax</span>
                  <span className="font-mono">${receiptSale.tax.toFixed(2)}</span>
                </div>
                <div className="flex justify-between font-bold">
                  <span>Total</span>
                  <span className="font-mono">${receiptSale.total.toFixed(2)}</span>
                </div>
              </div>
              <div className="text-center">
                <Badge variant="secondary" className="capitalize">
                  {receiptSale.paymentMethod}
                </Badge>
              </div>
              <Button
                variant="outline"
                className="w-full"
                onClick={() => setReceiptSale(null)}
              >
                Close
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
