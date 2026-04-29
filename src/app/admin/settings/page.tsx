'use client';

import { useState, useEffect, useCallback } from 'react';
import AdminShell from '@/components/admin/AdminShell';
import { useAdmin } from '@/components/admin/AdminShell';
import Cropper from 'react-easy-crop';

const INPUT: React.CSSProperties = { padding: '9px 12px', fontSize: 13, border: '1px solid var(--as-input-border)', borderRadius: 6, background: 'var(--as-input-bg)', color: 'var(--as-text)', width: '100%' };

// ── Crop Helper ────────────────────────────────────────────────────────────
const createImage = (url: string) =>
  new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.addEventListener('load', () => resolve(image));
    image.addEventListener('error', (error) => reject(error));
    image.src = url;
  });

async function getCroppedImg(imageSrc: string, pixelCrop: any, fileName: string = 'profile.jpg'): Promise<File> {
  const image = await createImage(imageSrc);
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('No 2d context');

  canvas.width = pixelCrop.width;
  canvas.height = pixelCrop.height;

  ctx.drawImage(
    image,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    pixelCrop.width,
    pixelCrop.height
  );

  return new Promise((resolve) => {
    canvas.toBlob((file) => {
      resolve(new File([file!], fileName, { type: 'image/jpeg' }));
    }, 'image/jpeg');
  });
}

