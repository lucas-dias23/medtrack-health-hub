import { Link, useNavigate } from "react-router-dom";
import { Check } from "lucide-react";
import { Logo } from "@/components/Logo";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";

const plans = [
  {
    name: "Teste Grátis",
    price: "0",
    param: "trial",
    popular: false,
    isFree: true,
    features: [
      "7 dias grátis",
      "1 médico",
      "Convênios ilimitados",
      "Registro ilimitado de consultas",
      "Dashboard completo com gráficos",
    ],
  },
  {
    name: "Solo",
    price: "49",
    param: "solo",
    popular: false,
    isFree: false,
    features: [
      "1 médico",
      "Convênios ilimitados",
      "Registro ilimitado de consultas",
      "Dashboard completo com gráficos",
      "Suporte por email",
    ],
  },
  {
    name: "Clínica",
    price: "129",
    param: "clinica",
    popular: true,
    isFree: false,
    features: [
      "Até 5 médicos",
      "Tudo do Solo",
      "Relatórios exportáveis (Excel e PDF)",
      "Histórico completo sem limite de período",
      "Filtro de consultas por médico",
      "Gestão de médicos da clínica",
      "Suporte prioritário por WhatsApp",
    ],
  },
];

export default function Pricing() {
  const navigate = useNavigate();
  let isLoggedIn = false;
  try {
    const { user } = useAuth();
    isLoggedIn = !!user;
  } catch {
    // not wrapped in AuthProvider (public route)
  }

  return (
    <div className="min-h-screen bg-background px-4 py-8">
      <div className="mx-auto max-w-4xl">
        <div className="mb-4">
          <button
            onClick={() => navigate(-1)}
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            ← Voltar
          </button>
        </div>
        <div className="mb-12 text-center">
          <Logo />
          <h1 className="mt-4 font-display text-3xl text-foreground">Escolha seu plano</h1>
          <p className="mt-2 text-muted-foreground">Comece com 7 dias grátis. Cancele quando quiser.</p>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {plans.map(plan => (
            <div
              key={plan.name}
              className={`relative rounded-lg border p-6 ${
                plan.popular ? "border-primary" : "border-border"
              } bg-card`}
            >
              {plan.popular && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-primary px-3 py-1 text-xs font-medium text-primary-foreground">
                  Mais popular
                </span>
              )}
              <h2 className="font-display text-xl text-foreground">{plan.name}</h2>
              <div className="mt-4 flex items-baseline gap-1">
                {plan.isFree ? (
                  <span className="font-display text-4xl text-foreground">Grátis</span>
                ) : (
                  <>
                    <span className="font-display text-4xl text-foreground">R$ {plan.price}</span>
                    <span className="text-sm text-muted-foreground">/mês</span>
                  </>
                )}
              </div>
              <ul className="mt-6 space-y-3">
                {plan.features.map(f => (
                  <li key={f} className="flex items-start gap-2 text-sm text-foreground">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                    {f}
                  </li>
                ))}
              </ul>
              <Button asChild className="mt-8 w-full">
                <Link to={`/cadastro?plano=${plan.param}`}>
                  {plan.isFree ? "Começar agora" : "Começar grátis"}
                </Link>
              </Button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
