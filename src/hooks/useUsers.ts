import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface ManagedUser {
  id: string;
  full_name: string;
  username: string;
  role: string;
  created_at: string;
  updated_at: string;
}

export function useUsers(role: "manager" | "client") {
  const queryClient = useQueryClient();

  const { data: users = [], isLoading } = useQuery({
    queryKey: ["managed-users", role],
    queryFn: async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Not authenticated");

      const { data, error } = await supabase.functions.invoke("manage-users", {
        body: { action: "list", role },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      return (data?.users || []) as ManagedUser[];
    },
  });

  const createUser = useMutation({
    mutationFn: async (userData: { email: string; password: string; fullName: string; role: "manager" | "client" }) => {
      const { data, error } = await supabase.functions.invoke("manage-users", {
        body: { action: "create", ...userData },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["managed-users", role] }),
  });

  const deleteUser = useMutation({
    mutationFn: async (userId: string) => {
      const { data, error } = await supabase.functions.invoke("manage-users", {
        body: { action: "delete", userId },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["managed-users", role] }),
  });

  const resetPassword = useMutation({
    mutationFn: async ({ userId, newPassword }: { userId: string; newPassword: string }) => {
      const { data, error } = await supabase.functions.invoke("manage-users", {
        body: { action: "reset-password", userId, newPassword },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      return data;
    },
  });

  return { users, isLoading, createUser, deleteUser, resetPassword };
}
