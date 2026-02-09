import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";
import { useEffect } from "react";

export type InventoryAlert = Tables<"inventory_alerts">;

export function useAlerts() {
  const queryClient = useQueryClient();

  const { data: alerts = [], isLoading } = useQuery({
    queryKey: ["alerts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("inventory_alerts")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  useEffect(() => {
    const channel = supabase
      .channel("alerts-changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "inventory_alerts" }, () => {
        queryClient.invalidateQueries({ queryKey: ["alerts"] });
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [queryClient]);

  const resolveAlert = useMutation({
    mutationFn: async (alertId: string) => {
      const { error } = await supabase
        .from("inventory_alerts")
        .update({ resolved: true, resolved_at: new Date().toISOString() })
        .eq("id", alertId);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["alerts"] }),
  });

  const unresolvedCount = alerts.filter((a) => !a.resolved).length;

  return { alerts, isLoading, resolveAlert, unresolvedCount };
}
