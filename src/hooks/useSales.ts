import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";
import { useEffect } from "react";

export type Sale = Tables<"sales">;
export type SaleItem = Tables<"sale_items">;

export interface SaleWithItems extends Sale {
  sale_items: SaleItem[];
}

export function useSales() {
  const queryClient = useQueryClient();

  const { data: sales = [], isLoading } = useQuery({
    queryKey: ["sales"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("sales")
        .select("*, sale_items(*)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as SaleWithItems[];
    },
  });

  useEffect(() => {
    const channel = supabase
      .channel("sales-changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "sales" }, () => {
        queryClient.invalidateQueries({ queryKey: ["sales"] });
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [queryClient]);

  const createSale = useMutation({
    mutationFn: async (saleData: {
      transactionId: string;
      items: { productId: string; productName: string; quantity: number; unitPrice: number; totalPrice: number }[];
      subtotal: number;
      tax: number;
      total: number;
      paymentMethod: "cash" | "card" | "mobile";
      cashierId: string;
      cashierName: string;
    }) => {
      // 1. Create the sale
      const { data: sale, error: saleError } = await supabase
        .from("sales")
        .insert({
          transaction_id: saleData.transactionId,
          subtotal: saleData.subtotal,
          tax: saleData.tax,
          total: saleData.total,
          payment_method: saleData.paymentMethod,
          cashier_id: saleData.cashierId,
          cashier_name: saleData.cashierName,
        })
        .select()
        .single();
      if (saleError) throw saleError;

      // 2. Create sale items
      const saleItems = saleData.items.map((item) => ({
        sale_id: sale.id,
        product_id: item.productId,
        product_name: item.productName,
        quantity: item.quantity,
        unit_price: item.unitPrice,
        total_price: item.totalPrice,
      }));
      const { error: itemsError } = await supabase.from("sale_items").insert(saleItems);
      if (itemsError) throw itemsError;

      // 3. Deduct stock for each product
      for (const item of saleData.items) {
        const { data: product } = await supabase
          .from("products")
          .select("quantity")
          .eq("id", item.productId)
          .single();
        if (product) {
          await supabase
            .from("products")
            .update({ quantity: Math.max(0, product.quantity - item.quantity) })
            .eq("id", item.productId);
        }
      }

      return { ...sale, sale_items: saleItems } as SaleWithItems;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sales"] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
    },
  });

  const todaysSalesTotal = sales
    .filter((s) => new Date(s.created_at).toDateString() === new Date().toDateString())
    .reduce((sum, s) => sum + Number(s.total), 0);

  const todaysSalesCount = sales.filter(
    (s) => new Date(s.created_at).toDateString() === new Date().toDateString()
  ).length;

  return { sales, isLoading, createSale, todaysSalesTotal, todaysSalesCount };
}
