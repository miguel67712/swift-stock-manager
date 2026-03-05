import { useState } from "react";
import { useNavigate, Navigate, Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useI18n } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Store, Eye, EyeOff, ShoppingCart, Package, BarChart3, Globe } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";

const floatingIcons = [
  { Icon: ShoppingCart, x: "15%", y: "20%", delay: 0 },
  { Icon: Package, x: "75%", y: "35%", delay: 0.5 },
  { Icon: BarChart3, x: "25%", y: "70%", delay: 1 },
  { Icon: Store, x: "80%", y: "75%", delay: 1.5 },
];

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const { signIn, isAuthenticated, isLoading } = useAuth();
  const { t, toggleLang, lang } = useI18n();
  const navigate = useNavigate();

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <motion.div className="rounded-full h-10 w-10 border-b-2 border-primary" animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }} />
      </div>
    );
  }

  if (isAuthenticated) return <Navigate to="/" replace />;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const { error } = await signIn(email, password);
      if (error) { setError(error); setLoading(false); return; }
      navigate("/", { replace: true });
    } catch {
      setError("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen">
      {/* Left branding panel */}
      <div className="hidden lg:flex lg:w-1/2 gradient-brand items-center justify-center p-12 relative overflow-hidden">
        <motion.div className="absolute top-20 left-20 h-64 w-64 rounded-full bg-primary-foreground/10 blur-3xl" animate={{ scale: [1, 1.2, 1], x: [0, 30, 0], y: [0, -20, 0] }} transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }} />
        <motion.div className="absolute bottom-20 right-20 h-80 w-80 rounded-full bg-primary-foreground/5 blur-3xl" animate={{ scale: [1, 1.3, 1], x: [0, -20, 0], y: [0, 30, 0] }} transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 1 }} />
        {floatingIcons.map(({ Icon, x, y, delay }, i) => (
          <motion.div key={i} className="absolute text-primary-foreground/15" style={{ left: x, top: y }} animate={{ y: [0, -15, 0], rotate: [0, 10, -10, 0] }} transition={{ duration: 4 + i, repeat: Infinity, ease: "easeInOut", delay }}>
            <Icon className="h-8 w-8" />
          </motion.div>
        ))}
        <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }} className="relative z-10 text-center">
          <motion.div className="mx-auto mb-8 flex h-20 w-20 items-center justify-center rounded-2xl bg-primary-foreground/20 backdrop-blur-sm" animate={{ y: [0, -8, 0] }} transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }} whileHover={{ scale: 1.1, rotate: 5 }}>
            <Store className="h-10 w-10 text-primary-foreground" />
          </motion.div>
          <motion.h1 className="text-4xl font-extrabold text-primary-foreground mb-4" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3, duration: 0.6 }}>Swift-Mart</motion.h1>
          <motion.p className="text-lg text-primary-foreground/80 max-w-sm" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5, duration: 0.6 }}>{t("login.branding")}</motion.p>
        </motion.div>
      </div>

      {/* Right form */}
      <div className="flex w-full lg:w-1/2 items-center justify-center p-6 sm:p-12 bg-background relative">
        <motion.button onClick={toggleLang} className="absolute top-4 right-4 flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors shadow-sm" whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
          <Globe className="h-3.5 w-3.5" /> {lang === "fr" ? "English" : "Français"}
        </motion.button>

        <motion.div initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }} className="w-full max-w-md">
          <motion.div className="lg:hidden flex items-center gap-3 mb-8" initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <motion.div className="flex h-10 w-10 items-center justify-center rounded-xl gradient-brand" whileHover={{ scale: 1.1, rotate: 5 }} whileTap={{ scale: 0.95 }}>
              <Store className="h-5 w-5 text-primary-foreground" />
            </motion.div>
            <h1 className="text-2xl font-extrabold text-foreground">Swift-Mart</h1>
          </motion.div>

          <div className="mb-8">
            <h2 className="text-2xl font-bold text-foreground">{t("login.title")}</h2>
            <p className="mt-2 text-sm text-muted-foreground">{t("login.subtitle")}</p>
          </div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3, duration: 0.5 }}>
            <Card className="shadow-card border-border/50 hover-glow">
              <CardContent className="p-6">
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">{t("login.email")}</Label>
                    <Input id="email" type="email" placeholder="you@swift-mart.com" value={email} onChange={(e) => setEmail(e.target.value)} className="h-11" autoComplete="email" required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password">{t("login.password")}</Label>
                    <div className="relative">
                      <Input id="password" type={showPassword ? "text" : "password"} placeholder={t("login.passwordPlaceholder")} value={password} onChange={(e) => setPassword(e.target.value)} className="h-11 pr-10" autoComplete="current-password" required minLength={6} />
                      <motion.button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors" whileTap={{ scale: 0.85 }}>
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </motion.button>
                    </div>
                  </div>
                  <AnimatePresence mode="wait">
                    {error && <motion.p initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }} className="text-sm text-destructive font-medium">{error}</motion.p>}
                  </AnimatePresence>
                  <motion.div whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }}>
                    <Button type="submit" className="w-full h-11 font-semibold" disabled={loading}>
                      {loading ? (
                        <motion.span className="flex items-center gap-2" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                          <motion.span className="h-4 w-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full" animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }} />
                          {t("login.connecting")}
                        </motion.span>
                      ) : t("login.signIn")}
                    </Button>
                  </motion.div>
                </form>
              </CardContent>
            </Card>
          </motion.div>

          <motion.button type="button" className="mt-4 w-full text-center text-sm text-primary hover:underline font-medium" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }} onClick={() => toast.info(t("login.forgotMsg"))}>
            {t("login.forgot")}
          </motion.button>

          <p className="mt-2 text-center text-sm text-muted-foreground">
            {t("login.noAccount")}{" "}
            <span className="text-primary font-medium cursor-pointer" onClick={() => toast.info("Contactez votre manager pour créer un compte client.")}>
              {t("login.registerLink")}
            </span>
          </p>

          <motion.div className="mt-6 rounded-lg border border-border bg-muted/50 p-4" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7, duration: 0.4 }}>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">{t("login.demoAccounts")}</p>
            <div className="space-y-1.5 text-xs text-muted-foreground font-mono">
              <p>👑 admin@swift-mart.com (admin123)</p>
              <p>📊 manager@swift-mart.com (manager123)</p>
              <p>👤 client@swift-mart.com (client123)</p>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}
