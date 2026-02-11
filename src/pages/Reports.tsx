import { useMemo } from "react";
import { useProducts } from "@/hooks/useProducts";
import { useSales } from "@/hooks/useSales";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  BarChart3,
  TrendingUp,
  DollarSign,
  Package,
  Award,
  Users,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { motion, type Variants } from "framer-motion";

const COLORS = [
  "hsl(221 83% 53%)", "hsl(152 69% 31%)", "hsl(38 92% 50%)",
  "hsl(280 65% 60%)", "hsl(340 75% 55%)", "hsl(190 80% 42%)",
];

const container: Variants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.1 } },
};

const item: Variants = {
  hidden: { opacity: 0, y: 20, scale: 0.95 },
  show: { opacity: 1, y: 0, scale: 1, transition: { type: "spring" as const, stiffness: 300, damping: 24 } },
};

export default function Reports() {
  const { sales } = useSales();
  const { products } = useProducts();

  const totalRevenue = sales.reduce((sum, s) => sum + Number(s.total), 0);
  const totalItems = sales.reduce((sum, s) => sum + (s.sale_items?.reduce((is, i) => is + i.quantity, 0) || 0), 0);
  const avgTransaction = sales.length > 0 ? totalRevenue / sales.length : 0;

  const topProducts = useMemo(() => {
    const map = new Map<string, { name: string; qty: number; revenue: number }>();
    sales.forEach((s) =>
      s.sale_items?.forEach((item) => {
        const existing = map.get(item.product_id || item.product_name) || { name: item.product_name, qty: 0, revenue: 0 };
        existing.qty += item.quantity;
        existing.revenue += Number(item.total_price);
        map.set(item.product_id || item.product_name, existing);
      })
    );
    return Array.from(map.values()).sort((a, b) => b.revenue - a.revenue).slice(0, 6);
  }, [sales]);

  const categoryData = useMemo(() => {
    const map = new Map<string, number>();
    sales.forEach((s) =>
      s.sale_items?.forEach((item) => {
        const product = products.find((p) => p.id === item.product_id);
        const cat = product?.category || "Other";
        map.set(cat, (map.get(cat) || 0) + Number(item.total_price));
      })
    );
    return Array.from(map.entries()).map(([name, value]) => ({ name, value: Math.round(value * 100) / 100 })).sort((a, b) => b.value - a.value);
  }, [sales, products]);

  const paymentData = useMemo(() => {
    const map = new Map<string, number>();
    sales.forEach((s) => map.set(s.payment_method, (map.get(s.payment_method) || 0) + 1));
    return Array.from(map.entries()).map(([name, value]) => ({ name: name.charAt(0).toUpperCase() + name.slice(1), value }));
  }, [sales]);

  const cashierData = useMemo(() => {
    const map = new Map<string, { transactions: number; revenue: number }>();
    sales.forEach((s) => {
      const existing = map.get(s.cashier_name) || { transactions: 0, revenue: 0 };
      existing.transactions += 1;
      existing.revenue += Number(s.total);
      map.set(s.cashier_name, existing);
    });
    return Array.from(map.entries()).map(([name, data]) => ({ name, ...data })).sort((a, b) => b.revenue - a.revenue);
  }, [sales]);

  const inventoryValue = products.reduce((sum, p) => sum + Number(p.price) * p.quantity, 0);

  const statCards = [
    { label: "Total Revenue", value: `$${totalRevenue.toFixed(2)}`, icon: DollarSign, color: "text-success", bg: "bg-success/10" },
    { label: "Total Transactions", value: sales.length.toString(), icon: BarChart3, color: "text-primary", bg: "bg-primary/10" },
    { label: "Avg Transaction", value: `$${avgTransaction.toFixed(2)}`, icon: TrendingUp, color: "text-primary", bg: "bg-primary/10" },
    { label: "Inventory Value", value: `$${inventoryValue.toFixed(2)}`, icon: Package, color: "text-warning", bg: "bg-warning/10" },
  ];

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-4 sm:space-y-6">
      <motion.div
        initial={{ opacity: 0, x: -15 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.4 }}
      >
        <h1 className="text-xl sm:text-2xl font-bold text-foreground">Reports & Analytics</h1>
        <p className="text-sm text-muted-foreground mt-1">Performance overview and sales insights</p>
      </motion.div>

      <motion.div
        className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4"
        variants={container}
        initial="hidden"
        animate="show"
      >
        {statCards.map((stat) => {
          const Icon = stat.icon;
          return (
            <motion.div key={stat.label} variants={item}>
              <Card className="shadow-card hover-lift">
                <CardContent className="p-4 sm:p-5">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-[10px] sm:text-xs font-medium text-muted-foreground uppercase tracking-wide">{stat.label}</p>
                      <motion.p
                        className="mt-1 sm:mt-2 text-lg sm:text-2xl font-bold font-mono"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4 }}
                      >
                        {stat.value}
                      </motion.p>
                    </div>
                    <motion.div
                      className={`rounded-lg p-2 sm:p-2.5 ${stat.bg}`}
                      whileHover={{ rotate: 15, scale: 1.1 }}
                      transition={{ type: "spring", stiffness: 400 }}
                    >
                      <Icon className={`h-4 w-4 sm:h-5 sm:w-5 ${stat.color}`} />
                    </motion.div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        <motion.div
          initial={{ opacity: 0, y: 25 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.5 }}
        >
          <Card className="shadow-card hover-glow">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <motion.div whileHover={{ rotate: 20 }}><Award className="h-4 w-4 text-warning" /></motion.div>
                Top Selling Products
              </CardTitle>
            </CardHeader>
            <CardContent>
              {topProducts.length > 0 ? (
                <div className="h-[220px] sm:h-[260px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={topProducts} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(220 13% 91%)" />
                      <XAxis type="number" tickFormatter={(v) => `$${v}`} tick={{ fontSize: 11, fill: "hsl(220 9% 46%)" }} />
                      <YAxis type="category" dataKey="name" width={100} tick={{ fontSize: 10, fill: "hsl(220 9% 46%)" }} />
                      <Tooltip contentStyle={{ borderRadius: "8px", border: "1px solid hsl(220 13% 91%)", fontSize: "13px" }} formatter={(value: number) => [`$${value.toFixed(2)}`, "Revenue"]} />
                      <Bar dataKey="revenue" fill="hsl(221 83% 53%)" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <p className="py-12 text-center text-sm text-muted-foreground">No sales data yet</p>
              )}
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 25 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.5 }}
        >
          <Card className="shadow-card hover-glow">
            <CardHeader className="pb-2"><CardTitle className="text-base font-semibold">Sales by Category</CardTitle></CardHeader>
            <CardContent>
              {categoryData.length > 0 ? (
                <>
                  <div className="h-[220px] sm:h-[260px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={categoryData} cx="50%" cy="50%" innerRadius={50} outerRadius={85} paddingAngle={3} dataKey="value">
                          {categoryData.map((_, idx) => (<Cell key={idx} fill={COLORS[idx % COLORS.length]} />))}
                        </Pie>
                        <Tooltip contentStyle={{ borderRadius: "8px", fontSize: "13px" }} formatter={(value: number) => [`$${value.toFixed(2)}`, "Revenue"]} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <motion.div
                    className="flex flex-wrap gap-3 mt-2 justify-center"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.8 }}
                  >
                    {categoryData.map((cat, idx) => (
                      <motion.div
                        key={cat.name}
                        className="flex items-center gap-1.5 text-xs"
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.8 + idx * 0.05 }}
                      >
                        <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: COLORS[idx % COLORS.length] }} />
                        <span className="text-muted-foreground">{cat.name}</span>
                      </motion.div>
                    ))}
                  </motion.div>
                </>
              ) : (
                <p className="py-12 text-center text-sm text-muted-foreground">No sales data yet</p>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 25 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6, duration: 0.5 }}
      >
        <Card className="shadow-card hover-glow">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <motion.div whileHover={{ rotate: 15 }}><Users className="h-4 w-4 text-primary" /></motion.div>
              Cashier Performance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto -mx-6 px-6">
              <table className="w-full text-sm min-w-[400px]">
                <thead>
                  <tr className="border-b">
                    <th className="pb-3 text-left text-xs font-medium text-muted-foreground uppercase">Cashier</th>
                    <th className="pb-3 text-right text-xs font-medium text-muted-foreground uppercase">Transactions</th>
                    <th className="pb-3 text-right text-xs font-medium text-muted-foreground uppercase">Revenue</th>
                    <th className="pb-3 text-right text-xs font-medium text-muted-foreground uppercase hidden sm:table-cell">Avg/Transaction</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {cashierData.map((cashier, i) => (
                    <motion.tr
                      key={cashier.name}
                      className="hover:bg-muted/30 transition-colors"
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.7 + i * 0.08 }}
                    >
                      <td className="py-3 font-medium">{cashier.name}</td>
                      <td className="py-3 text-right font-mono">{cashier.transactions}</td>
                      <td className="py-3 text-right font-mono font-semibold">${cashier.revenue.toFixed(2)}</td>
                      <td className="py-3 text-right font-mono text-muted-foreground hidden sm:table-cell">${(cashier.revenue / cashier.transactions).toFixed(2)}</td>
                    </motion.tr>
                  ))}
                  {cashierData.length === 0 && (
                    <tr><td colSpan={4} className="py-8 text-center text-muted-foreground text-sm">No sales data yet</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
