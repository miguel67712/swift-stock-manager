import { useState, useMemo } from "react";
import { useStore } from "@/lib/store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  AlertTriangle,
  XCircle,
  CheckCircle2,
  Clock,
  Filter,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";

type FilterType = "all" | "low_stock" | "out_of_stock" | "resolved";

export default function Alerts() {
  const { alerts, resolveAlert, products } = useStore();
  const [filter, setFilter] = useState<FilterType>("all");

  const filteredAlerts = useMemo(() => {
    switch (filter) {
      case "low_stock":
        return alerts.filter((a) => a.type === "low_stock" && !a.resolved);
      case "out_of_stock":
        return alerts.filter((a) => a.type === "out_of_stock" && !a.resolved);
      case "resolved":
        return alerts.filter((a) => a.resolved);
      default:
        return alerts;
    }
  }, [alerts, filter]);

  const unresolvedCount = alerts.filter((a) => !a.resolved).length;
  const outOfStockCount = alerts.filter((a) => a.type === "out_of_stock" && !a.resolved).length;
  const lowStockCount = alerts.filter((a) => a.type === "low_stock" && !a.resolved).length;

  const handleResolve = (alertId: string, productName: string) => {
    resolveAlert(alertId);
    toast.success(`Alert for ${productName} resolved`);
  };

  const filterButtons: { key: FilterType; label: string; count: number }[] = [
    { key: "all", label: "All", count: alerts.length },
    { key: "out_of_stock", label: "Out of Stock", count: outOfStockCount },
    { key: "low_stock", label: "Low Stock", count: lowStockCount },
    { key: "resolved", label: "Resolved", count: alerts.filter((a) => a.resolved).length },
  ];

  return (
    <div className="p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Inventory Alerts</h1>
        <p className="text-sm text-muted-foreground mt-1">
          {unresolvedCount > 0
            ? `${unresolvedCount} item${unresolvedCount > 1 ? "s" : ""} need attention`
            : "All stock levels are healthy"}
        </p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="shadow-card border-l-4 border-l-destructive">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="rounded-lg p-2.5 bg-destructive/10">
              <XCircle className="h-5 w-5 text-destructive" />
            </div>
            <div>
              <p className="text-2xl font-bold font-mono">{outOfStockCount}</p>
              <p className="text-xs text-muted-foreground">Out of Stock</p>
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-card border-l-4 border-l-warning">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="rounded-lg p-2.5 bg-warning/10">
              <AlertTriangle className="h-5 w-5 text-warning" />
            </div>
            <div>
              <p className="text-2xl font-bold font-mono">{lowStockCount}</p>
              <p className="text-xs text-muted-foreground">Low Stock</p>
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-card border-l-4 border-l-success">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="rounded-lg p-2.5 bg-success/10">
              <CheckCircle2 className="h-5 w-5 text-success" />
            </div>
            <div>
              <p className="text-2xl font-bold font-mono">
                {products.filter((p) => p.quantity > p.minThreshold).length}
              </p>
              <p className="text-xs text-muted-foreground">Healthy Stock</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filter tabs */}
      <div className="flex items-center gap-2 flex-wrap">
        <Filter className="h-4 w-4 text-muted-foreground" />
        {filterButtons.map(({ key, label, count }) => (
          <button
            key={key}
            onClick={() => setFilter(key)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
              filter === key
                ? "bg-primary text-primary-foreground"
                : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
            }`}
          >
            {label}
            <span className="ml-1.5 opacity-70">({count})</span>
          </button>
        ))}
      </div>

      {/* Alert list */}
      <div className="space-y-3">
        <AnimatePresence mode="popLayout">
          {filteredAlerts.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="py-16 text-center"
            >
              <CheckCircle2 className="h-12 w-12 mx-auto mb-3 text-success/30" />
              <p className="text-muted-foreground">No alerts in this category</p>
            </motion.div>
          ) : (
            filteredAlerts.map((alert) => (
              <motion.div
                key={alert.id}
                layout
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
              >
                <Card
                  className={`shadow-card transition-all ${
                    alert.resolved
                      ? "opacity-60"
                      : alert.type === "out_of_stock"
                      ? "border-l-4 border-l-destructive"
                      : "border-l-4 border-l-warning"
                  }`}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center gap-4">
                      <div
                        className={`rounded-lg p-2.5 shrink-0 ${
                          alert.resolved
                            ? "bg-muted"
                            : alert.type === "out_of_stock"
                            ? "bg-destructive/10"
                            : "bg-warning/10"
                        }`}
                      >
                        {alert.resolved ? (
                          <CheckCircle2 className="h-5 w-5 text-muted-foreground" />
                        ) : alert.type === "out_of_stock" ? (
                          <XCircle className="h-5 w-5 text-destructive" />
                        ) : (
                          <AlertTriangle className="h-5 w-5 text-warning" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-foreground truncate">
                            {alert.productName}
                          </h3>
                          <Badge
                            variant={alert.resolved ? "secondary" : "destructive"}
                            className="text-[10px] shrink-0"
                          >
                            {alert.resolved
                              ? "Resolved"
                              : alert.type === "out_of_stock"
                              ? "OUT OF STOCK"
                              : "LOW STOCK"}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-4 mt-1 text-xs text-muted-foreground">
                          <span>
                            Stock: {alert.previousQuantity} → {alert.currentQuantity}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {new Date(alert.date).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                      {!alert.resolved && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleResolve(alert.id, alert.productName)}
                          className="shrink-0"
                        >
                          Resolve
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
