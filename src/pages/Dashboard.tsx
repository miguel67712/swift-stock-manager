import { useStore } from "@/lib/store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  DollarSign,
  Package,
  AlertTriangle,
  ShoppingCart,
  TrendingUp,
  ArrowUpRight,
  Clock,
} from "lucide-react";
import { motion } from "framer-motion";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { useNavigate } from "react-router-dom";

const fadeIn = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
};

// Generate chart data from last 7 days
function getLast7DaysData() {
  const data = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    data.push({
      date: d.toLocaleDateString("en-US", { weekday: "short" }),
      sales: Math.floor(Math.random() * 500) + 200,
      orders: Math.floor(Math.random() * 30) + 10,
    });
  }
  return data;
}

const chartData = getLast7DaysData();

export default function Dashboard() {
  const { products, sales, alerts, todaysSalesTotal, lowStockCount, user } = useStore();
  const navigate = useNavigate();

  const todaysSales = sales.filter(
    (s) => new Date(s.date).toDateString() === new Date().toDateString()
  );

  const unresolvedAlerts = alerts.filter((a) => !a.resolved);

  const statCards = [
    {
      title: "Today's Revenue",
      value: `$${todaysSalesTotal.toFixed(2)}`,
      subtitle: `${todaysSales.length} transactions`,
      icon: DollarSign,
      color: "text-success",
      bg: "bg-success/10",
    },
    {
      title: "Total Products",
      value: products.length.toString(),
      subtitle: "In inventory",
      icon: Package,
      color: "text-primary",
      bg: "bg-primary/10",
    },
    {
      title: "Low Stock Items",
      value: lowStockCount.toString(),
      subtitle: "Need attention",
      icon: AlertTriangle,
      color: "text-warning",
      bg: "bg-warning/10",
    },
    {
      title: "Total Sales",
      value: sales.length.toString(),
      subtitle: "All time",
      icon: ShoppingCart,
      color: "text-primary",
      bg: "bg-primary/10",
    },
  ];

  return (
    <div className="p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            Good {new Date().getHours() < 12 ? "morning" : new Date().getHours() < 18 ? "afternoon" : "evening"}, {user?.name}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Here's what's happening at your store today
          </p>
        </div>
        <button
          onClick={() => navigate("/pos")}
          className="hidden sm:flex items-center gap-2 rounded-lg gradient-brand px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm hover:opacity-90 transition-opacity"
        >
          <ShoppingCart className="h-4 w-4" />
          Open POS
        </button>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat, i) => {
          const Icon = stat.icon;
          return (
            <motion.div
              key={stat.title}
              variants={fadeIn}
              initial="initial"
              animate="animate"
              transition={{ delay: i * 0.1, duration: 0.4 }}
            >
              <Card className="shadow-card hover:shadow-card-hover transition-shadow">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                        {stat.title}
                      </p>
                      <p className="mt-2 text-2xl font-bold font-mono text-foreground">
                        {stat.value}
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">{stat.subtitle}</p>
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

      {/* Charts & alerts row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sales chart */}
        <motion.div
          className="lg:col-span-2"
          variants={fadeIn}
          initial="initial"
          animate="animate"
          transition={{ delay: 0.4, duration: 0.4 }}
        >
          <Card className="shadow-card">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-semibold">Sales Overview</CardTitle>
                <div className="flex items-center gap-1.5 text-xs text-success font-medium">
                  <TrendingUp className="h-3.5 w-3.5" />
                  Last 7 days
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="h-[260px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData}>
                    <defs>
                      <linearGradient id="salesGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="hsl(221 83% 53%)" stopOpacity={0.2} />
                        <stop offset="100%" stopColor="hsl(221 83% 53%)" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(220 13% 91%)" />
                    <XAxis
                      dataKey="date"
                      tick={{ fontSize: 12, fill: "hsl(220 9% 46%)" }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      tick={{ fontSize: 12, fill: "hsl(220 9% 46%)" }}
                      axisLine={false}
                      tickLine={false}
                      tickFormatter={(v) => `$${v}`}
                    />
                    <Tooltip
                      contentStyle={{
                        borderRadius: "8px",
                        border: "1px solid hsl(220 13% 91%)",
                        boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.06)",
                        fontSize: "13px",
                      }}
                      formatter={(value: number) => [`$${value}`, "Revenue"]}
                    />
                    <Area
                      type="monotone"
                      dataKey="sales"
                      stroke="hsl(221 83% 53%)"
                      strokeWidth={2.5}
                      fill="url(#salesGradient)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Low stock alerts */}
        <motion.div
          variants={fadeIn}
          initial="initial"
          animate="animate"
          transition={{ delay: 0.5, duration: 0.4 }}
        >
          <Card className="shadow-card h-full">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-semibold">Stock Alerts</CardTitle>
                <button
                  onClick={() => navigate("/alerts")}
                  className="text-xs font-medium text-primary hover:underline flex items-center gap-1"
                >
                  View all <ArrowUpRight className="h-3 w-3" />
                </button>
              </div>
            </CardHeader>
            <CardContent className="space-y-3 pt-0">
              {unresolvedAlerts.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">
                  All stock levels are healthy ✓
                </p>
              ) : (
                unresolvedAlerts.slice(0, 5).map((alert) => (
                  <div
                    key={alert.id}
                    className={`flex items-center gap-3 rounded-lg border p-3 ${
                      alert.type === "out_of_stock" ? "stock-critical" : "stock-warning"
                    }`}
                  >
                    <AlertTriangle className="h-4 w-4 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{alert.productName}</p>
                      <p className="text-xs opacity-75">
                        {alert.type === "out_of_stock" ? "Out of stock" : `${alert.currentQuantity} left`}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Recent transactions */}
      <motion.div
        variants={fadeIn}
        initial="initial"
        animate="animate"
        transition={{ delay: 0.6, duration: 0.4 }}
      >
        <Card className="shadow-card">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-semibold">Recent Transactions</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="pb-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Transaction</th>
                    <th className="pb-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Items</th>
                    <th className="pb-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Payment</th>
                    <th className="pb-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Cashier</th>
                    <th className="pb-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {sales.slice(0, 6).map((sale) => (
                    <tr key={sale.id} className="hover:bg-muted/50 transition-colors">
                      <td className="py-3 font-mono text-xs text-muted-foreground">{sale.transactionId}</td>
                      <td className="py-3">
                        <span className="text-sm">{sale.items.map((i) => i.productName).join(", ")}</span>
                      </td>
                      <td className="py-3">
                        <Badge variant="secondary" className="text-xs capitalize font-medium">
                          {sale.paymentMethod}
                        </Badge>
                      </td>
                      <td className="py-3 text-sm text-muted-foreground">{sale.cashier}</td>
                      <td className="py-3 text-right font-mono font-semibold">${sale.total.toFixed(2)}</td>
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