// ── Data Visibility Control ────────────────────────────────────────────────
function DataVisibilityCard() {
  const [config, setConfig] = useState<{ visibleFrom: string | null; updatedAt?: string; updatedBy?: string } | null>(null);
  const [loadingConfig, setLoadingConfig] = useState(true);
  const [dateInput, setDateInput] = useState('');
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    fetch('/api/admin/config')
      .then(r => r.json())
      .then(d => {
        const cfg = d.config ?? null;
        setConfig(cfg);
        if (cfg?.visibleFrom) {
          // Convert ISO to local datetime-local value
          setDateInput(new Date(cfg.visibleFrom).toISOString().slice(0, 16));
        }
      })
      .catch(() => setConfig(null))
      .finally(() => setLoadingConfig(false));
  }, []);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMsg(null);
    try {
      const res = await fetch('/api/admin/config', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ visibleFrom: dateInput ? new Date(dateInput).toISOString() : null }),
      });
      const data = await res.json();
      if (!res.ok) { setMsg({ type: 'error', text: data.error || 'Failed to save.' }); return; }
      setMsg({ type: 'success', text: `Cutoff updated. Admin/Employee users will now only see data from ${dateInput ? new Date(dateInput).toLocaleString('en-IN') : 'all time'}.` });
      setConfig(c => ({ ...c, visibleFrom: dateInput ? new Date(dateInput).toISOString() : null }));
    } finally {
      setSaving(false);
    }
  }

  async function handleClear() {
    setSaving(true);
    setMsg(null);
    try {
      const res = await fetch('/api/admin/config', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ visibleFrom: null }),
      });
      if (res.ok) {
        setDateInput('');
        setConfig(c => ({ ...c, visibleFrom: null }));
        setMsg({ type: 'success', text: 'Cutoff cleared. All data is now visible to everyone.' });
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card title="🔒 Global Data Visibility Control">
      <div style={{ fontSize: 13, color: 'var(--as-muted)', lineHeight: 1.6, marginBottom: 16 }}>
        Set a <strong style={{ color: 'var(--as-text)' }}>cutoff timestamp</strong> to hide old/test data from Admin and Employee roles.
        Super Admin always sees all data regardless of this setting.
      </div>

      {/* Current status */}
      <div style={{ padding: '12px 14px', background: 'var(--as-hover)', borderRadius: 8, marginBottom: 18, fontSize: 13 }}>
        {loadingConfig ? (
          <span style={{ color: 'var(--as-muted)' }}>Loading...</span>
        ) : config?.visibleFrom ? (
          <>
            <div style={{ fontWeight: 600, color: 'var(--as-text)', marginBottom: 4 }}>
              Current cutoff: {new Date(config.visibleFrom).toLocaleString('en-IN', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
            </div>
            <div style={{ fontSize: 12, color: 'var(--as-muted)' }}>
              Admin/Employee users cannot see data before this date.
              {config.updatedBy && ` Last set by ${config.updatedBy}.`}
            </div>
          </>
        ) : (
          <div style={{ color: 'var(--as-muted)' }}>
            <strong style={{ color: 'var(--as-badge-green-text)' }}>No cutoff set</strong> — all data is visible to all roles.
          </div>
        )}
      </div>

      {/* Form */}
      <form onSubmit={handleSave}>
        <Field label="New Cutoff Date & Time (leave blank to show all data)">
          <input
            type="datetime-local"
            value={dateInput}
            onChange={e => setDateInput(e.target.value)}
            style={INPUT}
          />
        </Field>

        {msg && (
          <div style={{
            fontSize: 12, padding: '9px 12px', borderRadius: 6, marginBottom: 14,
            background: msg.type === 'success' ? 'var(--as-badge-green)' : 'var(--as-badge-red)',
            color: msg.type === 'success' ? 'var(--as-badge-green-text)' : 'var(--as-badge-red-text)',
          }}>
            {msg.text}
          </div>
        )}

        <div style={{ display: 'flex', gap: 10 }}>
          <button
            type="submit"
            disabled={saving}
            style={{ padding: '9px 24px', fontSize: 13, fontWeight: 600, cursor: 'pointer', background: 'var(--as-accent)', color: 'var(--as-bg)', border: 'none', borderRadius: 6, opacity: saving ? 0.6 : 1 }}
          >
            {saving ? 'Saving...' : 'Apply Cutoff'}
          </button>
          {config?.visibleFrom && (
            <button
              type="button"
              onClick={handleClear}
              disabled={saving}
              style={{ padding: '9px 18px', fontSize: 13, fontWeight: 500, cursor: 'pointer', background: 'transparent', color: 'var(--as-badge-red-text)', border: '1px solid var(--as-badge-red)', borderRadius: 6 }}
            >
              Clear Cutoff
            </button>
          )}
        </div>
      </form>

      {/* How it works */}
      <div style={{ marginTop: 20, paddingTop: 16, borderTop: '1px solid var(--as-border)', fontSize: 12, color: 'var(--as-muted)', lineHeight: 1.6 }}>
        <div style={{ fontWeight: 600, color: 'var(--as-text)', marginBottom: 6 }}>How it works</div>
        <div>• <strong>Super Admin</strong> — always sees all data, no restrictions.</div>
        <div>• <strong>Admin</strong> — sees orders and customers created on or after the cutoff.</div>
        <div>• <strong>Employee</strong> — same cutoff applies. Cannot access data before the date.</div>
        <div>• Enforcement happens at the <strong>API layer</strong> — not just the UI. Data cannot be bypassed.</div>
      </div>
    </Card>
  );
}

function ProfileForm({ user }: { user: any }) {
  const [name, setName] = useState(user?.name || '');
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<{ type: 'success'|'error', text: string } | null>(null);
  const [preview, setPreview] = useState<string | null>(user?.profileImage || null);

  const [cropImageRaw, setCropImageRaw] = useState<string | null>(null);
  const [cropFileName, setCropFileName] = useState('');
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);

  useEffect(() => {
    if (user?.name) setName(user.name);
    if (user?.profileImage) setPreview(user.profileImage);
  }, [user]);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.files && e.target.files[0]) {
      const f = e.target.files[0];
      setCropFileName(f.name);
      setCropImageRaw(URL.createObjectURL(f));
      e.target.value = ''; // reset so same file can trigger change
    }
  }

  const onCropComplete = useCallback((croppedArea: any, croppedAreaPixels: any) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  async function handleCropConfirm() {
    if (!cropImageRaw || !croppedAreaPixels) return;
    try {
      const croppedFile = await getCroppedImg(cropImageRaw, croppedAreaPixels, cropFileName);
      setFile(croppedFile);
      setPreview(URL.createObjectURL(croppedFile));
      setCropImageRaw(null);
    } catch (e) {
      console.error(e);
      setMsg({ type: 'error', text: 'Failed to crop image' });
      setCropImageRaw(null);
    }
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true); setMsg(null);
    try {
      const formData = new FormData();
      formData.append('name', name);
      if (file) formData.append('file', file);

      const res = await fetch('/api/admin/auth/me', {
        method: 'PATCH',
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update profile');
      setMsg({ type: 'success', text: 'Profile updated. Please refresh the page to see changes everywhere.' });
      setTimeout(() => window.location.reload(), 1500);
    } catch (err: any) {
      setMsg({ type: 'error', text: err.message });
    } finally {
      setLoading(false);
    }
  }

  const initials = user?.name ? user.name.split(' ').map((n: string) => n[0]).slice(0,2).join('').toUpperCase() : '?';

  return (
    <Card title="My Profile">
      <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div style={{ display: 'flex', gap: 20, alignItems: 'center' }}>
          <div style={{ position: 'relative', width: 80, height: 80, borderRadius: '50%', overflow: 'hidden', background: 'var(--as-hover)', border: '1px solid var(--as-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            {preview ? (
              <img src={preview} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              <span style={{ fontSize: 24, fontWeight: 600, color: 'var(--as-muted)' }}>{initials}</span>
            )}
            <input type="file" accept="image/*" onChange={handleFileChange} style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer' }} title="Change profile picture" />
          </div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--as-text)', marginBottom: 4 }}>Profile Picture</div>
            <div style={{ fontSize: 11, color: 'var(--as-muted)' }}>Click the image to upload a new 1:1 picture.</div>
          </div>
        </div>

        <Field label="Full Name">
          <input type="text" value={name} onChange={e => setName(e.target.value)} required style={INPUT} />
        </Field>

        <div style={{ padding: '12px 14px', background: 'var(--as-hover)', borderRadius: 8, fontSize: 13 }}>
          <InfoRow label="Employee ID" value={user?.employeeId || '—'} />
          <InfoRow label="Email" value={user?.email || '—'} />
          <InfoRow label="Role" value={user?.role?.replace('_', ' ') || '—'} />
        </div>

        {msg && (
          <div style={{
            fontSize: 12, padding: '9px 12px', borderRadius: 6,
            background: msg.type === 'success' ? 'var(--as-badge-green)' : 'var(--as-badge-red)',
            color: msg.type === 'success' ? 'var(--as-badge-green-text)' : 'var(--as-badge-red-text)',
          }}>
            {msg.text}
          </div>
        )}

        <div>
          <button type="submit" disabled={loading} style={{ padding: '9px 24px', fontSize: 13, fontWeight: 600, cursor: 'pointer', background: 'var(--as-accent)', color: 'var(--as-bg)', border: 'none', borderRadius: 6, opacity: loading ? 0.6 : 1 }}>
            {loading ? 'Saving...' : 'Save Profile'}
          </button>
        </div>
      </form>

      {/* Crop Modal */}
      {cropImageRaw && (
        <>
          <div onClick={() => setCropImageRaw(null)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 1000 }} />
          <div style={{
            position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%,-50%)',
            width: 400, maxWidth: '90vw', background: 'var(--as-card)',
            borderRadius: 12, overflow: 'hidden', zIndex: 1001, boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
            display: 'flex', flexDirection: 'column'
          }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--as-border)', fontWeight: 600, fontSize: 14 }}>
              Crop Profile Picture
            </div>
            <div style={{ position: 'relative', width: '100%', height: 300, background: '#000' }}>
              <Cropper
                image={cropImageRaw}
                crop={crop}
                zoom={zoom}
                aspect={1}
                cropShape="round"
                showGrid={false}
                onCropChange={setCrop}
                onZoomChange={setZoom}
                onCropComplete={onCropComplete}
              />
            </div>
            <div style={{ padding: '16px 20px', display: 'flex', gap: 12, borderTop: '1px solid var(--as-border)' }}>
              <button onClick={() => setCropImageRaw(null)} type="button" style={{ flex: 1, padding: '9px', fontSize: 13, cursor: 'pointer', border: '1px solid var(--as-border)', borderRadius: 6, background: 'transparent', color: 'var(--as-text)' }}>
                Cancel
              </button>
              <button onClick={handleCropConfirm} type="button" style={{ flex: 1, padding: '9px', fontSize: 13, fontWeight: 600, cursor: 'pointer', background: 'var(--as-accent)', color: 'var(--as-bg)', border: 'none', borderRadius: 6 }}>
                Apply Crop
              </button>
            </div>
          </div>
        </>
      )}
    </Card>
  );
}

