import { useMemo } from "react";
import { useStore } from "@/lib/store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
import { motion } from "framer-motion";

const COLORS = [
  "hsl(221 83% 53%)",
  "hsl(152 69% 31%)",
  "hsl(38 92% 50%)",
  "hsl(280 65% 60%)",
  "hsl(340 75% 55%)",
  "hsl(190 80% 42%)",
];

export default function Reports() {
  const { sales, products } = useStore();

  const totalRevenue = sales.reduce((sum, s) => sum + s.total, 0);
  const totalItems = sales.reduce(
    (sum, s) => sum + s.items.reduce((is, i) => is + i.quantity, 0),
    0
  );
  const avgTransaction = sales.length > 0 ? totalRevenue / sales.length : 0;

  // Top selling products
  const topProducts = useMemo(() => {
    const map = new Map<string, { name: string; qty: number; revenue: number }>();
    sales.forEach((s) =>
      s.items.forEach((item) => {
        const existing = map.get(item.productId) || { name: item.productName, qty: 0, revenue: 0 };
        existing.qty += item.quantity;
        existing.revenue += item.totalPrice;
        map.set(item.productId, existing);
      })
    );
    return Array.from(map.values())
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 6);
  }, [sales]);

  // Category breakdown
  const categoryData = useMemo(() => {
    const map = new Map<string, number>();
    sales.forEach((s) =>
      s.items.forEach((item) => {
        const product = products.find((p) => p.id === item.productId);
        if (product) {
          map.set(product.category, (map.get(product.category) || 0) + item.totalPrice);
        }
      })
    );
    return Array.from(map.entries())
      .map(([name, value]) => ({ name, value: Math.round(value * 100) / 100 }))
      .sort((a, b) => b.value - a.value);
  }, [sales, products]);

  // Payment methods
  const paymentData = useMemo(() => {
    const map = new Map<string, number>();
    sales.forEach((s) => {
      map.set(s.paymentMethod, (map.get(s.paymentMethod) || 0) + 1);
    });
    return Array.from(map.entries()).map(([name, value]) => ({
      name: name.charAt(0).toUpperCase() + name.slice(1),
      value,
    }));
  }, [sales]);

  // Cashier performance
  const cashierData = useMemo(() => {
    const map = new Map<string, { transactions: number; revenue: number }>();
    sales.forEach((s) => {
      const existing = map.get(s.cashier) || { transactions: 0, revenue: 0 };
      existing.transactions += 1;
      existing.revenue += s.total;
      map.set(s.cashier, existing);
    });
    return Array.from(map.entries())
      .map(([name, data]) => ({ name, ...data }))
      .sort((a, b) => b.revenue - a.revenue);
  }, [sales]);

  // Inventory valuation
  const inventoryValue = products.reduce((sum, p) => sum + p.price * p.quantity, 0);

  const fadeIn = {
    initial: { opacity: 0, y: 12 },
    animate: { opacity: 1, y: 0 },
  };

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Reports & Analytics</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Performance overview and sales insights
        </p>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Total Revenue", value: `$${totalRevenue.toFixed(2)}`, icon: DollarSign, color: "text-success", bg: "bg-success/10" },
          { label: "Total Transactions", value: sales.length.toString(), icon: BarChart3, color: "text-primary", bg: "bg-primary/10" },
          { label: "Avg Transaction", value: `$${avgTransaction.toFixed(2)}`, icon: TrendingUp, color: "text-primary", bg: "bg-primary/10" },
          { label: "Inventory Value", value: `$${inventoryValue.toFixed(2)}`, icon: Package, color: "text-warning", bg: "bg-warning/10" },
        ].map((stat, i) => {
          const Icon = stat.icon;
          return (
            <motion.div key={stat.label} variants={fadeIn} initial="initial" animate="animate" transition={{ delay: i * 0.1 }}>
              <Card className="shadow-card">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{stat.label}</p>
                      <p className="mt-2 text-2xl font-bold font-mono">{stat.value}</p>
                    </div>
                    <div className={`rounded-lg p-2.5 ${stat.bg}`}>
                      <Icon className={`h-5 w-5 ${stat.color}`} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Products */}
        <motion.div variants={fadeIn} initial="initial" animate="animate" transition={{ delay: 0.4 }}>
          <Card className="shadow-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <Award className="h-4 w-4 text-warning" />
                Top Selling Products
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[260px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={topProducts} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(220 13% 91%)" />
                    <XAxis type="number" tickFormatter={(v) => `$${v}`} tick={{ fontSize: 11, fill: "hsl(220 9% 46%)" }} />
                    <YAxis type="category" dataKey="name" width={120} tick={{ fontSize: 11, fill: "hsl(220 9% 46%)" }} />
                    <Tooltip
                      contentStyle={{ borderRadius: "8px", border: "1px solid hsl(220 13% 91%)", fontSize: "13px" }}
                      formatter={(value: number) => [`$${value.toFixed(2)}`, "Revenue"]}
                    />
                    <Bar dataKey="revenue" fill="hsl(221 83% 53%)" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Payment Methods & Category Breakdown */}
        <motion.div variants={fadeIn} initial="initial" animate="animate" transition={{ delay: 0.5 }}>
          <Card className="shadow-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-semibold">Sales by Category</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[260px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={categoryData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {categoryData.map((_, idx) => (
                        <Cell key={idx} fill={COLORS[idx % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{ borderRadius: "8px", border: "1px solid hsl(220 13% 91%)", fontSize: "13px" }}
                      formatter={(value: number) => [`$${value.toFixed(2)}`, "Revenue"]}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex flex-wrap gap-3 mt-2 justify-center">
                {categoryData.map((cat, idx) => (
                  <div key={cat.name} className="flex items-center gap-1.5 text-xs">
                    <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: COLORS[idx % COLORS.length] }} />
                    <span className="text-muted-foreground">{cat.name}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Cashier Performance */}
      <motion.div variants={fadeIn} initial="initial" animate="animate" transition={{ delay: 0.6 }}>
        <Card className="shadow-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Users className="h-4 w-4 text-primary" />
              Cashier Performance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="pb-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Cashier</th>
                    <th className="pb-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">Transactions</th>
                    <th className="pb-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">Revenue</th>
                    <th className="pb-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">Avg/Transaction</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {cashierData.map((cashier) => (
                    <tr key={cashier.name} className="hover:bg-muted/30 transition-colors">
                      <td className="py-3 font-medium">{cashier.name}</td>
                      <td className="py-3 text-right font-mono">{cashier.transactions}</td>
                      <td className="py-3 text-right font-mono font-semibold">${cashier.revenue.toFixed(2)}</td>
                      <td className="py-3 text-right font-mono text-muted-foreground">
                        ${(cashier.revenue / cashier.transactions).toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
