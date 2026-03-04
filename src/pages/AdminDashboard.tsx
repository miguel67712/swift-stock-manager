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
import {
  Shield, Users, Package, Settings, Activity, BarChart3,
  DollarSign, TrendingUp, AlertTriangle, Clock, CheckCircle,
  XCircle, UserPlus, Trash2, Download, FileText, Database
} from "lucide-react";

const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.06 } } };
const item = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } };

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

      {/* Tabs */}
      <Tabs defaultValue="dashboard" className="space-y-4">
        <TabsList>
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          <TabsTrigger value="managers">Managers</TabsTrigger>
          <TabsTrigger value="products">Produits</TabsTrigger>
          <TabsTrigger value="system">Système</TabsTrigger>
          <TabsTrigger value="logs">Logs</TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Quick Actions */}
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

            {/* Alerts */}
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

        <TabsContent value="system">
          <Card>
            <CardHeader><CardTitle className="text-base flex items-center gap-2"><Settings className="h-4 w-4 text-primary" /> Paramètres Système</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-lg border border-border">
                  <h3 className="font-semibold text-sm mb-2">Base de données</h3>
                  <p className="text-xs text-muted-foreground">{products.length} produits • {sales.length} transactions</p>
                </div>
                <div className="p-4 rounded-lg border border-border">
                  <h3 className="font-semibold text-sm mb-2">Sécurité</h3>
                  <p className="text-xs text-muted-foreground">RLS activé • Rôles configurés</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

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
