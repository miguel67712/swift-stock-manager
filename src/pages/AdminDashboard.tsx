import { useState, useMemo } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useProducts } from "@/hooks/useProducts";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import {
  Shield, Users, Package, Settings, Activity, BarChart3,
  DollarSign, TrendingUp, AlertTriangle, Clock, CheckCircle,
  XCircle, UserPlus, Trash2, Download, FileText, Database,
  Lock, Bell, Server, HardDrive
} from "lucide-react";

const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.06 } } };
const item = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } };
const COLORS = ["hsl(var(--primary))", "hsl(var(--chart-2))", "hsl(var(--chart-3))", "hsl(var(--chart-4))", "hsl(var(--chart-5))"];

export default function AdminDashboard() {
  const { profile } = useAuth();
  const { products } = useProducts();
  const { sales } = useSales();
  const { alerts } = useAlerts();
  const { users: managers, isLoading: managersLoading, createUser, deleteUser } = useUsers("manager");
  const { t } = useI18n();

  const [createOpen, setCreateOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [form, setForm] = useState({ email: "", password: "", fullName: "" });
  const [formLoading, setFormLoading] = useState(false);

  const unresolvedAlerts = alerts.filter(a => !a.resolved);
  const totalStock = products.reduce((s, p) => s + p.quantity, 0);
  const totalRevenue = sales.reduce((s, sale) => s + Number(sale.total), 0);
  const todaysSales = sales.filter(s => new Date(s.created_at).toDateString() === new Date().toDateString());
  const todaysRevenue = todaysSales.reduce((s, sale) => s + Number(sale.total), 0);

  const recentActivity = useMemo(() => {
    const items: { time: string; message: string; type: "sale" | "alert" | "info" }[] = [];
    sales.slice(0, 5).forEach(s => {
      const d = new Date(s.created_at);
      items.push({ time: d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }), message: `Vente ${s.transaction_id} (${formatXAF(Number(s.total))})`, type: "sale" });
    });
    unresolvedAlerts.slice(0, 3).forEach(a => {
      const d = new Date(a.created_at);
      items.push({ time: d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }), message: `Alerte: ${a.product_name} - ${a.current_quantity} unités`, type: "alert" });
    });
    return items.sort((a, b) => b.time.localeCompare(a.time)).slice(0, 8);
  }, [sales, unresolvedAlerts]);

  // Reports data
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

  const categoryData = useMemo(() => {
    const map: Record<string, number> = {};
    sales.forEach(s => {
      (s as any).sale_items?.forEach((si: any) => {
        const prod = products.find(p => p.id === si.product_id);
        const cat = prod?.category || "Autre";
        map[cat] = (map[cat] || 0) + Number(si.total_price);
      });
    });
    return Object.entries(map).map(([name, value]) => ({ name, value }));
  }, [sales, products]);

  const topProducts = useMemo(() => {
    const map: Record<string, number> = {};
    sales.forEach(s => {
      (s as any).sale_items?.forEach((si: any) => {
        map[si.product_name] = (map[si.product_name] || 0) + Number(si.total_price);
      });
    });
    return Object.entries(map).sort((a, b) => b[1] - a[1]).slice(0, 6).map(([name, revenue]) => ({ name: name.length > 15 ? name.slice(0, 15) + "…" : name, revenue }));
  }, [sales]);

  const handleCreateManager = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.email || !form.password || !form.fullName) { toast.error("Remplissez tous les champs"); return; }
    setFormLoading(true);
    try {
      await createUser.mutateAsync({ email: form.email, password: form.password, fullName: form.fullName, role: "manager" });
      toast.success(`Manager ${form.fullName} créé`);
      setCreateOpen(false);
      setForm({ email: "", password: "", fullName: "" });
    } catch (err: any) { toast.error(err.message); }
    setFormLoading(false);
  };

  const handleDeleteManager = async () => {
    if (!deleteId) return;
    try { await deleteUser.mutateAsync(deleteId); toast.success("Manager supprimé"); } catch (err: any) { toast.error(err.message); }
    setDeleteId(null);
  };

  const statCards = [
    { label: "Ventes Totales", value: formatXAF(totalRevenue), icon: DollarSign, color: "text-primary" },
    { label: "Aujourd'hui", value: formatXAF(todaysRevenue), icon: TrendingUp, color: "text-chart-2" },
    { label: "Alertes", value: `${unresolvedAlerts.length}`, icon: AlertTriangle, color: "text-destructive" },
    { label: "Produits", value: products.length.toString(), icon: Package, color: "text-primary" },
    { label: "Stock Total", value: `${totalStock.toLocaleString()}`, icon: Database, color: "text-success" },
    { label: "Managers", value: managers.length.toString(), icon: Users, color: "text-chart-2" },
  ];

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6 p-4 md:p-6">
      <motion.div variants={item} className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-foreground flex items-center gap-2">
            <Shield className="h-7 w-7 text-primary" />
            Swift-Mart Admin
          </h1>
          <p className="text-muted-foreground text-sm mt-1">{t("dash.greeting")}, {profile?.full_name} — Centre de Commande</p>
        </div>
      </motion.div>

      {/* KPI Grid */}
      <motion.div variants={item} className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {statCards.map(stat => (
          <Card key={stat.label} className="hover-lift">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <stat.icon className={`h-4 w-4 ${stat.color}`} />
                <span className="text-xs text-muted-foreground font-medium truncate">{stat.label}</span>
              </div>
              <p className="text-lg font-bold text-foreground font-mono-price">{stat.value}</p>
            </CardContent>
          </Card>
        ))}
      </motion.div>

      {/* Tabs - 6 tabs */}
      <Tabs defaultValue="dashboard" className="space-y-4">
        <TabsList className="flex-wrap">
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          <TabsTrigger value="managers">Managers</TabsTrigger>
          <TabsTrigger value="products">Produits</TabsTrigger>
          <TabsTrigger value="reports">Rapports</TabsTrigger>
          <TabsTrigger value="logs">Logs</TabsTrigger>
          <TabsTrigger value="settings">Paramètres</TabsTrigger>
        </TabsList>

        {/* 1. Dashboard */}
        <TabsContent value="dashboard">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <motion.div variants={item}>
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Settings className="h-4 w-4 text-primary" /> Actions Rapides
                  </CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-2 gap-2">
                  {[
                    { label: "Rapport Complet", icon: FileText },
                    { label: "Sauvegarder", icon: Download },
                    { label: "Nouveau Manager", icon: UserPlus, onClick: () => setCreateOpen(true) },
                    { label: "Statistiques", icon: BarChart3 },
                  ].map(action => (
                    <Button key={action.label} variant="outline" className="h-auto py-3 flex-col gap-1.5 text-xs" onClick={action.onClick}>
                      <action.icon className="h-4 w-4" /> {action.label}
                    </Button>
                  ))}
                </CardContent>
              </Card>
            </motion.div>

            <motion.div variants={item}>
              <Card className={unresolvedAlerts.length > 0 ? "border-destructive/30" : ""}>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <AlertTriangle className={`h-4 w-4 ${unresolvedAlerts.length > 0 ? "text-destructive" : "text-success"}`} />
                    Alertes Stock
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {unresolvedAlerts.length === 0 ? (
                    <p className="text-sm text-muted-foreground flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-success" /> Tous les niveaux de stock sont bons
                    </p>
                  ) : unresolvedAlerts.slice(0, 5).map(a => (
                    <div key={a.id} className="flex items-center justify-between py-1.5 border-b border-border last:border-0">
                      <div className="flex items-center gap-2">
                        <XCircle className="h-3.5 w-3.5 text-destructive" />
                        <span className="text-sm text-foreground">{a.product_name}</span>
                      </div>
                      <Badge variant="destructive" className="text-[10px]">{a.current_quantity} unités</Badge>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </TabsContent>

        {/* 2. Managers */}
        <TabsContent value="managers">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2">
                  <Users className="h-4 w-4 text-primary" /> Managers ({managers.length})
                </CardTitle>
                <Button size="sm" onClick={() => setCreateOpen(true)} className="gap-1">
                  <UserPlus className="h-4 w-4" /> Ajouter Manager
                </Button>
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
                  {managers.map(m => (
                    <TableRow key={m.id}>
                      <TableCell className="font-medium">{m.full_name}</TableCell>
                      <TableCell className="text-muted-foreground">{m.username}</TableCell>
                      <TableCell className="text-muted-foreground text-xs">{new Date(m.created_at).toLocaleDateString("fr-FR")}</TableCell>
                      <TableCell className="text-right">
                        <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive" onClick={() => setDeleteId(m.id)}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                  {managers.length === 0 && (
                    <TableRow><TableCell colSpan={4} className="text-center py-8 text-muted-foreground">Aucun manager</TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 3. Products */}
        <TabsContent value="products">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Package className="h-4 w-4 text-primary" /> Tous les Produits ({products.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Produit</TableHead>
                      <TableHead>Catégorie</TableHead>
                      <TableHead className="text-right">Prix</TableHead>
                      <TableHead className="text-center">Stock</TableHead>
                      <TableHead>Statut</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {products.map(p => (
                      <TableRow key={p.id} className={p.quantity <= p.min_threshold ? "bg-destructive/5" : ""}>
                        <TableCell className="font-medium">{p.name}</TableCell>
                        <TableCell className="text-muted-foreground text-xs">{p.category}</TableCell>
                        <TableCell className="text-right font-mono-price">{formatXAF(Number(p.price))}</TableCell>
                        <TableCell className="text-center">{p.quantity}</TableCell>
                        <TableCell>
                          {p.quantity === 0 ? <Badge variant="destructive">Rupture</Badge> :
                           p.quantity <= p.min_threshold ? <Badge className="bg-warning text-warning-foreground">Stock Faible</Badge> :
                           <Badge variant="outline" className="text-success border-success/30">En Stock</Badge>}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 4. Reports (NEW) */}
        <TabsContent value="reports">
          <div className="space-y-6">
            {/* Summary cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardContent className="p-4">
                  <p className="text-xs text-muted-foreground">Revenu Total</p>
                  <p className="text-2xl font-bold font-mono-price text-primary">{formatXAF(totalRevenue)}</p>
                  <p className="text-xs text-muted-foreground mt-1">{sales.length} transactions</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <p className="text-xs text-muted-foreground">Transaction Moyenne</p>
                  <p className="text-2xl font-bold font-mono-price text-foreground">{formatXAF(sales.length ? totalRevenue / sales.length : 0)}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <p className="text-xs text-muted-foreground">Valeur Inventaire</p>
                  <p className="text-2xl font-bold font-mono-price text-foreground">{formatXAF(products.reduce((s, p) => s + Number(p.price) * p.quantity, 0))}</p>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Daily sales chart */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2"><BarChart3 className="h-4 w-4 text-primary" /> Ventes 7 Derniers Jours</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-52">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={chartData}>
                        <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                        <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                        <Tooltip formatter={(v: number) => formatXAF(v)} />
                        <Bar dataKey="sales" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              {/* Top products */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2"><Package className="h-4 w-4 text-primary" /> Top Produits</CardTitle>
                </CardHeader>
                <CardContent>
                  {topProducts.length === 0 ? (
                    <p className="text-sm text-muted-foreground py-8 text-center">Aucune donnée de vente</p>
                  ) : (
                    <div className="h-52">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={topProducts} layout="vertical">
                          <XAxis type="number" tick={{ fontSize: 11 }} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                          <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={100} />
                          <Tooltip formatter={(v: number) => formatXAF(v)} />
                          <Bar dataKey="revenue" fill="hsl(var(--chart-2))" radius={[0, 4, 4, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Recent sales table */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2"><FileText className="h-4 w-4 text-primary" /> Dernières Transactions</CardTitle>
              </CardHeader>
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
                    {sales.slice(0, 15).map(s => (
                      <TableRow key={s.id}>
                        <TableCell className="font-mono text-xs">{s.transaction_id}</TableCell>
                        <TableCell>{s.cashier_name}</TableCell>
                        <TableCell><Badge variant="outline" className="text-[10px]">{s.payment_method}</Badge></TableCell>
                        <TableCell className="text-right font-mono-price">{formatXAF(Number(s.total))}</TableCell>
                        <TableCell className="text-xs text-muted-foreground">{new Date(s.created_at).toLocaleString("fr-FR")}</TableCell>
                      </TableRow>
                    ))}
                    {sales.length === 0 && <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">Aucune transaction</TableCell></TableRow>}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* 5. Logs */}
        <TabsContent value="logs">
          <Card>
            <CardHeader><CardTitle className="text-base flex items-center gap-2"><Clock className="h-4 w-4 text-primary" /> Activité Récente</CardTitle></CardHeader>
            <CardContent>
              {recentActivity.length === 0 ? (
                <p className="text-sm text-muted-foreground">Aucune activité récente</p>
              ) : (
                <div className="space-y-2">
                  {recentActivity.map((act, i) => (
                    <div key={i} className="flex items-center gap-3 py-2 border-b border-border last:border-0">
                      <span className="text-xs text-muted-foreground font-mono-price w-12 shrink-0">{act.time}</span>
                      <div className={`h-2 w-2 rounded-full shrink-0 ${act.type === "alert" ? "bg-destructive" : "bg-success"}`} />
                      <span className="text-sm text-foreground">{act.message}</span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* 6. Settings (NEW) */}
        <TabsContent value="settings">
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2"><Database className="h-4 w-4 text-primary" /> Base de Données</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between text-sm"><span className="text-muted-foreground">Produits</span><span className="font-bold">{products.length}</span></div>
                  <div className="flex justify-between text-sm"><span className="text-muted-foreground">Transactions</span><span className="font-bold">{sales.length}</span></div>
                  <div className="flex justify-between text-sm"><span className="text-muted-foreground">Alertes</span><span className="font-bold">{alerts.length}</span></div>
                  <Button variant="outline" className="w-full gap-2 mt-2"><Download className="h-4 w-4" /> Exporter les Données</Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2"><Lock className="h-4 w-4 text-primary" /> Sécurité</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between text-sm"><span className="text-muted-foreground">RLS</span><Badge variant="outline" className="text-success border-success/30">Activé</Badge></div>
                  <div className="flex justify-between text-sm"><span className="text-muted-foreground">Auth</span><Badge variant="outline" className="text-success border-success/30">Activé</Badge></div>
                  <div className="flex justify-between text-sm"><span className="text-muted-foreground">Rôles</span><Badge variant="outline" className="text-success border-success/30">Configurés</Badge></div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2"><Bell className="h-4 w-4 text-primary" /> Seuils d'Alerte</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between text-sm"><span className="text-muted-foreground">Seuil par défaut</span><span className="font-bold">5 unités</span></div>
                  <div className="flex justify-between text-sm"><span className="text-muted-foreground">Alerte critique</span><span className="font-bold text-destructive">&lt; 3 unités</span></div>
                  <div className="flex justify-between text-sm"><span className="text-muted-foreground">Stock faible</span><span className="font-bold text-warning">5-9 unités</span></div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2"><Server className="h-4 w-4 text-primary" /> Système</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between text-sm"><span className="text-muted-foreground">Version</span><span className="font-bold">1.0.0</span></div>
                  <div className="flex justify-between text-sm"><span className="text-muted-foreground">Statut</span><Badge variant="outline" className="text-success border-success/30">En ligne</Badge></div>
                  <div className="flex justify-between text-sm"><span className="text-muted-foreground">Dernière sauvegarde</span><span className="text-xs text-muted-foreground">{new Date().toLocaleDateString("fr-FR")}</span></div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* Create Manager Dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Ajouter un Manager</DialogTitle></DialogHeader>
          <form onSubmit={handleCreateManager} className="space-y-4">
            <div><Label>Nom Complet</Label><Input value={form.fullName} onChange={e => setForm(f => ({ ...f, fullName: e.target.value }))} placeholder="Nom complet" required /></div>
            <div><Label>Email</Label><Input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="manager@swift-mart.com" required /></div>
            <div><Label>Mot de passe</Label><Input type="password" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} placeholder="Min 6 caractères" required minLength={6} /></div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setCreateOpen(false)}>Annuler</Button>
              <Button type="submit" disabled={formLoading}>{formLoading ? "Création..." : "Créer Manager"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirm */}
      <Dialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Supprimer ce manager ?</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground">Cette action est irréversible.</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteId(null)}>Annuler</Button>
            <Button variant="destructive" onClick={handleDeleteManager}>Supprimer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
