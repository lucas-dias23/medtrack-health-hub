
-- Perfil do médico
CREATE TABLE public.profiles (
  id uuid REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  nome text NOT NULL,
  especialidade text,
  plano text NOT NULL DEFAULT 'solo',
  clinica_id uuid,
  trial_inicio timestamp with time zone DEFAULT now(),
  trial_ativo boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "profiles_select" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "profiles_insert" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "profiles_update" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "profiles_delete" ON public.profiles FOR DELETE USING (auth.uid() = id);

-- Clínicas
CREATE TABLE public.clinicas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text NOT NULL,
  responsavel_id uuid REFERENCES public.profiles(id) NOT NULL,
  created_at timestamp with time zone DEFAULT now()
);

ALTER TABLE public.clinicas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "clinicas_select" ON public.clinicas FOR SELECT USING (auth.uid() = responsavel_id);
CREATE POLICY "clinicas_insert" ON public.clinicas FOR INSERT WITH CHECK (auth.uid() = responsavel_id);
CREATE POLICY "clinicas_update" ON public.clinicas FOR UPDATE USING (auth.uid() = responsavel_id);
CREATE POLICY "clinicas_delete" ON public.clinicas FOR DELETE USING (auth.uid() = responsavel_id);

-- Convênios
CREATE TABLE public.convenios (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  medico_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  nome text NOT NULL,
  valor_padrao numeric(10,2),
  cor text DEFAULT '#2D6BE4',
  ativo boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now()
);

ALTER TABLE public.convenios ENABLE ROW LEVEL SECURITY;

CREATE POLICY "convenios_select" ON public.convenios FOR SELECT USING (auth.uid() = medico_id);
CREATE POLICY "convenios_insert" ON public.convenios FOR INSERT WITH CHECK (auth.uid() = medico_id);
CREATE POLICY "convenios_update" ON public.convenios FOR UPDATE USING (auth.uid() = medico_id);
CREATE POLICY "convenios_delete" ON public.convenios FOR DELETE USING (auth.uid() = medico_id);

-- Consultas
CREATE TABLE public.consultas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  medico_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  convenio_id uuid REFERENCES public.convenios(id) ON DELETE SET NULL,
  paciente_nome text NOT NULL,
  procedimento text NOT NULL DEFAULT 'Consulta Clínica',
  valor numeric(10,2) NOT NULL,
  data date NOT NULL,
  observacoes text,
  created_at timestamp with time zone DEFAULT now()
);

ALTER TABLE public.consultas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "consultas_select" ON public.consultas FOR SELECT USING (auth.uid() = medico_id);
CREATE POLICY "consultas_insert" ON public.consultas FOR INSERT WITH CHECK (auth.uid() = medico_id);
CREATE POLICY "consultas_update" ON public.consultas FOR UPDATE USING (auth.uid() = medico_id);
CREATE POLICY "consultas_delete" ON public.consultas FOR DELETE USING (auth.uid() = medico_id);

-- Add foreign key for clinica_id after clinicas table exists
ALTER TABLE public.profiles ADD CONSTRAINT profiles_clinica_id_fkey FOREIGN KEY (clinica_id) REFERENCES public.clinicas(id);

-- Trigger to auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, nome, plano)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'nome', 'Médico'),
    COALESCE(NEW.raw_user_meta_data->>'plano', 'solo')
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
