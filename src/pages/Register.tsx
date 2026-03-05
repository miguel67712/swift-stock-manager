import { useState } from "react";
import { useNavigate, Navigate, Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useI18n } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Store, Eye, EyeOff, Globe } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function Register() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const { signUp, isAuthenticated, isLoading } = useAuth();
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
    if (password.length < 6) {
      setError(t("register.passwordMin"));
      return;
    }
    setLoading(true);
    try {
      const { error } = await signUp(email, password, fullName, "client");
      if (error) { setError(error); setLoading(false); return; }
      navigate("/", { replace: true });
    } catch {
      setError("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center p-6 bg-background relative">
      <motion.button
        onClick={toggleLang}
        className="absolute top-4 right-4 flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors shadow-sm"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        <Globe className="h-3.5 w-3.5" />
        {lang === "fr" ? "English" : "Français"}
      </motion.button>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="w-full max-w-md">
        <div className="flex items-center gap-3 mb-6 justify-center">
          <motion.div className="flex h-10 w-10 items-center justify-center rounded-xl gradient-brand" whileHover={{ scale: 1.1, rotate: 5 }}>
            <Store className="h-5 w-5 text-primary-foreground" />
          </motion.div>
          <h1 className="text-2xl font-extrabold text-foreground">Swift-Mart</h1>
        </div>

        <div className="mb-6 text-center">
          <h2 className="text-2xl font-bold text-foreground">{t("register.title")}</h2>
          <p className="mt-2 text-sm text-muted-foreground">{t("register.subtitle")}</p>
        </div>

        <Card className="shadow-card border-border/50">
          <CardContent className="p-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="fullName">{t("register.fullName")}</Label>
                <Input id="fullName" type="text" placeholder={t("register.fullNamePlaceholder")} value={fullName} onChange={(e) => setFullName(e.target.value)} className="h-11" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">{t("login.email")}</Label>
                <Input id="email" type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} className="h-11" autoComplete="email" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">{t("login.password")}</Label>
                <div className="relative">
                  <Input id="password" type={showPassword ? "text" : "password"} placeholder={t("login.passwordPlaceholder")} value={password} onChange={(e) => setPassword(e.target.value)} className="h-11 pr-10" autoComplete="new-password" required minLength={6} />
                  <motion.button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors" whileTap={{ scale: 0.85 }}>
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </motion.button>
                </div>
              </div>
              <AnimatePresence mode="wait">
                {error && <motion.p initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }} className="text-sm text-destructive font-medium">{error}</motion.p>}
              </AnimatePresence>
              <Button type="submit" className="w-full h-11 font-semibold" disabled={loading}>
                {loading ? (
                  <motion.span className="flex items-center gap-2" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                    <motion.span className="h-4 w-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full" animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }} />
                    {t("register.creating")}
                  </motion.span>
                ) : t("register.signUp")}
              </Button>
            </form>
          </CardContent>
        </Card>

        <p className="mt-4 text-center text-sm text-muted-foreground">
          {t("register.hasAccount")}{" "}
          <Link to="/login" className="text-primary hover:underline font-medium">{t("register.loginLink")}</Link>
        </p>
      </motion.div>
    </div>
  );
}
