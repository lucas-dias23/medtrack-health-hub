import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { Skeleton } from "@/components/ui/skeleton";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";

interface Consulta {
  id: string;
  paciente_nome: string;
  procedimento: string;
  valor: number;
  data: string;
  convenio_id: string | null;
  convenio?: { nome: string; cor: string } | null;
}

interface Convenio {
  id: string;
  nome: string;
  cor: string;
}

export default function Dashboard() {
  const { user } = useAuth();
  const [consultas, setConsultas] = useState<Consulta[]>([]);
  const [convenios, setConvenios] = useState<Convenio[]>([]);
  const [barData, setBarData] = useState<{ mes: string; total: number }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    loadData();
  }, [user]);

  const loadData = async () => {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split("T")[0];
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split("T")[0];

    const [consultasRes, conveniosRes, last6Res] = await Promise.all([
      supabase
        .from("consultas")
        .select("*, convenio:convenios(nome, cor)")
        .gte("data", startOfMonth)
        .lte("data", endOfMonth)
        .order("data", { ascending: false }),
      supabase.from("convenios").select("*"),
      // Last 6 months
      supabase
        .from("consultas")
        .select("data")
        .gte("data", new Date(now.getFullYear(), now.getMonth() - 5, 1).toISOString().split("T")[0]),
    ]);

    setConsultas(consultasRes.data || []);
    setConvenios(conveniosRes.data || []);

    // Build bar chart data
    const months: Record<string, number> = {};
    const monthNames = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${monthNames[d.getMonth()]}/${d.getFullYear().toString().slice(2)}`;
      months[key] = 0;
    }
    (last6Res.data || []).forEach((c: any) => {
      const d = new Date(c.data);
      const key = `${monthNames[d.getMonth()]}/${d.getFullYear().toString().slice(2)}`;
      if (key in months) months[key]++;
    });
    setBarData(Object.entries(months).map(([mes, total]) => ({ mes, total })));
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
          {[1, 2, 3, 4].map(i => (
            <Skeleton key={i} className="h-24 rounded-lg" />
          ))}
        </div>
        <Skeleton className="h-64 rounded-lg" />
      </div>
    );
  }

  const totalConsultas = consultas.length;
  const receitaTotal = consultas.reduce((sum, c) => sum + Number(c.valor), 0);
  const ticketMedio = totalConsultas > 0 ? receitaTotal / totalConsultas : 0;

  // Convênio líder
  const convCount: Record<string, number> = {};
  consultas.forEach(c => {
    const name = c.convenio?.nome || "Particular";
    convCount[name] = (convCount[name] || 0) + 1;
  });
  const convenioLider = Object.entries(convCount).sort((a, b) => b[1] - a[1])[0]?.[0] || "—";

  // Pie chart data
  const pieData = Object.entries(convCount).map(([name, value]) => {
    const conv = convenios.find(c => c.nome === name);
    return { name, value, color: conv?.cor || "#2D6BE4" };
  });

  const formatCurrency = (v: number) =>
    v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

  const metrics = [
    { label: "Total de consultas", value: totalConsultas.toString() },
    { label: "Receita total esperada", value: formatCurrency(receitaTotal) },
    { label: "Ticket médio", value: formatCurrency(ticketMedio) },
    { label: "Convênio líder", value: convenioLider },
  ];

  return (
    <div className="space-y-6">
      <h1 className="font-display text-xl text-foreground">Dashboard</h1>

      {/* Metrics */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
        {metrics.map(m => (
          <div key={m.label} className="rounded-lg border border-border bg-card p-4">
            <p className="text-xs text-muted-foreground">{m.label}</p>
            <p className="mt-1 text-2xl font-bold text-foreground whitespace-nowrap">{m.value}</p>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Bar chart */}
        <div className="rounded-lg border border-border bg-card p-4">
          <h3 className="mb-4 text-sm font-medium text-foreground">Consultas por mês</h3>
          <div>
            <div style={{ height: 240 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={barData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(224 20% 14%)" />
                  <XAxis dataKey="mes" stroke="hsl(220 15% 50%)" fontSize={12} />
                  <YAxis stroke="hsl(220 15% 50%)" fontSize={12} allowDecimals={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(226 38% 9%)",
                      border: "1px solid hsl(224 20% 14%)",
                      borderRadius: 8,
                      color: "hsl(220 30% 94%)",
                    }}
                  />
                  <Bar dataKey="total" fill="hsl(220 65% 55%)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Pie chart */}
        <div className="rounded-lg border border-border bg-card p-4">
          <h3 className="mb-4 text-sm font-medium text-foreground">Distribuição por convênio</h3>
          {pieData.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhuma consulta neste mês</p>
          ) : (
            <div className="flex flex-col items-center">
              <div style={{ width: 160, height: 160 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70} innerRadius={40}>
                      {pieData.map((d, i) => (
                        <Cell key={i} fill={d.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(226 38% 9%)",
                        border: "1px solid hsl(224 20% 14%)",
                        borderRadius: 8,
                        color: "hsl(220 30% 94%)",
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-x-6 gap-y-1">
                {pieData.map(d => (
                  <div key={d.name} className="flex items-center gap-2 text-xs text-foreground">
                    <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ backgroundColor: d.color }} />
                    {d.name}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Recent consultations */}
      <div className="rounded-lg border border-border bg-card p-4">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-sm font-medium text-foreground">Últimas consultas</h3>
          <Link to="/consultas" className="text-xs text-primary hover:underline">
            Ver todas →
          </Link>
        </div>
        {consultas.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Nenhuma consulta neste mês.{" "}
            <Link to="/consultas" className="text-primary hover:underline">
              Registrar primeira consulta
            </Link>
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs text-muted-foreground">
                  <th className="pb-2">Paciente</th>
                  <th className="pb-2">Convênio</th>
                  <th className="hidden pb-2 md:table-cell">Procedimento</th>
                  <th className="pb-2 text-right">Valor</th>
                  <th className="hidden pb-2 md:table-cell text-right">Data</th>
                </tr>
              </thead>
              <tbody>
                {consultas.slice(0, 5).map(c => (
                  <tr key={c.id} className="border-b border-border/50 last:border-0">
                    <td className="py-2.5 text-foreground">{c.paciente_nome}</td>
                    <td className="py-2.5">
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
                    <td className="hidden py-2.5 text-muted-foreground md:table-cell">{c.procedimento}</td>
                    <td className="py-2.5 text-right text-foreground">{formatCurrency(Number(c.valor))}</td>
                    <td className="hidden py-2.5 text-right text-muted-foreground md:table-cell">
                      {new Date(c.data).toLocaleDateString("pt-BR")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
