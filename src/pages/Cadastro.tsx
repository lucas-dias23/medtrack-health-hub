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
    const { error } = await supabase.auth.signUp({
      email,
      password: senha,
      options: {
        data: { nome, plano },
        emailRedirectTo: window.location.origin,
      },
    });
    setLoading(false);
    if (error) {
      toast({ title: "Erro ao criar conta", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Conta criada!", description: "Verifique seu email para confirmar." });
      navigate("/dashboard");
    }
  };

  const planoLabel = plano === "clinica" ? "Clínica — R$ 129/mês" : "Solo — R$ 49/mês";

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
