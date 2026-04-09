import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Tables, TablesInsert, TablesUpdate } from "@/integrations/supabase/types";
import { useEffect, useState } from "react";

export type Product = Tables<"products">;

function isDemoMode(): boolean {
  try {
    const hostname = window.location.hostname.toLowerCase();
    return (
      hostname.includes("preview") ||
      hostname.includes("lovable.app") ||
      hostname.includes("lovableproject.com") ||
      hostname === "localhost" ||
      hostname === "127.0.0.1"
    );
  } catch { return false; }
}

const DEMO_PRODUCTS: Product[] = [
  { id: "p1", name: "Lait Entier 1L", category: "Alimentation", price: 850, quantity: 45, min_threshold: 10, supplier: "Nestlé", barcode: null, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: "p2", name: "Riz Uncle Ben's 1kg", category: "Alimentation", price: 1500, quantity: 60, min_threshold: 15, supplier: "Mars Inc", barcode: null, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: "p3", name: "Huile de Palme 1L", category: "Alimentation", price: 1800, quantity: 35, min_threshold: 8, supplier: "Local Farm", barcode: null, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: "p4", name: "Sucre en Poudre 1kg", category: "Alimentation", price: 900, quantity: 50, min_threshold: 12, supplier: "SOSUCAM", barcode: null, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: "p5", name: "Farine de Blé 1kg", category: "Alimentation", price: 750, quantity: 40, min_threshold: 10, supplier: "Grands Moulins", barcode: null, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: "p6", name: "Spaghetti Pasta 500g", category: "Alimentation", price: 650, quantity: 55, min_threshold: 10, supplier: "Barilla", barcode: null, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: "p7", name: "Sardines en Conserve", category: "Alimentation", price: 500, quantity: 80, min_threshold: 15, supplier: "Gino", barcode: null, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: "p8", name: "Tomate Concentrée 400g", category: "Alimentation", price: 450, quantity: 70, min_threshold: 12, supplier: "Gino", barcode: null, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: "p9", name: "Maggi Cube (boîte 100)", category: "Alimentation", price: 2500, quantity: 30, min_threshold: 8, supplier: "Nestlé", barcode: null, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: "p10", name: "Beurre de Cacahuète 500g", category: "Alimentation", price: 1200, quantity: 25, min_threshold: 5, supplier: "Local", barcode: null, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: "p11", name: "Lait en Poudre Nido 400g", category: "Alimentation", price: 3200, quantity: 20, min_threshold: 5, supplier: "Nestlé", barcode: null, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: "p12", name: "Café Moulu 250g", category: "Alimentation", price: 2000, quantity: 18, min_threshold: 5, supplier: "Nescafé", barcode: null, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: "p13", name: "Thé Lipton 25 sachets", category: "Boissons", price: 1100, quantity: 40, min_threshold: 8, supplier: "Unilever", barcode: null, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: "p14", name: "Coca-Cola 1.5L", category: "Boissons", price: 750, quantity: 100, min_threshold: 20, supplier: "SABC", barcode: null, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: "p15", name: "Eau Minérale Supermont 1.5L", category: "Boissons", price: 400, quantity: 120, min_threshold: 25, supplier: "Supermont", barcode: null, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: "p16", name: "Jus d'Orange Tampico 1L", category: "Boissons", price: 900, quantity: 35, min_threshold: 8, supplier: "Tampico", barcode: null, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: "p17", name: "Bière 33 Export 65cl", category: "Boissons", price: 600, quantity: 90, min_threshold: 20, supplier: "SABC", barcode: null, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: "p18", name: "Fanta Orange 1.5L", category: "Boissons", price: 750, quantity: 85, min_threshold: 20, supplier: "SABC", barcode: null, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: "p19", name: "Vin Rouge Baron 75cl", category: "Boissons", price: 3500, quantity: 15, min_threshold: 5, supplier: "Import France", barcode: null, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: "p20", name: "Maltina 33cl", category: "Boissons", price: 500, quantity: 60, min_threshold: 12, supplier: "SABC", barcode: null, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: "p21", name: "Savon Palmolive 200g", category: "Ménage", price: 350, quantity: 65, min_threshold: 15, supplier: "Colgate", barcode: null, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: "p22", name: "Détergent Omo 900g", category: "Ménage", price: 1800, quantity: 28, min_threshold: 8, supplier: "Unilever", barcode: null, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: "p23", name: "Eau de Javel 1L", category: "Ménage", price: 500, quantity: 40, min_threshold: 10, supplier: "Local", barcode: null, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: "p24", name: "Papier Toilette (6 rouleaux)", category: "Ménage", price: 1500, quantity: 30, min_threshold: 8, supplier: "Sita", barcode: null, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: "p25", name: "Éponge Vaisselle (lot 3)", category: "Ménage", price: 300, quantity: 50, min_threshold: 10, supplier: "Local", barcode: null, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: "p26", name: "Insecticide Raid 300ml", category: "Ménage", price: 2200, quantity: 3, min_threshold: 5, supplier: "SC Johnson", barcode: null, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: "p27", name: "Dentifrice Colgate 100ml", category: "Ménage", price: 800, quantity: 45, min_threshold: 10, supplier: "Colgate", barcode: null, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: "p28", name: "Bougie (paquet 6)", category: "Autre", price: 600, quantity: 2, min_threshold: 5, supplier: "Local", barcode: null, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: "p29", name: "Allumettes (lot 10)", category: "Autre", price: 250, quantity: 70, min_threshold: 15, supplier: "Local", barcode: null, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: "p30", name: "Pile AA (pack 4)", category: "Autre", price: 1000, quantity: 4, min_threshold: 5, supplier: "Duracell", barcode: null, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
];

const DEMO_STORAGE_KEY = "demo_products";

function getDemoProducts(): Product[] {
  try {
    const stored = localStorage.getItem(DEMO_STORAGE_KEY);
    if (stored) return JSON.parse(stored);
  } catch {}
  localStorage.setItem(DEMO_STORAGE_KEY, JSON.stringify(DEMO_PRODUCTS));
  return [...DEMO_PRODUCTS];
}

function saveDemoProducts(products: Product[]) {
  localStorage.setItem(DEMO_STORAGE_KEY, JSON.stringify(products));
}

export function useProducts() {
  const queryClient = useQueryClient();
  const demo = isDemoMode();

  const { data: products = [], isLoading, error } = useQuery({
    queryKey: ["products"],
    queryFn: async () => {
      if (demo) return getDemoProducts();
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  // Realtime subscription (only when not demo)
  useEffect(() => {
    if (demo) return;
    const channel = supabase
      .channel("products-changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "products" }, () => {
        queryClient.invalidateQueries({ queryKey: ["products"] });
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [queryClient, demo]);

  const addProduct = useMutation({
    mutationFn: async (product: Omit<TablesInsert<"products">, "id" | "created_at" | "updated_at">) => {
      if (demo) {
        const current = getDemoProducts();
        const newProduct: Product = {
          ...product,
          id: `p${Date.now()}`,
          barcode: product.barcode ?? null,
          supplier: product.supplier ?? null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        } as Product;
        current.unshift(newProduct);
        saveDemoProducts(current);
        return newProduct;
      }
      const { data, error } = await supabase.from("products").insert(product).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["products"] }),
  });

  const updateProduct = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: TablesUpdate<"products"> }) => {
      if (demo) {
        const current = getDemoProducts();
        const idx = current.findIndex(p => p.id === id);
        if (idx >= 0) {
          current[idx] = { ...current[idx], ...updates, updated_at: new Date().toISOString() } as Product;
          saveDemoProducts(current);
        }
        return current[idx];
      }
      const { data, error } = await supabase.from("products").update(updates).eq("id", id).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["products"] }),
  });

  const deleteProduct = useMutation({
    mutationFn: async (id: string) => {
      if (demo) {
        const current = getDemoProducts().filter(p => p.id !== id);
        saveDemoProducts(current);
        return;
      }
      const { error } = await supabase.from("products").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["products"] }),
  });

  const lowStockCount = products.filter((p) => p.quantity <= p.min_threshold).length;

  return { products, isLoading, error, addProduct, updateProduct, deleteProduct, lowStockCount };
}
