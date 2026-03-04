import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    // Verify the caller is admin or manager
    const authHeader = req.headers.get("Authorization")!;
    const token = authHeader.replace("Bearer ", "");
    const { data: { user: caller } } = await supabaseAdmin.auth.getUser(token);
    if (!caller) throw new Error("Not authenticated");

    const { data: callerProfile } = await supabaseAdmin
      .from("profiles")
      .select("role")
      .eq("id", caller.id)
      .single();
    if (!callerProfile) throw new Error("Profile not found");

    const body = await req.json();
    const { action } = body;

    if (action === "create") {
      const { email, password, fullName, role } = body;
      
      // Admin can only create managers, Manager can only create clients
      if (callerProfile.role === "admin" && role !== "manager") {
        throw new Error("Admin can only create manager accounts");
      }
      if (callerProfile.role === "manager" && role !== "client") {
        throw new Error("Manager can only create client accounts");
      }
      if (callerProfile.role !== "admin" && callerProfile.role !== "manager") {
        throw new Error("Unauthorized");
      }

      const { data, error } = await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { full_name: fullName, role },
      });
      if (error) throw error;

      return new Response(JSON.stringify({ user: data.user }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "list") {
      const { role: filterRole } = body;
      
      // Admin lists managers, Manager lists clients
      if (callerProfile.role === "admin" && filterRole !== "manager") {
        throw new Error("Admin can only list managers");
      }
      if (callerProfile.role === "manager" && filterRole !== "client") {
        throw new Error("Manager can only list clients");
      }

      const { data: profiles } = await supabaseAdmin
        .from("profiles")
        .select("*")
        .eq("role", filterRole)
        .order("created_at", { ascending: false });

      return new Response(JSON.stringify({ users: profiles || [] }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "delete") {
      const { userId } = body;
      
      // Verify the target user's role
      const { data: targetProfile } = await supabaseAdmin
        .from("profiles")
        .select("role")
        .eq("id", userId)
        .single();
      if (!targetProfile) throw new Error("User not found");

      if (callerProfile.role === "admin" && targetProfile.role !== "manager") {
        throw new Error("Admin can only delete managers");
      }
      if (callerProfile.role === "manager" && targetProfile.role !== "client") {
        throw new Error("Manager can only delete clients");
      }

      const { error } = await supabaseAdmin.auth.admin.deleteUser(userId);
      if (error) throw error;

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "reset-password") {
      const { userId, newPassword } = body;
      
      const { data: targetProfile } = await supabaseAdmin
        .from("profiles")
        .select("role")
        .eq("id", userId)
        .single();
      if (!targetProfile) throw new Error("User not found");

      if (callerProfile.role === "manager" && targetProfile.role !== "client") {
        throw new Error("Manager can only reset client passwords");
      }

      const { error } = await supabaseAdmin.auth.admin.updateUserById(userId, { password: newPassword });
      if (error) throw error;

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    throw new Error("Unknown action");
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
