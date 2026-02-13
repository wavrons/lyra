import { useEffect, useState } from 'react';
import { SFPersonBadgePlus, SFTrashFill } from './SFSymbols';
import { Button } from './Button';
import { Input } from './Input';
import { Select } from './Select';
import { supabase, type TripMember } from '../lib/supabase';

interface ShareModalProps {
  tripId: string;
  onClose: () => void;
}

export function ShareModal({ tripId, onClose }: ShareModalProps) {
  const [members, setMembers] = useState<TripMember[]>([]);
  const [newEmail, setNewEmail] = useState('');
  const [role, setRole] = useState<'viewer' | 'editor'>('viewer');
  const [loading, setLoading] = useState(true);
  const [sharing, setSharing] = useState(false);
  const [error, setError] = useState('');
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    fetchMembers();
  }, [tripId]);

  const fetchMembers = async () => {
    try {
      const { data, error } = await supabase
        .from('trip_members')
        .select('*')
        .eq('trip_id', tripId);

      if (error) throw error;
      setMembers(data || []);
    } catch (err) {
      console.error('Error fetching members:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleShare = async (e: React.FormEvent) => {
    e.preventDefault();
    setSharing(true);
    setError('');

    try {
      const normalizedEmail = newEmail.trim().toLowerCase();
      const { data: exists, error: existsError } = await supabase.rpc('user_exists_by_email', {
        target_email: normalizedEmail,
      });

      if (existsError) throw existsError;
      if (!exists) {
        setError('That email isn’t registered yet. Ask them to sign up first.');
        setSharing(false);
        return;
      }

      const { data, error } = await supabase
        .from('trip_members')
        .insert([{
          trip_id: tripId,
          user_email: normalizedEmail,
          role
        }])
        .select()
        .single();

      if (error) {
        if (error.code === '23505') throw new Error('User already added');
        throw error;
      }
      
      if (data) {
        setMembers([...members, data]);
        setNewEmail('');
        setRole('viewer');
        setAdding(false);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSharing(false);
    }
  };

  const handleCancel = () => {
    setAdding(false);
    setNewEmail('');
    setRole('viewer');
    setError('');
  };

  const handleRemove = async (memberId: string) => {
    try {
      const { error } = await supabase
        .from('trip_members')
        .delete()
        .eq('id', memberId);

      if (error) throw error;
      setMembers(members.filter(m => m.id !== memberId));
    } catch (err) {
      console.error('Error removing member:', err);
    }
  };

  return (
    <div className="share-modal__backdrop" role="presentation">
      <div className="share-modal">
        <div className="share-modal__header">
          <div>
            <p className="share-modal__eyebrow">Trip access</p>
            <h2 className="share-modal__title">Share Trip</h2>
          </div>
          <button type="button" className="share-modal__close" onClick={onClose} aria-label="Close">
            ×
          </button>
        </div>

        <div className="share-modal__list">
          <div className="share-modal__list-header">
            <h3>People with access</h3>
            <button
              type="button"
              className="share-modal__icon-btn"
              onClick={() => {
                setAdding(true);
                setError('');
              }}
              disabled={adding}
              aria-label="Add collaborator"
            >
              +
            </button>
          </div>

          {loading ? (
            <div className="share-modal__skeleton" />
          ) : (
            <>
              <ul className="share-modal__people" aria-live="polite">
                {members.length === 0 ? (
                  <li className="share-modal__empty-row">
                    <span className="share-modal__empty">No one else has access.</span>
                  </li>
                ) : (
                  members.map(member => (
                    <li key={member.id} className="share-modal__person">
                      <div>
                        <span className="share-modal__email">{member.user_email}</span>
                        <span className="share-modal__role-chip">{member.role}</span>
                      </div>
                      <Button variant="danger" size="sm" onClick={() => handleRemove(member.id)}>
                        <SFTrashFill size={16} />
                      </Button>
                    </li>
                  ))
                )}
              </ul>

              {adding && (
                <form onSubmit={handleShare} className="share-modal__new-row">
                  <div className="share-modal__new-row-grid">
                    <Input
                      type="email"
                      required
                      placeholder="friend@example.com"
                      value={newEmail}
                      onChange={e => setNewEmail(e.target.value)}
                      className="share-modal__input"
                    />
                    <Select
                      value={role}
                      onChange={v => setRole(v as 'viewer' | 'editor')}
                      options={[
                        { value: 'viewer', label: 'Viewer' },
                        { value: 'editor', label: 'Editor' },
                      ]}
                      className="share-modal__select"
                    />
                  </div>

                  {error && <p className="share-modal__error">{error}</p>}

                  <div className="share-modal__form-actions">
                    <Button type="button" variant="secondary" size="sm" onClick={handleCancel}>
                      Cancel
                    </Button>
                    <Button type="submit" size="sm" disabled={sharing} className="share-modal__submit">
                      <SFPersonBadgePlus size={16} className="mr-2" />
                      {sharing ? 'Adding…' : 'Add'}
                    </Button>
                  </div>
                </form>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
