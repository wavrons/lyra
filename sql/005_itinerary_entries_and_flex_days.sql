-- ============================================================
-- Migration 005: Itinerary scheduling (day buckets) + flexible day count
-- Run this in your Supabase SQL Editor
-- ============================================================

-- 1) Flexible day count (only used when trip has no fixed dates)
ALTER TABLE public.trips
  ADD COLUMN IF NOT EXISTS flex_day_count integer NOT NULL DEFAULT 7;

-- 2) Itinerary entries (schedule board_items into day buckets)
CREATE TABLE IF NOT EXISTS public.itinerary_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id uuid NOT NULL REFERENCES public.trips(id) ON DELETE CASCADE,
  board_item_id uuid NOT NULL REFERENCES public.board_items(id) ON DELETE CASCADE,
  day_index integer NOT NULL CHECK (day_index >= 1),
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (trip_id, board_item_id)
);

CREATE INDEX IF NOT EXISTS idx_itinerary_entries_trip_day ON public.itinerary_entries(trip_id, day_index);

ALTER TABLE public.itinerary_entries ENABLE ROW LEVEL SECURITY;

-- View itinerary entries: trip access
DROP POLICY IF EXISTS "View itinerary entries: trip access" ON public.itinerary_entries;
CREATE POLICY "View itinerary entries: trip access"
  ON public.itinerary_entries FOR SELECT
  USING (public.has_trip_access(trip_id));

-- Insert itinerary entries: editor
DROP POLICY IF EXISTS "Create itinerary entries: trip editor access" ON public.itinerary_entries;
CREATE POLICY "Create itinerary entries: trip editor access"
  ON public.itinerary_entries FOR INSERT
  WITH CHECK (public.has_trip_access(trip_id, 'editor'));

-- Update itinerary entries: editor
DROP POLICY IF EXISTS "Update itinerary entries: trip editor access" ON public.itinerary_entries;
CREATE POLICY "Update itinerary entries: trip editor access"
  ON public.itinerary_entries FOR UPDATE
  USING (public.has_trip_access(trip_id, 'editor'));

-- Delete itinerary entries: editor
DROP POLICY IF EXISTS "Delete itinerary entries: trip editor access" ON public.itinerary_entries;
CREATE POLICY "Delete itinerary entries: trip editor access"
  ON public.itinerary_entries FOR DELETE
  USING (public.has_trip_access(trip_id, 'editor'));
