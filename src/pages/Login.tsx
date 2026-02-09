import { useState } from "react";
import { useNavigate, Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Store, Eye, EyeOff } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";

export default function Login() {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [role, setRole] = useState<"admin" | "manager" | "cashier">("cashier");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const { signIn, signUp, isAuthenticated, isLoading } = useAuth();
  const navigate = useNavigate();

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (isAuthenticated) return <Navigate to="/" replace />;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (isSignUp) {
        if (!fullName.trim()) { setError("Please enter your full name"); setLoading(false); return; }
        const { error } = await signUp(email, password, fullName.trim(), role);
        if (error) { setError(error); setLoading(false); return; }
        toast.success("Account created! You're now signed in.");
        navigate("/", { replace: true });
      } else {
        const { error } = await signIn(email, password);
        if (error) { setError(error); setLoading(false); return; }
        navigate("/", { replace: true });
      }
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
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-20 h-64 w-64 rounded-full bg-primary-foreground/20 blur-3xl" />
          <div className="absolute bottom-20 right-20 h-80 w-80 rounded-full bg-primary-foreground/10 blur-3xl" />
        </div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="relative z-10 text-center"
        >
          <div className="mx-auto mb-8 flex h-20 w-20 items-center justify-center rounded-2xl bg-primary-foreground/20 backdrop-blur-sm">
            <Store className="h-10 w-10 text-primary-foreground" />
          </div>
          <h1 className="text-4xl font-extrabold text-primary-foreground mb-4">Swift-Mart</h1>
          <p className="text-lg text-primary-foreground/80 max-w-sm">
            Streamline your retail operations with intelligent inventory and sales management.
          </p>
        </motion.div>
      </div>

      {/* Right form */}
      <div className="flex w-full lg:w-1/2 items-center justify-center p-6 sm:p-12 bg-background">
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="w-full max-w-md"
        >
          <div className="lg:hidden flex items-center gap-3 mb-8">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl gradient-brand">
              <Store className="h-5 w-5 text-primary-foreground" />
            </div>
            <h1 className="text-2xl font-extrabold text-foreground">Swift-Mart</h1>
          </div>

          <div className="mb-8">
            <h2 className="text-2xl font-bold text-foreground">
              {isSignUp ? "Create an account" : "Welcome back"}
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              {isSignUp ? "Sign up to get started" : "Sign in to access your dashboard"}
            </p>
          </div>

          <Card className="shadow-card border-border/50">
            <CardContent className="p-6">
              <form onSubmit={handleSubmit} className="space-y-4">
                {isSignUp && (
                  <div className="space-y-2">
                    <Label htmlFor="fullName">Full Name</Label>
                    <Input
                      id="fullName"
                      placeholder="Enter your full name"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="h-11"
                    />
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="h-11"
                    autoComplete="email"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Enter your password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="h-11 pr-10"
                      autoComplete={isSignUp ? "new-password" : "current-password"}
                      required
                      minLength={6}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                {isSignUp && (
                  <div className="space-y-2">
                    <Label>Role</Label>
                    <Select value={role} onValueChange={(v) => setRole(v as typeof role)}>
                      <SelectTrigger className="h-11">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="admin">Admin</SelectItem>
                        <SelectItem value="manager">Manager</SelectItem>
                        <SelectItem value="cashier">Cashier</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {error && <p className="text-sm text-destructive font-medium">{error}</p>}

                <Button type="submit" className="w-full h-11 font-semibold" disabled={loading}>
                  {loading ? "Please wait..." : isSignUp ? "Create Account" : "Sign In"}
                </Button>
              </form>
            </CardContent>
          </Card>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            {isSignUp ? "Already have an account?" : "Don't have an account?"}{" "}
            <button
              onClick={() => { setIsSignUp(!isSignUp); setError(""); }}
              className="font-semibold text-primary hover:underline"
            >
              {isSignUp ? "Sign in" : "Sign up"}
            </button>
          </p>
        </motion.div>
      </div>
    </div>
  );
}
