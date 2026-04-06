import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Não autorizado" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Verify user from token
    const supabaseUser = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: userError } = await supabaseUser.auth.getUser();
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: "Usuário não encontrado" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check if user has plano clinica using admin client (bypasses RLS)
    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("id, nome, plano")
      .eq("id", user.id)
      .single();

    if (!profile || profile.plano !== "clinica") {
      return new Response(
        JSON.stringify({ error: "Apenas usuários do plano Clínica podem adicionar médicos" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Find or create clinica for this user
    let { data: clinica } = await supabaseAdmin
      .from("clinicas")
      .select("id")
      .eq("responsavel_id", user.id)
      .single();

    if (!clinica) {
      const { data: novaClinica, error: clinicaError } = await supabaseAdmin
        .from("clinicas")
        .insert({ nome: `Clínica de ${profile.nome}`, responsavel_id: user.id })
        .select("id")
        .single();

      if (clinicaError || !novaClinica) {
        return new Response(
          JSON.stringify({ error: "Erro ao criar clínica" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Update the responsavel's own profile with clinica_id
      await supabaseAdmin
        .from("profiles")
        .update({ clinica_id: novaClinica.id })
        .eq("id", user.id);

      clinica = novaClinica;
    }

    // Check 5 doctor limit
    const { count } = await supabaseAdmin
      .from("profiles")
      .select("*", { count: "exact", head: true })
      .eq("clinica_id", clinica.id);

    if (count !== null && count >= 5) {
      return new Response(
        JSON.stringify({ error: "Limite de 5 médicos atingido no plano Clínica" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const body = await req.json();
    const { nome, email, senha, especialidade } = body;
    console.log("Dados recebidos do formulário:", JSON.stringify({ nome, email, especialidade }));
    if (!nome || !email || !senha) {
      return new Response(
        JSON.stringify({ error: "Nome, email e senha são obrigatórios" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (senha.length < 6) {
      return new Response(
        JSON.stringify({ error: "A senha deve ter no mínimo 6 caracteres" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Criando usuário no Auth com nome:", nome);
    const { data: novoUsuario, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password: senha,
      email_confirm: true,
      user_metadata: { nome },
    });

    if (createError) {
      console.log("Erro ao criar usuário:", createError.message);
      return new Response(
        JSON.stringify({ error: createError.message }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Usuário criado, ID:", novoUsuario.user.id);
    console.log("Inserindo profile com:", JSON.stringify({
      id: novoUsuario.user.id,
      nome,
      especialidade: especialidade || null,
      plano: "clinica",
      clinica_id: clinica.id,
      trial_ativo: false,
      trial_usado: false,
    }));

    const { error: profileError } = await supabaseAdmin
      .from("profiles")
      .upsert({
        id: novoUsuario.user.id,
        nome,
        especialidade: especialidade || null,
        plano: "clinica",
        clinica_id: clinica.id,
        trial_ativo: false,
        trial_usado: false,
      }, { onConflict: "id" });

    if (profileError) {
      await supabaseAdmin.auth.admin.deleteUser(novoUsuario.user.id);
      return new Response(
        JSON.stringify({ error: "Erro ao criar perfil do médico" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ success: true, medico_id: novoUsuario.user.id }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: "Erro interno do servidor" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