// ── Settings Page ─────────────────────────────────────────────────────────
function SettingsContent() {
  const { user } = useAdmin();
  const isSuperAdmin = user?.role === 'super_admin';

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [pwLoading, setPwLoading] = useState(false);
  const [pwError, setPwError] = useState('');
  const [pwSuccess, setPwSuccess] = useState('');

  async function handlePasswordChange(e: React.FormEvent) {
    e.preventDefault();
    if (newPassword !== confirmPassword) { setPwError('Passwords do not match.'); return; }
    if (newPassword.length < 8) { setPwError('Password must be at least 8 characters.'); return; }
    setPwLoading(true); setPwError(''); setPwSuccess('');
    try {
      const res = await fetch('/api/admin/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const data = await res.json();
      if (!res.ok) { setPwError(data.error || 'Failed.'); return; }
      setPwSuccess('Password updated successfully.');
      setCurrentPassword(''); setNewPassword(''); setConfirmPassword('');
    } finally {
      setPwLoading(false);
    }
  }

  return (
    <div style={{ maxWidth: 640 }}>
      {/* My Profile */}
      <ProfileForm user={user} />

      {/* Change Password */}
      <Card title="Change Password">
        <form onSubmit={handlePasswordChange}>
          <Field label="Current Password">
            <input type="password" value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} placeholder="Your current password" required style={INPUT} />
          </Field>
          <Field label="New Password">
            <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder="Minimum 8 characters" required minLength={8} style={INPUT} />
          </Field>
          <Field label="Confirm New Password">
            <input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} placeholder="Repeat new password" required style={INPUT} />
          </Field>
          {pwError && <div style={{ fontSize: 12, color: 'var(--as-badge-red-text)', padding: '8px 12px', background: 'var(--as-badge-red)', borderRadius: 6, marginBottom: 14 }}>{pwError}</div>}
          {pwSuccess && <div style={{ fontSize: 12, color: 'var(--as-badge-green-text)', padding: '8px 12px', background: 'var(--as-badge-green)', borderRadius: 6, marginBottom: 14 }}>{pwSuccess}</div>}
          <button type="submit" disabled={pwLoading} style={{ padding: '9px 24px', fontSize: 13, fontWeight: 600, cursor: 'pointer', background: 'var(--as-accent)', color: 'var(--as-bg)', border: 'none', borderRadius: 6, opacity: pwLoading ? 0.6 : 1 }}>
            {pwLoading ? 'Updating...' : 'Update Password'}
          </button>
        </form>
      </Card>

      {/* Data Visibility — Super Admin only */}
      {isSuperAdmin && <DataVisibilityCard />}

      {/* System Settings — Super Admin only */}
      {isSuperAdmin && (
        <Card title="System Settings">
          <div style={{ fontSize: 13, color: 'var(--as-muted)', lineHeight: 1.7 }}>
            <p style={{ margin: 0 }}>Configure environment variables in your deployment:</p>
            <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 6 }}>
              {[
                ['ADMIN_JWT_SECRET', 'JWT signing secret (32+ chars)'],
                ['ADMIN_SETUP_SECRET', 'One-time setup secret for first Super Admin'],
                ['SUPER_ADMIN_EMAIL', 'Email address that receives OTP codes'],
                ['FROM_EMAIL', 'Sender address for admin emails'],
                ['RESEND_API_KEY', 'Resend API key for transactional email'],
              ].map(([key, desc]) => (
                <div key={key} style={{ display: 'flex', gap: 12, fontSize: 12 }}>
                  <code style={{ fontFamily: 'monospace', color: 'var(--as-text)', background: 'var(--as-hover)', padding: '2px 8px', borderRadius: 4, whiteSpace: 'nowrap' }}>{key}</code>
                  <span style={{ color: 'var(--as-muted)' }}>{desc}</span>
                </div>
              ))}
            </div>
          </div>
        </Card>
      )}

      {/* OTP Security */}
      <Card title="OTP Security Policy">
        <div style={{ fontSize: 13, color: 'var(--as-muted)', lineHeight: 1.7 }}>
          <InfoRow label="OTP Expiry" value="5 minutes" />
          <InfoRow label="Max Attempts" value="3 per request" />
          <InfoRow label="Sent To" value="Super Admin email (SUPER_ADMIN_EMAIL env)" />
          <InfoRow label="Scope" value="Coupon creation approvals only" />
        </div>
      </Card>
    </div>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ background: 'var(--as-card)', border: '1px solid var(--as-border)', borderRadius: 10, padding: 24, marginBottom: 20, boxShadow: 'var(--as-shadow)' }}>
      <h3 style={{ margin: '0 0 18px', fontSize: 14, fontWeight: 600, color: 'var(--as-text)' }}>{title}</h3>
      {children}
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '7px 0', borderBottom: '1px solid var(--as-border)', fontSize: 13 }}>
      <span style={{ color: 'var(--as-muted)' }}>{label}</span>
      <span style={{ color: 'var(--as-text)', fontWeight: 500, textTransform: 'capitalize' }}>{value}</span>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: 'var(--as-muted)', marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</label>
      {children}
    </div>
  );
}

export default function SettingsPage() {
  return <AdminShell><SettingsContent /></AdminShell>;
}
