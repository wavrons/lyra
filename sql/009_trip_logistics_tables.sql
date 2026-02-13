-- ============================================================
-- Migration 009: Trip logistics tables (multiple flights + multiple stays)
-- Run this AFTER supabase_schema_v2.sql (and after has_trip_access exists)
-- ============================================================

CREATE TABLE IF NOT EXISTS public.trip_flights (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id uuid NOT NULL REFERENCES public.trips(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id),
  flight_number text,
  airline text,
  status text,
  depart_airport text,
  arrive_airport text,
  depart_time timestamptz,
  arrive_time timestamptz,
  confirmation_number text,
  notes text,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_trip_flights_trip ON public.trip_flights(trip_id);

ALTER TABLE public.trip_flights ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "View flights: trip access" ON public.trip_flights;
CREATE POLICY "View flights: trip access"
  ON public.trip_flights FOR SELECT
  USING (public.has_trip_access(trip_id));

DROP POLICY IF EXISTS "Create flights: trip editor access" ON public.trip_flights;
CREATE POLICY "Create flights: trip editor access"
  ON public.trip_flights FOR INSERT
  WITH CHECK (public.has_trip_access(trip_id, 'editor') AND auth.uid() = user_id);

DROP POLICY IF EXISTS "Update flights: trip editor access" ON public.trip_flights;
CREATE POLICY "Update flights: trip editor access"
  ON public.trip_flights FOR UPDATE
  USING (public.has_trip_access(trip_id, 'editor'));

DROP POLICY IF EXISTS "Delete flights: trip editor access" ON public.trip_flights;
CREATE POLICY "Delete flights: trip editor access"
  ON public.trip_flights FOR DELETE
  USING (public.has_trip_access(trip_id, 'editor'));

CREATE TABLE IF NOT EXISTS public.trip_stays (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id uuid NOT NULL REFERENCES public.trips(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id),
  name text,
  address text,
  check_in_time text,
  check_out_time text,
  confirmation_number text,
  notes text,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_trip_stays_trip ON public.trip_stays(trip_id);

ALTER TABLE public.trip_stays ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "View stays: trip access" ON public.trip_stays;
CREATE POLICY "View stays: trip access"
  ON public.trip_stays FOR SELECT
  USING (public.has_trip_access(trip_id));

DROP POLICY IF EXISTS "Create stays: trip editor access" ON public.trip_stays;
CREATE POLICY "Create stays: trip editor access"
  ON public.trip_stays FOR INSERT
  WITH CHECK (public.has_trip_access(trip_id, 'editor') AND auth.uid() = user_id);

DROP POLICY IF EXISTS "Update stays: trip editor access" ON public.trip_stays;
CREATE POLICY "Update stays: trip editor access"
  ON public.trip_stays FOR UPDATE
  USING (public.has_trip_access(trip_id, 'editor'));

DROP POLICY IF EXISTS "Delete stays: trip editor access" ON public.trip_stays;
CREATE POLICY "Delete stays: trip editor access"
  ON public.trip_stays FOR DELETE
  USING (public.has_trip_access(trip_id, 'editor'));
