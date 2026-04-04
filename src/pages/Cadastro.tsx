import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { Logo } from "@/components/Logo";
import { useToast } from "@/hooks/use-toast";

export default function Cadastro() {
  const [searchParams] = useSearchParams();
  const plano = searchParams.get("plano") || "solo";
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // Check if this email already used the trial
    if (plano === "trial") {
      const { data: existingProfiles } = await supabase
        .from("profiles")
        .select("trial_usado")
        .eq("id", email); // We can't query by email in profiles directly

      // Instead, try to look up auth user by attempting signup — if user exists Supabase returns error
      // But we need a server-side check. Use a simpler approach: attempt signup and check error.
    }

    const planoSelecionado = plano === "trial" ? "solo" : plano;

    const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/criar-conta`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
      },
      body: JSON.stringify({
        nome,
        email,
        senha,
        plano: planoSelecionado,
        emailRedirectTo: window.location.origin,
      }),
    });

    const data = await response.json();

    if (response.ok && data?.session?.access_token && data?.session?.refresh_token) {
      await supabase.auth.setSession({
        access_token: data.session.access_token,
        refresh_token: data.session.refresh_token,
      });
    }

    setLoading(false);
    const error = response.ok ? null : { message: data?.error || "Erro ao criar conta" };
    if (error) {
      if (error.message?.includes("already registered") || error.message?.includes("already been registered")) {
        if (plano === "trial") {
          toast({
            title: "Trial já utilizado",
            description: "Este email já utilizou o período de teste. Escolha um plano para continuar.",
            variant: "destructive",
          });
          navigate("/pricing?upgrade=true");
          return;
        }
      }
      toast({ title: "Erro ao criar conta", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Conta criada!", description: "Bem-vindo ao MedTrack!" });
      navigate("/dashboard");
    }
  };

  const planoLabels: Record<string, string> = {
    trial: "Teste Grátis — 7 dias",
    solo: "Solo — R$ 49/mês",
    clinica: "Clínica — R$ 129/mês",
  };
  const planoLabel = planoLabels[plano] || planoLabels.solo;

  return (
    <div className="flex min-h-screen items-center justify-center" style={{ backgroundColor: "#f5f5f0" }}>
      <div className="w-full max-w-sm px-6">
        <div className="mb-8 text-center">
          <Logo dark />
          <div className="mt-3 inline-block rounded-full px-4 py-1 text-xs font-medium" style={{ backgroundColor: "#2D6BE4", color: "#fff" }}>
            {planoLabel}
          </div>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium" style={{ color: "#1a1a2e" }}>Nome</label>
            <input
              type="text"
              value={nome}
              onChange={e => setNome(e.target.value)}
              required
              className="w-full rounded-[10px] border bg-white px-4 py-3 text-sm outline-none transition-colors"
              style={{ borderColor: "#e0e0e0", color: "#1a1a2e" }}
              onFocus={e => (e.target.style.borderColor = "#2D6BE4")}
              onBlur={e => (e.target.style.borderColor = "#e0e0e0")}
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium" style={{ color: "#1a1a2e" }}>Email</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              className="w-full rounded-[10px] border bg-white px-4 py-3 text-sm outline-none transition-colors"
              style={{ borderColor: "#e0e0e0", color: "#1a1a2e" }}
              onFocus={e => (e.target.style.borderColor = "#2D6BE4")}
              onBlur={e => (e.target.style.borderColor = "#e0e0e0")}
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium" style={{ color: "#1a1a2e" }}>Senha</label>
            <input
              type="password"
              value={senha}
              onChange={e => setSenha(e.target.value)}
              required
              minLength={6}
              className="w-full rounded-[10px] border bg-white px-4 py-3 text-sm outline-none transition-colors"
              style={{ borderColor: "#e0e0e0", color: "#1a1a2e" }}
              onFocus={e => (e.target.style.borderColor = "#2D6BE4")}
              onBlur={e => (e.target.style.borderColor = "#e0e0e0")}
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-[10px] py-3 text-sm font-semibold text-white transition-opacity disabled:opacity-50"
            style={{ backgroundColor: "#2D6BE4" }}
          >
            {loading ? "Criando conta..." : "Criar conta"}
          </button>
        </form>
        <p className="mt-6 text-center text-sm" style={{ color: "#666" }}>
          Já tem conta?{" "}
          <Link to="/login" className="font-medium" style={{ color: "#2D6BE4" }}>
            Entrar
          </Link>
        </p>
      </div>
    </div>
  );
}
