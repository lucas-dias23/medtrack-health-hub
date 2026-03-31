import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { usePlano } from "@/hooks/usePlano";
import { BannerUpgrade } from "@/components/BannerUpgrade";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { Plus, Trash2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface Medico {
  id: string;
  nome: string;
  especialidade: string | null;
  consultas_count?: number;
}

export default function Medicos() {
  const { user, perfil } = useAuth();
  const { isClinica } = usePlano();
  const { toast } = useToast();
  const [medicos, setMedicos] = useState<Medico[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [form, setForm] = useState({ nome: "", email: "", senha: "" });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (user && isClinica) loadData();
    else setLoading(false);
  }, [user, isClinica]);

  const loadData = async () => {
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, nome, especialidade")
      .eq("clinica_id", perfil?.clinica_id || user!.id);

    const allMedicos = profiles || [];
    const medicoIds = allMedicos.map(m => m.id);
    const { data: consultas } = await supabase
      .from("consultas")
      .select("medico_id")
      .in("medico_id", medicoIds.length > 0 ? medicoIds : ["none"]);

    const counts: Record<string, number> = {};
    (consultas || []).forEach((c: any) => {
      counts[c.medico_id] = (counts[c.medico_id] || 0) + 1;
    });

    setMedicos(allMedicos.map(m => ({ ...m, consultas_count: counts[m.id] || 0 })));
    setLoading(false);
  };

  if (!isClinica) {
    return <BannerUpgrade mensagem="A gestão de médicos está disponível no plano Clínica." />;
  }

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (medicos.length >= 5) {
      toast({ title: "Limite atingido", description: "Máximo de 5 médicos por clínica.", variant: "destructive" });
      return;
    }
    setSaving(true);
    toast({
      title: "Funcionalidade em desenvolvimento",
      description: "A adição de médicos requer configuração de edge functions.",
    });
    setSaving(false);
    setModalOpen(false);
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    const { error } = await supabase.from("profiles").update({ clinica_id: null }).eq("id", deleteId);
    if (error) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Médico removido da clínica!" });
      loadData();
    }
    setDeleteId(null);
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-xl text-foreground">Médicos</h1>
        <Button onClick={() => setModalOpen(true)} disabled={medicos.length >= 5}>
          <Plus className="mr-1 h-4 w-4" /> Adicionar Médico
        </Button>
      </div>
      <p className="text-sm text-muted-foreground">{medicos.length}/5 médicos</p>
      {medicos.length === 0 ? (
        <div className="rounded-lg border border-border bg-card p-8 text-center">
          <p className="text-muted-foreground">Nenhum médico cadastrado na clínica.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {medicos.map(m => (
            <div key={m.id} className="flex items-center justify-between rounded-lg border border-border bg-card p-4">
              <div>
                <p className="font-medium text-foreground">{m.nome}</p>
                <p className="text-sm text-muted-foreground">
                  {m.especialidade || "Sem especialidade"} · {m.consultas_count} consultas
                </p>
              </div>
              {m.id !== user!.id && (
                <button onClick={() => setDeleteId(m.id)} className="rounded p-1 text-muted-foreground hover:text-destructive">
                  <Trash2 className="h-4 w-4" />
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="bg-card border-border">
          <DialogHeader>
            <DialogTitle className="text-foreground">Adicionar Médico</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAdd} className="space-y-4">
            <div>
              <label className="mb-1 block text-sm text-muted-foreground">Nome *</label>
              <input value={form.nome} onChange={e => setForm(f => ({ ...f, nome: e.target.value }))} required className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-primary" />
            </div>
            <div>
              <label className="mb-1 block text-sm text-muted-foreground">Email *</label>
              <input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} required className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-primary" />
            </div>
            <div>
              <label className="mb-1 block text-sm text-muted-foreground">Senha temporária *</label>
              <input type="password" value={form.senha} onChange={e => setForm(f => ({ ...f, senha: e.target.value }))} required minLength={6} className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-primary" />
            </div>
            <Button type="submit" disabled={saving} className="w-full">{saving ? "Adicionando..." : "Adicionar"}</Button>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent className="bg-card border-border">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-foreground">Remover médico?</AlertDialogTitle>
            <AlertDialogDescription>O médico será removido da clínica.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Remover</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
