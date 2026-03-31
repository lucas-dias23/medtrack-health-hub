import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import AppLayout from "@/components/AppLayout";
import Login from "@/pages/Login";
import Cadastro from "@/pages/Cadastro";
import Dashboard from "@/pages/Dashboard";
import Consultas from "@/pages/Consultas";
import Convenios from "@/pages/Convenios";
import Perfil from "@/pages/Perfil";
import Medicos from "@/pages/Medicos";
import Pricing from "@/pages/Pricing";
import TrialExpirado from "@/pages/TrialExpirado";
import NotFound from "@/pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/login" element={<Login />} />
            <Route path="/cadastro" element={<Cadastro />} />
            <Route path="/pricing" element={<Pricing />} />
            <Route path="/trial-expirado" element={<TrialExpirado />} />
            <Route
              element={
                <ProtectedRoute>
                  <AppLayout />
                </ProtectedRoute>
              }
            >
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/consultas" element={<Consultas />} />
              <Route path="/convenios" element={<Convenios />} />
              <Route path="/perfil" element={<Perfil />} />
              <Route path="/medicos" element={<Medicos />} />
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
