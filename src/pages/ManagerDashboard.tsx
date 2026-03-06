import { useState, useMemo } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useProducts, type Product } from "@/hooks/useProducts";
import { useSales } from "@/hooks/useSales";
import { useAlerts } from "@/hooks/useAlerts";
import { useUsers } from "@/hooks/useUsers";
import { useI18n } from "@/lib/i18n";
import { formatXAF } from "@/lib/currency";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import {
  AlertTriangle, Package, Plus, TrendingUp, BarChart3, Search, Edit, Trash2,
  DollarSign, ShoppingCart, CheckCircle, Users, UserPlus, KeyRound
} from "lucide-react";

const CATEGORIES = ["Boissons", "Produits Laitiers", "Céréales & Pâtes", "Huiles & Condiments", "Conserves", "Snacks & Biscuits", "Hygiène & Entretien", "Fruits & Légumes", "Viandes & Poissons", "Boulangerie"];
const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.06 } } };
const item = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } };

interface ProductFormData {
  name: string; category: string; price: string; quantity: string;
  minThreshold: string; barcode: string; supplier: string;
}
const emptyForm: ProductFormData = { name: "", category: "", price: "", quantity: "0", minThreshold: "5", barcode: "", supplier: "" };

export default function ManagerDashboard() {
  const { profile } = useAuth();
  const { products, addProduct, updateProduct, deleteProduct } = useProducts();
  const { sales, todaysSalesTotal, todaysSalesCount } = useSales();
  const { alerts, resolveAlert } = useAlerts();
  const { users: clients, createUser, deleteUser: deleteClient, resetPassword } = useUsers("client");
  const { t } = useI18n();

  const [search, setSearch] = useState("");
  const [catFilter, setCatFilter] = useState("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [form, setForm] = useState<ProductFormData>(emptyForm);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  // Client management state
  const [clientDialogOpen, setClientDialogOpen] = useState(false);
  const [clientForm, setClientForm] = useState({ email: "", password: "", fullName: "" });
  const [clientFormLoading, setClientFormLoading] = useState(false);
  const [deleteClientId, setDeleteClientId] = useState<string | null>(null);
  const [resetPwOpen, setResetPwOpen] = useState<string | null>(null);
  const [newPw, setNewPw] = useState("");

  const unresolvedAlerts = alerts.filter(a => !a.resolved);
  const lowStockProducts = products.filter(p => p.quantity <= p.min_threshold);
  const totalStock = products.reduce((s, p) => s + p.quantity, 0);

  const filteredProducts = useMemo(() => {
    let list = products;
    if (search) list = list.filter(p => p.name.toLowerCase().includes(search.toLowerCase()));
    if (catFilter !== "all") list = list.filter(p => p.category === catFilter);
    return list;
  }, [products, search, catFilter]);

  const chartData = useMemo(() => {
    const days: { date: string; sales: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(); d.setDate(d.getDate() - i);
      const ds = d.toDateString();
      const total = sales.filter(s => new Date(s.created_at).toDateString() === ds).reduce((sum, s) => sum + Number(s.total), 0);
      days.push({ date: d.toLocaleDateString("fr-FR", { weekday: "short" }), sales: total });
    }
    return days;
  }, [sales]);

  const openAddDialog = () => { setEditingProduct(null); setForm(emptyForm); setDialogOpen(true); };
  const openEditDialog = (p: Product) => {
    setEditingProduct(p);
    setForm({ name: p.name, category: p.category, price: String(p.price), quantity: String(p.quantity), minThreshold: String(p.min_threshold), barcode: p.barcode || "", supplier: p.supplier || "" });
    setDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.category || !form.price) { toast.error(t("prod.fillRequired")); return; }
    const payload = { name: form.name, category: form.category, price: parseFloat(form.price), quantity: parseInt(form.quantity) || 0, min_threshold: parseInt(form.minThreshold) || 5, barcode: form.barcode || null, supplier: form.supplier || null };
    try {
      if (editingProduct) {
        await updateProduct.mutateAsync({ id: editingProduct.id, updates: payload });
        toast.success(`${form.name} ${t("prod.updated")}`);
      } else {
        await addProduct.mutateAsync(payload);
        toast.success(`${form.name} ${t("prod.added")}`);
      }
      setDialogOpen(false);
    } catch (err: any) { toast.error(err.message); }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try { await deleteProduct.mutateAsync(deleteId); toast.success(t("prod.deleted")); } catch (err: any) { toast.error(err.message); }
    setDeleteId(null);
  };

  const handleCreateClient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientForm.email || !clientForm.password || !clientForm.fullName) { toast.error("Remplissez tous les champs"); return; }
    setClientFormLoading(true);
    try {
      await createUser.mutateAsync({ email: clientForm.email, password: clientForm.password, fullName: clientForm.fullName, role: "client" });
      toast.success(`Client ${clientForm.fullName} créé`);
      setClientDialogOpen(false);
      setClientForm({ email: "", password: "", fullName: "" });
    } catch (err: any) { toast.error(err.message); }
    setClientFormLoading(false);
  };

  const handleDeleteClient = async () => {
    if (!deleteClientId) return;
    try { await deleteClient.mutateAsync(deleteClientId); toast.success("Client supprimé"); } catch (err: any) { toast.error(err.message); }
    setDeleteClientId(null);
  };

  const handleResetPw = async () => {
    if (!resetPwOpen || !newPw) return;
    try {
      await resetPassword.mutateAsync({ userId: resetPwOpen, newPassword: newPw });
      toast.success("Mot de passe réinitialisé");
    } catch (err: any) { toast.error(err.message); }
    setResetPwOpen(null); setNewPw("");
  };

  const getStockBadge = (p: Product) => {
    if (p.quantity === 0) return <Badge variant="destructive">{t("prod.outOfStock")}</Badge>;
    if (p.quantity <= p.min_threshold) return <Badge className="bg-warning text-warning-foreground">{t("prod.lowStock")}</Badge>;
    return <Badge variant="outline" className="text-success border-success/30">{t("prod.inStock")}</Badge>;
  };

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6 p-4 md:p-6">
      {/* Header */}
      <motion.div variants={item} className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-foreground flex items-center gap-2">
            <BarChart3 className="h-7 w-7 text-primary" /> Swift-Mart Manager
          </h1>
          <p className="text-muted-foreground text-sm mt-1">{t("dash.greeting")}, {profile?.full_name}</p>
        </div>
        <Button onClick={openAddDialog} className="gap-2"><Plus className="h-4 w-4" /> {t("prod.addProduct")}</Button>
      </motion.div>

      {/* Low Stock Banner */}
      {lowStockProducts.length > 0 && (
        <motion.div variants={item}>
          <Card className="border-destructive/40 bg-destructive/5">
            <CardHeader className="pb-2">
              <CardTitle className="text-base text-destructive flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" /> ⚠️ {t("alert.lowStock")} ({lowStockProducts.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {lowStockProducts.slice(0, 5).map(p => (
                <div key={p.id} className="flex items-center justify-between py-1.5 px-3 rounded-md bg-destructive/10">
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-medium text-foreground">{p.name}</span>
                    <Badge variant="destructive" className="text-[10px]">{p.quantity} unités</Badge>
                  </div>
                  <span className="text-sm font-mono-price text-muted-foreground">{formatXAF(Number(p.price))}</span>
                </div>
              ))}
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* KPI */}
      <motion.div variants={item} className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: t("dash.todaySales"), value: formatXAF(todaysSalesTotal), sub: `${todaysSalesCount} ${t("dash.transactions")}`, icon: DollarSign },
          { label: t("dash.totalProducts"), value: products.length.toString(), sub: `${totalStock} unités`, icon: Package },
          { label: t("dash.lowStock"), value: lowStockProducts.length.toString(), sub: t("dash.needsAttention"), icon: AlertTriangle },
          { label: "Clients", value: clients.length.toString(), sub: "comptes actifs", icon: Users },
        ].map(stat => (
          <Card key={stat.label} className="hover-lift">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-1"><stat.icon className="h-4 w-4 text-primary" /><span className="text-xs text-muted-foreground">{stat.label}</span></div>
              <p className="text-xl font-bold font-mono-price text-foreground">{stat.value}</p>
              <p className="text-xs text-muted-foreground">{stat.sub}</p>
            </CardContent>
          </Card>
        ))}
      </motion.div>

      {/* Tabs */}
      <Tabs defaultValue="dashboard" className="space-y-4">
        <TabsList className="flex-wrap">
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          <TabsTrigger value="products">Produits</TabsTrigger>
          <TabsTrigger value="inventory">Inventaire</TabsTrigger>
          <TabsTrigger value="reports">Rapports</TabsTrigger>
          <TabsTrigger value="alerts">Alertes</TabsTrigger>
          <TabsTrigger value="clients">Clients</TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard">
          <motion.div variants={item}>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-primary" /> {t("dash.salesOverview")} — {t("dash.last7days")}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-52">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData}>
                      <defs>
                        <linearGradient id="mgSales" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                      <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                      <Tooltip formatter={(v: number) => formatXAF(v)} />
                      <Area type="monotone" dataKey="sales" stroke="hsl(var(--primary))" fill="url(#mgSales)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </TabsContent>

        <TabsContent value="products">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <CardTitle className="text-base">{t("prod.title")} ({filteredProducts.length})</CardTitle>
                <div className="flex gap-2 w-full sm:w-auto">
                  <div className="relative flex-1 sm:w-48">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input placeholder={t("prod.search")} value={search} onChange={e => setSearch(e.target.value)} className="pl-9 h-9" />
                  </div>
                  <Select value={catFilter} onValueChange={setCatFilter}>
                    <SelectTrigger className="w-40 h-9"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">{t("prod.allCategories")}</SelectItem>
                      {CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t("prod.product")}</TableHead>
                      <TableHead>{t("prod.category")}</TableHead>
                      <TableHead className="text-right">{t("prod.price")}</TableHead>
                      <TableHead className="text-center">{t("prod.stock")}</TableHead>
                      <TableHead>{t("prod.status")}</TableHead>
                      <TableHead className="text-right">{t("prod.actions")}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredProducts.map(p => (
                      <TableRow key={p.id} className={p.quantity <= p.min_threshold ? "bg-destructive/5" : ""}>
                        <TableCell className="font-medium">{p.name}</TableCell>
                        <TableCell className="text-muted-foreground text-xs">{p.category}</TableCell>
                        <TableCell className="text-right font-mono-price">{formatXAF(Number(p.price))}</TableCell>
                        <TableCell className="text-center">{p.quantity}</TableCell>
                        <TableCell>{getStockBadge(p)}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => openEditDialog(p)}><Edit className="h-3.5 w-3.5" /></Button>
                            <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive" onClick={() => setDeleteId(p.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                    {filteredProducts.length === 0 && <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">{t("prod.noProducts")}</TableCell></TableRow>}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="inventory">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-destructive" /> Alertes Inventaire ({unresolvedAlerts.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {unresolvedAlerts.length === 0 ? (
                <p className="text-sm text-muted-foreground flex items-center gap-2"><CheckCircle className="h-4 w-4 text-success" /> {t("alert.allGood")}</p>
              ) : unresolvedAlerts.map(a => (
                <div key={a.id} className="flex items-center justify-between py-2 px-3 rounded-md bg-destructive/10 border border-destructive/20">
                  <div>
                    <span className="text-sm font-medium text-foreground">{a.product_name}</span>
                    <span className="text-xs text-muted-foreground ml-2">{a.current_quantity} unités</span>
                  </div>
                  <Button size="sm" variant="outline" onClick={() => resolveAlert.mutate(a.id)}>Résoudre</Button>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reports">
          <Card>
            <CardHeader><CardTitle className="text-base flex items-center gap-2"><BarChart3 className="h-4 w-4 text-primary" /> Historique des Ventes</CardTitle></CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Transaction</TableHead>
                    <TableHead>Client</TableHead>
                    <TableHead>Paiement</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                    <TableHead>Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sales.slice(0, 20).map(s => (
                    <TableRow key={s.id}>
                      <TableCell className="font-mono text-xs">{s.transaction_id}</TableCell>
                      <TableCell>{s.cashier_name}</TableCell>
                      <TableCell><Badge variant="outline" className="text-[10px]">{s.payment_method}</Badge></TableCell>
                      <TableCell className="text-right font-mono-price">{formatXAF(Number(s.total))}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">{new Date(s.created_at).toLocaleString("fr-FR")}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="clients">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2"><Users className="h-4 w-4 text-primary" /> Clients ({clients.length})</CardTitle>
                <Button size="sm" onClick={() => setClientDialogOpen(true)} className="gap-1"><UserPlus className="h-4 w-4" /> Ajouter Client</Button>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nom</TableHead>
                    <TableHead>Username</TableHead>
                    <TableHead>Créé le</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {clients.map(c => (
                    <TableRow key={c.id}>
                      <TableCell className="font-medium">{c.full_name}</TableCell>
                      <TableCell className="text-muted-foreground">{c.username}</TableCell>
                      <TableCell className="text-muted-foreground text-xs">{new Date(c.created_at).toLocaleDateString("fr-FR")}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => setResetPwOpen(c.id)} title="Réinitialiser mot de passe">
                            <KeyRound className="h-3.5 w-3.5" />
                          </Button>
                          <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive" onClick={() => setDeleteClientId(c.id)}>
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                  {clients.length === 0 && <TableRow><TableCell colSpan={4} className="text-center py-8 text-muted-foreground">Aucun client</TableCell></TableRow>}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Add/Edit Product Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editingProduct ? t("prod.editProduct") : t("prod.addProduct")}</DialogTitle></DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2"><Label>{t("prod.name")}</Label><Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required /></div>
              <div><Label>{t("prod.categoryLabel")}</Label><Select value={form.category} onValueChange={v => setForm(f => ({ ...f, category: v }))}><SelectTrigger><SelectValue placeholder={t("prod.select")} /></SelectTrigger><SelectContent>{CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent></Select></div>
              <div><Label>{t("prod.priceLabel")}</Label><Input type="number" value={form.price} onChange={e => setForm(f => ({ ...f, price: e.target.value }))} required min="0" /></div>
              <div><Label>{t("prod.quantity")}</Label><Input type="number" value={form.quantity} onChange={e => setForm(f => ({ ...f, quantity: e.target.value }))} min="0" /></div>
              <div><Label>{t("prod.minThreshold")}</Label><Input type="number" value={form.minThreshold} onChange={e => setForm(f => ({ ...f, minThreshold: e.target.value }))} min="0" /></div>
              <div><Label>{t("prod.barcode")}</Label><Input value={form.barcode} onChange={e => setForm(f => ({ ...f, barcode: e.target.value }))} /></div>
              <div><Label>{t("prod.supplierLabel")}</Label><Input value={form.supplier} onChange={e => setForm(f => ({ ...f, supplier: e.target.value }))} /></div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>{t("prod.cancel")}</Button>
              <Button type="submit">{editingProduct ? t("prod.update") : t("prod.add")}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Product Confirm */}
      <Dialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>{t("prod.deleteProduct")}</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground">{t("prod.deleteConfirm")}</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteId(null)}>{t("prod.cancel")}</Button>
            <Button variant="destructive" onClick={handleDelete}>{t("prod.delete")}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Client Dialog */}
      <Dialog open={clientDialogOpen} onOpenChange={setClientDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Ajouter un Client</DialogTitle></DialogHeader>
          <form onSubmit={handleCreateClient} className="space-y-4">
            <div><Label>Nom Complet</Label><Input value={clientForm.fullName} onChange={e => setClientForm(f => ({ ...f, fullName: e.target.value }))} required /></div>
            <div><Label>Email</Label><Input type="email" value={clientForm.email} onChange={e => setClientForm(f => ({ ...f, email: e.target.value }))} required /></div>
            <div><Label>Mot de passe</Label><Input type="password" value={clientForm.password} onChange={e => setClientForm(f => ({ ...f, password: e.target.value }))} required minLength={6} /></div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setClientDialogOpen(false)}>Annuler</Button>
              <Button type="submit" disabled={clientFormLoading}>{clientFormLoading ? "Création..." : "Créer Client"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Client Confirm */}
      <Dialog open={!!deleteClientId} onOpenChange={() => setDeleteClientId(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Supprimer ce client ?</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground">Cette action est irréversible.</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteClientId(null)}>Annuler</Button>
            <Button variant="destructive" onClick={handleDeleteClient}>Supprimer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reset Password Dialog */}
      <Dialog open={!!resetPwOpen} onOpenChange={() => { setResetPwOpen(null); setNewPw(""); }}>
        <DialogContent>
          <DialogHeader><DialogTitle>Réinitialiser le mot de passe</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label>Nouveau mot de passe</Label><Input type="password" value={newPw} onChange={e => setNewPw(e.target.value)} minLength={6} placeholder="Min 6 caractères" /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setResetPwOpen(null); setNewPw(""); }}>Annuler</Button>
            <Button onClick={handleResetPw} disabled={newPw.length < 6}>Réinitialiser</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
