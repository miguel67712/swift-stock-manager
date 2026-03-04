import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import AppSidebar from "./AppSidebar";
import { useState } from "react";
import { Menu } from "lucide-react";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { motion, AnimatePresence, type Variants } from "framer-motion";

const pageVariants: Variants = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.35, ease: "easeOut" as const } },
  exit: { opacity: 0, y: -8, transition: { duration: 0.2 } },
};

export default function AppLayout() {
  const { isAuthenticated, isLoading, profile } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <motion.div className="rounded-full h-10 w-10 border-b-2 border-primary" animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }} />
      </div>
    );
  }

  if (!isAuthenticated) return <Navigate to="/login" replace />;

  // Client gets a full-screen shop without sidebar
  if (profile?.role === "client" || profile?.role === "cashier") {
    return (
      <div className="h-screen overflow-hidden bg-background">
        <Outlet />
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <div className="hidden md:block"><AppSidebar /></div>
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent side="left" className="p-0 w-64">
          <AppSidebar onNavigate={() => setMobileOpen(false)} />
        </SheetContent>
      </Sheet>
      <div className="flex-1 flex flex-col overflow-hidden">
        <motion.header initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.3 }} className="md:hidden flex items-center gap-3 px-4 py-3 border-b border-border bg-card">
          <motion.button onClick={() => setMobileOpen(true)} className="p-1.5 rounded-md hover:bg-muted transition-colors" whileTap={{ scale: 0.9 }}><Menu className="h-5 w-5" /></motion.button>
          <h1 className="text-base font-bold text-foreground">Swift-Mart</h1>
        </motion.header>
        <main className="flex-1 overflow-auto">
          <AnimatePresence mode="wait">
            <motion.div key={location.pathname} variants={pageVariants} initial="initial" animate="animate" exit="exit"><Outlet /></motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}
