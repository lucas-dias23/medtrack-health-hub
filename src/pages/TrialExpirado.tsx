import { Link } from "react-router-dom";
import { Logo } from "@/components/Logo";
import { Button } from "@/components/ui/button";

export default function TrialExpirado() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4 text-center">
      <Logo />
      <h1 className="mt-6 font-display text-2xl text-foreground">Seu período de teste terminou</h1>
      <p className="mt-2 max-w-md text-muted-foreground">
        Escolha um plano para continuar usando o MedTrack
      </p>
      <Button asChild className="mt-6">
        <Link to="/pricing">Ver planos</Link>
      </Button>
    </div>
  );
}
