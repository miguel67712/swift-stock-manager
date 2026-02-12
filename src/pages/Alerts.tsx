import { useState, useMemo } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useAlerts } from "@/hooks/useAlerts";
import { useProducts } from "@/hooks/useProducts";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, XCircle, CheckCircle2, Clock, Filter } from "lucide-react";
import { motion, AnimatePresence, type Variants } from "framer-motion";
import { toast } from "sonner";

type FilterType = "all" | "low_stock" | "out_of_stock" | "resolved";
const container: Variants = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.08 } } };
const alertItem: Variants = { hidden: { opacity: 0, y: 15 }, show: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 300, damping: 24 } } };

export default function Alerts() {
  const { isAdminOrManager } = useAuth();
  const { alerts, resolveAlert } = useAlerts();
  const { products } = useProducts();
  const [filter, setFilter] = useState<FilterType>("all");

  const filteredAlerts = useMemo(() => {
    switch (filter) {
      case "low_stock": return alerts.filter((a) => a.alert_type === "low_stock" && !a.resolved);
      case "out_of_stock": return alerts.filter((a) => a.alert_type === "out_of_stock" && !a.resolved);
      case "resolved": return alerts.filter((a) => a.resolved);
      default: return alerts;
    }
  }, [alerts, filter]);

  const unresolvedCount = alerts.filter((a) => !a.resolved).length;
  const outOfStockCount = alerts.filter((a) => a.alert_type === "out_of_stock" && !a.resolved).length;
  const lowStockCount = alerts.filter((a) => a.alert_type === "low_stock" && !a.resolved).length;

  const handleResolve = async (id: string, name: string) => {
    try { await resolveAlert.mutateAsync(id); toast.success(`Alerte pour ${name} résolue`); }
    catch (err: any) { toast.error(err.message || "Erreur"); }
  };

  const filterButtons: { key: FilterType; label: string; count: number }[] = [
    { key: "all", label: "Tout", count: alerts.length },
    { key: "out_of_stock", label: "Rupture", count: outOfStockCount },
    { key: "low_stock", label: "Stock Faible", count: lowStockCount },
    { key: "resolved", label: "Résolues", count: alerts.filter((a) => a.resolved).length },
  ];

  const summaryCards = [
    { count: outOfStockCount, label: "Rupture de Stock", icon: XCircle, color: "text-destructive", bg: "bg-destructive/10", border: "border-l-destructive" },
    { count: lowStockCount, label: "Stock Faible", icon: AlertTriangle, color: "text-warning", bg: "bg-warning/10", border: "border-l-warning" },
    { count: products.filter((p) => p.quantity > p.min_threshold).length, label: "Stock Sain", icon: CheckCircle2, color: "text-success", bg: "bg-success/10", border: "border-l-success" },
  ];

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-4 sm:space-y-6">
      <div><h1 className="text-xl sm:text-2xl font-bold text-foreground">Alertes Inventaire</h1>
        <p className="text-sm text-muted-foreground mt-1">{unresolvedCount > 0 ? `${unresolvedCount} article(s) nécessite(nt) attention` : "Tous les niveaux de stock sont bons"}</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
        {summaryCards.map((card) => { const Icon = card.icon; return (
          <Card key={card.label} className={`shadow-card border-l-4 ${card.border} hover-lift`}><CardContent className="p-4 flex items-center gap-4">
            <div className={`rounded-lg p-2.5 ${card.bg}`}><Icon className={`h-5 w-5 ${card.color}`} /></div>
            <div><p className="text-2xl font-bold font-mono">{card.count}</p><p className="text-xs text-muted-foreground">{card.label}</p></div>
          </CardContent></Card>
        ); })}
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        <Filter className="h-4 w-4 text-muted-foreground" />
        {filterButtons.map(({ key, label, count }) => (
          <button key={key} onClick={() => setFilter(key)} className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${filter === key ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground hover:bg-secondary/80"}`}>{label} ({count})</button>
        ))}
      </div>

      <motion.div className="space-y-3" variants={container} initial="hidden" animate="show">
        <AnimatePresence mode="popLayout">
          {filteredAlerts.length === 0 ? (
            <div className="py-16 text-center"><CheckCircle2 className="h-12 w-12 mx-auto mb-3 text-success/30" /><p className="text-muted-foreground">Aucune alerte</p></div>
          ) : filteredAlerts.map((alert) => (
            <motion.div key={alert.id} variants={alertItem} layout exit={{ opacity: 0, x: -50 }}>
              <Card className={`shadow-card hover-lift ${alert.resolved ? "opacity-60" : alert.alert_type === "out_of_stock" ? "border-l-4 border-l-destructive" : "border-l-4 border-l-warning"}`}><CardContent className="p-4">
                <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                  <div className={`rounded-lg p-2.5 shrink-0 self-start ${alert.resolved ? "bg-muted" : alert.alert_type === "out_of_stock" ? "bg-destructive/10" : "bg-warning/10"}`}>
                    {alert.resolved ? <CheckCircle2 className="h-5 w-5 text-muted-foreground" /> : alert.alert_type === "out_of_stock" ? <XCircle className="h-5 w-5 text-destructive" /> : <AlertTriangle className="h-5 w-5 text-warning" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap"><h3 className="font-semibold truncate">{alert.product_name}</h3><Badge variant={alert.resolved ? "secondary" : "destructive"} className="text-[10px]">{alert.resolved ? "Résolue" : alert.alert_type === "out_of_stock" ? "RUPTURE" : "STOCK FAIBLE"}</Badge></div>
                    <div className="flex items-center gap-4 mt-1 text-xs text-muted-foreground"><span>Stock: {alert.previous_quantity} → {alert.current_quantity}</span><span className="flex items-center gap-1"><Clock className="h-3 w-3" />{new Date(alert.created_at).toLocaleDateString()}</span></div>
                  </div>
                  {!alert.resolved && isAdminOrManager && <Button size="sm" variant="outline" onClick={() => handleResolve(alert.id, alert.product_name)} disabled={resolveAlert.isPending} className="shrink-0">Résoudre</Button>}
                </div>
              </CardContent></Card>
            </motion.div>
          ))}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
