import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, serviceRoleKey, { auth: { autoRefreshToken: false, persistSession: false } });

  const results: string[] = [];

  // Create demo users
  const demoUsers = [
    { email: "admin@swift-mart.com", password: "admin123", full_name: "Administrateur", role: "admin" },
    { email: "manager@swift-mart.com", password: "manager123", full_name: "Manager Swift", role: "manager" },
    { email: "client@swift-mart.com", password: "client123", full_name: "Client Demo", role: "client" },
  ];

  for (const u of demoUsers) {
    const { data: existing } = await supabase.auth.admin.listUsers();
    const alreadyExists = existing?.users?.find((x: any) => x.email === u.email);
    if (alreadyExists) {
      // Reset password to ensure demo credentials work
      await supabase.auth.admin.updateUserById(alreadyExists.id, { password: u.password });
      // Ensure profile exists
      const { data: profileExists } = await supabase.from("profiles").select("id").eq("id", alreadyExists.id).maybeSingle();
      if (!profileExists) {
        await supabase.from("profiles").upsert({ id: alreadyExists.id, full_name: u.full_name, username: u.email.split("@")[0], role: u.role });
        await supabase.from("user_roles").upsert({ user_id: alreadyExists.id, role: u.role });
      }
      results.push(`${u.email} updated`);
      continue;
    }
    const { error } = await supabase.auth.admin.createUser({
      email: u.email,
      password: u.password,
      email_confirm: true,
      user_metadata: { full_name: u.full_name, role: u.role },
    });
    results.push(error ? `${u.email}: ${error.message}` : `${u.email} created`);
  }

  // Seed products
  const { count } = await supabase.from("products").select("*", { count: "exact", head: true });
  if ((count ?? 0) === 0) {
    const products = [
      { name: "Lait Entier 1L", category: "Alimentation", price: 850, quantity: 45, min_threshold: 10, supplier: "Nestlé" },
      { name: "Riz Uncle Ben's 1kg", category: "Alimentation", price: 1500, quantity: 60, min_threshold: 15, supplier: "Mars Inc" },
      { name: "Huile de Palme 1L", category: "Alimentation", price: 1800, quantity: 35, min_threshold: 8, supplier: "Local Farm" },
      { name: "Sucre en Poudre 1kg", category: "Alimentation", price: 900, quantity: 50, min_threshold: 12, supplier: "SOSUCAM" },
      { name: "Farine de Blé 1kg", category: "Alimentation", price: 750, quantity: 40, min_threshold: 10, supplier: "Grands Moulins" },
      { name: "Spaghetti Pasta 500g", category: "Alimentation", price: 650, quantity: 55, min_threshold: 10, supplier: "Barilla" },
      { name: "Sardines en Conserve", category: "Alimentation", price: 500, quantity: 80, min_threshold: 15, supplier: "Gino" },
      { name: "Tomate Concentrée 400g", category: "Alimentation", price: 450, quantity: 70, min_threshold: 12, supplier: "Gino" },
      { name: "Maggi Cube (boîte 100)", category: "Alimentation", price: 2500, quantity: 30, min_threshold: 8, supplier: "Nestlé" },
      { name: "Beurre de Cacahuète 500g", category: "Alimentation", price: 1200, quantity: 25, min_threshold: 5, supplier: "Local" },
      { name: "Lait en Poudre Nido 400g", category: "Alimentation", price: 3200, quantity: 20, min_threshold: 5, supplier: "Nestlé" },
      { name: "Café Moulu 250g", category: "Alimentation", price: 2000, quantity: 18, min_threshold: 5, supplier: "Nescafé" },
      { name: "Thé Lipton 25 sachets", category: "Boissons", price: 1100, quantity: 40, min_threshold: 8, supplier: "Unilever" },
      { name: "Coca-Cola 1.5L", category: "Boissons", price: 750, quantity: 100, min_threshold: 20, supplier: "SABC" },
      { name: "Eau Minérale Supermont 1.5L", category: "Boissons", price: 400, quantity: 120, min_threshold: 25, supplier: "Supermont" },
      { name: "Jus d'Orange Tampico 1L", category: "Boissons", price: 900, quantity: 35, min_threshold: 8, supplier: "Tampico" },
      { name: "Bière 33 Export 65cl", category: "Boissons", price: 600, quantity: 90, min_threshold: 20, supplier: "SABC" },
      { name: "Fanta Orange 1.5L", category: "Boissons", price: 750, quantity: 85, min_threshold: 20, supplier: "SABC" },
      { name: "Vin Rouge Baron 75cl", category: "Boissons", price: 3500, quantity: 15, min_threshold: 5, supplier: "Import France" },
      { name: "Maltina 33cl", category: "Boissons", price: 500, quantity: 60, min_threshold: 12, supplier: "SABC" },
      { name: "Savon Palmolive 200g", category: "Ménage", price: 350, quantity: 65, min_threshold: 15, supplier: "Colgate" },
      { name: "Détergent Omo 900g", category: "Ménage", price: 1800, quantity: 28, min_threshold: 8, supplier: "Unilever" },
      { name: "Eau de Javel 1L", category: "Ménage", price: 500, quantity: 40, min_threshold: 10, supplier: "Local" },
      { name: "Papier Toilette (6 rouleaux)", category: "Ménage", price: 1500, quantity: 30, min_threshold: 8, supplier: "Sita" },
      { name: "Éponge Vaisselle (lot 3)", category: "Ménage", price: 300, quantity: 50, min_threshold: 10, supplier: "Local" },
      { name: "Insecticide Raid 300ml", category: "Ménage", price: 2200, quantity: 3, min_threshold: 5, supplier: "SC Johnson" },
      { name: "Dentifrice Colgate 100ml", category: "Ménage", price: 800, quantity: 45, min_threshold: 10, supplier: "Colgate" },
      { name: "Bougie (paquet 6)", category: "Autre", price: 600, quantity: 2, min_threshold: 5, supplier: "Local" },
      { name: "Allumettes (lot 10)", category: "Autre", price: 250, quantity: 70, min_threshold: 15, supplier: "Local" },
      { name: "Pile AA (pack 4)", category: "Autre", price: 1000, quantity: 4, min_threshold: 5, supplier: "Duracell" },
    ];
    const { error } = await supabase.from("products").insert(products);
    results.push(error ? `Products: ${error.message}` : "30 products seeded");

    // Generate alerts for low stock items
    const lowStockProducts = products.filter(p => p.quantity <= p.min_threshold);
    if (lowStockProducts.length > 0) {
      const alerts = lowStockProducts.map(p => ({
        product_name: p.name,
        alert_type: p.quantity === 0 ? "out_of_stock" : "low_stock",
        current_quantity: p.quantity,
        previous_quantity: p.min_threshold + 1,
      }));
      await supabase.from("inventory_alerts").insert(alerts);
      results.push(`${alerts.length} alerts created`);
    }
  } else {
    results.push(`Products already seeded (${count} found)`);
  }

  return new Response(JSON.stringify({ results }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
});
