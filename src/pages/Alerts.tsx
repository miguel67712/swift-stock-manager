import { useState, useMemo } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useAlerts } from "@/hooks/useAlerts";
import { useProducts } from "@/hooks/useProducts";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  AlertTriangle,
  XCircle,
  CheckCircle2,
  Clock,
  Filter,
} from "lucide-react";
import { motion, AnimatePresence, type Variants } from "framer-motion";
import { toast } from "sonner";

type FilterType = "all" | "low_stock" | "out_of_stock" | "resolved";

const container: Variants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.08 } },
};

const alertItem: Variants = {
  hidden: { opacity: 0, y: 15, scale: 0.97 },
  show: { opacity: 1, y: 0, scale: 1, transition: { type: "spring" as const, stiffness: 300, damping: 24 } },
};

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

  const handleResolve = async (alertId: string, productName: string) => {
    try {
      await resolveAlert.mutateAsync(alertId);
      toast.success(`Alert for ${productName} resolved`);
    } catch (err: any) {
      toast.error(err.message || "Failed to resolve alert");
    }
  };

  const filterButtons: { key: FilterType; label: string; count: number }[] = [
    { key: "all", label: "All", count: alerts.length },
    { key: "out_of_stock", label: "Out of Stock", count: outOfStockCount },
    { key: "low_stock", label: "Low Stock", count: lowStockCount },
    { key: "resolved", label: "Resolved", count: alerts.filter((a) => a.resolved).length },
  ];

  const summaryCards = [
    { count: outOfStockCount, label: "Out of Stock", icon: XCircle, color: "text-destructive", bg: "bg-destructive/10", border: "border-l-destructive" },
    { count: lowStockCount, label: "Low Stock", icon: AlertTriangle, color: "text-warning", bg: "bg-warning/10", border: "border-l-warning" },
    { count: products.filter((p) => p.quantity > p.min_threshold).length, label: "Healthy Stock", icon: CheckCircle2, color: "text-success", bg: "bg-success/10", border: "border-l-success" },
  ];

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-4 sm:space-y-6">
      <motion.div
        initial={{ opacity: 0, x: -15 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.4 }}
      >
        <h1 className="text-xl sm:text-2xl font-bold text-foreground">Inventory Alerts</h1>
        <p className="text-sm text-muted-foreground mt-1">
          {unresolvedCount > 0 ? `${unresolvedCount} item${unresolvedCount > 1 ? "s" : ""} need attention` : "All stock levels are healthy"}
        </p>
      </motion.div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
        {summaryCards.map((card, i) => {
          const Icon = card.icon;
          return (
            <motion.div
              key={card.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1, type: "spring", stiffness: 300, damping: 24 }}
            >
              <Card className={`shadow-card border-l-4 ${card.border} hover-lift`}>
                <CardContent className="p-4 flex items-center gap-4">
                  <motion.div
                    className={`rounded-lg p-2.5 ${card.bg}`}
                    whileHover={{ rotate: 15, scale: 1.1 }}
                    transition={{ type: "spring", stiffness: 400 }}
                  >
                    <Icon className={`h-5 w-5 ${card.color}`} />
                  </motion.div>
                  <div>
                    <motion.p
                      className="text-2xl font-bold font-mono"
                      key={card.count}
                      initial={{ scale: 1.2 }}
                      animate={{ scale: 1 }}
                    >
                      {card.count}
                    </motion.p>
                    <p className="text-xs text-muted-foreground">{card.label}</p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {/* Filter tabs */}
      <motion.div
        className="flex items-center gap-2 flex-wrap"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <Filter className="h-4 w-4 text-muted-foreground" />
        {filterButtons.map(({ key, label, count }) => (
          <motion.button
            key={key}
            onClick={() => setFilter(key)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${filter === key ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground hover:bg-secondary/80"}`}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            layout
          >
            {label}<span className="ml-1.5 opacity-70">({count})</span>
          </motion.button>
        ))}
      </motion.div>

      {/* Alert list */}
      <motion.div className="space-y-3" variants={container} initial="hidden" animate="show">
        <AnimatePresence mode="popLayout">
          {filteredAlerts.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="py-16 text-center"
            >
              <motion.div
                animate={{ y: [0, -8, 0] }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
              >
                <CheckCircle2 className="h-12 w-12 mx-auto mb-3 text-success/30" />
              </motion.div>
              <p className="text-muted-foreground">No alerts in this category</p>
            </motion.div>
          ) : (
            filteredAlerts.map((alert) => (
              <motion.div key={alert.id} variants={alertItem} layout exit={{ opacity: 0, x: -50, scale: 0.95, transition: { duration: 0.3 } }}>
                <Card className={`shadow-card transition-all hover-lift ${alert.resolved ? "opacity-60" : alert.alert_type === "out_of_stock" ? "border-l-4 border-l-destructive" : "border-l-4 border-l-warning"}`}>
                  <CardContent className="p-4">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
                      <motion.div
                        className={`rounded-lg p-2.5 shrink-0 self-start ${alert.resolved ? "bg-muted" : alert.alert_type === "out_of_stock" ? "bg-destructive/10" : "bg-warning/10"}`}
                        animate={!alert.resolved && alert.alert_type === "out_of_stock" ? { scale: [1, 1.15, 1] } : {}}
                        transition={{ duration: 1.5, repeat: Infinity }}
                      >
                        {alert.resolved ? <CheckCircle2 className="h-5 w-5 text-muted-foreground" /> : alert.alert_type === "out_of_stock" ? <XCircle className="h-5 w-5 text-destructive" /> : <AlertTriangle className="h-5 w-5 text-warning" />}
                      </motion.div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-semibold text-foreground truncate">{alert.product_name}</h3>
                          <Badge variant={alert.resolved ? "secondary" : "destructive"} className="text-[10px] shrink-0">
                            {alert.resolved ? "Resolved" : alert.alert_type === "out_of_stock" ? "OUT OF STOCK" : "LOW STOCK"}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-4 mt-1 text-xs text-muted-foreground flex-wrap">
                          <span>Stock: {alert.previous_quantity} → {alert.current_quantity}</span>
                          <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{new Date(alert.created_at).toLocaleDateString()}</span>
                        </div>
                      </div>
                      {!alert.resolved && isAdminOrManager && (
                        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                          <Button size="sm" variant="outline" onClick={() => handleResolve(alert.id, alert.product_name)} disabled={resolveAlert.isPending} className="shrink-0 self-start sm:self-center">
                            Resolve
                          </Button>
                        </motion.div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
