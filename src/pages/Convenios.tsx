import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { Plus, Pencil, Trash2 } from "lucide-react";
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

interface Convenio {
  id: string;
  nome: string;
  valor_padrao: number | null;
  cor: string;
  ativo: boolean;
  consultas_count?: number;
  receita_total?: number;
}

export default function Convenios() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [convenios, setConvenios] = useState<Convenio[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [form, setForm] = useState({ nome: "", valor_padrao: "", cor: "#2D6BE4" });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (user) loadData();
  }, [user]);

  const loadData = async () => {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split("T")[0];
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split("T")[0];

    const [convRes, consultasRes] = await Promise.all([
      supabase.from("convenios").select("*").order("nome"),
      supabase.from("consultas").select("convenio_id, valor").gte("data", startOfMonth).lte("data", endOfMonth),
    ]);

    const convs = (convRes.data || []).map(c => {
      const relatedConsultas = (consultasRes.data || []).filter((co: any) => co.convenio_id === c.id);
      return {
        ...c,
        consultas_count: relatedConsultas.length,
        receita_total: relatedConsultas.reduce((s: number, co: any) => s + Number(co.valor), 0),
      };
    });

    convs.sort((a, b) => (b.consultas_count || 0) - (a.consultas_count || 0));
    setConvenios(convs);
    setLoading(false);
  };

  const openNew = () => {
    setEditingId(null);
    setForm({ nome: "", valor_padrao: "", cor: "#2D6BE4" });
    setModalOpen(true);
  };

  const openEdit = (c: Convenio) => {
    setEditingId(c.id);
    setForm({
      nome: c.nome,
      valor_padrao: c.valor_padrao ? String(c.valor_padrao) : "",
      cor: c.cor,
    });
    setModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const payload = {
      medico_id: user!.id,
      nome: form.nome,
      valor_padrao: form.valor_padrao ? parseFloat(form.valor_padrao) : null,
      cor: form.cor,
    };

    let error;
    if (editingId) {
      ({ error } = await supabase.from("convenios").update(payload).eq("id", editingId));
    } else {
      ({ error } = await supabase.from("convenios").insert(payload));
    }
    setSaving(false);
    if (error) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    } else {
      toast({ title: editingId ? "Convênio atualizado!" : "Convênio criado!" });
      setModalOpen(false);
      loadData();
    }
  };

  const handleToggle = async (c: Convenio) => {
    const { error } = await supabase.from("convenios").update({ ativo: !c.ativo }).eq("id", c.id);
    if (error) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    } else {
      loadData();
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    const { error } = await supabase.from("convenios").delete().eq("id", deleteId);
    if (error) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Convênio excluído!" });
      loadData();
    }
    setDeleteId(null);
  };

  const formatCurrency = (v: number) =>
    v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-full" />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-40" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-xl text-foreground">Convênios</h1>
        <Button onClick={openNew}>
          <Plus className="mr-1 h-4 w-4" /> Novo Convênio
        </Button>
      </div>

      {convenios.length === 0 ? (
        <div className="rounded-lg border border-border bg-card p-8 text-center">
          <p className="text-muted-foreground">Nenhum convênio cadastrado.</p>
          <Button onClick={openNew} className="mt-4">
            <Plus className="mr-1 h-4 w-4" /> Cadastrar convênio
          </Button>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {convenios.map((c, index) => (
            <div key={c.id} className="rounded-lg border border-border bg-card p-4">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <span className="h-3 w-3 rounded-full shrink-0" style={{ backgroundColor: c.cor }} />
                  <span className="font-medium text-foreground">{c.nome}</span>
                </div>
                <span className="text-xs text-muted-foreground">{index + 1}º</span>
              </div>
              <div className="mt-3 space-y-1 text-sm text-muted-foreground">
                <p>{c.consultas_count} consulta{c.consultas_count !== 1 ? "s" : ""} este mês</p>
                <p>Receita: {formatCurrency(c.receita_total || 0)}</p>
                {c.valor_padrao && <p>Valor padrão: {formatCurrency(c.valor_padrao)}</p>}
              </div>
              <div className="mt-4 flex items-center justify-between">
                <button
                  onClick={() => handleToggle(c)}
                  className={`rounded-full px-3 py-1 text-xs font-medium ${
                    c.ativo ? "bg-primary/20 text-primary" : "bg-secondary text-muted-foreground"
                  }`}
                >
                  {c.ativo ? "Ativo" : "Inativo"}
                </button>
                <div className="flex gap-1">
                  <button onClick={() => openEdit(c)} className="rounded p-1 text-muted-foreground hover:text-foreground">
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button onClick={() => setDeleteId(c.id)} className="rounded p-1 text-muted-foreground hover:text-destructive">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create/Edit Modal */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="bg-card border-border">
          <DialogHeader>
            <DialogTitle className="text-foreground">{editingId ? "Editar Convênio" : "Novo Convênio"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSave} className="space-y-4">
            <div>
              <label className="mb-1 block text-sm text-muted-foreground">Nome *</label>
              <input
                value={form.nome}
                onChange={e => setForm(f => ({ ...f, nome: e.target.value }))}
                required
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-primary"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm text-muted-foreground">Valor padrão</label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={form.valor_padrao}
                onChange={e => setForm(f => ({ ...f, valor_padrao: e.target.value }))}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-primary"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm text-muted-foreground">Cor</label>
              <input
                type="color"
                value={form.cor}
                onChange={e => setForm(f => ({ ...f, cor: e.target.value }))}
                className="h-10 w-20 cursor-pointer rounded-lg border border-border bg-background"
              />
            </div>
            <Button type="submit" disabled={saving} className="w-full">
              {saving ? "Salvando..." : "Salvar"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent className="bg-card border-border">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-foreground">Excluir convênio?</AlertDialogTitle>
            <AlertDialogDescription>Esta ação não pode ser desfeita.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
