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
  AlertTriangle, CheckCircle, Package, Receipt, User, LogOut, Globe,
  Eye, Heart, MapPin, RefreshCw
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
  const [receiptSale, setReceiptSale] = useState<any>(null);
  const [processing, setProcessing] = useState(false);
  const [activeTab, setActiveTab] = useState("shop");
  const [selectedProduct, setSelectedProduct] = useState<any>(null);

  const filtered = useMemo(() => {
    let list = products;
    if (search) list = list.filter(p => p.name.toLowerCase().includes(search.toLowerCase()) || p.barcode?.toLowerCase().includes(search.toLowerCase()));
    if (activeCat !== "Tout") list = list.filter(p => p.category === activeCat);
    return list;
  }, [products, search, activeCat]);

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
      setActiveTab("orders");
      toast.success(t("pos.transactionComplete"));
    } catch (err: any) { toast.error(err.message); }
    finally { setProcessing(false); }
  };

  const cartItemCount = cart.reduce((s, i) => s + i.quantity, 0);
  const totalSpent = myOrders.reduce((s, o) => s + Number(o.total), 0);

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
          <Button variant="ghost" size="icon" onClick={() => { signOut(); }} className="text-muted-foreground">
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* 6 Tabs */}
      <div className="px-4 pt-3 shrink-0">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="flex-wrap">
            <TabsTrigger value="shop" className="gap-1"><Package className="h-3.5 w-3.5" /> Boutique</TabsTrigger>
            <TabsTrigger value="cart" className="gap-1 relative">
              <ShoppingCart className="h-3.5 w-3.5" /> Panier
              {cartItemCount > 0 && <span className="ml-1 h-5 w-5 rounded-full bg-primary text-primary-foreground text-[10px] flex items-center justify-center font-bold">{cartItemCount}</span>}
            </TabsTrigger>
            <TabsTrigger value="checkout" className="gap-1"><CreditCard className="h-3.5 w-3.5" /> Paiement</TabsTrigger>
            <TabsTrigger value="orders" className="gap-1"><Receipt className="h-3.5 w-3.5" /> Commandes</TabsTrigger>
            <TabsTrigger value="profile" className="gap-1"><User className="h-3.5 w-3.5" /> Profil</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* 1. Shop */}
      {activeTab === "shop" && (
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
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2.5">
              {filtered.map(product => {
                const inCart = cart.find(c => c.productId === product.id);
                const isOutOfStock = product.quantity === 0;
                const isLowStock = product.quantity > 0 && product.quantity <= product.min_threshold;
                return (
                  <motion.div key={product.id} whileTap={{ scale: 0.97 }}
                    className={`relative rounded-lg border p-3 text-left transition-all ${isOutOfStock ? "opacity-50 border-border" : inCart ? "border-primary bg-primary/5 shadow-sm" : "border-border hover:border-primary/50 hover:shadow-sm bg-card"}`}>
                    {isLowStock && <AlertTriangle className="absolute top-2 right-2 h-3.5 w-3.5 text-warning" />}
                    {inCart && <span className="absolute top-1.5 right-1.5 h-5 w-5 rounded-full bg-primary text-primary-foreground text-[10px] flex items-center justify-center font-bold">{inCart.quantity}</span>}
                    <p className="text-sm font-semibold text-foreground truncate">{product.name}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{product.category}</p>
                    <p className="text-base font-bold font-mono-price text-primary mt-2">{formatXAF(Number(product.price))}</p>
                    <p className="text-[10px] text-muted-foreground mt-1">{isOutOfStock ? "RUPTURE" : `${product.quantity} dispo`}</p>
                    <div className="flex gap-1 mt-2">
                      <Button size="sm" variant="outline" className="flex-1 h-7 text-xs" onClick={() => setSelectedProduct(product)}>
                        <Eye className="h-3 w-3 mr-1" /> Détails
                      </Button>
                      <Button size="sm" className="flex-1 h-7 text-xs" disabled={isOutOfStock} onClick={() => addToCart(product)}>
                        <Plus className="h-3 w-3 mr-1" /> Ajouter
                      </Button>
                    </div>
                  </motion.div>
                );
              })}
              {filtered.length === 0 && <div className="col-span-full text-center py-12 text-muted-foreground">{t("pos.noProducts")}</div>}
            </div>
          </div>
        </div>
      )}

      {/* 2. Cart */}
      {activeTab === "cart" && (
        <div className="flex-1 overflow-y-auto p-4">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2"><ShoppingCart className="h-4 w-4 text-primary" /> Mon Panier ({cartItemCount} articles)</CardTitle>
                {cart.length > 0 && <Button variant="ghost" size="sm" className="text-xs text-destructive" onClick={clearCart}>Vider le panier</Button>}
              </div>
            </CardHeader>
            <CardContent>
              {cart.length === 0 ? (
                <div className="text-center py-12">
                  <ShoppingCart className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                  <p className="text-muted-foreground">Votre panier est vide</p>
                  <Button variant="outline" className="mt-4" onClick={() => setActiveTab("shop")}>Continuer les achats</Button>
                </div>
              ) : (
                <div className="space-y-3">
                  <AnimatePresence>
                    {cart.map(ci => (
                      <motion.div key={ci.productId} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, x: -20 }}
                        className="flex items-center justify-between gap-3 p-3 rounded-lg border border-border bg-background">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-foreground truncate">{ci.productName}</p>
                          <p className="text-xs text-muted-foreground font-mono-price">{formatXAF(ci.unitPrice)} / unité</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button size="icon" variant="outline" className="h-8 w-8" onClick={() => updateCartQty(ci.productId, ci.quantity - 1)}><Minus className="h-3 w-3" /></Button>
                          <span className="text-sm font-bold w-8 text-center">{ci.quantity}</span>
                          <Button size="icon" variant="outline" className="h-8 w-8" onClick={() => updateCartQty(ci.productId, ci.quantity + 1)}><Plus className="h-3 w-3" /></Button>
                          <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive" onClick={() => removeFromCart(ci.productId)}><X className="h-3 w-3" /></Button>
                        </div>
                        <p className="text-sm font-bold font-mono-price w-24 text-right">{formatXAF(ci.unitPrice * ci.quantity)}</p>
                      </motion.div>
                    ))}
                  </AnimatePresence>

                  <div className="border-t border-border pt-4 space-y-2">
                    <div className="flex justify-between text-sm"><span className="text-muted-foreground">Sous-total</span><span className="font-mono-price">{formatXAF(cartSubtotal)}</span></div>
                    <div className="flex justify-between text-sm"><span className="text-muted-foreground">TVA (10%)</span><span className="font-mono-price">{formatXAF(cartTax)}</span></div>
                    <div className="flex justify-between text-lg font-bold pt-2 border-t border-border">
                      <span>Total</span><span className="font-mono-price text-primary">{formatXAF(cartTotal)}</span>
                    </div>
                  </div>
                  <Button className="w-full h-12 text-base" onClick={() => setActiveTab("checkout")}>Procéder au Paiement</Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* 3. Checkout */}
      {activeTab === "checkout" && (
        <div className="flex-1 overflow-y-auto p-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2"><CreditCard className="h-4 w-4 text-primary" /> Paiement</CardTitle>
            </CardHeader>
            <CardContent>
              {cart.length === 0 ? (
                <div className="text-center py-12">
                  <CreditCard className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                  <p className="text-muted-foreground">Aucun article à payer</p>
                  <Button variant="outline" className="mt-4" onClick={() => setActiveTab("shop")}>Retour à la boutique</Button>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Order summary */}
                  <div>
                    <h3 className="text-sm font-semibold mb-3">Résumé de la commande</h3>
                    <div className="space-y-2">
                      {cart.map(ci => (
                        <div key={ci.productId} className="flex justify-between text-sm py-1.5 border-b border-border last:border-0">
                          <span>{ci.quantity}× {ci.productName}</span>
                          <span className="font-mono-price">{formatXAF(ci.unitPrice * ci.quantity)}</span>
                        </div>
                      ))}
                    </div>
                    <div className="space-y-1 mt-4 pt-3 border-t border-border">
                      <div className="flex justify-between text-sm"><span className="text-muted-foreground">Sous-total</span><span className="font-mono-price">{formatXAF(cartSubtotal)}</span></div>
                      <div className="flex justify-between text-sm"><span className="text-muted-foreground">TVA (10%)</span><span className="font-mono-price">{formatXAF(cartTax)}</span></div>
                      <div className="flex justify-between text-xl font-bold pt-2 border-t border-border">
                        <span>Total</span><span className="font-mono-price text-primary">{formatXAF(cartTotal)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Payment methods */}
                  <div>
                    <h3 className="text-sm font-semibold mb-3">Mode de paiement</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <Button onClick={() => handleCheckout("cash")} disabled={processing} variant="outline" className="h-20 flex-col gap-2 text-sm hover:border-primary hover:bg-primary/5">
                        <Banknote className="h-8 w-8 text-primary" /> Espèces (Cash)
                      </Button>
                      <Button onClick={() => handleCheckout("mobile")} disabled={processing} variant="outline" className="h-20 flex-col gap-2 text-sm hover:border-primary hover:bg-primary/5">
                        <Smartphone className="h-8 w-8 text-chart-2" /> Mobile Money
                      </Button>
                      <Button onClick={() => handleCheckout("card")} disabled={processing} variant="outline" className="h-20 flex-col gap-2 text-sm hover:border-primary hover:bg-primary/5">
                        <CreditCard className="h-8 w-8 text-chart-3" /> Carte Bancaire
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* 4. Orders */}
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
                    <TableHead>Statut</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {myOrders.map(s => (
                    <TableRow key={s.id}>
                      <TableCell className="font-mono text-xs">{s.transaction_id}</TableCell>
                      <TableCell><Badge variant="outline" className="text-[10px]">{s.payment_method}</Badge></TableCell>
                      <TableCell className="text-right font-mono-price">{formatXAF(Number(s.total))}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">{new Date(s.created_at).toLocaleString("fr-FR")}</TableCell>
                      <TableCell><Badge variant="outline" className="text-success border-success/30 text-[10px]">Complétée</Badge></TableCell>
                    </TableRow>
                  ))}
                  {myOrders.length === 0 && <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">Aucune commande</TableCell></TableRow>}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      )}

      {/* 5. Profile */}
      {activeTab === "profile" && (
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
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
            </CardContent>
          </Card>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Card>
              <CardContent className="p-4 text-center">
                <Receipt className="h-5 w-5 text-primary mx-auto mb-1" />
                <p className="text-xs text-muted-foreground">Commandes</p>
                <p className="text-xl font-bold font-mono-price">{myOrders.length}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <Banknote className="h-5 w-5 text-primary mx-auto mb-1" />
                <p className="text-xs text-muted-foreground">Total Dépensé</p>
                <p className="text-xl font-bold font-mono-price">{formatXAF(totalSpent)}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <Heart className="h-5 w-5 text-destructive mx-auto mb-1" />
                <p className="text-xs text-muted-foreground">Points Fidélité</p>
                <p className="text-xl font-bold">{Math.floor(totalSpent / 1000)}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <ShoppingCart className="h-5 w-5 text-chart-2 mx-auto mb-1" />
                <p className="text-xs text-muted-foreground">Panier Moyen</p>
                <p className="text-xl font-bold font-mono-price">{formatXAF(myOrders.length ? totalSpent / myOrders.length : 0)}</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-base">Informations du Compte</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between text-sm"><span className="text-muted-foreground">Nom</span><span className="font-medium">{profile?.full_name}</span></div>
              <div className="flex justify-between text-sm"><span className="text-muted-foreground">Email</span><span className="font-medium">{user?.email}</span></div>
              <div className="flex justify-between text-sm"><span className="text-muted-foreground">Rôle</span><Badge variant="outline">Client</Badge></div>
              <div className="flex justify-between text-sm"><span className="text-muted-foreground">Membre depuis</span><span className="text-xs">{user?.created_at ? new Date(user.created_at).toLocaleDateString("fr-FR") : "-"}</span></div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Product Details Dialog */}
      <Dialog open={!!selectedProduct} onOpenChange={() => setSelectedProduct(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><Package className="h-5 w-5 text-primary" /> Détails du Produit</DialogTitle>
          </DialogHeader>
          {selectedProduct && (
            <div className="space-y-4">
              <div className="p-6 bg-muted rounded-lg text-center">
                <Package className="h-16 w-16 text-primary mx-auto mb-3" />
                <h2 className="text-xl font-bold text-foreground">{selectedProduct.name}</h2>
                <p className="text-sm text-muted-foreground">{selectedProduct.category}</p>
              </div>
              <div className="text-center">
                <p className="text-3xl font-bold font-mono-price text-primary">{formatXAF(Number(selectedProduct.price))}</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-lg border border-border text-center">
                  <p className="text-xs text-muted-foreground">Disponibilité</p>
                  <p className="font-bold">{selectedProduct.quantity > 0 ? `${selectedProduct.quantity} en stock` : "Rupture"}</p>
                </div>
                <div className="p-3 rounded-lg border border-border text-center">
                  <p className="text-xs text-muted-foreground">Fournisseur</p>
                  <p className="font-bold text-sm">{selectedProduct.supplier || "—"}</p>
                </div>
              </div>
              {selectedProduct.barcode && (
                <div className="text-center text-xs text-muted-foreground">Code-barres: {selectedProduct.barcode}</div>
              )}
              <Button className="w-full h-12" disabled={selectedProduct.quantity === 0} onClick={() => { addToCart(selectedProduct); setSelectedProduct(null); toast.success("Ajouté au panier"); }}>
                <Plus className="h-4 w-4 mr-2" /> Ajouter au Panier
              </Button>
            </div>
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
