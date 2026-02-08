import { useLocation, useNavigate } from "react-router-dom";
import { useStore } from "@/lib/store";
import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  AlertTriangle,
  BarChart3,
  LogOut,
  Store,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

const navItems = [
  { path: "/", label: "Dashboard", icon: LayoutDashboard },
  { path: "/pos", label: "Point of Sale", icon: ShoppingCart },
  { path: "/products", label: "Products", icon: Package },
  { path: "/alerts", label: "Alerts", icon: AlertTriangle },
  { path: "/reports", label: "Reports", icon: BarChart3 },
];

export default function AppSidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout, lowStockCount } = useStore();

  return (
    <aside className="flex h-screen w-64 flex-col bg-sidebar text-sidebar-foreground">
      {/* Brand */}
      <div className="flex items-center gap-3 px-6 py-5 border-b border-sidebar-border">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg gradient-brand">
          <Store className="h-5 w-5 text-primary-foreground" />
        </div>
        <div>
          <h1 className="text-base font-bold text-sidebar-accent-foreground">Swift-Mart</h1>
          <p className="text-xs text-sidebar-foreground/60">Inventory & Sales</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 px-3 py-4">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          const Icon = item.icon;
          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={cn(
                "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200",
                isActive
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground"
              )}
            >
              <Icon className="h-4.5 w-4.5 shrink-0" />
              <span>{item.label}</span>
              {item.path === "/alerts" && lowStockCount > 0 && (
                <Badge
                  variant="destructive"
                  className="ml-auto h-5 min-w-5 px-1.5 text-[10px] font-bold animate-pulse-alert"
                >
                  {lowStockCount}
                </Badge>
              )}
            </button>
          );
        })}
      </nav>

      {/* User section */}
      {user && (
        <div className="border-t border-sidebar-border px-4 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-sidebar-accent text-xs font-bold text-sidebar-accent-foreground">
              {user.name.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-sidebar-accent-foreground truncate">
                {user.name}
              </p>
              <p className="text-xs text-sidebar-foreground/60 capitalize">{user.role}</p>
            </div>
            <button
              onClick={() => { logout(); navigate("/login"); }}
              className="rounded-md p-1.5 text-sidebar-foreground/60 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors"
              title="Sign out"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </aside>
  );
}
