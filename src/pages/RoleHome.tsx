import { useAuth } from "@/hooks/useAuth";
import AdminDashboard from "./AdminDashboard";
import ManagerDashboard from "./ManagerDashboard";
import CashierPOS from "./CashierPOS";

export default function RoleHome() {
  const { profile } = useAuth();

  if (profile?.role === "admin") return <AdminDashboard />;
  if (profile?.role === "manager") return <ManagerDashboard />;
  return <CashierPOS />;
}
