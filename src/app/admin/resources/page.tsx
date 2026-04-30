'use client';

import { useState, useEffect, useCallback } from 'react';
import AdminShell from '@/components/admin/AdminShell';

// ── Types ────────────────────────────────────────────────────────────────────
type Category = 'all' | 'guide' | 'policy' | 'template' | 'sop' | 'other';
type VisibleTo = 'all' | 'admin' | 'super_admin';

interface Resource {
  _id: string;
  title: string;
  description?: string;
  category: Exclude<Category, 'all'>;
  fileUrl?: string;
  fileName?: string;
  fileSize?: number;
  externalLink?: string;
  uploadedByName: string;
  visibleTo: VisibleTo;
  createdAt: string;
}

interface Me {
  role: string;
  employeeId: string;
  name: string;
}

// ── Helpers ──────────────────────────────────────────────────────────────────
const CATEGORY_LABELS: Record<string, string> = {
  guide: 'Guide',
  policy: 'Policy',
  template: 'Template',
  sop: 'SOP',
  other: 'Other',
};

const CATEGORY_COLORS: Record<string, { bg: string; text: string }> = {
  guide:    { bg: 'var(--as-badge-blue)',   text: 'var(--as-badge-blue-text)' },
  policy:   { bg: 'var(--as-badge-red)',    text: 'var(--as-badge-red-text)' },
  template: { bg: 'var(--as-badge-green)',  text: 'var(--as-badge-green-text)' },
  sop:      { bg: 'var(--as-badge-yellow)', text: 'var(--as-badge-yellow-text)' },
  other:    { bg: 'var(--as-badge-gray)',   text: 'var(--as-muted)' },
};

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1048576).toFixed(1)} MB`;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

// ── Icon helper ──────────────────────────────────────────────────────────────
const Icon = ({ d, size = 16, color = 'currentColor' }: { d: string; size?: number; color?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
    <path d={d} />
  </svg>
);

const ICONS = {
  file:     'M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z M14 2v6h6',
  link:     'M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71 M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71',
  download: 'M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4 M7 10l5 5 5-5 M12 15V3',
  trash:    'M3 6h18 M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6 M10 11v6 M14 11v6 M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2',
  plus:     'M12 5v14 M5 12h14',
  search:   'M21 21l-4.35-4.35 M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z',
  x:        'M18 6L6 18 M6 6l12 12',
  folder:   'M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z',
  upload:   'M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4 M17 8l-5-5-5 5 M12 3v12',
  lock:     'M19 11H5a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7a2 2 0 0 0-2-2z M7 11V7a5 5 0 0 1 10 0v4',
};

// ── Upload Modal ─────────────────────────────────────────────────────────────
function UploadModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const [form, setForm] = useState({
    title: '',
    description: '',
    category: 'guide' as Exclude<Category, 'all'>,
    fileUrl: '',
    fileName: '',
    externalLink: '',
    visibleTo: 'all' as VisibleTo,
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [useLink, setUseLink] = useState(false);

  function set(k: string, v: string) { setForm(f => ({ ...f, [k]: v })); }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.title.trim()) { setError('Title is required.'); return; }
    if (!useLink && !form.fileUrl.trim()) { setError('Please provide a file URL or use an external link.'); return; }
    if (useLink && !form.externalLink.trim()) { setError('Please provide an external link.'); return; }

    setSaving(true); setError('');
    try {
      const payload: any = {
        title: form.title.trim(),
        description: form.description.trim() || undefined,
        category: form.category,
        visibleTo: form.visibleTo,
      };
      if (useLink) {
        payload.externalLink = form.externalLink.trim();
      } else {
        payload.fileUrl = form.fileUrl.trim();
        payload.fileName = form.fileName.trim() || form.title.trim();
      }

      const res = await fetch('/api/admin/resources', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error || 'Failed to upload');
      }
      onSuccess();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '8px 11px', fontSize: 13,
    border: '1px solid var(--as-border)', borderRadius: 'var(--as-radius-sm)',
    background: 'var(--as-input-bg)', color: 'var(--as-text)',
    outline: 'none', boxSizing: 'border-box',
  };
  const labelStyle: React.CSSProperties = {
    fontSize: 11, fontWeight: 600, color: 'var(--as-muted)',
    textTransform: 'uppercase', letterSpacing: '0.07em', display: 'block', marginBottom: 5,
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 1000,
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
    }}>
      <div style={{
        background: 'var(--as-card)', border: '1px solid var(--as-border)',
        borderRadius: 'var(--as-radius)', width: '100%', maxWidth: 520,
        maxHeight: '90vh', overflowY: 'auto',
      }}>
        {/* Header */}
        <div style={{ padding: '18px 20px 16px', borderBottom: '1px solid var(--as-border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--as-text)' }}>Add Resource</div>
            <div style={{ fontSize: 12, color: 'var(--as-muted)', marginTop: 2 }}>Share a file or link with the team</div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--as-muted)', padding: 4 }}>
            <Icon d={ICONS.x} size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 14 }}>
          {/* Title */}
          <div>
            <label style={labelStyle}>Title *</label>
            <input style={inputStyle} value={form.title} onChange={e => set('title', e.target.value)} placeholder="e.g. Return Policy v2" />
          </div>

          {/* Description */}
          <div>
            <label style={labelStyle}>Description</label>
            <textarea
              style={{ ...inputStyle, resize: 'vertical', minHeight: 72 }}
              value={form.description}
              onChange={e => set('description', e.target.value)}
              placeholder="Brief summary of this resource..."
            />
          </div>

          {/* Category + Visible to */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={labelStyle}>Category</label>
              <select style={{ ...inputStyle }} value={form.category} onChange={e => set('category', e.target.value)}>
                <option value="guide">Guide</option>
                <option value="policy">Policy</option>
                <option value="template">Template</option>
                <option value="sop">SOP</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div>
              <label style={labelStyle}>Visible To</label>
              <select style={{ ...inputStyle }} value={form.visibleTo} onChange={e => set('visibleTo', e.target.value)}>
                <option value="all">All Staff</option>
                <option value="admin">Admin+</option>
                <option value="super_admin">Super Admin Only</option>
              </select>
            </div>
          </div>

          {/* Type toggle */}
          <div style={{ display: 'flex', gap: 8 }}>
            {(['File URL', 'External Link'] as const).map((t, i) => (
              <button
                key={t}
                type="button"
                onClick={() => setUseLink(i === 1)}
                style={{
                  flex: 1, padding: '7px 0', fontSize: 12, fontWeight: 600,
                  border: '1px solid var(--as-border)', borderRadius: 'var(--as-radius-sm)',
                  background: (i === 1) === useLink ? 'var(--as-accent)' : 'transparent',
                  color: (i === 1) === useLink ? '#fff' : 'var(--as-muted)',
                  cursor: 'pointer', transition: 'all 0.12s',
                }}
              >{t}</button>
            ))}
          </div>

          {!useLink ? (
            <>
              <div>
                <label style={labelStyle}>File URL *</label>
                <input style={inputStyle} value={form.fileUrl} onChange={e => set('fileUrl', e.target.value)} placeholder="https://..." />
              </div>
              <div>
                <label style={labelStyle}>File Name</label>
                <input style={inputStyle} value={form.fileName} onChange={e => set('fileName', e.target.value)} placeholder="return-policy.pdf" />
              </div>
            </>
          ) : (
            <div>
              <label style={labelStyle}>External Link *</label>
              <input style={inputStyle} value={form.externalLink} onChange={e => set('externalLink', e.target.value)} placeholder="https://notion.so/..." />
            </div>
          )}

          {error && (
            <div style={{ fontSize: 12, color: 'var(--as-badge-red-text)', background: 'var(--as-badge-red)', padding: '8px 12px', borderRadius: 'var(--as-radius-sm)' }}>
              {error}
            </div>
          )}

          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', paddingTop: 4 }}>
            <button type="button" onClick={onClose} style={{
              padding: '8px 16px', fontSize: 12, border: '1px solid var(--as-border)',
              borderRadius: 'var(--as-radius-sm)', background: 'transparent', color: 'var(--as-muted)', cursor: 'pointer',
            }}>Cancel</button>
            <button type="submit" disabled={saving} style={{
              padding: '8px 20px', fontSize: 12, fontWeight: 600, border: 'none',
              borderRadius: 'var(--as-radius-sm)', background: 'var(--as-accent)', color: '#fff',
              cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.7 : 1,
            }}>{saving ? 'Uploading…' : 'Add Resource'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Resource Card ─────────────────────────────────────────────────────────────
function ResourceCard({ resource, canDelete, onDelete }: {
  resource: Resource;
  canDelete: boolean;
  onDelete: (id: string) => void;
}) {
  const [deleting, setDeleting] = useState(false);
  const isFile = !!resource.fileUrl;
  const cat = CATEGORY_COLORS[resource.category] || CATEGORY_COLORS.other;

  async function handleDelete() {
    if (!confirm(`Delete "${resource.title}"? This cannot be undone.`)) return;
    setDeleting(true);
    try {
      await fetch(`/api/admin/resources/${resource._id}`, { method: 'DELETE' });
      onDelete(resource._id);
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div style={{
      background: 'var(--as-card)', border: '1px solid var(--as-border)',
      borderRadius: 'var(--as-radius)', padding: '16px 18px',
      display: 'flex', flexDirection: 'column', gap: 10,
      transition: 'border-color 0.15s, box-shadow 0.15s',
    }}
      onMouseEnter={e => {
        (e.currentTarget as HTMLElement).style.borderColor = 'var(--as-accent)';
        (e.currentTarget as HTMLElement).style.boxShadow = '0 0 0 1px var(--as-accent)20';
      }}
      onMouseLeave={e => {
        (e.currentTarget as HTMLElement).style.borderColor = 'var(--as-border)';
        (e.currentTarget as HTMLElement).style.boxShadow = 'none';
      }}
    >
      {/* Top row */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
        {/* File icon */}
        <div style={{
          width: 38, height: 38, borderRadius: 'var(--as-radius-sm)',
          background: cat.bg, display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0,
        }}>
          <Icon d={isFile ? ICONS.file : ICONS.link} size={17} color={cat.text} />
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--as-text)', lineHeight: 1.3 }}>
            {resource.title}
          </div>
          {resource.description && (
            <div style={{ fontSize: 11.5, color: 'var(--as-muted)', marginTop: 3, lineHeight: 1.4 }}>
              {resource.description}
            </div>
          )}
        </div>
      </div>

      {/* Badges */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
        <span style={{
          fontSize: 10, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase',
          padding: '2px 7px', borderRadius: 20, background: cat.bg, color: cat.text,
        }}>
          {CATEGORY_LABELS[resource.category] || resource.category}
        </span>
        {resource.visibleTo !== 'all' && (
          <span style={{
            fontSize: 10, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase',
            padding: '2px 7px', borderRadius: 20, background: 'var(--as-badge-yellow)', color: 'var(--as-badge-yellow-text)',
            display: 'flex', alignItems: 'center', gap: 3,
          }}>
            <Icon d={ICONS.lock} size={9} color="currentColor" />
            {resource.visibleTo === 'super_admin' ? 'Super Admin' : 'Admin+'}
          </span>
        )}
        {resource.fileName && (
          <span style={{ fontSize: 10, color: 'var(--as-muted)' }}>
            {resource.fileName}{resource.fileSize ? ` · ${formatBytes(resource.fileSize)}` : ''}
          </span>
        )}
      </div>

      {/* Footer */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid var(--as-border)', paddingTop: 10 }}>
        <div style={{ fontSize: 11, color: 'var(--as-muted)' }}>
          By <strong style={{ color: 'var(--as-text)' }}>{resource.uploadedByName}</strong> · {formatDate(resource.createdAt)}
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          {/* Download / Open */}
          <a
            href={resource.fileUrl || resource.externalLink || '#'}
            target="_blank"
            rel="noopener noreferrer"
            title={isFile ? 'Download' : 'Open Link'}
            style={{
              width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center',
              border: '1px solid var(--as-border)', borderRadius: 'var(--as-radius-sm)',
              color: 'var(--as-muted)', textDecoration: 'none', transition: 'all 0.12s',
            }}
            onMouseEnter={e => {
              (e.currentTarget as HTMLElement).style.background = 'var(--as-badge-blue)';
              (e.currentTarget as HTMLElement).style.color = 'var(--as-badge-blue-text)';
              (e.currentTarget as HTMLElement).style.borderColor = 'var(--as-badge-blue-text)';
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLElement).style.background = 'transparent';
              (e.currentTarget as HTMLElement).style.color = 'var(--as-muted)';
              (e.currentTarget as HTMLElement).style.borderColor = 'var(--as-border)';
            }}
          >
            <Icon d={isFile ? ICONS.download : ICONS.link} size={13} />
          </a>

          {/* Delete (admin+) */}
          {canDelete && (
            <button
              onClick={handleDelete}
              disabled={deleting}
              title="Delete resource"
              style={{
                width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center',
                border: '1px solid var(--as-border)', borderRadius: 'var(--as-radius-sm)',
                background: 'transparent', color: 'var(--as-muted)', cursor: 'pointer',
                transition: 'all 0.12s', opacity: deleting ? 0.5 : 1,
              }}
              onMouseEnter={e => {
                (e.currentTarget as HTMLElement).style.background = 'var(--as-badge-red)';
                (e.currentTarget as HTMLElement).style.color = 'var(--as-badge-red-text)';
                (e.currentTarget as HTMLElement).style.borderColor = 'var(--as-badge-red-text)';
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLElement).style.background = 'transparent';
                (e.currentTarget as HTMLElement).style.color = 'var(--as-muted)';
                (e.currentTarget as HTMLElement).style.borderColor = 'var(--as-border)';
              }}
            >
              <Icon d={ICONS.trash} size={13} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function ResourcesPage() {
  const [me, setMe] = useState<Me | null>(null);
  const [allResources, setAllResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState<Category>('all');
  const [showUpload, setShowUpload] = useState(false);

  const canManage = me?.role === 'super_admin' || me?.role === 'admin';

  // Filtered view (client-side search + category filter)
  const resources = allResources.filter(r => {
    const matchesCat = category === 'all' || r.category === category;
    const q = search.toLowerCase();
    const matchesSearch = !q ||
      r.title.toLowerCase().includes(q) ||
      (r.description || '').toLowerCase().includes(q) ||
      (r.fileName || '').toLowerCase().includes(q);
    return matchesCat && matchesSearch;
  });

  const fetchMe = useCallback(async () => {
    const res = await fetch('/api/admin/auth/me');
    if (res.ok) setMe(await res.json());
  }, []);

  const fetchResources = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/resources');
      if (res.ok) {
        const d = await res.json();
        setAllResources(d.resources || []);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchMe(); }, [fetchMe]);
  useEffect(() => { fetchResources(); }, [fetchResources]);

  const handleDelete = (id: string) => setAllResources(rs => rs.filter(r => r._id !== id));

  const categories: { key: Category; label: string }[] = [
    { key: 'all', label: 'All' },
    { key: 'guide', label: 'Guides' },
    { key: 'policy', label: 'Policies' },
    { key: 'template', label: 'Templates' },
    { key: 'sop', label: 'SOPs' },
    { key: 'other', label: 'Other' },
  ];

  return (
    <AdminShell title="Resource Hub">
      <div style={{ maxWidth: 1100, margin: '0 auto' }}>

        {/* Page header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
          <div>
            <h2 style={{ fontSize: 18, fontWeight: 700, color: 'var(--as-text)', margin: 0, letterSpacing: '-0.02em' }}>
              Resource Hub
            </h2>
            <p style={{ fontSize: 13, color: 'var(--as-muted)', margin: '4px 0 0' }}>
              Team files, policies, guides, and SOPs
            </p>
          </div>
          {canManage && (
            <button
              onClick={() => setShowUpload(true)}
              style={{
                display: 'flex', alignItems: 'center', gap: 7,
                padding: '8px 16px', fontSize: 12, fontWeight: 600,
                background: 'var(--as-accent)', color: '#fff',
                border: 'none', borderRadius: 'var(--as-radius-sm)', cursor: 'pointer',
              }}
            >
              <Icon d={ICONS.upload} size={14} color="#fff" />
              Add Resource
            </button>
          )}
        </div>

        {/* Search + filter bar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
          {/* Search */}
          <div style={{ position: 'relative', flex: '1 1 220px', minWidth: 160 }}>
            <span style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--as-muted)' }}>
              <Icon d={ICONS.search} size={14} />
            </span>
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search resources…"
              style={{
                width: '100%', padding: '8px 11px 8px 32px', fontSize: 13,
                border: '1px solid var(--as-border)', borderRadius: 'var(--as-radius-sm)',
                background: 'var(--as-input-bg)', color: 'var(--as-text)', outline: 'none',
                boxSizing: 'border-box',
              }}
            />
          </div>

          {/* Category tabs */}
          <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
            {categories.map(c => (
              <button
                key={c.key}
                onClick={() => setCategory(c.key)}
                style={{
                  padding: '6px 12px', fontSize: 12, fontWeight: 500,
                  border: '1px solid var(--as-border)', borderRadius: 20,
                  background: category === c.key ? 'var(--as-accent)' : 'transparent',
                  color: category === c.key ? '#fff' : 'var(--as-muted)',
                  cursor: 'pointer', transition: 'all 0.12s',
                }}
              >
                {c.label}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        {loading ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 200, color: 'var(--as-muted)', fontSize: 13 }}>
            Loading resources…
          </div>
        ) : resources.length === 0 ? (
          <div style={{
            border: '2px dashed var(--as-border)', borderRadius: 'var(--as-radius)', padding: '60px 20px',
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, color: 'var(--as-muted)',
          }}>
            <Icon d={ICONS.folder} size={40} color="var(--as-border)" />
            <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--as-text)' }}>No resources found</div>
            <div style={{ fontSize: 13 }}>
              {search ? `No results for "${search}"` : canManage ? 'Upload the first resource to get started.' : 'No resources have been shared yet.'}
            </div>
            {canManage && !search && (
              <button
                onClick={() => setShowUpload(true)}
                style={{
                  marginTop: 4, padding: '8px 20px', fontSize: 12, fontWeight: 600,
                  background: 'var(--as-accent)', color: '#fff', border: 'none',
                  borderRadius: 'var(--as-radius-sm)', cursor: 'pointer',
                }}
              >
                + Add First Resource
              </button>
            )}
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
            gap: 14,
          }}>
            {resources.map(r => (
              <ResourceCard
                key={r._id}
                resource={r}
                canDelete={canManage}
                onDelete={handleDelete}
              />
            ))}
          </div>
        )}

        {/* Stats footer */}
        {resources.length > 0 && (
          <div style={{ marginTop: 20, fontSize: 12, color: 'var(--as-muted)', textAlign: 'right' }}>
            {resources.length} of {allResources.length} resource{allResources.length !== 1 ? 's' : ''}
            {(category !== 'all' || search) ? ' (filtered)' : ' total'}
          </div>
        )}
      </div>

      {/* Upload modal */}
      {showUpload && (
        <UploadModal
          onClose={() => setShowUpload(false)}
          onSuccess={() => { setShowUpload(false); fetchResources(); }}
        />
      )}
    </AdminShell>
  );
}
