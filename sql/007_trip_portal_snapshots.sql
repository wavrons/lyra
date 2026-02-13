-- ============================================================
-- Migration 007: Public portal snapshots (RLS-safe public read)
-- Run this AFTER Migration 004 and 006
-- ============================================================

CREATE TABLE IF NOT EXISTS public.trip_portal_snapshots (
  token text PRIMARY KEY REFERENCES public.trip_portals(token) ON DELETE CASCADE,
  trip_title text NOT NULL DEFAULT '',
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.trip_portal_snapshots ENABLE ROW LEVEL SECURITY;

-- Public can read snapshots (no auth)
DROP POLICY IF EXISTS "Public can read portal snapshots" ON public.trip_portal_snapshots;
CREATE POLICY "Public can read portal snapshots"
  ON public.trip_portal_snapshots FOR SELECT
  USING (true);

-- Editors can upsert snapshots by token they manage via trip_portals
DROP POLICY IF EXISTS "Editors can write portal snapshots" ON public.trip_portal_snapshots;
CREATE POLICY "Editors can write portal snapshots"
  ON public.trip_portal_snapshots FOR ALL
  USING (
    EXISTS (
      SELECT 1
      FROM public.trip_portals p
      WHERE p.token = trip_portal_snapshots.token
      AND (
        p.trip_id IN (SELECT id FROM public.trips WHERE user_id = auth.uid())
        OR p.trip_id IN (SELECT trip_id FROM public.trip_members WHERE user_email = auth.email() AND role = 'editor')
      )
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.trip_portals p
      WHERE p.token = trip_portal_snapshots.token
      AND (
        p.trip_id IN (SELECT id FROM public.trips WHERE user_id = auth.uid())
        OR p.trip_id IN (SELECT trip_id FROM public.trip_members WHERE user_email = auth.email() AND role = 'editor')
      )
    )
  );

CREATE OR REPLACE FUNCTION public.set_portal_snapshot_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_portal_snapshot_updated_at ON public.trip_portal_snapshots;
CREATE TRIGGER trg_portal_snapshot_updated_at
BEFORE UPDATE ON public.trip_portal_snapshots
FOR EACH ROW EXECUTE FUNCTION public.set_portal_snapshot_updated_at();
