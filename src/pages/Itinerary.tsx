import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useParams } from 'react-router-dom';
import { Button } from '../components/Button';
import { supabase, type BoardItem, type Trip, type TripItem } from '../lib/supabase';

type PortalRow = {
  token: string;
  trip_id: string;
  published: boolean;
  created_at: string;
};

function makeToken(len = 12) {
  const alphabet = 'abcdefghijklmnopqrstuvwxyz0123456789';
  const bytes = new Uint8Array(len);
  crypto.getRandomValues(bytes);
  let out = '';
  for (let i = 0; i < bytes.length; i += 1) {
    out += alphabet[bytes[i] % alphabet.length];
  }
  return out;
}

function getGoogleMapsSearchUrl(query: string) {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
}

export function Itinerary({ embedded }: { embedded?: boolean } = {}) {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const [trip, setTrip] = useState<Trip | null>(null);
  const [items, setItems] = useState<TripItem[]>([]);
  const [boardItems, setBoardItems] = useState<BoardItem[]>([]);
  const [portal, setPortal] = useState<PortalRow | null>(null);
  const [publishing, setPublishing] = useState(false);
  const [loading, setLoading] = useState(true);

  const portalUrl = useMemo(() => {
    if (!portal?.token) return '';
    const base = import.meta.env.BASE_URL || '/';
    return `${window.location.origin}${base}#/v/${portal.token}`;
  }, [portal?.token]);

  const handlePublishToggle = async () => {
    if (!id) return;
    setPublishing(true);
    try {
      if (!portal) {
        const { data: userData } = await supabase.auth.getUser();
        const userId = userData.user?.id;
        if (!userId) throw new Error('You must be logged in to publish.');
        const token = makeToken(12);
        const { data, error } = await supabase
          .from('trip_portals')
          .insert({ token, trip_id: id, created_by: userId, published: true })
          .select('token, trip_id, published, created_at')
          .single();
        if (error) throw error;
        setPortal(data as PortalRow);
      } else {
        const next = !portal.published;
        const { data, error } = await supabase
          .from('trip_portals')
          .update({ published: next })
          .eq('token', portal.token)
          .select('token, trip_id, published, created_at')
          .single();
        if (error) throw error;
        setPortal(data as PortalRow);
      }
    } finally {
      setPublishing(false);
    }
  };

  const handleCopyPortalUrl = async () => {
    if (!portalUrl) return;
    try {
      await navigator.clipboard.writeText(portalUrl);
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    (async () => {
      if (!id) {
        setItems([]);
        setBoardItems([]);
        setTrip(null);
        setPortal(null);
        setLoading(false);
        return;
      }

      const [{ data: tripData }, { data: tripItems }, { data: bItems }, { data: portalData }] = await Promise.all([
        supabase.from('trips').select('*').eq('id', id).maybeSingle(),
        supabase.from('trip_items').select('*').eq('trip_id', id).order('created_at', { ascending: false }),
        supabase.from('board_items').select('*').eq('trip_id', id).order('created_at', { ascending: false }),
        supabase.from('trip_portals').select('token, trip_id, published, created_at').eq('trip_id', id).order('created_at', { ascending: false }).limit(1),
      ]);

      setTrip((tripData as Trip) ?? null);
      setItems((tripItems as TripItem[]) ?? []);
      setBoardItems((bItems as BoardItem[]) ?? []);

      const latestPortal = Array.isArray(portalData) && portalData.length ? portalData[0] : null;
      setPortal((latestPortal as PortalRow) ?? null);
      setLoading(false);
    })();
  }, [id]);

  if (loading) return null;

  return (
    <div className="mx-auto max-w-6xl p-6">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          {!embedded && (
            <h1 className="text-2xl font-bold" style={{ color: 'var(--text-main)' }}>
              {t('itinerary.title')}
            </h1>
          )}
          {trip?.title && (
            <div className={embedded ? 'text-sm font-semibold' : 'mt-1 text-sm'} style={{ color: embedded ? 'var(--text-main)' : 'var(--text-muted)' }}>
              {trip.title}
            </div>
          )}
        </div>
        <div className="flex flex-col items-end gap-2">
          <Button variant="secondary" size="sm" disabled={publishing} onClick={() => void handlePublishToggle()}>
            {portal?.published ? 'Unpublish' : 'Publish'}
          </Button>
          {portal?.published && portalUrl && (
            <div className="flex items-center gap-2">
              <Button variant="secondary" size="sm" onClick={() => void handleCopyPortalUrl()}>
                Copy Link
              </Button>
              <Button variant="secondary" size="sm" onClick={() => window.open(portalUrl, '_blank')}>
                Open
              </Button>
            </div>
          )}
        </div>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(280px, 1fr) minmax(360px, 1.2fr)',
          gap: 16,
          alignItems: 'start',
        }}
      >
        <div className="rounded-2xl p-4" style={{ background: 'var(--card-surface)', border: '1px solid var(--border-color)' }}>
          <div className="mb-3 text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>
            Sandbox (Board)
          </div>
          {boardItems.length === 0 ? (
            <div className="rounded-xl border border-dashed p-6 text-center text-sm" style={{ background: 'transparent', color: 'var(--text-muted)', borderColor: 'var(--border-color)' }}>
              No board items yet.
            </div>
          ) : (
            <div className="space-y-2">
              {boardItems.map((b) => (
                <div key={b.id} className="rounded-xl p-3" style={{ border: '1px solid var(--border-color)' }}>
                  <div className="text-sm font-semibold" style={{ color: 'var(--text-main)' }}>
                    {b.title || '(untitled)'}
                  </div>
                  {b.url && (
                    <a href={b.url} target="_blank" className="text-xs hover:underline" style={{ color: 'var(--accent)' }}>
                      {b.url}
                    </a>
                  )}
                  {b.description && (
                    <div className="mt-1 text-xs" style={{ color: 'var(--text-muted)' }}>
                      {b.description}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-2xl p-4" style={{ background: 'var(--card-surface)', border: '1px solid var(--border-color)' }}>
          <div className="mb-3 text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>
            Timeline (POIs)
          </div>
          {items.length === 0 ? (
            <div className="rounded-xl border border-dashed p-6 text-center text-sm" style={{ background: 'transparent', color: 'var(--text-muted)', borderColor: 'var(--border-color)' }}>
              {t('itinerary.noPOIs')}
            </div>
          ) : (
            <div className="space-y-2">
              {items.map((item) => (
                <div key={item.id} className="rounded-xl p-3" style={{ border: '1px solid var(--border-color)' }}>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="mb-1 text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--accent)' }}>
                        {item.country}
                      </div>
                      <div className="text-sm font-semibold" style={{ color: 'var(--text-main)' }}>
                        {item.name}
                      </div>
                      {item.notes && (
                        <div className="mt-1 text-xs" style={{ color: 'var(--text-muted)' }}>
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
                        <a href={item.link} target="_blank" className="text-xs hover:underline" style={{ color: 'var(--accent)' }}>
                          Link
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
