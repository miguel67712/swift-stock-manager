import { useState, useMemo } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useProducts } from "@/hooks/useProducts";
import { useSales } from "@/hooks/useSales";
import { useCart } from "@/hooks/useCart";
import { useI18n } from "@/lib/i18n";
import { formatXAF } from "@/lib/currency";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import {
  Search, ShoppingCart, Plus, Minus, X, Banknote, Smartphone, CreditCard,
  AlertTriangle, CheckCircle, Package, Receipt, User, LogOut, Globe
} from "lucide-react";

const CATEGORIES = ["Tout", "Boissons", "Produits Laitiers", "Céréales & Pâtes", "Huiles & Condiments", "Conserves", "Snacks & Biscuits", "Hygiène & Entretien", "Fruits & Légumes", "Viandes & Poissons", "Boulangerie"];

export default function ClientShop() {
  const { profile, user, signOut } = useAuth();
  const { products } = useProducts();
  const { sales, createSale } = useSales();
  const { cart, addToCart, removeFromCart, updateCartQty, clearCart, cartSubtotal, cartTax, cartTotal } = useCart();
  const { t, toggleLang, lang } = useI18n();

  const [search, setSearch] = useState("");
  const [activeCat, setActiveCat] = useState("Tout");
  const [paymentOpen, setPaymentOpen] = useState(false);
  const [receiptSale, setReceiptSale] = useState<any>(null);
  const [processing, setProcessing] = useState(false);
  const [activeTab, setActiveTab] = useState("shop");

  const filtered = useMemo(() => {
    let list = products;
    if (search) list = list.filter(p => p.name.toLowerCase().includes(search.toLowerCase()) || p.barcode?.toLowerCase().includes(search.toLowerCase()));
    if (activeCat !== "Tout") list = list.filter(p => p.category === activeCat);
    return list;
  }, [products, search, activeCat]);

  // Only show this client's orders
  const myOrders = useMemo(() => sales.filter(s => s.cashier_id === user?.id), [sales, user]);

  const handleCheckout = async (method: "cash" | "card" | "mobile") => {
    if (cart.length === 0) return;
    setProcessing(true);
    try {
      const result = await createSale.mutateAsync({
        transactionId: `TXN-${Date.now()}`,
        items: cart.map(i => ({ productId: i.productId, productName: i.productName, quantity: i.quantity, unitPrice: i.unitPrice, totalPrice: i.unitPrice * i.quantity })),
        subtotal: cartSubtotal, tax: cartTax, total: cartTotal,
        paymentMethod: method,
        cashierId: user?.id || "",
        cashierName: profile?.full_name || "Client",
      });
      setReceiptSale(result);
      clearCart();
      setPaymentOpen(false);
      toast.success(t("pos.transactionComplete"));
    } catch (err: any) { toast.error(err.message); }
    finally { setProcessing(false); }
  };

  const cartItemCount = cart.reduce((s, i) => s + i.quantity, 0);

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-background">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-card shrink-0">
        <div className="flex items-center gap-3">
          <Package className="h-6 w-6 text-primary" />
          <div>
            <h1 className="text-lg font-bold text-foreground">Swift-Mart</h1>
            <p className="text-xs text-muted-foreground">{profile?.full_name}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={toggleLang} className="text-xs gap-1">
            <Globe className="h-3.5 w-3.5" /> {lang === "fr" ? "EN" : "FR"}
          </Button>
          <Button variant="ghost" size="sm" className="md:hidden relative" onClick={() => setPaymentOpen(true)} disabled={cart.length === 0}>
            <ShoppingCart className="h-4 w-4" />
            {cartItemCount > 0 && <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-primary text-primary-foreground text-[10px] flex items-center justify-center font-bold">{cartItemCount}</span>}
          </Button>
          <Button variant="ghost" size="icon" onClick={() => { signOut(); }} className="text-muted-foreground">
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Main Tabs */}
      <div className="px-4 pt-3 shrink-0">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="shop" className="gap-1"><Package className="h-3.5 w-3.5" /> Boutique</TabsTrigger>
            <TabsTrigger value="orders" className="gap-1"><Receipt className="h-3.5 w-3.5" /> Mes Commandes</TabsTrigger>
            <TabsTrigger value="profile" className="gap-1"><User className="h-3.5 w-3.5" /> Profil</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {activeTab === "shop" && (
        <div className="flex flex-1 overflow-hidden">
          {/* Product Grid */}
          <div className="flex-1 flex flex-col overflow-hidden">
            <div className="p-3 border-b border-border bg-card shrink-0">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input placeholder={t("pos.searchPlaceholder")} value={search} onChange={e => setSearch(e.target.value)} className="pl-9 h-10" />
              </div>
            </div>
            <div className="flex gap-2 px-3 py-2 overflow-x-auto border-b border-border bg-card shrink-0">
              {CATEGORIES.map(cat => (
                <Button key={cat} variant={activeCat === cat ? "default" : "outline"} size="sm" className="shrink-0 text-xs h-8" onClick={() => setActiveCat(cat)}>
                  {cat}
                </Button>
              ))}
            </div>
            <div className="flex-1 overflow-y-auto p-3">
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2.5">
                {filtered.map(product => {
                  const inCart = cart.find(c => c.productId === product.id);
                  const isOutOfStock = product.quantity === 0;
                  const isLowStock = product.quantity > 0 && product.quantity <= product.min_threshold;
                  return (
                    <motion.button key={product.id} whileTap={{ scale: 0.97 }} disabled={isOutOfStock}
                      onClick={() => addToCart(product)}
                      className={`relative rounded-lg border p-3 text-left transition-all ${isOutOfStock ? "opacity-50 cursor-not-allowed border-border" : inCart ? "border-primary bg-primary/5 shadow-sm" : "border-border hover:border-primary/50 hover:shadow-sm bg-card"}`}>
                      {isLowStock && <AlertTriangle className="absolute top-2 right-2 h-3.5 w-3.5 text-warning" />}
                      {inCart && <span className="absolute top-1.5 right-1.5 h-5 w-5 rounded-full bg-primary text-primary-foreground text-[10px] flex items-center justify-center font-bold">{inCart.quantity}</span>}
                      <p className="text-sm font-semibold text-foreground truncate">{product.name}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{product.category}</p>
                      <p className="text-base font-bold font-mono-price text-primary mt-2">{formatXAF(Number(product.price))}</p>
                      <p className="text-[10px] text-muted-foreground mt-1">{isOutOfStock ? "RUPTURE" : `${product.quantity} dispo`}</p>
                    </motion.button>
                  );
                })}
                {filtered.length === 0 && <div className="col-span-full text-center py-12 text-muted-foreground">{t("pos.noProducts")}</div>}
              </div>
            </div>
          </div>

          {/* Desktop Cart */}
          <div className="hidden md:flex flex-col w-80 lg:w-96 border-l border-border bg-card">
            <div className="p-4 border-b border-border flex items-center justify-between">
              <h2 className="font-bold text-foreground flex items-center gap-2"><ShoppingCart className="h-4 w-4 text-primary" /> Mon Panier</h2>
              {cart.length > 0 && <Button variant="ghost" size="sm" className="text-xs text-destructive" onClick={clearCart}>Vider</Button>}
            </div>
            <div className="flex-1 overflow-y-auto p-3 space-y-2">
              <AnimatePresence>
                {cart.map(ci => (
                  <motion.div key={ci.productId} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                    className="flex items-center justify-between gap-2 p-2.5 rounded-lg border border-border bg-background">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{ci.productName}</p>
                      <p className="text-xs text-muted-foreground font-mono-price">{formatXAF(ci.unitPrice)}</p>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Button size="icon" variant="outline" className="h-7 w-7" onClick={() => updateCartQty(ci.productId, ci.quantity - 1)}><Minus className="h-3 w-3" /></Button>
                      <span className="text-sm font-bold w-6 text-center">{ci.quantity}</span>
                      <Button size="icon" variant="outline" className="h-7 w-7" onClick={() => updateCartQty(ci.productId, ci.quantity + 1)}><Plus className="h-3 w-3" /></Button>
                      <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => removeFromCart(ci.productId)}><X className="h-3 w-3" /></Button>
                    </div>
                    <p className="text-sm font-bold font-mono-price w-20 text-right">{formatXAF(ci.unitPrice * ci.quantity)}</p>
                  </motion.div>
                ))}
              </AnimatePresence>
              {cart.length === 0 && <div className="text-center py-12 text-muted-foreground text-sm">Panier vide</div>}
            </div>
            {cart.length > 0 && (
              <div className="p-4 border-t border-border space-y-3">
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between"><span className="text-muted-foreground">Sous-total</span><span className="font-mono-price">{formatXAF(cartSubtotal)}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">TVA (10%)</span><span className="font-mono-price">{formatXAF(cartTax)}</span></div>
                  <div className="flex justify-between text-lg font-bold pt-2 border-t border-border">
                    <span>Total</span><span className="font-mono-price text-primary">{formatXAF(cartTotal)}</span>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <Button onClick={() => handleCheckout("cash")} disabled={processing} className="h-12 flex-col gap-1 text-xs"><Banknote className="h-5 w-5" /> Espèces</Button>
                  <Button onClick={() => handleCheckout("mobile")} disabled={processing} variant="secondary" className="h-12 flex-col gap-1 text-xs"><Smartphone className="h-5 w-5" /> Mobile</Button>
                  <Button onClick={() => handleCheckout("card")} disabled={processing} variant="outline" className="h-12 flex-col gap-1 text-xs"><CreditCard className="h-5 w-5" /> Carte</Button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === "orders" && (
        <div className="flex-1 overflow-y-auto p-4">
          <Card>
            <CardHeader><CardTitle className="text-base flex items-center gap-2"><Receipt className="h-4 w-4 text-primary" /> Mes Commandes ({myOrders.length})</CardTitle></CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Transaction</TableHead>
                    <TableHead>Paiement</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                    <TableHead>Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {myOrders.map(s => (
                    <TableRow key={s.id}>
                      <TableCell className="font-mono text-xs">{s.transaction_id}</TableCell>
                      <TableCell><Badge variant="outline" className="text-[10px]">{s.payment_method}</Badge></TableCell>
                      <TableCell className="text-right font-mono-price">{formatXAF(Number(s.total))}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">{new Date(s.created_at).toLocaleString("fr-FR")}</TableCell>
                    </TableRow>
                  ))}
                  {myOrders.length === 0 && <TableRow><TableCell colSpan={4} className="text-center py-8 text-muted-foreground">Aucune commande</TableCell></TableRow>}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      )}

      {activeTab === "profile" && (
        <div className="flex-1 overflow-y-auto p-4">
          <Card>
            <CardHeader><CardTitle className="text-base flex items-center gap-2"><User className="h-4 w-4 text-primary" /> Mon Profil</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary text-primary-foreground text-2xl font-bold">
                  {profile?.full_name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="text-lg font-bold text-foreground">{profile?.full_name}</p>
                  <p className="text-sm text-muted-foreground">{user?.email}</p>
                  <Badge variant="outline" className="mt-1">Client</Badge>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-border">
                <div className="p-3 rounded-lg border border-border">
                  <p className="text-xs text-muted-foreground">Commandes</p>
                  <p className="text-xl font-bold font-mono-price">{myOrders.length}</p>
                </div>
                <div className="p-3 rounded-lg border border-border">
                  <p className="text-xs text-muted-foreground">Total Dépensé</p>
                  <p className="text-xl font-bold font-mono-price">{formatXAF(myOrders.reduce((s, o) => s + Number(o.total), 0))}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Mobile Cart Dialog */}
      <Dialog open={paymentOpen} onOpenChange={setPaymentOpen}>
        <DialogContent className="max-h-[85vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Mon Panier</DialogTitle></DialogHeader>
          <div className="space-y-2">
            {cart.map(ci => (
              <div key={ci.productId} className="flex items-center justify-between text-sm p-2 border border-border rounded-md">
                <div><p className="font-medium">{ci.productName}</p><p className="text-xs text-muted-foreground">{ci.quantity} × {formatXAF(ci.unitPrice)}</p></div>
                <p className="font-bold font-mono-price">{formatXAF(ci.unitPrice * ci.quantity)}</p>
              </div>
            ))}
          </div>
          {cart.length > 0 && (
            <>
              <div className="space-y-1 text-sm border-t border-border pt-3">
                <div className="flex justify-between"><span>Sous-total</span><span className="font-mono-price">{formatXAF(cartSubtotal)}</span></div>
                <div className="flex justify-between"><span>TVA (10%)</span><span className="font-mono-price">{formatXAF(cartTax)}</span></div>
                <div className="flex justify-between text-lg font-bold pt-2 border-t"><span>Total</span><span className="text-primary font-mono-price">{formatXAF(cartTotal)}</span></div>
              </div>
              <div className="grid grid-cols-3 gap-2 pt-2">
                <Button onClick={() => handleCheckout("cash")} disabled={processing} className="h-12 flex-col gap-1 text-xs"><Banknote className="h-5 w-5" /> Espèces</Button>
                <Button onClick={() => handleCheckout("mobile")} disabled={processing} variant="secondary" className="h-12 flex-col gap-1 text-xs"><Smartphone className="h-5 w-5" /> Mobile</Button>
                <Button onClick={() => handleCheckout("card")} disabled={processing} variant="outline" className="h-12 flex-col gap-1 text-xs"><CreditCard className="h-5 w-5" /> Carte</Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Receipt Dialog */}
      <Dialog open={!!receiptSale} onOpenChange={() => setReceiptSale(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><CheckCircle className="h-5 w-5 text-success" /> Commande Confirmée</DialogTitle>
          </DialogHeader>
          {receiptSale && (
            <div className="space-y-3">
              <div className="text-center p-4 bg-muted rounded-lg">
                <p className="text-2xl font-bold font-mono-price text-primary">{formatXAF(Number(receiptSale.total))}</p>
                <p className="text-xs text-muted-foreground mt-1">{receiptSale.transaction_id}</p>
              </div>
              <div className="space-y-1 text-sm">
                {receiptSale.sale_items?.map((si: any, i: number) => (
                  <div key={i} className="flex justify-between"><span>{si.quantity}× {si.product_name}</span><span className="font-mono-price">{formatXAF(si.total_price)}</span></div>
                ))}
              </div>
              <Button className="w-full" onClick={() => setReceiptSale(null)}>Fermer</Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
