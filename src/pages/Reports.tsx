import { useMemo } from "react";
import { useProducts } from "@/hooks/useProducts";
import { useSales } from "@/hooks/useSales";
import { useI18n } from "@/lib/i18n";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart3, TrendingUp, DollarSign, Package, Award, Users } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { motion, type Variants } from "framer-motion";
import { formatXAF } from "@/lib/currency";

const COLORS = ["hsl(140 50% 30%)", "hsl(30 90% 50%)", "hsl(38 92% 50%)", "hsl(280 65% 60%)", "hsl(340 75% 55%)", "hsl(190 80% 42%)"];
const container: Variants = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.1 } } };
const item: Variants = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 300, damping: 24 } } };

export default function Reports() {
  const { sales } = useSales();
  const { products } = useProducts();
  const { t } = useI18n();
  const totalRevenue = sales.reduce((sum, s) => sum + Number(s.total), 0);
  const avgTransaction = sales.length > 0 ? totalRevenue / sales.length : 0;
  const inventoryValue = products.reduce((sum, p) => sum + Number(p.price) * p.quantity, 0);

  const topProducts = useMemo(() => {
    const map = new Map<string, { name: string; qty: number; revenue: number }>();
    sales.forEach((s) => s.sale_items?.forEach((si) => { const e = map.get(si.product_id || si.product_name) || { name: si.product_name, qty: 0, revenue: 0 }; e.qty += si.quantity; e.revenue += Number(si.total_price); map.set(si.product_id || si.product_name, e); }));
    return Array.from(map.values()).sort((a, b) => b.revenue - a.revenue).slice(0, 6);
  }, [sales]);

  const categoryData = useMemo(() => {
    const map = new Map<string, number>();
    sales.forEach((s) => s.sale_items?.forEach((si) => { const cat = products.find((p) => p.id === si.product_id)?.category || "Autre"; map.set(cat, (map.get(cat) || 0) + Number(si.total_price)); }));
    return Array.from(map.entries()).map(([name, value]) => ({ name, value: Math.round(value) })).sort((a, b) => b.value - a.value);
  }, [sales, products]);

  const cashierData = useMemo(() => {
    const map = new Map<string, { transactions: number; revenue: number }>();
    sales.forEach((s) => { const e = map.get(s.cashier_name) || { transactions: 0, revenue: 0 }; e.transactions++; e.revenue += Number(s.total); map.set(s.cashier_name, e); });
    return Array.from(map.entries()).map(([name, d]) => ({ name, ...d })).sort((a, b) => b.revenue - a.revenue);
  }, [sales]);

  const statCards = [
    { label: t("report.totalRevenue"), value: formatXAF(totalRevenue), icon: DollarSign, color: "text-success", bg: "bg-success/10" },
    { label: t("report.transactions"), value: sales.length.toString(), icon: BarChart3, color: "text-primary", bg: "bg-primary/10" },
    { label: t("report.avgTransaction"), value: formatXAF(avgTransaction), icon: TrendingUp, color: "text-primary", bg: "bg-primary/10" },
    { label: t("report.inventoryValue"), value: formatXAF(inventoryValue), icon: Package, color: "text-warning", bg: "bg-warning/10" },
  ];

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-4 sm:space-y-6">
      <div><h1 className="text-xl sm:text-2xl font-bold text-foreground">{t("report.title")}</h1><p className="text-sm text-muted-foreground mt-1">{t("report.subtitle")}</p></div>

      <motion.div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4" variants={container} initial="hidden" animate="show">
        {statCards.map((stat) => { const Icon = stat.icon; return (
          <motion.div key={stat.label} variants={item}><Card className="shadow-card hover-lift"><CardContent className="p-4 sm:p-5"><div className="flex items-start justify-between"><div><p className="text-[10px] sm:text-xs font-medium text-muted-foreground uppercase">{stat.label}</p><p className="mt-1 sm:mt-2 text-lg sm:text-2xl font-bold font-mono">{stat.value}</p></div><div className={`rounded-lg p-2 ${stat.bg}`}><Icon className={`h-4 w-4 sm:h-5 sm:w-5 ${stat.color}`} /></div></div></CardContent></Card></motion.div>
        ); })}
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        <Card className="shadow-card"><CardHeader className="pb-2"><CardTitle className="text-base font-semibold flex items-center gap-2"><Award className="h-4 w-4 text-warning" />{t("report.topProducts")}</CardTitle></CardHeader><CardContent>
          {topProducts.length > 0 ? <div className="h-[260px]"><ResponsiveContainer width="100%" height="100%"><BarChart data={topProducts} layout="vertical"><CartesianGrid strokeDasharray="3 3" stroke="hsl(220 13% 91%)" /><XAxis type="number" tickFormatter={(v) => `${Math.round(v/1000)}k`} tick={{ fontSize: 11 }} /><YAxis type="category" dataKey="name" width={100} tick={{ fontSize: 10 }} /><Tooltip formatter={(v: number) => [formatXAF(v), t("report.revenue")]} /><Bar dataKey="revenue" fill="hsl(140 50% 30%)" radius={[0, 4, 4, 0]} /></BarChart></ResponsiveContainer></div> : <p className="py-12 text-center text-sm text-muted-foreground">{t("report.noData")}</p>}
        </CardContent></Card>

        <Card className="shadow-card"><CardHeader className="pb-2"><CardTitle className="text-base font-semibold">{t("report.salesByCategory")}</CardTitle></CardHeader><CardContent>
          {categoryData.length > 0 ? <>
            <div className="h-[260px]"><ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={categoryData} cx="50%" cy="50%" innerRadius={50} outerRadius={85} paddingAngle={3} dataKey="value">{categoryData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}</Pie><Tooltip formatter={(v: number) => [formatXAF(v), t("report.revenue")]} /></PieChart></ResponsiveContainer></div>
            <div className="flex flex-wrap gap-3 mt-2 justify-center">{categoryData.map((c, i) => <div key={c.name} className="flex items-center gap-1.5 text-xs"><div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} /><span className="text-muted-foreground">{c.name}</span></div>)}</div>
          </> : <p className="py-12 text-center text-sm text-muted-foreground">{t("report.noData")}</p>}
        </CardContent></Card>
      </div>

      <Card className="shadow-card"><CardHeader className="pb-3"><CardTitle className="text-base font-semibold flex items-center gap-2"><Users className="h-4 w-4 text-primary" />{t("report.cashierPerformance")}</CardTitle></CardHeader><CardContent>
        <div className="overflow-x-auto"><table className="w-full text-sm min-w-[400px]"><thead><tr className="border-b">
          <th className="pb-3 text-left text-xs font-medium text-muted-foreground uppercase">{t("report.cashier")}</th>
          <th className="pb-3 text-right text-xs font-medium text-muted-foreground uppercase">{t("report.transactions")}</th>
          <th className="pb-3 text-right text-xs font-medium text-muted-foreground uppercase">{t("report.revenue")}</th>
        </tr></thead><tbody className="divide-y">
          {cashierData.map((c) => <tr key={c.name} className="hover:bg-muted/30"><td className="py-3 font-medium">{c.name}</td><td className="py-3 text-right font-mono">{c.transactions}</td><td className="py-3 text-right font-mono font-semibold">{formatXAF(c.revenue)}</td></tr>)}
          {cashierData.length === 0 && <tr><td colSpan={3} className="py-8 text-center text-muted-foreground text-sm">{t("report.noData")}</td></tr>}
        </tbody></table></div>
      </CardContent></Card>
    </div>
  );
}
