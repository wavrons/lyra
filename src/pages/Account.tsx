import { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import {
  SFTrashFill,
  SFCheckmark,
  SFPersonCircleFill,
  SFMapFill,
  SFCheckmarkCircleFill,
  SFEyeCircleFill,
} from '../components/SFSymbols';
import { Select } from '../components/Select';
import { ConfirmModal } from '../components/ConfirmModal';
import { Onboarding } from './Onboarding';

type ProfileRow = {
  user_id: string;
  display_name: string | null;
  deactivated_at: string | null;
};

type SettingsRow = {
  user_id: string;
  city_theme?: string | null;
};

type FrequentFlyerRow = {
  id: string;
  user_id: string;
  airline_code: string;
  airline_name: string | null;
  member_number: string;
};

type InviteCode = {
  id: string;
  code: string;
  created_for_name?: string;
  created_for_email?: string;
  used_by?: string;
  used_at?: string;
  created_at: string;
};

type ToastScope =
  | 'profile'
  | 'ff'
  | 'ff-modal'
  | 'theme'
  | 'invite'
  | 'invite-modal'
  | 'waitlist'
  | 'support';

type WaitlistEntry = {
  id: string;
  name: string;
  email: string;
  message?: string;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
};

const AIRLINES: Array<{ code: string; name: string }> = [
  { code: 'BR', name: 'EVA Air' },
  { code: 'CI', name: 'China Airlines' },
  { code: 'JL', name: 'Japan Airlines' },
  { code: 'NH', name: 'ANA' },
  { code: 'SQ', name: 'Singapore Airlines' },
  { code: 'CX', name: 'Cathay Pacific' },
  { code: 'UA', name: 'United' },
  { code: 'AA', name: 'American' },
  { code: 'DL', name: 'Delta' },
];

export function Account() {
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'profile' | 'look_and_feel' | 'admin' | 'support'>('profile');
  const [searchParams, setSearchParams] = useSearchParams();
  const [confirmAction, setConfirmAction] = useState<{ title: string; message: string; onConfirm: () => void } | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [showDeactivateModal, setShowDeactivateModal] = useState(false);
  const [deactivating, setDeactivating] = useState(false);
  const [savingTheme, setSavingTheme] = useState(false);

  const MIN_THEME_OVERLAY_MS = 2000;

  const [userId, setUserId] = useState<string | null>(null);
  const [currentEmail, setCurrentEmail] = useState<string>('');
  const [newEmail, setNewEmail] = useState<string>('');

  const [displayName, setDisplayName] = useState('');
  const [originalDisplayName, setOriginalDisplayName] = useState('');

  const [cityTheme, setCityTheme] = useState<
    'taipei' | 'rio' | 'los_angeles' | 'amsterdam' | 'tokyo' | 'seoul' | 'santorini' | 'arjeplog'
  >('taipei');
  const [activeTheme, setActiveTheme] = useState<typeof cityTheme>('taipei');

  const [ffRows, setFfRows] = useState<FrequentFlyerRow[]>([]);
  const [airlineCode, setAirlineCode] = useState('');
  const [airlineName, setAirlineName] = useState('');
  const [memberNumber, setMemberNumber] = useState('');
  const [showFfForm, setShowFfForm] = useState(false);

  const [toast, setToast] = useState<{
    type: 'error' | 'success';
    message: string;
    scope: ToastScope;
  } | null>(null);
  const toastTimer = useRef<number | null>(null);

  // Admin-only state
  const [codes, setCodes] = useState<InviteCode[]>([]);
  const [waitlist, setWaitlist] = useState<WaitlistEntry[]>([]);
  const [newCodeName, setNewCodeName] = useState('');
  const [newCodeEmail, setNewCodeEmail] = useState('');
  const [generating, setGenerating] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showOnboardingPreview, setShowOnboardingPreview] = useState(false);

  const isCjk = (value: string) => /[\u3400-\u9FFF\uF900-\uFAFF]/.test(value);
  const isProfileDirty = displayName.trim() !== originalDisplayName;
  const invitedCount = codes.length;
  const acceptedCount = codes.filter((code) => !!code.used_by).length;
  const waitingCount = waitlist.filter((entry) => entry.status === 'pending').length;

  const showToast = (type: 'error' | 'success', message: string, scope: ToastScope) => {
    setToast({ type, message, scope });
  };

  const clearToast = () => {
    setToast(null);
  };

  useEffect(() => {
    if (!toast) return;
    if (toastTimer.current) window.clearTimeout(toastTimer.current);
    toastTimer.current = window.setTimeout(() => {
      setToast(null);
    }, 3000);
    return () => {
      if (toastTimer.current) window.clearTimeout(toastTimer.current);
    };
  }, [toast]);

  const renderToast = (scope: ToastScope, className = '') => {
    if (!toast || toast.scope !== scope) return null;
    return (
      <div
        className={`account-toast account-toast--${toast.type} ${className}`.trim()}
      >
        {toast.message}
      </div>
    );
  };

  const setTabWithParam = (next: 'profile' | 'look_and_feel' | 'admin' | 'support') => {
    setTab(next);
    setSearchParams((prev) => {
      const params = new URLSearchParams(prev);
      params.set('tab', next);
      return params;
    });
  };

  const getAvatarText = (value: string) => {
    const v = (value || '').trim();
    if (!v) return '?';

    if (isCjk(v)) {
      const chars = Array.from(v.replace(/\s+/g, ''));
      return chars.length ? chars[chars.length - 1] : '?';
    }

    const letters = v.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
    if (!letters) return '?';
    return letters.slice(0, 2);
  };

  const cityThemes: Array<{
    key: typeof cityTheme;
    name: string;
    description: string;
    tagline: string;
    primaryColor: string;
    bgColor: string;
    image: string;
    adminOnly?: boolean;
    hidden?: boolean;
  }> = [
    { key: 'taipei', name: 'Taipei', description: 'Brutalist Tech', tagline: 'Industrial contrast with monospaced precision.', primaryColor: '#999999', bgColor: '#121212', image: `${import.meta.env.BASE_URL}themes/taipei.jpg` },
    { key: 'rio', name: 'Rio de Janeiro', description: 'Organic Growth', tagline: 'Lush gradients with botanical softness.', primaryColor: '#61BB46', bgColor: '#F0FFF0', image: `${import.meta.env.BASE_URL}themes/rio_de_janeiro.jpg` },
    { key: 'los_angeles', name: 'Los Angeles', description: 'Cinematic Retro', tagline: 'Golden hour palettes and film grain warmth.', primaryColor: '#FDBD2C', bgColor: '#000000', image: `${import.meta.env.BASE_URL}themes/los_angeles.jpg` },
    { key: 'amsterdam', name: 'Amsterdam', description: 'Modern Heritage', tagline: 'Serif editorial with Dutch restraint.', primaryColor: '#F58220', bgColor: '#FAF9F6', image: `${import.meta.env.BASE_URL}themes/amsterdam.jpg` },
    { key: 'tokyo', name: 'Tokyo', description: 'Precise Editorial', tagline: 'Minimal grids and surgical color pops.', primaryColor: '#333333', bgColor: '#FFFFFF', image: `${import.meta.env.BASE_URL}themes/tokyo.jpg` },
    { key: 'seoul', name: 'Seoul', description: 'Cyber-Pop', tagline: 'Neon blurs and candy chrome typography.', primaryColor: '#963D97', bgColor: '#0B0114', image: `${import.meta.env.BASE_URL}themes/seoul.jpg` },
    { key: 'santorini', name: 'Santorini', description: 'Fluid Coastal', tagline: 'Breezy white space with ink accents.', primaryColor: '#009DDC', bgColor: '#FFFFFF', image: `${import.meta.env.BASE_URL}themes/santorini.jpg`, hidden: true },
    { key: 'arjeplog', name: 'Arjeplog', description: 'Arctic Horizon', tagline: 'Polar night navies with frozen cyan highlights.', primaryColor: '#F0EEE9', bgColor: '#002147', image: `${import.meta.env.BASE_URL}themes/arjeplog.jpg`, adminOnly: true },
  ];

  const getCityLabel = (key: typeof cityTheme) => cityThemes.find((t) => t.key === key)?.name ?? key;

  useEffect(() => {
    const param = searchParams.get('tab');
    if (!param || param === tab) return;
    if (param === 'admin' && !isAdmin) return;
    if (param === 'profile' || param === 'look_and_feel' || param === 'support' || param === 'admin') {
      setTab(param);
    }
  }, [searchParams, tab, isAdmin]);

  const saveCityTheme = async () => {
    if (!userId) return;
    clearToast();
    setSavingTheme(true);

    const prevTheme =
      (document.documentElement.getAttribute('data-theme') as typeof cityTheme | null) ?? 'taipei';
    const isSameTheme = prevTheme === cityTheme;

    let transitionStartedAt: number | null = null;

    if (!isSameTheme) {
      transitionStartedAt = Date.now();
      window.dispatchEvent(
        new CustomEvent('city-theme-transition-start', {
          detail: { themeKey: cityTheme, label: getCityLabel(cityTheme) },
        })
      );
    }

    try {
      const { error: upsertErr } = await supabase
        .from('user_settings')
        .upsert({ user_id: userId, city_theme: cityTheme });

      if (upsertErr) throw upsertErr;

      // Persist for next refresh (pre-React boot theme)
      try {
        localStorage.setItem('city_theme', cityTheme);
      } catch {
        // ignore
      }

      setActiveTheme(cityTheme);
      showToast('success', 'Theme saved.', 'theme');
    } catch (e: any) {
      if (!isSameTheme) {
        document.documentElement.setAttribute('data-theme', prevTheme);
        try {
          localStorage.setItem('city_theme', prevTheme);
        } catch {
          // ignore
        }
      }
      showToast('error', e.message ?? 'Failed to save theme', 'theme');
    } finally {
      if (!isSameTheme) {
        const elapsed = transitionStartedAt ? Date.now() - transitionStartedAt : 0;
        const remaining = Math.max(0, MIN_THEME_OVERLAY_MS - elapsed);
        window.setTimeout(() => {
          window.dispatchEvent(new Event('city-theme-transition-end'));
        }, remaining);
      }
      setSavingTheme(false);
    }
  };

  const avatarText = getAvatarText(displayName || currentEmail);

  const BG: Record<typeof cityTheme, { bg: string; text: string }> = {
    taipei: { bg: '#999999', text: '#121212' },
    rio: { bg: '#61BB46', text: '#1B3022' },
    los_angeles: { bg: '#FDBD2C', text: '#3D2B1F' },
    amsterdam: { bg: '#F58220', text: '#FFFFFF' },
    tokyo: { bg: '#333333', text: '#FFFFFF' },
    seoul: { bg: '#963D97', text: '#FFFFFF' },
    santorini: { bg: '#009DDC', text: '#FFFFFF' },
    arjeplog: { bg: '#F0EEE9', text: '#002147' },
  };

  const avatarSvg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="128" height="128" viewBox="0 0 128 128">
  <defs>
    <clipPath id="c">
      <circle cx="64" cy="64" r="64" />
    </clipPath>
  </defs>
  <g clip-path="url(#c)">
    <rect width="128" height="128" fill="${BG[cityTheme].bg}" />
    <text x="64" y="64" text-anchor="middle" dominant-baseline="central" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial" font-size="48" font-weight="700" fill="${BG[cityTheme].text}">${avatarText}</text>
  </g>
</svg>`;

  const avatarUrl = `data:image/svg+xml;utf8,${encodeURIComponent(avatarSvg)}`;

  useEffect(() => {
    void load();
  }, []);

  useEffect(() => {
    if (isAdmin) {
      void fetchCodes();
      void fetchWaitlist();
    }
  }, [isAdmin]);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', cityTheme);
    return () => {
      document.documentElement.setAttribute('data-theme', activeTheme);
    };
  }, [cityTheme, activeTheme]);

  const load = async () => {
    setLoading(true);
    clearToast();

    try {
      const { data: userData, error: userErr } = await supabase.auth.getUser();
      if (userErr) throw userErr;
      if (!userData.user) throw new Error('Not signed in');

      const { data: adminData } = await supabase.rpc('is_admin');
      setIsAdmin(!!adminData);

      setUserId(userData.user.id);
      setCurrentEmail(userData.user.email ?? '');
      setNewEmail('');

      const [{ data: p }, { data: s }, { data: ff }] = await Promise.all([
        supabase.from('profiles').select('user_id, display_name, deactivated_at').eq('user_id', userData.user.id).maybeSingle(),
        supabase.from('user_settings').select('user_id, city_theme').eq('user_id', userData.user.id).maybeSingle(),
        supabase.from('frequent_flyer_accounts').select('id, user_id, airline_code, airline_name, member_number').eq('user_id', userData.user.id).order('created_at', { ascending: true }),
      ]);

      const profile = (p ?? null) as ProfileRow | null;
      const settings = (s ?? null) as SettingsRow | null;

      const nextDisplayName = profile?.display_name ?? '';
      setDisplayName(nextDisplayName);
      setOriginalDisplayName(nextDisplayName);

      const rawTheme = ((settings as any)?.city_theme as string | null) ?? null;
      const allowed = new Set(['taipei', 'rio', 'los_angeles', 'amsterdam', 'tokyo', 'seoul', 'santorini', 'arjeplog']);
      const theme = (allowed.has(rawTheme ?? '') ? (rawTheme as any) : 'taipei') as typeof cityTheme;
      setCityTheme(theme);
      setActiveTheme(theme);
      
      // Apply theme to document root
      document.documentElement.setAttribute('data-theme', theme);
      
      setFfRows((ff as any) ?? []);
    } catch (e: any) {
      showToast('error', e.message ?? 'Failed to load account', 'profile');
    } finally {
      setLoading(false);
    }
  };

  const saveProfile = async () => {
    if (!userId) return;
    clearToast();

    try {
      const { error: upsertErr } = await supabase
        .from('profiles')
        .upsert({
          user_id: userId,
          display_name: displayName.trim() || null,
        });

      if (upsertErr) throw upsertErr;
      const trimmed = displayName.trim();
      setDisplayName(trimmed);
      setOriginalDisplayName(trimmed);
      showToast('success', 'Saved.', 'profile');
    } catch (e: any) {
      showToast('error', e.message ?? 'Failed to save', 'profile');
    }
  };


  const updateEmail = async (newEmail: string) => {
    clearToast();

    try {
      const { error: updateErr } = await supabase.auth.updateUser({ email: newEmail });
      if (updateErr) throw updateErr;
      showToast('success', 'Email update requested. Check both your old and new inbox for confirmation.', 'profile');
    } catch (e: any) {
      showToast('error', e.message ?? 'Failed to update email', 'profile');
    }
  };


  const addFrequentFlyer = async () => {
    if (!userId) return;
    clearToast();

    const code = airlineCode.trim().toUpperCase();
    if (!code) {
      showToast('error', 'Airline code is required.', 'ff-modal');
      return;
    }
    if (!memberNumber.trim()) {
      showToast('error', 'Member number is required.', 'ff-modal');
      return;
    }

    try {
      const { error: insertErr } = await supabase.from('frequent_flyer_accounts').insert({
        user_id: userId,
        airline_code: code,
        airline_name: airlineName.trim() || null,
        member_number: memberNumber.trim(),
      });

      if (insertErr) throw insertErr;

      setAirlineCode('');
      setAirlineName('');
      setMemberNumber('');

      await load();
      setShowFfForm(false);
      showToast('success', 'Added.', 'ff');
    } catch (e: any) {
      showToast('error', e.message ?? 'Failed to add', 'ff-modal');
    }
  };

  const deleteFrequentFlyer = async (id: string) => {
    clearToast();

    try {
      const { error: delErr } = await supabase.from('frequent_flyer_accounts').delete().eq('id', id);
      if (delErr) throw delErr;
      await load();
      showToast('success', 'Deleted.', 'ff');
    } catch (e: any) {
      showToast('error', e.message ?? 'Failed to delete', 'ff');
    }
  };

  const copyMemberNumber = async (value: string) => {
    try {
      await navigator.clipboard.writeText(value);
      showToast('success', 'Copied.', 'ff');
    } catch {
      showToast('error', 'Copy failed.', 'ff');
    }
  };

  const deactivate = async () => {
    clearToast();
    setDeactivating(true);

    try {
      const { error: rpcErr } = await supabase.rpc('deactivate_me');
      if (rpcErr) throw rpcErr;

      await supabase.auth.signOut();
    } catch (e: any) {
      showToast('error', e.message ?? 'Failed to deactivate', 'support');
    } finally {
      setDeactivating(false);
    }
  };

  const fetchCodes = async () => {
    const { data } = await supabase
      .from('invite_codes')
      .select('*')
      .order('created_at', { ascending: false });
    setCodes(data || []);
  };

  const fetchWaitlist = async () => {
    const { data } = await supabase
      .from('waitlist')
      .select('*')
      .order('created_at', { ascending: false });
    setWaitlist(data || []);
  };

  const generateCode = async (e?: React.FormEvent) => {
    e?.preventDefault();
    setGenerating(true);
    clearToast();

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: newCode } = await supabase.rpc('generate_invite_code');

      const { error: insertErr } = await supabase
        .from('invite_codes')
        .insert([{
          code: newCode,
          created_by: user.id,
          created_for_name: newCodeName.trim() || null,
          created_for_email: newCodeEmail.trim() || null,
        }]);

      if (insertErr) throw insertErr;

      setNewCodeName('');
      setNewCodeEmail('');
      await fetchCodes();
      setShowInviteModal(false);
      showToast('success', 'Invite code generated.', 'invite');
    } catch (e: any) {
      showToast('error', e.message ?? 'Failed to generate code', 'invite-modal');
    } finally {
      setGenerating(false);
    }
  };

  const deleteCode = async (id: string) => {
    clearToast();

    try {
      const { error: delErr } = await supabase
        .from('invite_codes')
        .delete()
        .eq('id', id);

      if (delErr) throw delErr;
      await fetchCodes();
      showToast('success', 'Code deleted.', 'invite');
    } catch (e: any) {
      showToast('error', e.message ?? 'Failed to delete code', 'invite');
    }
  };

  const copyCode = async (code: string) => {
    const url = `${window.location.origin}/?code=${code}`;
    try {
      await navigator.clipboard.writeText(url);
      showToast('success', 'Invite link copied.', 'invite');
    } catch {
      showToast('error', 'Copy failed.', 'invite');
    }
  };

  const updateWaitlistStatus = async (id: string, status: 'approved' | 'rejected') => {
    clearToast();

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error: updateErr } = await supabase
        .from('waitlist')
        .update({ 
          status, 
          reviewed_by: user.id,
          reviewed_at: new Date().toISOString()
        })
        .eq('id', id);

      if (updateErr) throw updateErr;
      await fetchWaitlist();
      showToast('success', `Waitlist entry ${status}.`, 'waitlist');
    } catch (e: any) {
      showToast('error', e.message ?? 'Failed to update waitlist', 'waitlist');
    }
  };

  if (loading) return null;

  return (
    <div className="mx-auto max-w-6xl p-6">
      <div className="account-layout">
        <aside className="account-sidebar">
          <h1 className="account-title" style={{ color: 'var(--text-main)' }}>Account</h1>
          <div className="account-tabs">
            <button
              type="button"
              className={`account-tab ${tab === 'profile' ? 'account-tab--active' : ''}`}
              onClick={() => setTabWithParam('profile')}
            >
              <span className="account-tab__icon-wrap">
                <SFPersonCircleFill className="account-tab__icon" />
              </span>
              <span>Profile</span>
            </button>
            <button
              type="button"
              className={`account-tab ${tab === 'look_and_feel' ? 'account-tab--active' : ''}`}
              onClick={() => setTabWithParam('look_and_feel')}
            >
              <span className="account-tab__icon-wrap">
                <SFMapFill className="account-tab__icon" />
              </span>
              <span>Look & Feel</span>
            </button>
            {isAdmin && (
              <button
                type="button"
                className={`account-tab ${tab === 'admin' ? 'account-tab--active' : ''}`}
                onClick={() => setTabWithParam('admin')}
              >
                <span className="account-tab__icon-wrap">
                  <SFCheckmarkCircleFill className="account-tab__icon" />
                </span>
                <span>Admin</span>
              </button>
            )}
            <button
              type="button"
              className={`account-tab ${tab === 'support' ? 'account-tab--active' : ''}`}
              onClick={() => setTabWithParam('support')}
            >
              <span className="account-tab__icon-wrap">
                <SFEyeCircleFill className="account-tab__icon" />
              </span>
              <span>Support</span>
            </button>
          </div>
        </aside>

        <div className="account-content">

          {/* ── Profile tab (Basic + Frequent Flyer) ── */}
      {tab === 'profile' && (
        <div className="space-y-8">
          <section className="account-card rounded-xl p-6 shadow-sm" style={{ background: 'var(--card-surface)' }}>
            {renderToast('profile')}
            <div className="mb-4 flex items-center justify-between gap-4">
              <h2 className="text-lg font-semibold" style={{ color: 'var(--text-main)' }}>Basic</h2>
              {isProfileDirty && (
                <Button size="sm" onClick={() => void saveProfile()}>Save</Button>
              )}
            </div>

            <div className="flex items-center gap-4">
              <div className="h-16 w-16 overflow-hidden rounded-full" style={{ border: '1px solid var(--border-color)', background: 'var(--bg-main)' }}>
                <img src={avatarUrl} alt="avatar" className="h-full w-full object-cover" />
              </div>
            </div>

            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm font-medium" style={{ color: 'var(--text-muted)' }}>Display name</label>
                <Input value={displayName} onChange={(e) => setDisplayName(e.target.value)} placeholder="Your name" />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium" style={{ color: 'var(--text-muted)' }}>Email</label>
                <Input value={currentEmail} disabled />
                <div className="mt-2 flex gap-2">
                  <Input
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    placeholder="new-email@example.com"
                  />
                  <Button variant="secondary" onClick={() => void updateEmail(newEmail)}>
                    Update
                  </Button>
                </div>
                <p className="mt-1 text-xs" style={{ color: 'var(--text-muted)' }}>Changing email requires re-verification.</p>
              </div>
            </div>

          </section>

          {/* Frequent Flyer — now under Profile */}
          <section className="account-card rounded-xl p-6 shadow-sm" style={{ background: 'var(--card-surface)' }}>
            {renderToast('ff')}
            <div className="flex items-center justify-between gap-4">
              <h2 className="text-lg font-semibold" style={{ color: 'var(--text-main)' }}>Frequent Flyer Info</h2>
              <Button
                size="sm"
                variant="secondary"
                onClick={() => setShowFfForm(true)}
              >
                Add new
              </Button>
            </div>

            <div className="mt-4 ff-list">
              {ffRows.map((r) => (
                <div
                  key={r.id}
                  className="flex items-center justify-between rounded-lg p-3"
                  style={{ background: 'var(--input-surface)' }}
                >
                  <div className="min-w-0">
                    <div className="text-sm font-semibold" style={{ color: 'var(--text-main)' }}>
                      {r.airline_code}{r.airline_name ? ` — ${r.airline_name}` : ''}
                    </div>
                    <div className="font-mono text-sm" style={{ color: 'var(--text-muted)' }}>{r.member_number}</div>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="secondary" size="sm" onClick={() => void copyMemberNumber(r.member_number)}>
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
                    </Button>
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={() =>
                        void deleteFrequentFlyer(r.id)
                      }
                    >
                      <SFTrashFill size={16} />
                    </Button>
                  </div>
                </div>
              ))}
              {ffRows.length === 0 && <div className="text-sm" style={{ color: 'var(--text-muted)' }}>No frequent flyer accounts yet.</div>}
            </div>

          </section>
        </div>
      )}

      {/* ── Look and Feel tab (City Theme carousel) ── */}
          {tab === 'look_and_feel' && (
        <div className="space-y-8">
          <section className="account-card rounded-xl p-6 pb-0 shadow-sm">
            {renderToast('theme')}
            <h2 className="mb-4 text-lg font-semibold" style={{ color: 'var(--text-main)' }}>City Theme</h2>
            <p className="mb-4 text-sm" style={{ color: 'var(--text-muted)' }}>
              Choose a city theme to customize your experience. Each theme changes the look and feel of the entire site and your avatar.
            </p>

            {(() => {
              const visible = cityThemes.filter((t) => {
                const allowed = t.adminOnly ? isAdmin : true;
                if (!allowed) return false;
                if (t.hidden && t.key !== cityTheme && t.key !== activeTheme) return false;
                return true;
              });
              const currentIdx = visible.findIndex((t) => t.key === cityTheme);
              const idx = currentIdx === -1 ? 0 : currentIdx;
              const theme = visible[idx];
              const isActiveTheme = activeTheme === theme.key;

              const goPrev = () => {
                const prev = (idx - 1 + visible.length) % visible.length;
                setCityTheme(visible[prev].key);
              };
              const goNext = () => {
                const next = (idx + 1) % visible.length;
                setCityTheme(visible[next].key);
              };

              return (
                <div className="theme-carousel">
                  <div className="theme-carousel__meta">
                    <div className="theme-carousel__meta-row">
                      <div className="theme-carousel__city-name">
                        {theme.name}
                        {theme.adminOnly && (
                          <span className="theme-carousel__badge">Admin</span>
                        )}
                      </div>
                      <Button
                        size="sm"
                        onClick={() => void saveCityTheme()}
                        disabled={savingTheme || isActiveTheme}
                        className="theme-carousel__apply"
                      >
                        {savingTheme ? 'Applying…' : isActiveTheme ? 'Applied' : 'Apply'}
                      </Button>
                    </div>
                    <div className="theme-carousel__slogan">{theme.description}</div>
                    <div className="theme-carousel__tagline">{theme.tagline}</div>
                  </div>

                  <div className="theme-carousel__viewport">
                    <button
                      type="button"
                      onClick={goPrev}
                      className="theme-carousel__arrow theme-carousel__arrow--left"
                      aria-label="Previous theme"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5"><polyline points="15 18 9 12 15 6"/></svg>
                    </button>

                    <div className="theme-carousel__slide">
                      <div className="theme-carousel__preview" style={{ background: theme.bgColor }}>
                        <div className="theme-carousel__image-wrapper">
                          <img
                            src={theme.image}
                            alt={`${theme.name} theme`}
                            className="theme-carousel__image"
                            draggable={false}
                          />
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={goNext}
                      className="theme-carousel__arrow theme-carousel__arrow--right"
                      aria-label="Next theme"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5"><polyline points="9 18 15 12 9 6"/></svg>
                    </button>
                  </div>

                  <div className="theme-carousel__dots">
                    {visible.map((t, i) => (
                      <button
                        key={t.key}
                        type="button"
                        onClick={() => setCityTheme(t.key)}
                        className={`theme-carousel__dot ${i === idx ? 'theme-carousel__dot--active' : ''}`}
                        aria-label={t.name}
                      />
                    ))}
                  </div>

                </div>
              );
            })()}
          </section>
        </div>
      )}

      {/* ── Admin tab ── */}
          {tab === 'admin' && isAdmin && (
        <div className="space-y-8">
          <div className="admin-summary">
            <div className="admin-summary__card">
              <div className="admin-summary__label">Invited</div>
              <div className="admin-summary__value">{invitedCount}</div>
            </div>
            <div className="admin-summary__card">
              <div className="admin-summary__label">Accepted</div>
              <div className="admin-summary__value">{acceptedCount}</div>
            </div>
            <div className="admin-summary__card">
              <div className="admin-summary__label">Waiting</div>
              <div className="admin-summary__value">{waitingCount}</div>
            </div>
          </div>

          <div className="admin-actions">
            <Button size="sm" variant="secondary" onClick={() => setShowOnboardingPreview(true)}>
              Preview onboarding
            </Button>
          </div>

          {/* Invite Codes List */}
          <section className="account-card rounded-xl p-6 shadow-sm" style={{ background: 'var(--card-surface)' }}>
            {renderToast('invite')}
            <div className="admin-section__header">
              <h2 className="text-xl font-semibold" style={{ color: 'var(--text-main)' }}>Invite Codes ({codes.length})</h2>
              <Button
                size="sm"
                onClick={() => {
                  setNewCodeName('');
                  setNewCodeEmail('');
                  setShowInviteModal(true);
                }}
              >
                Generate
              </Button>
            </div>
            <div className="space-y-2">
              {codes.map((code) => (
                <div key={code.id} className="flex items-center justify-between rounded-lg p-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-lg font-bold" style={{ color: 'var(--accent)' }}>{code.code}</span>
                      {code.used_by && <span className="rounded px-2 py-1 text-xs" style={{ background: 'var(--hover-bg)', color: 'var(--text-muted)' }}>Used</span>}
                    </div>
                    {code.created_for_name && (
                      <div className="mt-1 text-sm" style={{ color: 'var(--text-muted)' }}>
                        For: {code.created_for_name} {code.created_for_email && `(${code.created_for_email})`}
                      </div>
                    )}
                    <div className="text-xs" style={{ color: 'var(--text-muted)' }}>
                      Created {new Date(code.created_at).toLocaleDateString()}
                      {code.used_at && ` • Used ${new Date(code.used_at).toLocaleDateString()}`}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {!code.used_by && (
                      <>
                        <Button size="sm" variant="secondary" onClick={() => void copyCode(code.code)}>
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
                        </Button>
                        <Button
                          size="sm"
                          variant="danger"
                          onClick={() =>
                            void deleteCode(code.id)
                          }
                        >
                          <SFTrashFill size={16} />
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              ))}
              {codes.length === 0 && (
                <p className="text-center text-sm" style={{ color: 'var(--text-muted)' }}>No invite codes yet.</p>
              )}
            </div>
          </section>

          {/* Waitlist */}
          <section className="account-card rounded-xl p-6 shadow-sm" style={{ background: 'var(--card-surface)' }}>
            {renderToast('waitlist')}
            <h2 className="mb-4 text-xl font-semibold" style={{ color: 'var(--text-main)' }}>
              Waitlist ({waitlist.filter(w => w.status === 'pending').length} pending)
            </h2>
            <div className="space-y-2">
              {waitlist.map((entry) => (
                <div key={entry.id} className="rounded-lg p-4" style={{ background: 'var(--input-surface)' }}>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold" style={{ color: 'var(--text-main)' }}>{entry.name}</span>
                        <span className={`rounded px-2 py-1 text-xs ${
                          entry.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                          entry.status === 'approved' ? 'bg-green-100 text-green-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {entry.status}
                        </span>
                      </div>
                      <div className="text-sm" style={{ color: 'var(--text-muted)' }}>{entry.email}</div>
                      {entry.message && (
                        <div className="mt-2 text-sm italic" style={{ color: 'var(--text-main)' }}>"{entry.message}"</div>
                      )}
                      <div className="mt-1 text-xs" style={{ color: 'var(--text-muted)' }}>
                        Submitted {new Date(entry.created_at).toLocaleDateString()}
                      </div>
                    </div>
                    {entry.status === 'pending' && (
                      <div className="flex gap-2">
                        <Button size="sm" onClick={() => void updateWaitlistStatus(entry.id, 'approved')}>
                          <SFCheckmark size={16} />
                        </Button>
                        <Button size="sm" variant="danger" onClick={() => void updateWaitlistStatus(entry.id, 'rejected')}>
                          ×
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
              {waitlist.length === 0 && (
                <p className="text-center text-sm" style={{ color: 'var(--text-muted)' }}>No waitlist entries yet.</p>
              )}
            </div>
          </section>
        </div>
      )}

      {/* ── Support tab ── */}
          {tab === 'support' && (
        <div className="space-y-8">
          <section className="rounded-xl p-6 shadow-sm" style={{ background: 'var(--card-surface)' }}>
            <h2 className="mb-2 text-lg font-semibold" style={{ color: 'var(--text-main)' }}>FAQ</h2>
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Coming soon.</p>
          </section>

          <section className="rounded-xl p-6 shadow-sm" style={{ background: 'var(--card-surface)' }}>
            <h2 className="mb-2 text-lg font-semibold" style={{ color: 'var(--text-main)' }}>Deactivate account</h2>
            <p className="mb-4 text-sm" style={{ color: 'var(--text-muted)' }}>
              This is a soft deactivation. You can reactivate anytime by logging back in.
            </p>
            <Button variant="secondary" onClick={() => setShowDeactivateModal(true)}>
              Deactivate
            </Button>
          </section>
        </div>
      )}

          {/* Deactivate modal — themed */}
      <ConfirmModal
        open={showDeactivateModal}
        title="Deactivate account?"
        message="This will soft-deactivate your account. You can reactivate whenever you want by logging back in."
        confirmLabel={deactivating ? 'Deactivating…' : 'Deactivate'}
        cancelLabel="Cancel"
        variant="danger"
        onConfirm={async () => {
          await deactivate();
          setShowDeactivateModal(false);
        }}
        onCancel={() => setShowDeactivateModal(false)}
      />

          {/* Generic confirm modal — themed */}
      <ConfirmModal
        open={!!confirmAction}
        title={confirmAction?.title ?? ''}
        message={confirmAction?.message ?? ''}
        confirmLabel="Delete"
        cancelLabel="Cancel"
        variant="danger"
        onConfirm={() => {
          confirmAction?.onConfirm();
          setConfirmAction(null);
        }}
        onCancel={() => setConfirmAction(null)}
      />

      {showInviteModal && (
        <div className="themed-modal__backdrop" onClick={() => setShowInviteModal(false)}>
          {renderToast('invite-modal', 'account-toast--modal')}
          <div
            className="themed-modal__panel"
            style={{ maxWidth: 520 }}
            onClick={(event) => event.stopPropagation()}
          >
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-semibold" style={{ color: 'var(--text-main)' }}>Generate invite</h2>
              <Button size="sm" variant="secondary" onClick={() => setShowInviteModal(false)}>
                ×
              </Button>
            </div>
            <form
              onSubmit={(event) => {
                event.preventDefault();
                void generateCode();
              }}
              className="space-y-4"
            >
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm font-medium" style={{ color: 'var(--text-muted)' }}>Name (Optional)</label>
                  <Input
                    value={newCodeName}
                    onChange={(e) => setNewCodeName(e.target.value)}
                    placeholder="John Doe"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium" style={{ color: 'var(--text-muted)' }}>Email (Optional)</label>
                  <Input
                    type="email"
                    value={newCodeEmail}
                    onChange={(e) => setNewCodeEmail(e.target.value)}
                    placeholder="john@example.com"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="secondary" type="button" onClick={() => setShowInviteModal(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={generating}>
                  {generating ? 'Generating...' : 'Generate Code'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showOnboardingPreview && (
        <Onboarding
          onComplete={(_, __) => setShowOnboardingPreview(false)}
          onExit={() => setShowOnboardingPreview(false)}
          persist={false}
          forceIsAdmin={false}
          prefillName={newCodeName.trim()}
          isPreview
        />
      )}

      {showFfForm && (
        <div className="themed-modal__backdrop" onClick={() => setShowFfForm(false)}>
          {renderToast('ff-modal', 'account-toast--modal')}
          <div
            className="themed-modal__panel"
            style={{ maxWidth: 520 }}
            onClick={(event) => event.stopPropagation()}
          >
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-semibold" style={{ color: 'var(--text-main)' }}>Add frequent flyer</h2>
              <Button size="sm" variant="secondary" onClick={() => setShowFfForm(false)}>
                ×
              </Button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium" style={{ color: 'var(--text-muted)' }}>Airline</label>
                <Select
                  value={airlineCode}
                  onChange={(next) => {
                    setAirlineCode(next);
                    const match = AIRLINES.find((a) => a.code === next);
                    if (match) setAirlineName(match.name);
                  }}
                  placeholder="Select airline…"
                  options={AIRLINES.map((a) => ({ value: a.code, label: `${a.code} — ${a.name}` }))}
                />
                <p className="mt-1 text-xs" style={{ color: 'var(--text-muted)' }}>Or type airline code below.</p>
              </div>

              <div className="grid gap-3 md:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm font-medium" style={{ color: 'var(--text-muted)' }}>Airline code</label>
                  <Input value={airlineCode} onChange={(e) => setAirlineCode(e.target.value)} placeholder="e.g. BR" />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium" style={{ color: 'var(--text-muted)' }}>Member number</label>
                  <Input value={memberNumber} onChange={(e) => setMemberNumber(e.target.value)} placeholder="123456789" />
                </div>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium" style={{ color: 'var(--text-muted)' }}>Airline name (optional)</label>
                <Input value={airlineName} onChange={(e) => setAirlineName(e.target.value)} placeholder="Airline name" />
              </div>

              <div className="flex justify-end gap-2">
                <Button onClick={() => void addFrequentFlyer()}>Add</Button>
              </div>
            </div>
          </div>
        </div>
      )}
        </div>
      </div>
    </div>
  );
}
