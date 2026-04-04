import { supabase } from "@/integrations/supabase/client";

interface CriarMedicoParams {
  nome: string;
  email: string;
  senha: string;
  especialidade?: string;
}

export async function criarMedico(params: CriarMedicoParams) {
  const { data: { session } } = await supabase.auth.getSession();

  if (!session) throw new Error("Não autenticado");

  const response = await fetch(
    `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/criar-medico`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${session.access_token}`,
        "apikey": import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
      },
      body: JSON.stringify(params),
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || "Erro ao criar médico");
  }

  return data;
}
