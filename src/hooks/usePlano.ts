import { useEffect, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";

export function usePlano() {
  const { perfil, refreshPerfil } = useAuth();
  const markedRef = useRef(false);

  const isClinica = perfil?.plano === "clinica";
  const isSolo = perfil?.plano === "solo";
  const diasTrial = perfil?.trial_inicio
    ? Math.max(0, 7 - Math.floor((Date.now() - new Date(perfil.trial_inicio).getTime()) / 86400000))
    : 0;
  const trialAtivo = perfil?.trial_ativo === true && diasTrial > 0;
  const trialExpirado = perfil?.trial_ativo === true && diasTrial <= 0;
  const trialUsado = perfil?.trial_usado ?? false;

  useEffect(() => {
    if (trialExpirado && perfil && !perfil.trial_usado && !markedRef.current) {
      markedRef.current = true;
      supabase
        .from("profiles")
        .update({ trial_usado: true } as any)
        .eq("id", perfil.id)
        .then(() => refreshPerfil());
    }
  }, [trialExpirado, perfil]);

  return { isClinica, isSolo, diasTrial, trialAtivo, trialExpirado, trialUsado };
}
