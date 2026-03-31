import { usePlano } from "@/hooks/usePlano";

export function TrialBanner() {
  const { trialAtivo, diasTrial } = usePlano();
  if (!trialAtivo) return null;

  return (
    <div className="flex items-center justify-center bg-primary px-4 py-2 text-sm text-primary-foreground">
      Seu trial termina em {diasTrial} dia{diasTrial !== 1 ? "s" : ""}
    </div>
  );
}
