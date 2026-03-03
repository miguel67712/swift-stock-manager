import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useProducts } from "@/hooks/useProducts";
import { useI18n } from "@/lib/i18n";
import { LayoutDashboard, ShoppingCart, Package, AlertTriangle, BarChart3, LogOut, Store, Globe, Shield, Users, Settings } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { motion, type Variants } from "framer-motion";
import { useMemo } from "react";

interface AppSidebarProps { onNavigate?: () => void; }

const sidebarVariants: Variants = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.08, delayChildren: 0.15 } } };
const navItemVariants: Variants = { hidden: { opacity: 0, x: -20 }, visible: { opacity: 1, x: 0, transition: { type: "spring" as const, stiffness: 300, damping: 24 } } };

export default function AppSidebar({ onNavigate }: AppSidebarProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { profile, signOut } = useAuth();
  const { lowStockCount } = useProducts();
  const { t, toggleLang, lang } = useI18n();
  const handleNav = (path: string) => { navigate(path); onNavigate?.(); };

  const role = profile?.role;

  const navItems = useMemo(() => {
    if (role === "admin") {
      return [
        { path: "/", label: t("nav.dashboard"), icon: Shield },
        { path: "/products", label: t("nav.products"), icon: Package },
        { path: "/alerts", label: t("nav.alerts"), icon: AlertTriangle },
        { path: "/reports", label: t("nav.reports"), icon: BarChart3 },
      ];
    }
    if (role === "manager") {
      return [
        { path: "/", label: t("nav.dashboard"), icon: BarChart3 },
        { path: "/products", label: t("nav.products"), icon: Package },
        { path: "/alerts", label: t("nav.alerts"), icon: AlertTriangle },
        { path: "/reports", label: t("nav.reports"), icon: BarChart3 },
      ];
    }
    // cashier - minimal nav
    return [
      { path: "/", label: t("nav.pos"), icon: ShoppingCart },
    ];
  }, [role, t]);

  const roleLabel = role === "admin" ? "Admin" : role === "manager" ? "Manager" : "Caissier";

  return (
    <aside className="flex h-screen w-64 flex-col bg-sidebar text-sidebar-foreground">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="flex items-center gap-3 px-6 py-5 border-b border-sidebar-border">
        <motion.div className="flex h-9 w-9 items-center justify-center rounded-lg gradient-brand" whileHover={{ scale: 1.1, rotate: 5 }} whileTap={{ scale: 0.95 }}>
          <Store className="h-5 w-5 text-primary-foreground" />
        </motion.div>
        <div>
          <h1 className="text-base font-bold text-sidebar-accent-foreground">Swift-Mart</h1>
          <p className="text-xs text-sidebar-foreground/60">{roleLabel}</p>
        </div>
      </motion.div>

      <motion.nav className="flex-1 space-y-1 px-3 py-4" variants={sidebarVariants} initial="hidden" animate="visible">
        {navItems.map((navItem) => {
          const isActive = location.pathname === navItem.path;
          const Icon = navItem.icon;
          return (
            <motion.button key={navItem.path} variants={navItemVariants} onClick={() => handleNav(navItem.path)} whileHover={{ x: 4, transition: { duration: 0.2 } }} whileTap={{ scale: 0.97 }}
              className={cn("flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200 relative overflow-hidden", isActive ? "bg-sidebar-accent text-sidebar-accent-foreground" : "text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground")}>
              {isActive && <motion.div layoutId="activeNav" className="absolute inset-0 bg-sidebar-accent rounded-lg" transition={{ type: "spring", stiffness: 350, damping: 30 }} />}
              <span className="relative z-10 flex items-center gap-3 w-full">
                <Icon className="h-4.5 w-4.5 shrink-0" />
                <span>{navItem.label}</span>
                {navItem.path === "/alerts" && lowStockCount > 0 && <Badge variant="destructive" className="ml-auto h-5 min-w-5 px-1.5 text-[10px] font-bold animate-pulse-alert">{lowStockCount}</Badge>}
              </span>
            </motion.button>
          );
        })}

        {/* Language toggle */}
        <motion.button
          variants={navItemVariants}
          onClick={toggleLang}
          whileHover={{ x: 4, transition: { duration: 0.2 } }}
          whileTap={{ scale: 0.97 }}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground transition-all duration-200 mt-4 border-t border-sidebar-border pt-4"
        >
          <Globe className="h-4.5 w-4.5 shrink-0" />
          <span>{lang === "fr" ? "English" : "Français"}</span>
          <Badge variant="secondary" className="ml-auto text-[10px] font-bold">{lang.toUpperCase()}</Badge>
        </motion.button>
      </motion.nav>

      {profile && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="border-t border-sidebar-border px-4 py-4">
          <div className="flex items-center gap-3">
            <motion.div className="flex h-8 w-8 items-center justify-center rounded-full bg-sidebar-accent text-xs font-bold text-sidebar-accent-foreground" whileHover={{ scale: 1.15 }}>{profile.full_name.charAt(0).toUpperCase()}</motion.div>
            <div className="flex-1 min-w-0"><p className="text-sm font-medium text-sidebar-accent-foreground truncate">{profile.full_name}</p><p className="text-xs text-sidebar-foreground/60 capitalize">{profile.role}</p></div>
            <motion.button onClick={() => { signOut(); navigate("/login"); }} className="rounded-md p-1.5 text-sidebar-foreground/60 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors" title={t("sidebar.logout")} whileHover={{ rotate: -15 }} whileTap={{ scale: 0.9 }}><LogOut className="h-4 w-4" /></motion.button>
          </div>
        </motion.div>
      )}
    </aside>
  );
}
