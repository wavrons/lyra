-- ============================================================
-- Migration 004: Trip portals (public read-only share links)
-- Run this in your Supabase SQL Editor
-- ============================================================

CREATE TABLE IF NOT EXISTS public.trip_portals (
  token text PRIMARY KEY,
  trip_id uuid NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
  created_by uuid NOT NULL REFERENCES auth.users(id),
  published boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_trip_portals_trip_id ON public.trip_portals(trip_id);

ALTER TABLE public.trip_portals ENABLE ROW LEVEL SECURITY;

-- Public can read published portals (no auth)
DROP POLICY IF EXISTS "Public can read published portals" ON public.trip_portals;
CREATE POLICY "Public can read published portals"
  ON public.trip_portals FOR SELECT
  USING (published = true);

-- Authenticated users can manage portals for trips they own or can edit
DROP POLICY IF EXISTS "Editors can insert portals" ON public.trip_portals;
CREATE POLICY "Editors can insert portals"
  ON public.trip_portals FOR INSERT
  WITH CHECK (
    auth.uid() = created_by AND (
      trip_id IN (SELECT id FROM trips WHERE user_id = auth.uid())
      OR trip_id IN (SELECT trip_id FROM trip_members WHERE user_email = auth.email() AND role = 'editor')
    )
  );

DROP POLICY IF EXISTS "Editors can update portals" ON public.trip_portals;
CREATE POLICY "Editors can update portals"
  ON public.trip_portals FOR UPDATE
  USING (
    trip_id IN (SELECT id FROM trips WHERE user_id = auth.uid())
    OR trip_id IN (SELECT trip_id FROM trip_members WHERE user_email = auth.email() AND role = 'editor')
  );
