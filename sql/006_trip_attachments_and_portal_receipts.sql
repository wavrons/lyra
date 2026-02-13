-- ============================================================
-- Migration 006: Trip attachments (document vault) + portal receipts visibility
-- Run this AFTER Migration 004
-- ============================================================

-- 1) Portal setting: whether to show receipts publicly
ALTER TABLE public.trip_portals
  ADD COLUMN IF NOT EXISTS show_receipts boolean NOT NULL DEFAULT false;

-- 2) Trip attachments (simple document vault)
CREATE TABLE IF NOT EXISTS public.trip_attachments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id uuid NOT NULL REFERENCES public.trips(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id),
  title text NOT NULL DEFAULT '',
  url text NOT NULL,
  kind text NOT NULL DEFAULT 'receipt' CHECK (kind IN ('receipt', 'ticket', 'document')),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_trip_attachments_trip ON public.trip_attachments(trip_id);

ALTER TABLE public.trip_attachments ENABLE ROW LEVEL SECURITY;

-- View: trip access
DROP POLICY IF EXISTS "View attachments: trip access" ON public.trip_attachments;
CREATE POLICY "View attachments: trip access"
  ON public.trip_attachments FOR SELECT
  USING (public.has_trip_access(trip_id));

-- Insert: editor
DROP POLICY IF EXISTS "Create attachments: trip editor access" ON public.trip_attachments;
CREATE POLICY "Create attachments: trip editor access"
  ON public.trip_attachments FOR INSERT
  WITH CHECK (public.has_trip_access(trip_id, 'editor') AND auth.uid() = user_id);

-- Delete: editor (allow deleting own docs; owners/editors can delete by RLS update if needed later)
DROP POLICY IF EXISTS "Delete attachments: trip editor access" ON public.trip_attachments;
CREATE POLICY "Delete attachments: trip editor access"
  ON public.trip_attachments FOR DELETE
  USING (public.has_trip_access(trip_id, 'editor'));
