import { useState, useMemo } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useProducts } from "@/hooks/useProducts";
import { useSales } from "@/hooks/useSales";
import { useCart } from "@/hooks/useCart";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { motion, AnimatePresence, type Variants } from "framer-motion";
import { toast } from "sonner";

const CATEGORIES = [
  "Dairy", "Bakery", "Meat", "Seafood", "Produce", "Grains",
  "Beverages", "Canned", "Cooking", "Household", "Snacks", "Frozen",
];

const productCardVariants: Variants = {
  hidden: { opacity: 0, scale: 0.8 },
  visible: (i: number) => ({
    opacity: 1,
    scale: 1,
    transition: { delay: i * 0.03, type: "spring" as const, stiffness: 300, damping: 24 },
  }),
};

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
      <motion.div
        className="p-4 border-b border-border"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-foreground flex items-center gap-2">
            <ShoppingCart className="h-4 w-4" />
            Current Sale
          </h2>
          {cart.length > 0 && (
            <motion.button
              onClick={clearCart}
              className="text-xs text-destructive hover:underline font-medium"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Clear all
            </motion.button>
          )}
        </div>
      </motion.div>

      <div className="flex-1 overflow-auto p-4 space-y-2">
        <AnimatePresence mode="popLayout">
          {cart.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex flex-col items-center justify-center py-16 text-muted-foreground"
            >
              <motion.div
                animate={{ y: [0, -8, 0] }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
              >
                <ShoppingCart className="h-10 w-10 mb-3 opacity-20" />
              </motion.div>
              <p className="text-sm">No items in cart</p>
              <p className="text-xs mt-1">Click a product to add it</p>
            </motion.div>
          ) : (
            cart.map((item) => (
              <motion.div
                key={item.productId}
                layout
                initial={{ opacity: 0, x: 30, scale: 0.9 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                exit={{ opacity: 0, x: -30, scale: 0.9 }}
                transition={{ type: "spring", stiffness: 300, damping: 25 }}
                className="flex items-center gap-3 rounded-lg border bg-background p-3"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{item.productName}</p>
                  <p className="text-xs text-muted-foreground font-mono">${item.unitPrice.toFixed(2)} each</p>
                </div>
                <div className="flex items-center gap-1.5">
                  <motion.button
                    onClick={() => updateCartQty(item.productId, item.quantity - 1)}
                    className="flex h-7 w-7 items-center justify-center rounded-md border bg-background hover:bg-muted transition-colors"
                    whileTap={{ scale: 0.85 }}
                  >
                    <Minus className="h-3 w-3" />
                  </motion.button>
                  <motion.span
                    key={item.quantity}
                    className="w-8 text-center text-sm font-bold font-mono"
                    initial={{ scale: 1.3, color: "hsl(221, 83%, 53%)" }}
                    animate={{ scale: 1, color: "inherit" }}
                    transition={{ duration: 0.2 }}
                  >
                    {item.quantity}
                  </motion.span>
                  <motion.button
                    onClick={() => updateCartQty(item.productId, item.quantity + 1)}
                    className="flex h-7 w-7 items-center justify-center rounded-md border bg-background hover:bg-muted transition-colors"
                    whileTap={{ scale: 0.85 }}
                  >
                    <Plus className="h-3 w-3" />
                  </motion.button>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold font-mono w-16 text-right">${(item.unitPrice * item.quantity).toFixed(2)}</span>
                  <motion.button
                    onClick={() => removeFromCart(item.productId)}
                    className="rounded-md p-1 text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                    whileHover={{ rotate: -10 }}
                    whileTap={{ scale: 0.8 }}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </motion.button>
                </div>
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>

      <motion.div
        className="border-t border-border p-4 bg-card"
        layout
      >
        <div className="space-y-2 mb-4">
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>Subtotal</span>
            <span className="font-mono">${cartSubtotal.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>Tax (10%)</span>
            <span className="font-mono">${cartTax.toFixed(2)}</span>
          </div>
          <motion.div
            className="flex justify-between text-lg font-bold border-t pt-2"
            key={cartTotal}
            initial={{ scale: 1.05 }}
            animate={{ scale: 1 }}
          >
            <span>Total</span>
            <span className="font-mono">${cartTotal.toFixed(2)}</span>
          </motion.div>
        </div>
        <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
          <Button className="w-full h-12 text-base font-bold" disabled={cart.length === 0 || createSale.isPending} onClick={() => setCheckoutOpen(true)}>
            {createSale.isPending ? "Processing..." : "Checkout"}
          </Button>
        </motion.div>
      </motion.div>
    </div>
  );

  return (
    <div className="flex h-[calc(100vh-56px)] md:h-screen overflow-hidden">
      {/* Product Selection */}
      <div className="flex-1 flex flex-col min-w-0 border-r border-border">
        <motion.div
          className="p-3 sm:p-4 border-b border-border bg-card"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search products or scan barcode..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10 h-10 sm:h-11 bg-background" />
          </div>
          <motion.div
            className="flex gap-2 mt-3 overflow-x-auto pb-1 scrollbar-hide"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            <motion.button
              onClick={() => setSelectedCategory(null)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${!selectedCategory ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground hover:bg-secondary/80"}`}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              All
            </motion.button>
            {activeCategories.map((cat) => (
              <motion.button
                key={cat}
                onClick={() => setSelectedCategory(selectedCategory === cat ? null : cat)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${selectedCategory === cat ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground hover:bg-secondary/80"}`}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                layout
              >
                {cat}
              </motion.button>
            ))}
          </motion.div>
        </motion.div>

        <div className="flex-1 overflow-auto p-3 sm:p-4">
          <motion.div
            className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-2 sm:gap-3"
            layout
          >
            <AnimatePresence mode="popLayout">
              {filteredProducts.map((product, i) => {
                const inCart = cart.find((c) => c.productId === product.id);
                const isOutOfStock = product.quantity === 0;
                const isLowStock = product.quantity > 0 && product.quantity <= product.min_threshold;

                return (
                  <motion.button
                    key={product.id}
                    custom={i}
                    variants={productCardVariants}
                    initial="hidden"
                    animate="visible"
                    exit={{ opacity: 0, scale: 0.8 }}
                    layout
                    whileHover={!isOutOfStock ? { y: -4, boxShadow: "0 8px 25px -5px rgba(0,0,0,0.1)" } : {}}
                    whileTap={!isOutOfStock ? { scale: 0.95 } : {}}
                    onClick={() => { if (!isOutOfStock) addToCart(product); }}
                    disabled={isOutOfStock}
                    className={`relative rounded-xl border p-3 sm:p-4 text-left transition-all ${isOutOfStock ? "opacity-50 cursor-not-allowed bg-muted" : inCart ? "border-primary bg-primary/5" : "bg-card hover:border-primary/30"}`}
                  >
                    {inCart && (
                      <motion.div
                        className="absolute -top-2 -right-2 flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-bold shadow-sm"
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: "spring", stiffness: 500, damping: 15 }}
                        key={inCart.quantity}
                      >
                        {inCart.quantity}
                      </motion.div>
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
            </AnimatePresence>
          </motion.div>
          {filteredProducts.length === 0 && (
            <motion.div
              className="flex flex-col items-center justify-center py-20 text-muted-foreground"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
            >
              <Search className="h-10 w-10 mb-3 opacity-30" />
              <p className="text-sm">No products found</p>
            </motion.div>
          )}
        </div>

        {/* Mobile cart FAB */}
        <div className="md:hidden fixed bottom-4 right-4 z-50">
          <Sheet open={mobileCartOpen} onOpenChange={setMobileCartOpen}>
            <SheetTrigger asChild>
              <motion.button
                className="relative flex h-14 w-14 items-center justify-center rounded-full gradient-brand text-primary-foreground shadow-lg"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                animate={cart.length > 0 ? { boxShadow: ["0 0 0 0 hsl(221 83% 53% / 0.4)", "0 0 0 12px hsl(221 83% 53% / 0)", "0 0 0 0 hsl(221 83% 53% / 0)"] } : {}}
                transition={cart.length > 0 ? { duration: 2, repeat: Infinity } : {}}
              >
                <ShoppingCart className="h-6 w-6" />
                {cart.length > 0 && (
                  <motion.span
                    className="absolute -top-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-destructive text-destructive-foreground text-xs font-bold"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 500, damping: 15 }}
                  >
                    {cart.reduce((s, c) => s + c.quantity, 0)}
                  </motion.span>
                )}
              </motion.button>
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
            ].map(({ method, icon: Icon, label }, i) => (
              <motion.button
                key={method}
                onClick={() => handleCheckout(method)}
                disabled={createSale.isPending}
                className="flex flex-col items-center gap-2 rounded-xl border-2 border-border p-4 sm:p-5 hover:border-primary hover:bg-primary/5 transition-all disabled:opacity-50"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1, type: "spring", stiffness: 300, damping: 24 }}
                whileHover={{ y: -4, borderColor: "hsl(221, 83%, 53%)" }}
                whileTap={{ scale: 0.95 }}
              >
                <Icon className="h-6 w-6 sm:h-8 sm:w-8 text-primary" />
                <span className="text-xs sm:text-sm font-semibold">{label}</span>
              </motion.button>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      {/* Receipt Dialog */}
      <Dialog open={!!receiptSale} onOpenChange={() => setReceiptSale(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-success">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 300, damping: 15, delay: 0.2 }}
              >
                <CheckCircle2 className="h-5 w-5" />
              </motion.div>
              Sale Complete
            </DialogTitle>
            <DialogDescription>Transaction recorded successfully</DialogDescription>
          </DialogHeader>
          {receiptSale && (
            <motion.div
              className="space-y-4 py-2"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <div className="text-center border-b pb-3">
                <p className="font-mono text-xs text-muted-foreground">{receiptSale.transaction_id}</p>
                <p className="text-xs text-muted-foreground mt-1">{new Date(receiptSale.created_at).toLocaleString()}</p>
              </div>
              <div className="space-y-2">
                {receiptSale.sale_items?.map((item: any, i: number) => (
                  <motion.div
                    key={i}
                    className="flex justify-between text-sm"
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.4 + i * 0.05 }}
                  >
                    <span>{item.quantity}x {item.product_name}</span>
                    <span className="font-mono">${Number(item.total_price).toFixed(2)}</span>
                  </motion.div>
                ))}
              </div>
              <div className="border-t pt-2 space-y-1">
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>Subtotal</span><span className="font-mono">${Number(receiptSale.subtotal).toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>Tax</span><span className="font-mono">${Number(receiptSale.tax).toFixed(2)}</span>
                </div>
                <motion.div
                  className="flex justify-between font-bold"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.6 }}
                >
                  <span>Total</span><span className="font-mono">${Number(receiptSale.total).toFixed(2)}</span>
                </motion.div>
              </div>
              <div className="text-center"><Badge variant="secondary" className="capitalize">{receiptSale.payment_method}</Badge></div>
              <Button variant="outline" className="w-full" onClick={() => setReceiptSale(null)}>Close</Button>
            </motion.div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
