import { useAuth } from "@/hooks/useAuth";
import { useProducts } from "@/hooks/useProducts";
import { useSales } from "@/hooks/useSales";
import { useAlerts } from "@/hooks/useAlerts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  DollarSign, Package, AlertTriangle, ShoppingCart, TrendingUp,
  ArrowUpRight, Clock,
} from "lucide-react";
import { motion, type Variants } from "framer-motion";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { useNavigate } from "react-router-dom";
import { useMemo } from "react";
import { formatXAF } from "@/lib/currency";

const container: Variants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.1 } },
};
const item: Variants = {
  hidden: { opacity: 0, y: 20, scale: 0.95 },
  show: { opacity: 1, y: 0, scale: 1, transition: { type: "spring" as const, stiffness: 300, damping: 24 } },
};
const slideUp: Variants = {
  hidden: { opacity: 0, y: 30 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" as const } },
};

export default function Dashboard() {
  const { profile } = useAuth();
  const { products, lowStockCount } = useProducts();
  const { sales, todaysSalesTotal, todaysSalesCount } = useSales();
  const { alerts } = useAlerts();
  const navigate = useNavigate();
  const unresolvedAlerts = alerts.filter((a) => !a.resolved);

  const chartData = useMemo(() => {
    const data = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(); d.setDate(d.getDate() - i);
      const dateStr = d.toDateString();
      const daySales = sales.filter((s) => new Date(s.created_at).toDateString() === dateStr);
      data.push({ date: d.toLocaleDateString("fr-FR", { weekday: "short" }), sales: daySales.reduce((sum, s) => sum + Number(s.total), 0) });
    }
    return data;
  }, [sales]);

  const statCards = [
    { title: "Ventes du Jour", value: formatXAF(todaysSalesTotal), subtitle: `${todaysSalesCount} transactions`, icon: DollarSign, color: "text-success", bg: "bg-success/10" },
    { title: "Total Produits", value: products.length.toString(), subtitle: "En inventaire", icon: Package, color: "text-primary", bg: "bg-primary/10" },
    { title: "Stock Faible", value: lowStockCount.toString(), subtitle: "Besoin d'attention", icon: AlertTriangle, color: "text-warning", bg: "bg-warning/10" },
    { title: "Total Ventes", value: sales.length.toString(), subtitle: "Depuis le début", icon: ShoppingCart, color: "text-primary", bg: "bg-primary/10" },
  ];

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6">
      <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5 }} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-foreground">Bonjour, {profile?.full_name}</h1>
          <p className="text-sm text-muted-foreground mt-1">Voici un aperçu de votre magasin aujourd'hui</p>
        </div>
        <motion.button onClick={() => navigate("/pos")} className="hidden sm:flex items-center gap-2 rounded-lg gradient-brand px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm hover:opacity-90 transition-opacity" whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
          <ShoppingCart className="h-4 w-4" /> Ouvrir Caisse
        </motion.button>
      </motion.div>

      <motion.div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4" variants={container} initial="hidden" animate="show">
        {statCards.map((stat) => { const Icon = stat.icon; return (
          <motion.div key={stat.title} variants={item}>
            <Card className="shadow-card hover-lift cursor-default"><CardContent className="p-4 sm:p-5">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-[10px] sm:text-xs font-medium text-muted-foreground uppercase tracking-wide">{stat.title}</p>
                  <motion.p className="mt-1 sm:mt-2 text-lg sm:text-2xl font-bold font-mono text-foreground" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>{stat.value}</motion.p>
                  <p className="mt-0.5 sm:mt-1 text-[10px] sm:text-xs text-muted-foreground">{stat.subtitle}</p>
                </div>
                <motion.div className={`rounded-lg p-2 sm:p-2.5 ${stat.bg}`} whileHover={{ rotate: 15, scale: 1.1 }}><Icon className={`h-4 w-4 sm:h-5 sm:w-5 ${stat.color}`} /></motion.div>
              </div>
            </CardContent></Card>
          </motion.div>
        ); })}
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <motion.div className="lg:col-span-2" variants={slideUp} initial="hidden" animate="show" transition={{ delay: 0.4 }}>
          <Card className="shadow-card hover-glow">
            <CardHeader className="pb-2"><div className="flex items-center justify-between"><CardTitle className="text-base font-semibold">Aperçu des Ventes</CardTitle><motion.div className="flex items-center gap-1.5 text-xs text-success font-medium" animate={{ opacity: [0.7, 1, 0.7] }} transition={{ duration: 2, repeat: Infinity }}><TrendingUp className="h-3.5 w-3.5" />7 derniers jours</motion.div></div></CardHeader>
            <CardContent className="pt-0"><div className="h-[200px] sm:h-[260px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs><linearGradient id="salesGradient" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="hsl(140 50% 30%)" stopOpacity={0.2} /><stop offset="100%" stopColor="hsl(140 50% 30%)" stopOpacity={0} /></linearGradient></defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(220 13% 91%)" />
                  <XAxis dataKey="date" tick={{ fontSize: 11, fill: "hsl(220 9% 46%)" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: "hsl(220 9% 46%)" }} axisLine={false} tickLine={false} tickFormatter={(v) => `${Math.round(v / 1000)}k`} />
                  <Tooltip contentStyle={{ borderRadius: "8px", border: "1px solid hsl(220 13% 91%)", fontSize: "13px" }} formatter={(value: number) => [formatXAF(value), "Revenue"]} />
                  <Area type="monotone" dataKey="sales" stroke="hsl(140 50% 30%)" strokeWidth={2.5} fill="url(#salesGradient)" />
                </AreaChart>
              </ResponsiveContainer>
            </div></CardContent>
          </Card>
        </motion.div>

        <motion.div variants={slideUp} initial="hidden" animate="show" transition={{ delay: 0.5 }}>
          <Card className="shadow-card h-full hover-glow">
            <CardHeader className="pb-3"><div className="flex items-center justify-between"><CardTitle className="text-base font-semibold">⚠️ Alerte Stock</CardTitle><motion.button onClick={() => navigate("/alerts")} className="text-xs font-medium text-primary hover:underline flex items-center gap-1" whileHover={{ x: 3 }}>Voir tout <ArrowUpRight className="h-3 w-3" /></motion.button></div></CardHeader>
            <CardContent className="space-y-3 pt-0">
              {unresolvedAlerts.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">Tous les niveaux de stock sont bons ✓</p>
              ) : unresolvedAlerts.slice(0, 5).map((alert, i) => (
                <motion.div key={alert.id} className={`flex items-center gap-3 rounded-lg border p-3 ${alert.alert_type === "out_of_stock" ? "stock-critical" : "stock-warning"}`} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.5 + i * 0.1 }} whileHover={{ x: 4, transition: { duration: 0.2 } }}>
                  <AlertTriangle className="h-4 w-4 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{alert.product_name}</p>
                    <p className="text-xs opacity-75">{alert.alert_type === "out_of_stock" ? "Rupture de stock" : `${alert.current_quantity} restant(s)`}</p>
                  </div>
                </motion.div>
              ))}
            </CardContent>
          </Card>
        </motion.div>
      </div>

      <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6, duration: 0.5 }}>
        <Card className="shadow-card hover-glow">
          <CardHeader className="pb-3"><div className="flex items-center justify-between"><CardTitle className="text-base font-semibold">Transactions Récentes</CardTitle><Clock className="h-4 w-4 text-muted-foreground" /></div></CardHeader>
          <CardContent className="pt-0"><div className="overflow-x-auto -mx-6 px-6">
            <table className="w-full text-sm min-w-[500px]">
              <thead><tr className="border-b">
                <th className="pb-3 text-left text-xs font-medium text-muted-foreground uppercase">Transaction</th>
                <th className="pb-3 text-left text-xs font-medium text-muted-foreground uppercase hidden sm:table-cell">Articles</th>
                <th className="pb-3 text-left text-xs font-medium text-muted-foreground uppercase">Paiement</th>
                <th className="pb-3 text-left text-xs font-medium text-muted-foreground uppercase hidden sm:table-cell">Caissier</th>
                <th className="pb-3 text-right text-xs font-medium text-muted-foreground uppercase">Total</th>
              </tr></thead>
              <tbody className="divide-y">
                {sales.slice(0, 6).map((sale, i) => (
                  <motion.tr key={sale.id} className="hover:bg-muted/50 transition-colors" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.7 + i * 0.08 }}>
                    <td className="py-3 font-mono text-xs text-muted-foreground">{sale.transaction_id}</td>
                    <td className="py-3 hidden sm:table-cell"><span className="text-sm">{sale.sale_items?.map((si) => si.product_name).join(", ") || "-"}</span></td>
                    <td className="py-3"><Badge variant="secondary" className="text-xs capitalize font-medium">{sale.payment_method}</Badge></td>
                    <td className="py-3 text-sm text-muted-foreground hidden sm:table-cell">{sale.cashier_name}</td>
                    <td className="py-3 text-right font-mono font-semibold">{formatXAF(Number(sale.total))}</td>
                  </motion.tr>
                ))}
                {sales.length === 0 && <tr><td colSpan={5} className="py-8 text-center text-muted-foreground text-sm">Aucune transaction</td></tr>}
              </tbody>
            </table>
          </div></CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
