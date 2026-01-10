-- Migration: create table 'involucrados'
CREATE TABLE IF NOT EXISTS public.involucrados (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  caso_id uuid REFERENCES public.cases(id) ON DELETE CASCADE,
  nombre text NOT NULL,
  rol text NOT NULL,
  contacto jsonb,
  metadata jsonb,
  created_at timestamptz DEFAULT now()
);

-- Index para consultas por caso
CREATE INDEX IF NOT EXISTS idx_involucrados_caso_id ON public.involucrados(caso_id);
