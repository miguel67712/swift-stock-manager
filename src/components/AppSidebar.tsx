import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useProducts } from "@/hooks/useProducts";
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
import { motion, type Variants } from "framer-motion";

const navItems = [
  { path: "/", label: "Dashboard", icon: LayoutDashboard },
  { path: "/pos", label: "Point of Sale", icon: ShoppingCart },
  { path: "/products", label: "Products", icon: Package },
  { path: "/alerts", label: "Alerts", icon: AlertTriangle },
  { path: "/reports", label: "Reports", icon: BarChart3 },
];

interface AppSidebarProps {
  onNavigate?: () => void;
}

const sidebarVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08, delayChildren: 0.15 },
  },
};

const navItemVariants: Variants = {
  hidden: { opacity: 0, x: -20 },
  visible: { opacity: 1, x: 0, transition: { type: "spring" as const, stiffness: 300, damping: 24 } },
};

export default function AppSidebar({ onNavigate }: AppSidebarProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { profile, signOut } = useAuth();
  const { lowStockCount } = useProducts();

  const handleNav = (path: string) => {
    navigate(path);
    onNavigate?.();
  };

  return (
    <aside className="flex h-screen w-64 flex-col bg-sidebar text-sidebar-foreground">
      {/* Brand */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="flex items-center gap-3 px-6 py-5 border-b border-sidebar-border"
      >
        <motion.div
          className="flex h-9 w-9 items-center justify-center rounded-lg gradient-brand"
          whileHover={{ scale: 1.1, rotate: 5 }}
          whileTap={{ scale: 0.95 }}
          transition={{ type: "spring", stiffness: 400, damping: 17 }}
        >
          <Store className="h-5 w-5 text-primary-foreground" />
        </motion.div>
        <div>
          <h1 className="text-base font-bold text-sidebar-accent-foreground">Swift-Mart</h1>
          <p className="text-xs text-sidebar-foreground/60">Inventory & Sales</p>
        </div>
      </motion.div>

      {/* Navigation */}
      <motion.nav
        className="flex-1 space-y-1 px-3 py-4"
        variants={sidebarVariants}
        initial="hidden"
        animate="visible"
      >
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          const Icon = item.icon;
          return (
            <motion.button
              key={item.path}
              variants={navItemVariants}
              onClick={() => handleNav(item.path)}
              whileHover={{ x: 4, transition: { duration: 0.2 } }}
              whileTap={{ scale: 0.97 }}
              className={cn(
                "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200 relative overflow-hidden",
                isActive
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground"
              )}
            >
              {isActive && (
                <motion.div
                  layoutId="activeNav"
                  className="absolute inset-0 bg-sidebar-accent rounded-lg"
                  transition={{ type: "spring", stiffness: 350, damping: 30 }}
                />
              )}
              <span className="relative z-10 flex items-center gap-3 w-full">
                <motion.span
                  animate={isActive ? { scale: [1, 1.2, 1] } : {}}
                  transition={{ duration: 0.3 }}
                >
                  <Icon className="h-4.5 w-4.5 shrink-0" />
                </motion.span>
                <span>{item.label}</span>
                {item.path === "/alerts" && lowStockCount > 0 && (
                  <Badge
                    variant="destructive"
                    className="ml-auto h-5 min-w-5 px-1.5 text-[10px] font-bold animate-pulse-alert"
                  >
                    {lowStockCount}
                  </Badge>
                )}
              </span>
            </motion.button>
          );
        })}
      </motion.nav>

      {/* User section */}
      {profile && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.4 }}
          className="border-t border-sidebar-border px-4 py-4"
        >
          <div className="flex items-center gap-3">
            <motion.div
              className="flex h-8 w-8 items-center justify-center rounded-full bg-sidebar-accent text-xs font-bold text-sidebar-accent-foreground"
              whileHover={{ scale: 1.15 }}
              transition={{ type: "spring", stiffness: 400, damping: 17 }}
            >
              {profile.full_name.charAt(0).toUpperCase()}
            </motion.div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-sidebar-accent-foreground truncate">
                {profile.full_name}
              </p>
              <p className="text-xs text-sidebar-foreground/60 capitalize">{profile.role}</p>
            </div>
            <motion.button
              onClick={() => { signOut(); navigate("/login"); }}
              className="rounded-md p-1.5 text-sidebar-foreground/60 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors"
              title="Sign out"
              whileHover={{ rotate: -15 }}
              whileTap={{ scale: 0.9 }}
            >
              <LogOut className="h-4 w-4" />
            </motion.button>
          </div>
        </motion.div>
      )}
    </aside>
  );
}
