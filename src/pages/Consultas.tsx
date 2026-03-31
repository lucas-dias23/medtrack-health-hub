import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { Plus, Pencil, Trash2, Eye } from "lucide-react";
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
}

interface Consulta {
  id: string;
  paciente_nome: string;
  procedimento: string;
  valor: number;
  data: string;
  observacoes: string | null;
  convenio_id: string | null;
  convenio?: { nome: string; cor: string } | null;
}

const PROCEDIMENTOS = ["Consulta Clínica", "Retorno", "Primeira Consulta", "Procedimento"];

export default function Consultas() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [consultas, setConsultas] = useState<Consulta[]>([]);
  const [convenios, setConvenios] = useState<Convenio[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtroConvenio, setFiltroConvenio] = useState<string | null>(null);
  const [mesAno, setMesAno] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  });
  const [modalOpen, setModalOpen] = useState(false);
  const [viewOpen, setViewOpen] = useState(false);
  const [viewConsulta, setViewConsulta] = useState<Consulta | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form state
  const [form, setForm] = useState({
    paciente_nome: "",
    convenio_id: "",
    procedimento: "Consulta Clínica",
    valor: "",
    data: new Date().toISOString().split("T")[0],
    observacoes: "",
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (user) loadData();
  }, [user, mesAno]);

  const loadData = async () => {
    const [year, month] = mesAno.split("-").map(Number);
    const start = new Date(year, month - 1, 1).toISOString().split("T")[0];
    const end = new Date(year, month, 0).toISOString().split("T")[0];

    const [consultasRes, conveniosRes] = await Promise.all([
      supabase
        .from("consultas")
        .select("*, convenio:convenios(nome, cor)")
        .gte("data", start)
        .lte("data", end)
        .order("data", { ascending: false }),
      supabase.from("convenios").select("*").eq("ativo", true),
    ]);
    setConsultas(consultasRes.data || []);
    setConvenios(conveniosRes.data || []);
    setLoading(false);
  };

  const filtered = filtroConvenio
    ? consultas.filter(c => c.convenio_id === filtroConvenio)
    : consultas;

  const totalValor = filtered.reduce((s, c) => s + Number(c.valor), 0);

  const openNew = () => {
    setEditingId(null);
    setForm({
      paciente_nome: "",
      convenio_id: "",
      procedimento: "Consulta Clínica",
      valor: "",
      data: new Date().toISOString().split("T")[0],
      observacoes: "",
    });
    setModalOpen(true);
  };

  const openEdit = (c: Consulta) => {
    setEditingId(c.id);
    setForm({
      paciente_nome: c.paciente_nome,
      convenio_id: c.convenio_id || "",
      procedimento: c.procedimento,
      valor: String(c.valor),
      data: c.data,
      observacoes: c.observacoes || "",
    });
    setModalOpen(true);
  };

  const handleConvenioChange = (convenioId: string) => {
    const conv = convenios.find(c => c.id === convenioId);
    setForm(f => ({
      ...f,
      convenio_id: convenioId,
      valor: conv?.valor_padrao ? String(conv.valor_padrao) : f.valor,
    }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const payload = {
      medico_id: user!.id,
      paciente_nome: form.paciente_nome,
      convenio_id: form.convenio_id || null,
      procedimento: form.procedimento,
      valor: parseFloat(form.valor),
      data: form.data,
      observacoes: form.observacoes || null,
    };

    let error;
    if (editingId) {
      ({ error } = await supabase.from("consultas").update(payload).eq("id", editingId));
    } else {
      ({ error } = await supabase.from("consultas").insert(payload));
    }
    setSaving(false);
    if (error) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    } else {
      toast({ title: editingId ? "Consulta atualizada!" : "Consulta registrada!" });
      setModalOpen(false);
      loadData();
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    const { error } = await supabase.from("consultas").delete().eq("id", deleteId);
    if (error) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Consulta excluída!" });
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
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-xl text-foreground">Consultas</h1>
        <Button onClick={openNew} className="hidden md:inline-flex">
          <Plus className="mr-1 h-4 w-4" /> Nova Consulta
        </Button>
      </div>

      {/* Filters */}
      <div className="space-y-3">
        <div className="flex items-center gap-3">
          <input
            type="month"
            value={mesAno}
            onChange={e => setMesAno(e.target.value)}
            className="rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground"
          />
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1">
          <button
            onClick={() => setFiltroConvenio(null)}
            className={`shrink-0 rounded-full px-3 py-1 text-xs font-medium transition-colors ${
              !filtroConvenio ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground"
            }`}
          >
            Todos
          </button>
          {convenios.map(c => (
            <button
              key={c.id}
              onClick={() => setFiltroConvenio(c.id)}
              className={`shrink-0 rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                filtroConvenio === c.id ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground"
              }`}
            >
              {c.nome}
            </button>
          ))}
        </div>
        <p className="text-sm text-muted-foreground">
          {filtered.length} consulta{filtered.length !== 1 ? "s" : ""} · {formatCurrency(totalValor)}
        </p>
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-lg border border-border bg-card p-8 text-center">
          <p className="text-muted-foreground">Nenhuma consulta encontrada.</p>
          <Button onClick={openNew} className="mt-4">
            <Plus className="mr-1 h-4 w-4" /> Registrar consulta
          </Button>
        </div>
      ) : (
        <>
          {/* Desktop table */}
          <div className="hidden overflow-x-auto rounded-lg border border-border bg-card md:block">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs text-muted-foreground">
                  <th className="px-4 py-3">Paciente</th>
                  <th className="px-4 py-3">Convênio</th>
                  <th className="px-4 py-3">Procedimento</th>
                  <th className="px-4 py-3 text-right">Valor</th>
                  <th className="px-4 py-3 text-right">Data</th>
                  <th className="px-4 py-3 text-right">Ações</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(c => (
                  <tr key={c.id} className="border-b border-border/50 last:border-0">
                    <td className="px-4 py-3 text-foreground">{c.paciente_nome}</td>
                    <td className="px-4 py-3">
                      <span
                        className="inline-block rounded-full px-2 py-0.5 text-xs font-medium"
                        style={{
                          backgroundColor: (c.convenio?.cor || "#2D6BE4") + "20",
                          color: c.convenio?.cor || "#2D6BE4",
                        }}
                      >
                        {c.convenio?.nome || "Particular"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{c.procedimento}</td>
                    <td className="px-4 py-3 text-right text-foreground">{formatCurrency(Number(c.valor))}</td>
                    <td className="px-4 py-3 text-right text-muted-foreground">
                      {new Date(c.data).toLocaleDateString("pt-BR")}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex justify-end gap-1">
                        <button onClick={() => { setViewConsulta(c); setViewOpen(true); }} className="rounded p-1 text-muted-foreground hover:text-foreground">
                          <Eye className="h-4 w-4" />
                        </button>
                        <button onClick={() => openEdit(c)} className="rounded p-1 text-muted-foreground hover:text-foreground">
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button onClick={() => setDeleteId(c.id)} className="rounded p-1 text-muted-foreground hover:text-destructive">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="space-y-3 md:hidden">
            {filtered.map(c => (
              <div key={c.id} className="rounded-lg border border-border bg-card p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm font-semibold text-foreground">{c.paciente_nome}</p>
                    <span
                      className="mt-1 inline-block rounded-full px-2 py-0.5 text-xs font-medium"
                      style={{
                        backgroundColor: (c.convenio?.cor || "#2D6BE4") + "20",
                        color: c.convenio?.cor || "#2D6BE4",
                      }}
                    >
                      {c.convenio?.nome || "Particular"}
                    </span>
                    <p className="mt-1 text-xs text-muted-foreground">{c.procedimento}</p>
                  </div>
                  <div className="flex gap-1">
                    <button onClick={() => { setViewConsulta(c); setViewOpen(true); }} className="rounded p-1 text-muted-foreground hover:text-foreground">
                      <Eye className="h-4 w-4" />
                    </button>
                    <button onClick={() => openEdit(c)} className="rounded p-1 text-muted-foreground hover:text-foreground">
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button onClick={() => setDeleteId(c.id)} className="rounded p-1 text-muted-foreground hover:text-destructive">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
                <div className="mt-2 flex items-center justify-between text-sm">
                  <span className="text-foreground font-medium">{formatCurrency(Number(c.valor))}</span>
                  <span className="text-muted-foreground">{new Date(c.data).toLocaleDateString("pt-BR")}</span>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* FAB mobile */}
      <button
        onClick={openNew}
        className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg md:hidden"
      >
        <Plus className="h-6 w-6" />
      </button>

      {/* Create/Edit Modal */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="bg-card border-border">
          <DialogHeader>
            <DialogTitle className="text-foreground">{editingId ? "Editar Consulta" : "Nova Consulta"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSave} className="space-y-4">
            <div>
              <label className="mb-1 block text-sm text-muted-foreground">Paciente *</label>
              <input
                value={form.paciente_nome}
                onChange={e => setForm(f => ({ ...f, paciente_nome: e.target.value }))}
                required
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-primary"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm text-muted-foreground">Convênio</label>
              <select
                value={form.convenio_id}
                onChange={e => handleConvenioChange(e.target.value)}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-primary"
              >
                <option value="">Particular</option>
                {convenios.map(c => (
                  <option key={c.id} value={c.id}>{c.nome}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm text-muted-foreground">Procedimento</label>
              <select
                value={form.procedimento}
                onChange={e => setForm(f => ({ ...f, procedimento: e.target.value }))}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-primary"
              >
                {PROCEDIMENTOS.map(p => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm text-muted-foreground">Valor *</label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={form.valor}
                onChange={e => setForm(f => ({ ...f, valor: e.target.value }))}
                required
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-primary"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm text-muted-foreground">Data</label>
              <input
                type="date"
                value={form.data}
                onChange={e => setForm(f => ({ ...f, data: e.target.value }))}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-primary"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm text-muted-foreground">Observações</label>
              <textarea
                value={form.observacoes}
                onChange={e => setForm(f => ({ ...f, observacoes: e.target.value }))}
                rows={3}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-primary"
              />
            </div>
            <Button type="submit" disabled={saving} className="w-full">
              {saving ? "Salvando..." : "Salvar"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* View Detail Modal */}
      <Dialog open={viewOpen} onOpenChange={setViewOpen}>
        <DialogContent className="bg-card border-border">
          <DialogHeader>
            <DialogTitle className="text-foreground">Detalhes da Consulta</DialogTitle>
          </DialogHeader>
          {viewConsulta && (
            <div className="space-y-3 text-sm">
              <div><span className="text-muted-foreground">Paciente:</span> <span className="text-foreground">{viewConsulta.paciente_nome}</span></div>
              <div><span className="text-muted-foreground">Convênio:</span> <span className="text-foreground">{viewConsulta.convenio?.nome || "Particular"}</span></div>
              <div><span className="text-muted-foreground">Procedimento:</span> <span className="text-foreground">{viewConsulta.procedimento}</span></div>
              <div><span className="text-muted-foreground">Valor:</span> <span className="text-foreground">{formatCurrency(Number(viewConsulta.valor))}</span></div>
              <div><span className="text-muted-foreground">Data:</span> <span className="text-foreground">{new Date(viewConsulta.data).toLocaleDateString("pt-BR")}</span></div>
              {viewConsulta.observacoes && (
                <div><span className="text-muted-foreground">Observações:</span> <span className="text-foreground">{viewConsulta.observacoes}</span></div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent className="bg-card border-border">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-foreground">Excluir consulta?</AlertDialogTitle>
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
