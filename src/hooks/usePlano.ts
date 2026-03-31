import { useAuth } from "@/contexts/AuthContext";

export function usePlano() {
  const { perfil } = useAuth();
  const isClinica = perfil?.plano === "clinica";
  const isSolo = perfil?.plano === "solo";
  const diasTrial = perfil?.trial_inicio
    ? Math.max(0, 7 - Math.floor((Date.now() - new Date(perfil.trial_inicio).getTime()) / 86400000))
    : 0;
  const trialAtivo = perfil?.trial_ativo === true && diasTrial > 0;
  const trialExpirado = perfil?.trial_ativo === true && diasTrial <= 0;
  return { isClinica, isSolo, diasTrial, trialAtivo, trialExpirado };
}
