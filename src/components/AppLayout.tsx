import { Link, useLocation, Outlet } from "react-router-dom";
import {
  LayoutDashboard,
  ClipboardList,
  Building2,
  User,
  CreditCard,
  Users,
  LogOut,
  Menu,
} from "lucide-react";
import { Logo } from "@/components/Logo";
import { TrialBanner } from "@/components/TrialBanner";
import { useAuth } from "@/contexts/AuthContext";
import { usePlano } from "@/hooks/usePlano";
import { useState } from "react";

const navItems = [
  { label: "Dashboard", icon: LayoutDashboard, path: "/dashboard" },
  { label: "Consultas", icon: ClipboardList, path: "/consultas" },
  { label: "Convênios", icon: Building2, path: "/convenios" },
  { label: "Perfil", icon: User, path: "/perfil" },
  { label: "Pricing", icon: CreditCard, path: "/pricing" },
];

export default function AppLayout() {
  const { pathname } = useLocation();
  const { perfil, signOut } = useAuth();
  const { isClinica } = usePlano();
  const [mobileOpen, setMobileOpen] = useState(false);

  const items = isClinica
    ? [...navItems.slice(0, 4), { label: "Médicos", icon: Users, path: "/medicos" }, navItems[4]]
    : navItems;

  const SidebarContent = () => (
    <>
      <div className="p-5">
        <Logo />
      </div>
      <nav className="flex-1 space-y-1 px-3">
        {items.map(item => {
          const active = pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              onClick={() => setMobileOpen(false)}
              className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors ${
                active
                  ? "bg-sidebar-accent text-sidebar-primary font-medium"
                  : "text-sidebar-foreground hover:bg-sidebar-accent/50"
              }`}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="border-t border-sidebar-border p-4">
        <p className="mb-2 truncate text-sm text-sidebar-foreground">{perfil?.nome}</p>
        <button
          onClick={signOut}
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <LogOut className="h-4 w-4" />
          Sair
        </button>
      </div>
    </>
  );

  return (
    <div className="flex min-h-screen bg-background">
      {/* Desktop sidebar */}
      <aside className="hidden md:flex w-[220px] flex-col border-r border-sidebar-border bg-sidebar shrink-0">
        <SidebarContent />
      </aside>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setMobileOpen(false)} />
          <aside className="absolute left-0 top-0 h-full w-[260px] flex flex-col bg-sidebar">
            <SidebarContent />
          </aside>
        </div>
      )}

      {/* Main content */}
      <div className="flex flex-1 flex-col min-w-0">
        <TrialBanner />
        {/* Mobile header */}
        <header className="flex items-center border-b border-border px-4 py-3 md:hidden">
          <button onClick={() => setMobileOpen(true)}>
            <Menu className="h-5 w-5 text-foreground" />
          </button>
          <div className="ml-3">
            <Logo />
          </div>
        </header>
        <main className="flex-1 overflow-auto p-4 md:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
