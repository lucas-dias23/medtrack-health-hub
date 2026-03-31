import { useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { usePlano } from "@/hooks/usePlano";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

export default function Perfil() {
  const { perfil, refreshPerfil } = useAuth();
  const { trialAtivo, diasTrial } = usePlano();
  const { toast } = useToast();
  const [nome, setNome] = useState(perfil?.nome || "");
  const [especialidade, setEspecialidade] = useState(perfil?.especialidade || "");
  const [saving, setSaving] = useState(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const { error } = await supabase
      .from("profiles")
      .update({ nome, especialidade })
      .eq("id", perfil!.id);
    setSaving(false);
    if (error) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Perfil atualizado!" });
      refreshPerfil();
    }
  };

  const planoLabel = perfil?.plano === "clinica" ? "Clínica" : "Solo";

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <h1 className="font-display text-xl text-foreground">Perfil</h1>

      <form onSubmit={handleSave} className="space-y-4 rounded-lg border border-border bg-card p-6">
        <div>
          <label className="mb-1 block text-sm text-muted-foreground">Nome</label>
          <input
            value={nome}
            onChange={e => setNome(e.target.value)}
            required
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-primary"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm text-muted-foreground">Email</label>
          <input
            value={perfil?.id ? "" : ""}
            readOnly
            disabled
            placeholder="(via autenticação)"
            className="w-full rounded-lg border border-border bg-muted px-3 py-2 text-sm text-muted-foreground"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm text-muted-foreground">Especialidade</label>
          <input
            value={especialidade}
            onChange={e => setEspecialidade(e.target.value)}
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-primary"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm text-muted-foreground">Plano</label>
          <span className="inline-block rounded-full bg-primary/20 px-3 py-1 text-xs font-medium text-primary">
            {planoLabel}
          </span>
        </div>
        {trialAtivo && (
          <p className="text-sm text-muted-foreground">
            Trial: {diasTrial} dia{diasTrial !== 1 ? "s" : ""} restante{diasTrial !== 1 ? "s" : ""}
          </p>
        )}
        <div className="flex gap-3">
          <Button type="submit" disabled={saving}>
            {saving ? "Salvando..." : "Salvar alterações"}
          </Button>
          <Button variant="outline" asChild>
            <Link to="/pricing">Ver planos</Link>
          </Button>
        </div>
      </form>
    </div>
  );
}
