import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { supabase, type TripItem } from '../lib/supabase';
import { Button } from '../components/Button';

type PortalRow = {
  token: string;
  trip_id: string;
  published: boolean;
  created_at: string;
};

function getGoogleMapsSearchUrl(query: string) {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
}

export function Portal() {
  const { token } = useParams<{ token: string }>();
  const [portal, setPortal] = useState<PortalRow | null>(null);
  const [tripTitle, setTripTitle] = useState<string>('');
  const [items, setItems] = useState<TripItem[]>([]);
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
        .select('token, trip_id, published, created_at')
        .eq('token', token)
        .maybeSingle();

      if (portalErr || !portalData || !portalData.published) {
        setPortal(null);
        setItems([]);
        setTripTitle('');
        setLoading(false);
        setError('This link is invalid or unpublished.');
        return;
      }

      setPortal(portalData as PortalRow);

      const [{ data: tripData }, { data: tripItems }] = await Promise.all([
        supabase.from('trips').select('title').eq('id', portalData.trip_id).maybeSingle(),
        supabase.from('trip_items').select('*').eq('trip_id', portalData.trip_id).order('created_at', { ascending: false }),
      ]);

      setTripTitle((tripData as any)?.title ?? 'Trip');
      setItems((tripItems as TripItem[]) ?? []);
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
      ) : items.length === 0 ? (
        <div className="rounded-xl border border-dashed p-8 text-center text-sm" style={{ background: 'var(--card-surface)', color: 'var(--text-muted)', borderColor: 'var(--border-color)' }}>
          No stops yet.
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((item) => (
            <div key={item.id} className="rounded-xl p-4 shadow-sm" style={{ background: 'var(--card-surface)', border: '1px solid var(--border-color)' }}>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="mb-1 text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--accent)' }}>
                    {item.country}
                  </div>
                  <div className="text-base font-semibold" style={{ color: 'var(--text-main)' }}>
                    {item.name}
                  </div>
                  {item.notes && (
                    <div className="mt-1 text-sm" style={{ color: 'var(--text-muted)' }}>
                      {item.notes}
                    </div>
                  )}
                </div>
                <div className="flex flex-col items-end gap-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => window.open(getGoogleMapsSearchUrl(`${item.name} ${item.country}`), '_blank')}
                  >
                    Open in Google Maps
                  </Button>
                  {item.link && (
                    <a href={item.link} target="_blank" className="text-sm hover:underline" style={{ color: 'var(--accent)' }}>
                      Link
                    </a>
                  )}
                </div>
              </div>
            </div>
          ))}
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
