import { Navigate, Outlet } from "react-router-dom";
import { useStore } from "@/lib/store";
import AppSidebar from "./AppSidebar";

export default function AppLayout() {
  const { isAuthenticated } = useStore();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <AppSidebar />
      <main className="flex-1 overflow-auto">
        <Outlet />
      </main>
    </div>
  );
}
