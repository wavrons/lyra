import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Plus, Share2, Trash2 } from 'lucide-react';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { supabase, type Trip } from '../lib/supabase';
import { ShareModal } from '../components/ShareModal';
import { ConfirmModal } from '../components/ConfirmModal';

export function Dashboard() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [newTripTitle, setNewTripTitle] = useState('');
  const [shareTripId, setShareTripId] = useState<string | null>(null);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchTrips();
  }, []);

  const fetchTrips = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      console.log('[Dashboard] session check:', { 
        hasSession: !!session, 
        userId: session?.user?.id,
        expiresAt: session?.expires_at,
        tokenPreview: session?.access_token?.slice(0, 20) + '…',
      });

      const { data, error } = await supabase
        .from('trips')
        .select('*')
        .order('created_at', { ascending: false });

      console.log('[Dashboard] fetchTrips result:', { count: data?.length, error });
      if (error) throw error;
      setTrips(data || []);
    } catch (error) {
      console.error('Error fetching trips:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTrip = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTripTitle.trim()) return;

    try {
      const { data: { session: currentSession } } = await supabase.auth.getSession();
      console.log('[Dashboard] session for insert:', {
        hasSession: !!currentSession,
        userId: currentSession?.user?.id,
        tokenType: currentSession?.token_type,
        tokenPreview: currentSession?.access_token?.slice(0, 30) + '…',
      });

      const { data: { user }, error: userError } = await supabase.auth.getUser();
      console.log('[Dashboard] getUser result:', { userId: user?.id, userError });
      if (!user) {
        setError('Not authenticated — please log in again.');
        return;
      }

      // Debug: check what token supabase-js is actually sending
      const { data: { session: sess } } = await supabase.auth.getSession();
      console.log('[Dashboard] token being used:', {
        hasAccessToken: !!sess?.access_token,
        tokenStart: sess?.access_token?.slice(0, 40),
        tokenLength: sess?.access_token?.length,
      });

      const { data, error } = await supabase
        .from('trips')
        .insert([{
          user_id: user.id,
          title: newTripTitle.trim(),
        }])
        .select()
        .single();

      console.log('[Dashboard] insert result:', { data, error });
      if (error) throw error;
      if (data) {
        setTrips([data, ...trips]);
        setNewTripTitle('');
        setIsCreating(false);
      }
    } catch (err: any) {
      const msg = err?.message || err?.details || JSON.stringify(err);
      console.error('Error creating trip:', err);
      setError(`Failed to create trip: ${msg}`);
    }
  };

  const handleDeleteTrip = async (id: string) => {
    try {
      const { error } = await supabase
        .from('trips')
        .delete()
        .eq('id', id);

      if (error) throw error;
      setTrips(trips.filter(t => t.id !== id));
    } catch (error) {
      console.error('Error deleting trip:', error);
    }
  };

  if (loading) return null;

  return (
    <div className="mx-auto max-w-6xl p-6">
      {error && (
        <div className="mb-4 rounded-lg p-3 text-sm" style={{ background: 'rgba(239,68,68,0.1)', color: '#ef4444' }}>
          {error}
        </div>
      )}
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold" style={{ color: 'var(--text-main)' }}>{t('dashboard.title')}</h1>
        <Button onClick={() => setIsCreating(!isCreating)}>
          <Plus className="mr-2 h-4 w-4" />
          {t('dashboard.newTrip')}
        </Button>
      </div>

      {isCreating && (
        <form onSubmit={handleCreateTrip} className="mb-8 rounded-xl p-5 shadow-sm" style={{ background: 'var(--card-surface)', border: '1px solid var(--border-color)' }}>
          <div className="flex gap-4">
            <div className="flex-1">
              <label className="mb-1 block text-sm font-medium">{t('dashboard.tripTitle')}</label>
              <Input 
                autoFocus
                required 
                value={newTripTitle} 
                onChange={e => setNewTripTitle(e.target.value)} 
                placeholder={t('dashboard.placeholder')}
              />
            </div>
            <div className="flex items-end gap-2">
              <Button type="submit">{t('dashboard.create')}</Button>
              <Button type="button" variant="secondary" onClick={() => setIsCreating(false)}>{t('dashboard.cancel')}</Button>
            </div>
          </div>
        </form>
      )}

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {trips.map(trip => (
          <div 
            key={trip.id} 
            className="group relative cursor-pointer rounded-xl p-6 shadow-sm transition-all hover:shadow-md"
            style={{ background: 'var(--card-surface)', border: '1px solid var(--border-color)' }}
            onClick={() => navigate(`/trip/${trip.id}/board`)}
          >
            <h3 className="mb-2 text-lg font-semibold" style={{ color: 'var(--text-main)' }}>{trip.title}</h3>
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>{t('dashboard.created')} {new Date(trip.created_at).toLocaleDateString()}</p>
            
            <div className="absolute right-4 top-4 flex gap-2 opacity-0 transition-opacity group-hover:opacity-100">
              <Button 
                variant="secondary" 
                size="sm" 
                onClick={(e) => {
                  e.stopPropagation();
                  setShareTripId(trip.id);
                }}
              >
                <Share2 className="h-4 w-4" />
              </Button>
              <Button 
                variant="danger" 
                size="sm" 
                onClick={(e) => {
                  e.stopPropagation();
                  setPendingDeleteId(trip.id);
                }}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ))}

        {trips.length === 0 && !isCreating && (
          <div className="col-span-full rounded-xl border border-dashed p-12 text-center" style={{ color: 'var(--text-muted)', borderColor: 'var(--border-color)' }}>
            {t('dashboard.noTrips')}
          </div>
        )}
      </div>

      {shareTripId && (
        <ShareModal 
          tripId={shareTripId} 
          onClose={() => setShareTripId(null)} 
        />
      )}

      <ConfirmModal
        open={!!pendingDeleteId}
        title="Delete trip?"
        message="Are you sure you want to delete this trip? This cannot be undone."
        confirmLabel="Delete"
        cancelLabel="Cancel"
        variant="danger"
        onConfirm={() => {
          if (pendingDeleteId) void handleDeleteTrip(pendingDeleteId);
          setPendingDeleteId(null);
        }}
        onCancel={() => setPendingDeleteId(null)}
      />
    </div>
  );
}
