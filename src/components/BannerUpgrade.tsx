import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

export function BannerUpgrade({ mensagem }: { mensagem: string }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-lg border border-border bg-card p-8 text-center">
      <p className="mb-4 text-muted-foreground">{mensagem}</p>
      <Button asChild>
        <Link to="/pricing">Fazer upgrade</Link>
      </Button>
    </div>
  );
}
