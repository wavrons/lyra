import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Button } from '../components/Button';

type PortalRow = {
  token: string;
  published: boolean;
  show_receipts?: boolean;
  created_at: string;
};

type SnapshotPayload = {
  days?: Array<{
    label: string;
    entries: Array<{ id: string; title: string; url?: string; description?: string }>;
  }>;
  receipts?: Array<{ id: string; title: string; url: string; kind: string }>;
};

function getGoogleMapsSearchUrl(query: string) {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
}

export function Portal() {
  const { token } = useParams<{ token: string }>();
  const [portal, setPortal] = useState<PortalRow | null>(null);
  const [tripTitle, setTripTitle] = useState<string>('');
  const [payload, setPayload] = useState<SnapshotPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const mapsQuery = useMemo(() => {
    if (tripTitle) return tripTitle;
    return 'Trip';
  }, [tripTitle]);

  useEffect(() => {
    (async () => {
      if (!token) return;
      setLoading(true);
      setError('');

      const { data: portalData, error: portalErr } = await supabase
        .from('trip_portals')
        .select('token, published, show_receipts, created_at')
        .eq('token', token)
        .maybeSingle();

      if (portalErr || !portalData || !portalData.published) {
        setPortal(null);
        setPayload(null);
        setTripTitle('');
        setLoading(false);
        setError('This link is invalid or unpublished.');
        return;
      }

      setPortal(portalData as PortalRow);

      const { data: snapData } = await supabase
        .from('trip_portal_snapshots')
        .select('trip_title, payload')
        .eq('token', token)
        .maybeSingle();

      setTripTitle((snapData as any)?.trip_title ?? 'Trip');
      setPayload(((snapData as any)?.payload as SnapshotPayload) ?? null);
      setLoading(false);
    })();
  }, [token]);

  if (loading) return null;

  return (
    <div className="mx-auto max-w-2xl p-6">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <div className="text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>
            Portal
          </div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--text-main)' }}>
            {tripTitle}
          </h1>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" size="sm" onClick={() => window.open(getGoogleMapsSearchUrl(mapsQuery), '_blank')}>
            Open in Google Maps
          </Button>
          <Button variant="secondary" size="sm" onClick={() => window.print()}>
            Save as PDF
          </Button>
        </div>
      </div>

      {error ? (
        <div className="rounded-xl border border-dashed p-8 text-center text-sm" style={{ background: 'var(--card-surface)', color: 'var(--text-muted)', borderColor: 'var(--border-color)' }}>
          {error}
        </div>
      ) : !payload?.days?.length ? (
        <div className="rounded-xl border border-dashed p-8 text-center text-sm" style={{ background: 'var(--card-surface)', color: 'var(--text-muted)', borderColor: 'var(--border-color)' }}>
          No stops yet.
        </div>
      ) : (
        <div className="space-y-4">
          {payload.days.map((day) => (
            <section key={day.label}>
              <div className="mb-2 text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>
                {day.label}
              </div>
              <div className="space-y-2">
                {day.entries.map((e) => (
                  <div key={e.id} className="rounded-xl p-4 shadow-sm" style={{ background: 'var(--card-surface)', border: '1px solid var(--border-color)' }}>
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="text-base font-semibold" style={{ color: 'var(--text-main)' }}>
                          {e.title}
                        </div>
                        {e.description && (
                          <div className="mt-1 text-sm" style={{ color: 'var(--text-muted)' }}>
                            {e.description}
                          </div>
                        )}
                        {e.url && (
                          <a href={e.url} target="_blank" className="mt-1 block text-sm hover:underline" style={{ color: 'var(--accent)' }}>
                            Link
                          </a>
                        )}
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <Button variant="secondary" size="sm" onClick={() => window.open(getGoogleMapsSearchUrl(e.title), '_blank')}>
                          Open in Google Maps
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          ))}

          {portal?.show_receipts && payload?.receipts?.length ? (
            <section>
              <div className="mb-2 text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>
                Receipts
              </div>
              <div className="space-y-2">
                {payload.receipts.map((r) => (
                  <div key={r.id} className="rounded-xl p-4 shadow-sm" style={{ background: 'var(--card-surface)', border: '1px solid var(--border-color)' }}>
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <div className="text-sm font-semibold" style={{ color: 'var(--text-main)' }}>{r.title || r.kind}</div>
                        <div className="text-xs" style={{ color: 'var(--text-muted)' }}>{r.kind}</div>
                      </div>
                      <a href={r.url} target="_blank" className="text-sm hover:underline" style={{ color: 'var(--accent)' }}>
                        View
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          ) : null}
        </div>
      )}

      {portal && (
        <div className="mt-6 text-xs" style={{ color: 'var(--text-muted)' }}>
          Link id: {portal.token}
        </div>
      )}
    </div>
  );
}
