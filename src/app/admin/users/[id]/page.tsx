'use client';

import React, { useState, useEffect, use } from 'react';
import AdminShell from '@/components/admin/AdminShell';
import { useAdmin } from '@/components/admin/AdminShell';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

// Helper to format seconds into "Xh Ym"
function fmtDuration(secs: number): string {
  if (!secs || secs <= 0) return '—';
  const h = Math.floor(secs / 3600);
  const m = Math.floor((secs % 3600) / 60);
  if (h === 0) return `${m}m`;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

function fmtDate(iso: string | null | undefined): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

interface Session {
  _id: string;
  loginTime: string;
  logoutTime?: string;
  lastActivityAt?: string;
  totalActiveSeconds: number;
  totalIdleSeconds: number;
  ipAddress?: string;
}

interface UserDetail {
  _id: string;
  employeeId: string;
  name: string;
  email: string;
  role: string;
  active: boolean;
  mustChangePassword: boolean;
  lastLogin?: string;
  lastActivityAt?: string;
  createdAt?: string;
  profileImageUrl?: string;
  department?: string;
  internalTitle?: string;
  phone?: string;
}

function ProfileContent({ employeeId }: { employeeId: string }) {
  const { user: me } = useAdmin();
  const router = useRouter();
  const [profile, setProfile] = useState<UserDetail | null>(null);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const isSuperAdmin = me?.role === 'super_admin';
  const isEmployee   = me?.role === 'employee';
  const isSelf       = me?.employeeId === employeeId;
  const [showEdit, setShowEdit] = useState(false);

  useEffect(() => {
    // Fetch user from users list
    async function load() {
      try {
        const [usersRes, sessionsRes] = await Promise.all([
          fetch('/api/admin/users'),
          fetch(`/api/admin/users/${employeeId}/sessions`),
        ]);
        const usersData = await usersRes.json();
        const sessionsData = sessionsRes.ok ? await sessionsRes.json() : { sessions: [] };

        const found = (usersData.users || []).find((u: UserDetail) => u.employeeId === employeeId);
        if (!found) {
          setError('User not found.');
          return;
        }
        setProfile(found);
        setSessions(sessionsData.sessions || []);
      } catch {
        setError('Failed to load profile.');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [employeeId]);

  if (loading) return <Spinner />;
  if (error) return <div style={{ color: 'var(--as-badge-red-text)', padding: 40 }}>{error}</div>;
  // Employees can only view their own profile
  if (!profile || (isEmployee && !isSelf)) return (
    <div style={{ color: 'var(--as-muted)', padding: 40, fontSize: 13 }}>Profile not accessible.</div>
  );

  // Compute aggregate stats from session history
  const totalActive = sessions.reduce((sum, s) => sum + (s.totalActiveSeconds || 0), 0);
  const totalIdle = sessions.reduce((sum, s) => sum + (s.totalIdleSeconds || 0), 0);
  const totalWork = totalActive + totalIdle;
  const activeRatio = totalWork > 0 ? Math.round((totalActive / totalWork) * 100) : 0;

  const ROLE_COLOR: Record<string, string> = {
    super_admin: 'var(--as-badge-blue)',
    admin: 'var(--as-badge-yellow)',
    employee: 'var(--as-badge-gray)',
  };
  const ROLE_TEXT: Record<string, string> = {
    super_admin: 'var(--as-badge-blue-text)',
    admin: 'var(--as-badge-yellow-text)',
    employee: 'var(--as-badge-gray-text)',
  };
  const ROLE_LABEL: Record<string, string> = {
    super_admin: 'Super Admin',
    admin: 'Admin',
    employee: 'Member',
  };

  return (
    <div style={{ maxWidth: 760 }}>
      {/* Back */}
      {isEmployee ? (
        <Link href="/admin" style={{ fontSize: 12, color: 'var(--as-muted)', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 6, marginBottom: 20 }}>
          ← Back to Dashboard
        </Link>
      ) : (
        <Link href="/admin/users" style={{ fontSize: 12, color: 'var(--as-muted)', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 6, marginBottom: 20 }}>
          ← Back to Team
        </Link>
      )}

      {/* Header card */}
      <div style={{ background: 'var(--as-card)', border: '1px solid var(--as-border)', borderRadius: 12, padding: 28, marginBottom: 20, boxShadow: 'var(--as-shadow)' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 20 }}>
          {/* Avatar */}
          {profile.profileImageUrl ? (
            <img src={profile.profileImageUrl} alt="Avatar" style={{
              width: 56, height: 56, borderRadius: '50%', objectFit: 'cover',
              border: '2px solid var(--as-border)', flexShrink: 0,
            }} />
          ) : (
            <div style={{
              width: 56, height: 56, borderRadius: '50%', background: 'var(--as-accent)',
              color: 'var(--as-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 22, fontWeight: 700, flexShrink: 0, letterSpacing: '-0.02em',
            }}>
              {profile.name?.charAt(0)?.toUpperCase() || '?'}
            </div>
          )}
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
              <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: 'var(--as-text)' }}>{profile.name}</h2>
              <span style={{
                padding: '2px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700,
                background: ROLE_COLOR[profile.role] || 'var(--as-badge-gray)',
                color: ROLE_TEXT[profile.role] || 'var(--as-badge-gray-text)',
                textTransform: 'capitalize', letterSpacing: '0.04em',
              }}>
                {ROLE_LABEL[profile.role] || profile.role.replace('_', ' ')}
              </span>
              <span style={{
                padding: '2px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600,
                background: profile.active ? 'var(--as-badge-green)' : 'var(--as-badge-red)',
                color: profile.active ? 'var(--as-badge-green-text)' : 'var(--as-badge-red-text)',
              }}>
                {profile.active ? 'Active' : 'Disabled'}
              </span>
            </div>
            <div style={{ fontSize: 13, color: 'var(--as-muted)', marginTop: 6 }}>
              {profile.employeeId} · {profile.email}
            </div>
            {profile.mustChangePassword && (
              <div style={{ fontSize: 12, marginTop: 6, color: 'var(--as-badge-yellow-text)' }}>⚠ Must change password on next login</div>
            )}
          </div>
          {/* Edit button for self */}
          {isSelf && (
            <button onClick={() => setShowEdit(true)} style={{
              background: 'var(--as-bg)', border: '1px solid var(--as-border)',
              borderRadius: 6, padding: '6px 12px', fontSize: 12, fontWeight: 600,
              color: 'var(--as-text)', cursor: 'pointer', transition: 'background 0.1s',
            }}>
              Edit Profile
            </button>
          )}
        </div>
      </div>

      {/* Stats grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 14, marginBottom: 20 }}>
        {[
          { label: 'Total Work Time', value: fmtDuration(totalWork), icon: '⏱' },
          { label: 'Active Time', value: fmtDuration(totalActive), icon: '🟢' },
          { label: 'Idle Time', value: fmtDuration(totalIdle), icon: '💤' },
          { label: 'Active Ratio', value: totalWork > 0 ? `${activeRatio}%` : '—', icon: '📊' },
          { label: 'Total Sessions', value: String(sessions.length), icon: '🔑' },
          { label: 'Last Login', value: profile.lastLogin ? new Date(profile.lastLogin).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : '—', icon: '📅' },
        ].map(stat => (
          <div key={stat.label} style={{ background: 'var(--as-card)', border: '1px solid var(--as-border)', borderRadius: 10, padding: '16px 18px', boxShadow: 'var(--as-shadow)' }}>
            <div style={{ fontSize: 18, marginBottom: 6 }}>{stat.icon}</div>
            <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--as-text)', lineHeight: 1 }}>{stat.value}</div>
            <div style={{ fontSize: 11, color: 'var(--as-muted)', marginTop: 4, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Active/Idle bar */}
      {totalWork > 0 && (
        <div style={{ background: 'var(--as-card)', border: '1px solid var(--as-border)', borderRadius: 10, padding: '16px 20px', marginBottom: 20, boxShadow: 'var(--as-shadow)' }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--as-muted)', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Active vs Idle Breakdown</div>
          <div style={{ height: 12, borderRadius: 6, overflow: 'hidden', background: 'var(--as-border)', display: 'flex' }}>
            <div style={{ width: `${activeRatio}%`, background: 'var(--as-badge-green-text)', transition: 'width 0.6s ease' }} />
            <div style={{ flex: 1, background: 'var(--as-badge-yellow-text)', opacity: 0.5 }} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8, fontSize: 12, color: 'var(--as-muted)' }}>
            <span style={{ color: 'var(--as-badge-green-text)', fontWeight: 600 }}>● Active {activeRatio}%</span>
            <span style={{ fontWeight: 600 }}>● Idle {100 - activeRatio}%</span>
          </div>
        </div>
      )}

      {/* Session History */}
      <div style={{ background: 'var(--as-card)', border: '1px solid var(--as-border)', borderRadius: 10, overflow: 'hidden', boxShadow: 'var(--as-shadow)', marginBottom: 20 }}>
        <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--as-border)', fontSize: 13, fontWeight: 600, color: 'var(--as-text)' }}>
          Session History ({sessions.length})
        </div>
        {sessions.length === 0 ? (
          <div style={{ padding: 32, textAlign: 'center', color: 'var(--as-muted)', fontSize: 13 }}>No sessions recorded yet.</div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr>
                {['Login', 'Logout', 'Active', 'Idle', 'IP', 'Status'].map(h => (
                  <th key={h} style={{ textAlign: 'left', padding: '9px 14px', fontSize: 11, fontWeight: 600, color: 'var(--as-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', background: 'var(--as-table-header)', borderBottom: '1px solid var(--as-border)', whiteSpace: 'nowrap' }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sessions.map(s => {
                const isOpen = !s.logoutTime;
                return (
                  <tr key={s._id} style={{ borderBottom: '1px solid var(--as-border)' }}>
                    <td style={{ padding: '9px 14px', color: 'var(--as-text)', whiteSpace: 'nowrap', fontSize: 12 }}>{fmtDate(s.loginTime)}</td>
                    <td style={{ padding: '9px 14px', color: 'var(--as-muted)', whiteSpace: 'nowrap', fontSize: 12 }}>{s.logoutTime ? fmtDate(s.logoutTime) : '—'}</td>
                    <td style={{ padding: '9px 14px', color: 'var(--as-badge-green-text)', fontWeight: 600 }}>{fmtDuration(s.totalActiveSeconds)}</td>
                    <td style={{ padding: '9px 14px', color: 'var(--as-muted)' }}>{fmtDuration(s.totalIdleSeconds)}</td>
                    <td style={{ padding: '9px 14px', color: 'var(--as-muted)', fontSize: 11 }}>{s.ipAddress || '—'}</td>
                    <td style={{ padding: '9px 14px' }}>
                      <span style={{
                        padding: '2px 8px', borderRadius: 20, fontSize: 11, fontWeight: 600,
                        background: isOpen ? 'var(--as-badge-green)' : 'var(--as-badge-gray)',
                        color: isOpen ? 'var(--as-badge-green-text)' : 'var(--as-badge-gray-text)',
                      }}>
                        {isOpen ? 'Active' : 'Closed'}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Account details */}
      <div style={{ background: 'var(--as-card)', border: '1px solid var(--as-border)', borderRadius: 10, padding: 20, boxShadow: 'var(--as-shadow)' }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--as-text)', marginBottom: 14 }}>Account Details</div>
        {[
          ['ID', profile.employeeId],
          ['Email', profile.email],
          ['Member Since', fmtDate(profile.createdAt ?? null)],
          ['Last Activity', fmtDate(profile.lastActivityAt ?? null)],
        ].map(([label, value]) => (
          <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--as-border)', fontSize: 13 }}>
            <span style={{ color: 'var(--as-muted)' }}>{label}</span>
            <span style={{ color: 'var(--as-text)', fontWeight: 500 }}>{value}</span>
          </div>
        ))}
      </div>

      {/* Edit Modal */}
      {showEdit && (
        <EditProfileModal
          profile={profile}
          onClose={() => setShowEdit(false)}
          onSaved={() => {
            setShowEdit(false);
            window.location.reload(); // Refresh to show new profile data
          }}
        />
      )}
    </div>
  );
}

function EditProfileModal({ profile, onClose, onSaved }: { profile: any, onClose: () => void, onSaved: () => void }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    name: profile.name || '',
    department: profile.department || '',
    internalTitle: profile.internalTitle || '',
    phone: profile.phone || '',
  });
  const [imgData, setImgData] = useState<string | null>(null);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file.');
      return;
    }
    const reader = new FileReader();
    reader.onload = (evt) => {
      const b64 = evt.target?.result as string;
      setImgData(b64);
    };
    reader.readAsDataURL(file);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const payload: any = { ...form };
      if (imgData) {
        // extract base64 string
        payload.profileImageBase64 = imgData.split(',')[1];
      }
      const res = await fetch('/api/admin/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update');
      onSaved();
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  };

  const INP = { width: '100%', padding: '10px 12px', fontSize: 13, border: '1px solid var(--as-border)', borderRadius: 6, background: 'var(--as-bg)', color: 'var(--as-text)', outline: 'none' };
  const LBL = { display: 'block', fontSize: 11, fontWeight: 600, color: 'var(--as-muted)', marginBottom: 6, textTransform: 'uppercase' as any, letterSpacing: '0.04em' };

  return (
    <>
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 999 }} />
      <div style={{ position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: '100%', maxWidth: 440, background: 'var(--as-card)', borderRadius: 12, padding: 24, zIndex: 1000, boxShadow: '0 20px 40px rgba(0,0,0,0.2)' }}>
        <h3 style={{ margin: '0 0 20px 0', fontSize: 18 }}>Edit Profile</h3>
        <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          
          <div>
            <label style={LBL}>Profile Picture</label>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              {imgData ? (
                <img src={imgData} alt="Preview" style={{ width: 48, height: 48, borderRadius: '50%', objectFit: 'cover' }} />
              ) : profile.profileImageUrl ? (
                <img src={profile.profileImageUrl} alt="Current" style={{ width: 48, height: 48, borderRadius: '50%', objectFit: 'cover' }} />
              ) : (
                <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'var(--as-border)' }} />
              )}
              <input type="file" accept="image/*" onChange={handleFile} style={{ fontSize: 12 }} />
            </div>
          </div>

          <div>
            <label style={LBL}>Name</label>
            <input style={INP} required value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
          </div>
          <div>
            <label style={LBL}>Department</label>
            <input style={INP} value={form.department} onChange={e => setForm(f => ({ ...f, department: e.target.value }))} placeholder="e.g. Operations" />
          </div>
          <div>
            <label style={LBL}>Title / Role Label</label>
            <input style={INP} value={form.internalTitle} onChange={e => setForm(f => ({ ...f, internalTitle: e.target.value }))} placeholder="e.g. Inventory Manager" />
          </div>
          <div>
            <label style={LBL}>Phone</label>
            <input style={INP} value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} placeholder="+91..." />
          </div>

          {error && <div style={{ color: 'var(--as-badge-red-text)', background: 'var(--as-badge-red)', padding: '8px 12px', borderRadius: 6, fontSize: 12 }}>{error}</div>}

          <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
            <button type="button" onClick={onClose} style={{ flex: 1, padding: '10px', background: 'transparent', border: '1px solid var(--as-border)', borderRadius: 6, cursor: 'pointer', color: 'var(--as-text)' }}>Cancel</button>
            <button type="submit" disabled={loading} style={{ flex: 1, padding: '10px', background: 'var(--as-accent)', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer', fontWeight: 600 }}>
              {loading ? 'Saving...' : 'Save Profile'}
            </button>
          </div>
        </form>
      </div>
    </>
  );
}

function Spinner() {
  return (
    <div style={{ display: 'flex', justifyContent: 'center', padding: 80 }}>
      <div style={{ width: 24, height: 24, border: '2px solid var(--as-border)', borderTopColor: 'var(--as-text)', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

export default function UserProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  return (
    <AdminShell>
      <ProfileContent employeeId={id} />
    </AdminShell>
  );
}
