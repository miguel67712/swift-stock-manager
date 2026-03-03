import { useMemo } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useProducts } from "@/hooks/useProducts";
import { useSales } from "@/hooks/useSales";
import { useAlerts } from "@/hooks/useAlerts";
import { useI18n } from "@/lib/i18n";
import { formatXAF } from "@/lib/currency";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { motion } from "framer-motion";
import {
  DollarSign, Users, AlertTriangle, Database, Shield, Package,
  Activity, Download, FileText, Settings, UserPlus, BarChart3,
  Clock, CheckCircle, XCircle, TrendingUp
} from "lucide-react";

const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.06 } } };
const item = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } };

export default function AdminDashboard() {
  const { profile } = useAuth();
  const { products } = useProducts();
  const { sales } = useSales();
  const { alerts } = useAlerts();
  const { t } = useI18n();

  const unresolvedAlerts = alerts.filter(a => !a.resolved);
  const totalStock = products.reduce((s, p) => s + p.quantity, 0);
  const totalRevenue = sales.reduce((s, sale) => s + Number(sale.total), 0);
  const todaysSales = sales.filter(s => new Date(s.created_at).toDateString() === new Date().toDateString());
  const todaysRevenue = todaysSales.reduce((s, sale) => s + Number(sale.total), 0);

  const recentActivity = useMemo(() => {
    const items: { time: string; message: string; type: "sale" | "alert" | "info" }[] = [];
    sales.slice(0, 5).forEach(s => {
      const d = new Date(s.created_at);
      items.push({
        time: d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }),
        message: `${s.cashier_name} - Vente ${s.transaction_id} (${formatXAF(Number(s.total))})`,
        type: "sale",
      });
    });
    unresolvedAlerts.slice(0, 3).forEach(a => {
      const d = new Date(a.created_at);
      items.push({
        time: d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }),
        message: `Alerte: ${a.product_name} - ${a.current_quantity} unités`,
        type: "alert",
      });
    });
    return items.sort((a, b) => b.time.localeCompare(a.time)).slice(0, 8);
  }, [sales, unresolvedAlerts]);

  const statCards = [
    { label: "Ventes Totales", value: formatXAF(totalRevenue), icon: DollarSign, color: "text-primary" },
    { label: "Ventes Aujourd'hui", value: formatXAF(todaysRevenue), icon: TrendingUp, color: "text-chart-2" },
    { label: "Alertes Système", value: `${unresolvedAlerts.length} actives`, icon: AlertTriangle, color: "text-destructive" },
    { label: "Stock Total", value: `${totalStock.toLocaleString()} unités`, icon: Package, color: "text-success" },
    { label: "Produits", value: products.length.toString(), icon: Database, color: "text-primary" },
    { label: "Transactions", value: sales.length.toString(), icon: Activity, color: "text-chart-2" },
  ];

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6 p-4 md:p-6">
      {/* Header */}
      <motion.div variants={item} className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-foreground flex items-center gap-2">
            <Shield className="h-7 w-7 text-primary" />
            Swift-Mart Admin
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            {t("dash.greeting")}, {profile?.full_name} — Centre de Commande
          </p>
        </div>
      </motion.div>

      {/* KPI Grid */}
      <motion.div variants={item} className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {statCards.map((stat) => (
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Quick Actions */}
        <motion.div variants={item}>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Settings className="h-4 w-4 text-primary" />
                Actions Rapides
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-2">
              {[
                { label: "Rapport Complet", icon: FileText },
                { label: "Sauvegarder", icon: Download },
                { label: "Nouvel Utilisateur", icon: UserPlus },
                { label: "Statistiques", icon: BarChart3 },
              ].map((action) => (
                <Button key={action.label} variant="outline" className="h-auto py-3 flex-col gap-1.5 text-xs">
                  <action.icon className="h-4 w-4" />
                  {action.label}
                </Button>
              ))}
            </CardContent>
          </Card>
        </motion.div>

        {/* Users overview */}
        <motion.div variants={item}>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Users className="h-4 w-4 text-primary" />
                Utilisateurs
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {[
                { email: "admin@swift-mart.com", role: "Admin", status: "active" },
                { email: "manager@swift-mart.com", role: "Manager", status: "active" },
                { email: "cashier@swift-mart.com", role: "Caissier", status: "active" },
              ].map((u) => (
                <div key={u.email} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                  <div>
                    <p className="text-sm font-medium text-foreground">{u.email}</p>
                    <p className="text-xs text-muted-foreground">{u.role}</p>
                  </div>
                  <Badge variant="outline" className="text-success border-success/30 text-[10px]">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Actif
                  </Badge>
                </div>
              ))}
            </CardContent>
          </Card>
        </motion.div>

        {/* Alerts Summary */}
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
                  <CheckCircle className="h-4 w-4 text-success" />
                  Tous les niveaux de stock sont bons
                </p>
              ) : (
                unresolvedAlerts.slice(0, 5).map((a) => (
                  <div key={a.id} className="flex items-center justify-between py-1.5 border-b border-border last:border-0">
                    <div className="flex items-center gap-2">
                      <XCircle className="h-3.5 w-3.5 text-destructive" />
                      <span className="text-sm text-foreground">{a.product_name}</span>
                    </div>
                    <Badge variant="destructive" className="text-[10px]">
                      {a.current_quantity} unités
                    </Badge>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Recent Activity */}
      <motion.div variants={item}>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Clock className="h-4 w-4 text-primary" />
              Activité Récente
            </CardTitle>
          </CardHeader>
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
      </motion.div>
    </motion.div>
  );
}
