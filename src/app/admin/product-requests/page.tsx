'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import AdminShell from '@/components/admin/AdminShell';
import { useAdmin } from '@/components/admin/AdminShell';

// ── Constants ────────────────────────────────────────────────────────────────

const SIZE_OPTIONS = ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'Free Size'];
const GENDER_OPTIONS = ['Men', 'Women', 'Unisex'];
const BADGE_OPTIONS = [
  { label: 'None', value: '' },
  { label: 'New', value: 'new' },
  { label: 'Sale', value: 'sale' },
  { label: 'Sold Out', value: 'sold-out' },
];
const IMAGE_SLOTS = [
  { key: 'front',     label: 'Front View',   required: true  },
  { key: 'back',      label: 'Back View',    required: true  },
  { key: 'left',      label: 'Left View',    required: false },
  { key: 'right',     label: 'Right View',   required: false },
  { key: 'detail',    label: 'Detail Shot',  required: false },
  { key: 'sizeGuide', label: 'Size Guide',   required: false },
];

type ImageAsset = { url: string; assetId: string };
type ImageMap   = Partial<Record<string, ImageAsset>>;

interface Category { _id: string; name: string; slug?: { current: string } }

interface FormState {
  name: string;
  categoryId: string;
  categoryName: string;
  gender: string;
  priceINR: string;
  originalPriceINR: string;
  badge: string;
  sizes: string[];
  colors: string[];
  description: string;
  material: string;
  internalNotes: string;
  images: ImageMap;
}

const EMPTY_FORM: FormState = {
  name: '', categoryId: '', categoryName: '', gender: 'Unisex',
  priceINR: '', originalPriceINR: '', badge: '',
  sizes: [], colors: [], description: '', material: '',
  internalNotes: '', images: {},
};

interface Request {
  _id: string; title: string; status: string;
  submittedByName?: string; submittedAt?: string; createdAt?: string;
  price?: number; comparePrice?: number; category?: string; gender?: string;
  badge?: string; sizes?: string[]; colors?: string[];
  description?: string; material?: string; imageAssetsJson?: string;
  reviewNote?: string; reviewedBy?: string; reviewedAt?: string;
  internalNotes?: string; categoryId?: string;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function slugify(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

function statusColor(s: string) {
  if (s === 'approved') return { bg: 'var(--as-badge-green)', color: 'var(--as-badge-green-text)' };
  if (s === 'rejected') return { bg: 'var(--as-badge-red)',  color: 'var(--as-badge-red-text)'  };
  if (s === 'pending')  return { bg: 'var(--as-badge-yellow)', color: 'var(--as-badge-yellow-text)' };
  return { bg: 'var(--as-badge-gray)', color: 'var(--as-badge-gray-text)' };
}

// ── Single-slot image uploader ────────────────────────────────────────────────

function SlotUploader({
  slotKey, label, required, value, onChange,
}: {
  slotKey: string; label: string; required: boolean;
  value?: ImageAsset; onChange: (v: ImageAsset | undefined) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [dragging, setDragging] = useState(false);

  async function upload(file: File) {
    setError(''); setUploading(true);
    try {
      const fd = new FormData(); fd.append('file', file);
      const res = await fetch('/api/admin/upload', { method: 'POST', body: fd });
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'Upload failed'); return; }
      onChange({ url: data.url, assetId: data.assetId });
    } catch { setError('Upload failed'); }
    finally { setUploading(false); }
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault(); setDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) upload(file);
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--as-muted)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
        {label}{required && <span style={{ color: '#f87171', marginLeft: 2 }}>*</span>}
      </div>
      {value ? (
        <div style={{ position: 'relative', borderRadius: 8, overflow: 'hidden', background: 'var(--as-border-subtle)', aspectRatio: '1/1' }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={value.url} alt={label} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
          <div style={{ position: 'absolute', top: 4, right: 4, display: 'flex', gap: 4 }}>
            <button onClick={() => inputRef.current?.click()} style={{ background: 'rgba(0,0,0,0.7)', border: 'none', borderRadius: 5, color: '#fff', fontSize: 10, padding: '3px 7px', cursor: 'pointer', fontWeight: 600 }}>Replace</button>
            <button onClick={() => onChange(undefined)} style={{ background: 'rgba(220,38,38,0.85)', border: 'none', borderRadius: 5, color: '#fff', fontSize: 12, width: 22, height: 22, cursor: 'pointer', lineHeight: 1 }}>✕</button>
          </div>
        </div>
      ) : (
        <div
          onClick={() => inputRef.current?.click()}
          onDragOver={e => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={onDrop}
          style={{
            aspectRatio: '1/1', border: `1.5px dashed ${dragging ? 'var(--as-accent)' : 'var(--as-input-border)'}`,
            borderRadius: 8, display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center',
            gap: 6, cursor: 'pointer', background: dragging ? 'var(--as-accent-subtle)' : 'var(--as-input-bg)',
            transition: 'all 0.15s',
          }}
        >
          {uploading ? (
            <div style={{ width: 18, height: 18, border: '2px solid var(--as-border)', borderTopColor: 'var(--as-accent)', borderRadius: '50%', animation: 'pr-spin 0.7s linear infinite' }} />
          ) : (
            <>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--as-muted)" strokeWidth="1.5">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>
              </svg>
              <span style={{ fontSize: 10, color: 'var(--as-muted)', textAlign: 'center', lineHeight: 1.4 }}>Click or drag</span>
            </>
          )}
        </div>
      )}
      {error && <div style={{ fontSize: 10, color: '#f87171' }}>{error}</div>}
      <input ref={inputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={e => { const f = e.target.files?.[0]; if (f) upload(f); e.target.value = ''; }} />
    </div>
  );
}

// ── Color tag input ───────────────────────────────────────────────────────────

function ColorTagInput({ value, onChange }: { value: string[]; onChange: (v: string[]) => void }) {
  const [input, setInput] = useState('');
  function add() {
    const v = input.trim();
    if (v && !value.includes(v)) onChange([...value, v]);
    setInput('');
  }
  function onKey(e: React.KeyboardEvent) {
    if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); add(); }
    if (e.key === 'Backspace' && !input && value.length) onChange(value.slice(0, -1));
  }
  return (
    <div style={{ border: '1px solid var(--as-input-border)', borderRadius: 7, padding: '6px 10px', background: 'var(--as-input-bg)', display: 'flex', flexWrap: 'wrap', gap: 5, alignItems: 'center', minHeight: 38 }}>
      {value.map(c => (
        <span key={c} style={{ display: 'flex', alignItems: 'center', gap: 4, background: 'var(--as-badge-gray)', color: 'var(--as-badge-gray-text)', borderRadius: 4, fontSize: 12, padding: '2px 7px', fontWeight: 500 }}>
          {c}
          <button onClick={() => onChange(value.filter(x => x !== c))} style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', padding: 0, lineHeight: 1, fontSize: 12, opacity: 0.6 }}>✕</button>
        </span>
      ))}
      <input value={input} onChange={e => setInput(e.target.value)} onKeyDown={onKey} onBlur={add}
        placeholder={value.length === 0 ? 'Type colour, press Enter…' : ''}
        style={{ flex: 1, minWidth: 80, border: 'none', outline: 'none', background: 'transparent', fontSize: 13, color: 'var(--as-text)', padding: 0 }} />
    </div>
  );
}

// ── Live product preview ──────────────────────────────────────────────────────

function ProductPreview({ form, categories }: { form: FormState; categories: Category[] }) {
  const cat      = categories.find(c => c._id === form.categoryId);
  const price    = parseFloat(form.priceINR) || 0;
  const orig     = parseFloat(form.originalPriceINR) || 0;
  const discount = orig > price && price > 0 ? Math.round(((orig - price) / orig) * 100) : 0;

  // All uploaded product images (exclude sizeGuide from main carousel)
  const carouselSlots = IMAGE_SLOTS.filter(s => s.key !== 'sizeGuide' && form.images[s.key]);
  const [activeIdx, setActiveIdx] = useState(0);

  // Reset to 0 whenever the set of uploaded images changes
  useEffect(() => {
    setActiveIdx(0);
  }, [carouselSlots.map(s => s.key).join(',')]);

  const safeIdx    = carouselSlots.length > 0 ? Math.min(activeIdx, carouselSlots.length - 1) : 0;
  const activeSlot = carouselSlots[safeIdx];
  const activeImg  = activeSlot ? form.images[activeSlot.key]?.url : undefined;

  function prev(e: React.MouseEvent) { e.stopPropagation(); setActiveIdx(i => (i - 1 + carouselSlots.length) % carouselSlots.length); }
  function next(e: React.MouseEvent) { e.stopPropagation(); setActiveIdx(i => (i + 1) % carouselSlots.length); }

  return (
    <div style={{ width: '100%', maxWidth: 280, margin: '0 auto' }}>
      {/* Main image box */}
      <div style={{ background: '#f4f3f0', borderRadius: 16, overflow: 'hidden', aspectRatio: '4/5', position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {activeImg ? (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img src={activeImg} alt="preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, color: '#bbb' }}>
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
              <rect x="3" y="3" width="18" height="18" rx="3"/><path d="m21 15-5-5L5 21"/><circle cx="9" cy="9" r="2"/>
            </svg>
            <span style={{ fontSize: 11 }}>Upload images to preview</span>
          </div>
        )}

        {/* Prev / Next arrows — only when multiple images */}
        {carouselSlots.length > 1 && (
          <>
            <button onClick={prev} style={{
              position: 'absolute', left: 8, top: '50%', transform: 'translateY(-50%)',
              width: 28, height: 28, borderRadius: '50%', border: 'none', cursor: 'pointer',
              background: 'rgba(255,255,255,0.88)', display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 13, color: '#333', boxShadow: '0 1px 4px rgba(0,0,0,0.15)',
            }}>‹</button>
            <button onClick={next} style={{
              position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)',
              width: 28, height: 28, borderRadius: '50%', border: 'none', cursor: 'pointer',
              background: 'rgba(255,255,255,0.88)', display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 13, color: '#333', boxShadow: '0 1px 4px rgba(0,0,0,0.15)',
            }}>›</button>
          </>
        )}

        {/* Badge */}
        {form.badge && (
          <div style={{
            position: 'absolute', top: 10, left: 10,
            background: form.badge === 'sale' ? '#ef4444' : form.badge === 'new' ? '#000' : '#6b7280',
            color: '#fff', fontSize: 9, fontWeight: 700, letterSpacing: '0.1em',
            textTransform: 'uppercase', padding: '3px 8px', borderRadius: 4,
          }}>{form.badge}</div>
        )}

        {/* Wishlist btn */}
        <div style={{ position: 'absolute', top: 8, right: 8, width: 30, height: 30, background: 'rgba(255,255,255,0.9)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14 }}>♡</div>

        {/* Dot indicators */}
        {carouselSlots.length > 1 && (
          <div style={{ position: 'absolute', bottom: 10, left: 0, right: 0, display: 'flex', justifyContent: 'center', gap: 5 }}>
            {carouselSlots.map((_, i) => (
              <button key={i} onClick={e => { e.stopPropagation(); setActiveIdx(i); }} style={{
                width: i === safeIdx ? 16 : 6, height: 6, borderRadius: 99, border: 'none', cursor: 'pointer', padding: 0,
                background: i === safeIdx ? '#fff' : 'rgba(255,255,255,0.45)',
                transition: 'all 0.2s',
              }} />
            ))}
          </div>
        )}
      </div>

      {/* Thumbnail strip — click to jump to that view */}
      {carouselSlots.length > 1 && (
        <div style={{ display: 'flex', gap: 6, marginTop: 8, justifyContent: 'center', flexWrap: 'wrap' }}>
          {carouselSlots.map((slot, i) => (
            <button key={slot.key} onClick={() => setActiveIdx(i)} style={{
              padding: 0, border: `2px solid ${i === safeIdx ? 'var(--as-accent)' : 'transparent'}`,
              borderRadius: 7, cursor: 'pointer', background: 'none', transition: 'border-color 0.15s',
            }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={form.images[slot.key]!.url} alt={slot.label}
                style={{ width: 44, height: 44, objectFit: 'cover', borderRadius: 5, display: 'block' }} />
            </button>
          ))}
        </div>
      )}

      <div style={{ padding: '12px 2px 0' }}>
        {/* Category */}
        {cat && <div style={{ fontSize: 10, color: '#888', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 3 }}>{cat.name}</div>}
        {/* Name */}
        <div style={{ fontSize: 13, fontWeight: 400, color: '#111', marginBottom: 6, lineHeight: 1.3 }}>
          {form.name || <span style={{ color: '#bbb' }}>Product name</span>}
        </div>
        {/* Price */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 14, fontWeight: 700, color: '#111' }}>{price > 0 ? `₹${price.toLocaleString('en-IN')}` : '₹—'}</span>
          {orig > price && price > 0 && <>
            <span style={{ fontSize: 12, color: '#999', textDecoration: 'line-through' }}>₹{orig.toLocaleString('en-IN')}</span>
            <span style={{ fontSize: 10, fontWeight: 700, color: '#fff', background: '#ef4444', borderRadius: 3, padding: '1px 5px' }}>{discount}% OFF</span>
          </>}
        </div>
        {/* Sizes */}
        {form.sizes.length > 0 && (
          <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginBottom: 6 }}>
            {form.sizes.map(s => (
              <span key={s} style={{ border: '1px solid #ddd', borderRadius: 4, fontSize: 10, padding: '2px 6px', color: '#555' }}>{s}</span>
            ))}
          </div>
        )}
        {/* Colors */}
        {form.colors.length > 0 && (
          <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
            {form.colors.map(c => (
              <span key={c} style={{ fontSize: 10, color: '#888', border: '1px solid #eee', borderRadius: 3, padding: '1px 5px' }}>{c}</span>
            ))}
          </div>
        )}
      </div>

      {/* Accordions — matching website exactly */}
      <PreviewAccordions description={form.description} material={form.material} />
    </div>
  );
}

// ── Preview accordions (mirrors website ProductAccordion) ─────────────────────

function PreviewAccordions({ description, material }: { description: string; material: string }) {
  const [open, setOpen] = useState<string | null>(null);
  function toggle(key: string) { setOpen(o => o === key ? null : key); }

  const items = [
    {
      key: 'description',
      title: 'Description',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" width={14} height={14}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
        </svg>
      ),
      content: <p style={{ whiteSpace: 'pre-line', margin: 0 }}>{description || 'No description available.'}</p>,
    },
    {
      key: 'material',
      title: 'Material & Care',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" width={14} height={14}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
        </svg>
      ),
      content: (
        <p style={{ whiteSpace: 'pre-line', margin: 0 }}>
          {material || '100% Premium Cotton.\nMachine wash cold.\nDo not bleach.\nTumble dry low.'}
        </p>
      ),
    },
    {
      key: 'shipping',
      title: 'Shipping Policy',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" width={14} height={14}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 00-10.026 0 1.106 1.106 0 00-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12" />
        </svg>
      ),
      content: (
        <p style={{ margin: 0 }}>We offer free shipping on all orders over ₹5000. All orders are processed within 1-2 business days. Standard delivery takes 3-5 business days depending on location. Discreet packaging allows for privacy.</p>
      ),
    },
    {
      key: 'returns',
      title: 'Return & Exchange Policy',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" width={14} height={14}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 12c0-1.232-.046-2.453-.138-3.662a4.006 4.006 0 00-3.7-3.7 48.678 48.678 0 00-7.324 0 4.006 4.006 0 00-3.7 3.7c-.017.22-.032.441-.046.662M19.5 12l3-3m-3 3l-3-3m-12 3c0 1.232.046 2.453.138 3.662a4.006 4.006 0 003.7 3.7 48.656 48.656 0 007.324 0 4.006 4.006 0 003.7-3.7c.017-.22.032-.441.046-.662M4.5 12l3 3m-3-3l-3 3" />
        </svg>
      ),
      content: (
        <div style={{ margin: 0 }}>
          <p style={{ margin: '0 0 6px' }}>Exchange or return is available for 7-14 days from the date of delivery.</p>
          <p style={{ margin: '0 0 6px' }}>Returns are only issued for damaged products or incorrect items. Please ensure the product is unused and in original packaging with tags intact.</p>
          <p style={{ margin: 0, fontStyle: 'italic', fontSize: 10, marginTop: 4 }}>*Visual inspection required for all returns.</p>
        </div>
      ),
    },
  ];

  return (
    <div style={{ borderTop: '1px solid #e5e7eb', marginTop: 16 }}>
      {items.map(item => (
        <div key={item.key} style={{ borderBottom: '1px solid #e5e7eb' }}>
          <button
            onClick={() => toggle(item.key)}
            style={{
              width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '14px 0', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              {item.icon && <span style={{ color: '#9ca3af', display: 'flex' }}>{item.icon}</span>}
              <span style={{ fontSize: 11, fontWeight: 500, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#111' }}>{item.title}</span>
            </div>
            <svg
              xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"
              width={14} height={14}
              style={{ transform: open === item.key ? 'rotate(45deg)' : 'rotate(0deg)', transition: 'transform 0.2s', flexShrink: 0 }}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
          </button>
          <div style={{
            overflow: 'hidden',
            maxHeight: open === item.key ? 400 : 0,
            opacity: open === item.key ? 1 : 0,
            transition: 'max-height 0.25s ease, opacity 0.2s ease',
            marginBottom: open === item.key ? 14 : 0,
          }}>
            <div style={{ fontSize: 12, color: '#6b7280', lineHeight: 1.6 }}>
              {item.content}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Product Form Modal ────────────────────────────────────────────────────────

function ProductFormModal({
  role, categories, onClose, onSaved, editRequest,
}: {
  role: string; categories: Category[];
  onClose: () => void; onSaved: () => void;
  editRequest?: Request | null;
}) {
  const isAdmin = role === 'admin' || role === 'super_admin';
  const [form, setForm] = useState<FormState>(() => {
    if (editRequest) {
      let imgs: ImageMap = {};
      try { if (editRequest.imageAssetsJson) imgs = JSON.parse(editRequest.imageAssetsJson); } catch {}
      const cat = categories.find(c => c._id === editRequest.categoryId);
      return {
        name: editRequest.title || '',
        categoryId: editRequest.categoryId || '',
        categoryName: editRequest.category || cat?.name || '',
        gender: editRequest.gender || 'Unisex',
        priceINR: editRequest.price?.toString() || '',
        originalPriceINR: editRequest.comparePrice?.toString() || '',
        badge: editRequest.badge || '',
        sizes: editRequest.sizes || [],
        colors: editRequest.colors || [],
        description: editRequest.description || '',
        material: editRequest.material || '',
        internalNotes: editRequest.internalNotes || '',
        images: imgs,
      };
    }
    return EMPTY_FORM;
  });

  const [saving, setSaving]     = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [error, setError]       = useState('');

  function setImg(key: string, v: ImageAsset | undefined) {
    setForm(f => {
      const imgs = { ...f.images };
      if (v) imgs[key] = v; else delete imgs[key];
      return { ...f, images: imgs };
    });
  }

  function toggleSize(s: string) {
    setForm(f => ({
      ...f,
      sizes: f.sizes.includes(s) ? f.sizes.filter(x => x !== s) : [...f.sizes, s],
    }));
  }

  function buildImageAssetsJson() {
    return Object.keys(form.images).length > 0 ? JSON.stringify(form.images) : null;
  }

  // Employee: save draft or submit for review
  async function saveRequest(submitForReview: boolean) {
    setError(''); setSaving(true);
    try {
      const body = {
        title: form.name, description: form.description,
        category: form.categoryName, categoryId: form.categoryId,
        gender: form.gender, price: form.priceINR ? Number(form.priceINR) : null,
        comparePrice: form.originalPriceINR ? Number(form.originalPriceINR) : null,
        badge: form.badge, sizes: form.sizes, colors: form.colors,
        material: form.material, internalNotes: form.internalNotes,
        imageAssetsJson: buildImageAssetsJson(), submitForReview,
      };
      const url    = editRequest ? `/api/admin/product-requests/${editRequest._id}` : '/api/admin/product-requests';
      const method = editRequest ? 'PATCH' : 'POST';
      const res    = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      const data   = await res.json();
      if (!res.ok) { setError(data.error || 'Failed to save.'); return; }
      onSaved();
    } catch { setError('Network error.'); }
    finally { setSaving(false); }
  }

  // Admin+: publish directly as product
  async function publishDirect() {
    if (!form.name) { setError('Product name is required.'); return; }
    if (!form.priceINR) { setError('Price is required.'); return; }
    setError(''); setPublishing(true);
    try {
      const res = await fetch('/api/admin/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name, categoryId: form.categoryId, gender: form.gender,
          priceINR: Number(form.priceINR),
          originalPriceINR: form.originalPriceINR ? Number(form.originalPriceINR) : undefined,
          badge: form.badge || undefined,
          sizes: form.sizes, colors: form.colors,
          description: form.description, material: form.material,
          images: Object.fromEntries(Object.entries(form.images).filter(([k]) => k !== 'sizeGuide')),
          sizeGuide: form.images['sizeGuide'],
        }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'Failed to publish.'); return; }
      onSaved();
    } catch { setError('Network error.'); }
    finally { setPublishing(false); }
  }

  const busy = saving || publishing;

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <div style={{ background: 'var(--as-card)', borderRadius: 14, width: '100%', maxWidth: 1020, maxHeight: '93vh', display: 'flex', flexDirection: 'column', boxShadow: 'var(--as-shadow-lg)', border: '1px solid var(--as-border)', overflow: 'hidden' }}>

        {/* Header */}
        <div style={{ padding: '18px 24px', borderBottom: '1px solid var(--as-border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
          <div>
            <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--as-text)' }}>
              {editRequest ? 'Edit Product' : isAdmin ? 'Add New Product' : 'New Product Request'}
            </div>
            <div style={{ fontSize: 12, color: 'var(--as-muted)', marginTop: 2 }}>
              {isAdmin ? 'Fill all details — you can publish directly or save as draft.' : 'Submit your product request for admin review.'}
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--as-muted)', fontSize: 20, lineHeight: 1, padding: 4 }}>✕</button>
        </div>

        {/* Body: split */}
        <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>

          {/* Left: form */}
          <div style={{ flex: '0 0 58%', overflowY: 'auto', padding: '20px 24px', borderRight: '1px solid var(--as-border)' }}>

            {/* Section: Basic Info */}
            <SectionLabel>Basic Information</SectionLabel>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 14, marginBottom: 20 }}>

              <Field label="Product Name" required>
                <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Oversized Drop-Shoulder Tee" style={inputSt} />
              </Field>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <Field label="Category">
                  <select value={form.categoryId} onChange={e => {
                    const cat = categories.find(c => c._id === e.target.value);
                    setForm(f => ({ ...f, categoryId: e.target.value, categoryName: cat?.name || '' }));
                  }} style={inputSt}>
                    <option value="">— Select category —</option>
                    {categories.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
                  </select>
                </Field>
                <Field label="Gender">
                  <select value={form.gender} onChange={e => setForm(f => ({ ...f, gender: e.target.value }))} style={inputSt}>
                    {GENDER_OPTIONS.map(g => <option key={g} value={g}>{g}</option>)}
                  </select>
                </Field>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
                <Field label="Price (₹)" required>
                  <input type="number" value={form.priceINR} onChange={e => setForm(f => ({ ...f, priceINR: e.target.value }))} placeholder="e.g. 1299" style={inputSt} />
                </Field>
                <Field label="Compare Price (₹)">
                  <input type="number" value={form.originalPriceINR} onChange={e => setForm(f => ({ ...f, originalPriceINR: e.target.value }))} placeholder="e.g. 1999" style={inputSt} />
                </Field>
                <Field label="Badge">
                  <select value={form.badge} onChange={e => setForm(f => ({ ...f, badge: e.target.value }))} style={inputSt}>
                    {BADGE_OPTIONS.map(b => <option key={b.value} value={b.value}>{b.label}</option>)}
                  </select>
                </Field>
              </div>

            </div>

            {/* Section: Images */}
            <SectionLabel>Product Images</SectionLabel>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginBottom: 20 }}>
              {IMAGE_SLOTS.map(slot => (
                <SlotUploader
                  key={slot.key}
                  slotKey={slot.key}
                  label={slot.label}
                  required={slot.required}
                  value={form.images[slot.key]}
                  onChange={v => setImg(slot.key, v)}
                />
              ))}
            </div>

            {/* Section: Variants */}
            <SectionLabel>Variants</SectionLabel>
            <div style={{ marginBottom: 20, display: 'flex', flexDirection: 'column', gap: 14 }}>
              <Field label="Available Sizes">
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', paddingTop: 2 }}>
                  {SIZE_OPTIONS.map(s => (
                    <button key={s} onClick={() => toggleSize(s)} style={{
                      border: `1.5px solid ${form.sizes.includes(s) ? 'var(--as-accent)' : 'var(--as-input-border)'}`,
                      borderRadius: 6, padding: '5px 12px', fontSize: 12, fontWeight: 600, cursor: 'pointer',
                      background: form.sizes.includes(s) ? 'var(--as-accent-subtle)' : 'var(--as-input-bg)',
                      color: form.sizes.includes(s) ? 'var(--as-accent)' : 'var(--as-text)',
                      transition: 'all 0.13s',
                    }}>{s}</button>
                  ))}
                </div>
              </Field>
              <Field label="Colors (press Enter to add)">
                <ColorTagInput value={form.colors} onChange={v => setForm(f => ({ ...f, colors: v }))} />
              </Field>
            </div>

            {/* Section: Details */}
            <SectionLabel>Details</SectionLabel>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 20 }}>
              <Field label="Description">
                <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={3} placeholder="Product description…" style={{ ...inputSt, resize: 'vertical' }} />
              </Field>
              <Field label="Material & Care">
                <textarea value={form.material} onChange={e => setForm(f => ({ ...f, material: e.target.value }))} rows={2} placeholder="e.g. 100% Cotton, Machine wash cold" style={{ ...inputSt, resize: 'vertical' }} />
              </Field>
              <Field label="Internal Notes">
                <textarea value={form.internalNotes} onChange={e => setForm(f => ({ ...f, internalNotes: e.target.value }))} rows={2} placeholder="Notes visible to admin only…" style={{ ...inputSt, resize: 'vertical' }} />
              </Field>
            </div>

          </div>

          {/* Right: preview */}
          <div style={{ flex: '0 0 42%', overflowY: 'auto', padding: '24px 28px', background: 'var(--as-bg)' }}>
            <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--as-muted)', marginBottom: 16 }}>Live Preview</div>
            <ProductPreview form={form} categories={categories} />
          </div>
        </div>

        {/* Footer */}
        <div style={{ padding: '14px 24px', borderTop: '1px solid var(--as-border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0, background: 'var(--as-card)' }}>
          <div style={{ fontSize: 12, color: '#f87171' }}>{error}</div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={onClose} disabled={busy} style={{ ...btnSt, background: 'var(--as-hover)', color: 'var(--as-text)' }}>Cancel</button>
            {isAdmin ? (
              <>
                <button onClick={() => saveRequest(false)} disabled={busy || !form.name} style={{ ...btnSt, background: 'var(--as-hover)', color: 'var(--as-text)' }}>
                  {saving ? 'Saving…' : 'Save Draft'}
                </button>
                <button onClick={publishDirect} disabled={busy || !form.name || !form.priceINR} style={{ ...btnSt, background: 'var(--as-accent)', color: '#fff' }}>
                  {publishing ? 'Publishing…' : 'Publish Product'}
                </button>
              </>
            ) : (
              <>
                <button onClick={() => saveRequest(false)} disabled={busy || !form.name} style={{ ...btnSt, background: 'var(--as-hover)', color: 'var(--as-text)' }}>
                  {saving ? 'Saving…' : 'Save Draft'}
                </button>
                <button onClick={() => saveRequest(true)} disabled={busy || !form.name || !form.priceINR} style={{ ...btnSt, background: 'var(--as-accent)', color: '#fff' }}>
                  {saving ? 'Submitting…' : 'Submit for Review'}
                </button>
              </>
            )}
          </div>
        </div>

      </div>
      <style>{`@keyframes pr-spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

// ── Review Modal (approve / reject) ──────────────────────────────────────────

function ReviewModal({
  req, onClose, onDone,
}: { req: Request; onClose: () => void; onDone: () => void }) {
  const [action, setAction]         = useState<'approved' | 'rejected'>('approved');
  const [note, setNote]             = useState('');
  const [publishAsProduct, setPublish] = useState(true);
  const [saving, setSaving]         = useState(false);
  const [error, setError]           = useState('');

  async function submit() {
    if (action === 'rejected' && !note.trim()) { setError('Rejection note is required.'); return; }
    setSaving(true); setError('');
    try {
      const res = await fetch(`/api/admin/product-requests/${req._id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: action, reviewNote: note, publishAsProduct: action === 'approved' && publishAsProduct }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'Failed.'); return; }
      onDone();
    } catch { setError('Network error.'); }
    finally { setSaving(false); }
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', zIndex: 1100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <div style={{ background: 'var(--as-card)', borderRadius: 12, width: '100%', maxWidth: 480, padding: 28, boxShadow: 'var(--as-shadow-lg)', border: '1px solid var(--as-border)' }}>
        <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 4, color: 'var(--as-text)' }}>Review Request</div>
        <div style={{ fontSize: 12, color: 'var(--as-muted)', marginBottom: 20 }}>{req.title}</div>

        <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
          {(['approved', 'rejected'] as const).map(a => (
            <button key={a} onClick={() => setAction(a)} style={{
              flex: 1, padding: '9px 0', borderRadius: 7, border: `1.5px solid ${action === a ? (a === 'approved' ? '#16a34a' : '#dc2626') : 'var(--as-input-border)'}`,
              background: action === a ? (a === 'approved' ? 'var(--as-badge-green)' : 'var(--as-badge-red)') : 'var(--as-input-bg)',
              color: action === a ? (a === 'approved' ? 'var(--as-badge-green-text)' : 'var(--as-badge-red-text)') : 'var(--as-muted)',
              fontWeight: 600, fontSize: 13, cursor: 'pointer', textTransform: 'capitalize',
            }}>{a}</button>
          ))}
        </div>

        {action === 'approved' && (
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16, cursor: 'pointer' }}>
            <input type="checkbox" checked={publishAsProduct} onChange={e => setPublish(e.target.checked)} />
            <span style={{ fontSize: 13, color: 'var(--as-text)' }}>Publish immediately as live product on website</span>
          </label>
        )}

        <div style={{ marginBottom: 16 }}>
          <label style={labelSt}>{action === 'rejected' ? 'Rejection Reason *' : 'Review Note (optional)'}</label>
          <textarea value={note} onChange={e => setNote(e.target.value)} rows={3} style={{ ...inputSt, resize: 'vertical', display: 'block', marginTop: 6 }} placeholder={action === 'rejected' ? 'Explain why this was rejected…' : 'Add a note for the submitter…'} />
        </div>

        {error && <div style={{ fontSize: 12, color: '#f87171', marginBottom: 12 }}>{error}</div>}

        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <button onClick={onClose} style={{ ...btnSt, background: 'var(--as-hover)', color: 'var(--as-text)' }}>Cancel</button>
          <button onClick={submit} disabled={saving} style={{ ...btnSt, background: action === 'approved' ? '#16a34a' : '#dc2626', color: '#fff' }}>
            {saving ? 'Saving…' : action === 'approved' ? 'Approve' : 'Reject'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Detail Modal ──────────────────────────────────────────────────────────────

function DetailModal({ req, role, categories, onClose, onRefresh }: {
  req: Request; role: string; categories: Category[];
  onClose: () => void; onRefresh: () => void;
}) {
  const [showReview, setShowReview] = useState(false);
  const isAdmin = role === 'admin' || role === 'super_admin';
  let imgs: ImageMap = {};
  try { if (req.imageAssetsJson) imgs = JSON.parse(req.imageAssetsJson); } catch {}
  const sc = statusColor(req.status);
  const cat = categories.find(c => c._id === req.categoryId);

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <div style={{ background: 'var(--as-card)', borderRadius: 14, width: '100%', maxWidth: 720, maxHeight: '90vh', display: 'flex', flexDirection: 'column', boxShadow: 'var(--as-shadow-lg)', border: '1px solid var(--as-border)', overflow: 'hidden' }}>
        <div style={{ padding: '18px 24px', borderBottom: '1px solid var(--as-border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 15, fontWeight: 700, color: 'var(--as-text)' }}>{req.title}</span>
            <span style={{ fontSize: 11, fontWeight: 600, padding: '2px 9px', borderRadius: 99, background: sc.bg, color: sc.color }}>{req.status}</span>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--as-muted)', fontSize: 20, padding: 4 }}>✕</button>
        </div>

        <div style={{ overflowY: 'auto', padding: '20px 24px', flex: 1 }}>
          {/* Images */}
          {Object.keys(imgs).length > 0 && (
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--as-muted)', marginBottom: 10 }}>Images</div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {IMAGE_SLOTS.filter(s => imgs[s.key]).map(s => (
                  <div key={s.key} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={imgs[s.key]!.url} alt={s.label} style={{ width: 90, height: 90, objectFit: 'cover', borderRadius: 8, border: '1px solid var(--as-border)' }} />
                    <span style={{ fontSize: 9, color: 'var(--as-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{s.label}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <Detail label="Category" value={cat?.name || req.category || '—'} />
            <Detail label="Gender"   value={req.gender || '—'} />
            <Detail label="Price"    value={req.price ? `₹${req.price.toLocaleString('en-IN')}` : '—'} />
            <Detail label="Compare"  value={req.comparePrice ? `₹${req.comparePrice.toLocaleString('en-IN')}` : '—'} />
            <Detail label="Badge"    value={req.badge || '—'} />
            <Detail label="Sizes"    value={req.sizes?.join(', ') || '—'} />
            <Detail label="Colors"   value={req.colors?.join(', ') || '—'} />
            <Detail label="Submitted by" value={req.submittedByName || '—'} />
          </div>
          {req.description && <Detail label="Description" value={req.description} block />}
          {req.material    && <Detail label="Material & Care" value={req.material} block />}
          {req.internalNotes && <Detail label="Internal Notes" value={req.internalNotes} block />}
          {req.reviewNote  && <Detail label="Review Note" value={req.reviewNote} block />}
        </div>

        {isAdmin && req.status === 'pending' && (
          <div style={{ padding: '14px 24px', borderTop: '1px solid var(--as-border)', display: 'flex', justifyContent: 'flex-end', gap: 8, flexShrink: 0 }}>
            <button onClick={() => setShowReview(true)} style={{ ...btnSt, background: 'var(--as-accent)', color: '#fff' }}>Review Request</button>
          </div>
        )}
      </div>

      {showReview && (
        <ReviewModal req={req} onClose={() => setShowReview(false)} onDone={() => { setShowReview(false); onClose(); onRefresh(); }} />
      )}
    </div>
  );
}

// ── Small helper components ───────────────────────────────────────────────────

function SectionLabel({ children }: { children: React.ReactNode }) {
  return <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--as-muted)', marginBottom: 10, paddingBottom: 6, borderBottom: '1px solid var(--as-border-subtle)' }}>{children}</div>;
}
function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div>
      <label style={labelSt}>{label}{required && <span style={{ color: '#f87171', marginLeft: 2 }}>*</span>}</label>
      <div style={{ marginTop: 6 }}>{children}</div>
    </div>
  );
}
function Detail({ label, value, block }: { label: string; value: string; block?: boolean }) {
  return (
    <div style={block ? { gridColumn: '1/-1', marginTop: 8 } : {}}>
      <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--as-muted)', marginBottom: 3 }}>{label}</div>
      <div style={{ fontSize: 13, color: 'var(--as-text)', lineHeight: 1.5 }}>{value}</div>
    </div>
  );
}

const inputSt: React.CSSProperties = {
  width: '100%', padding: '9px 12px', background: 'var(--as-input-bg)', border: '1px solid var(--as-input-border)',
  borderRadius: 7, color: 'var(--as-text)', fontSize: 13, fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box',
};
const btnSt: React.CSSProperties = {
  padding: '9px 18px', borderRadius: 7, border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 600, fontFamily: 'inherit',
};
const labelSt: React.CSSProperties = {
  fontSize: 10, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--as-muted)', display: 'block',
};

// ── Main page content ─────────────────────────────────────────────────────────

const STATUS_TABS = ['all', 'pending', 'approved', 'rejected', 'draft'];

function ProductRequestsContent() {
  const { user } = useAdmin();
  const role    = user?.role || 'employee';
  const isAdmin = role === 'admin' || role === 'super_admin';

  const [requests, setRequests]     = useState<Request[]>([]);
  const [total, setTotal]           = useState(0);
  const [loading, setLoading]       = useState(true);
  const [tab, setTab]               = useState('all');
  const [page, setPage]             = useState(1);
  const [categories, setCategories] = useState<Category[]>([]);
  const [showForm, setShowForm]     = useState(false);
  const [editReq, setEditReq]       = useState<Request | null>(null);
  const [detailReq, setDetailReq]   = useState<Request | null>(null);

  const fetchRequests = useCallback(async () => {
    setLoading(true);
    try {
      const qs = new URLSearchParams({ page: String(page) });
      if (tab !== 'all') qs.set('status', tab);
      const res  = await fetch(`/api/admin/product-requests?${qs}`);
      const data = await res.json();
      setRequests(data.requests || []);
      setTotal(data.total || 0);
    } finally { setLoading(false); }
  }, [tab, page]);

  useEffect(() => { fetchRequests(); }, [fetchRequests]);

  useEffect(() => {
    fetch('/api/admin/categories').then(r => r.json()).then(d => setCategories(d.categories || []));
  }, []);

  function openNew() { setEditReq(null); setShowForm(true); }

  const stats = {
    total: requests.length,
    pending:  requests.filter(r => r.status === 'pending').length,
    approved: requests.filter(r => r.status === 'approved').length,
    rejected: requests.filter(r => r.status === 'rejected').length,
  };

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 700, color: 'var(--as-text)', margin: 0 }}>
            {isAdmin ? 'Products' : 'Product Requests'}
          </h1>
          <p style={{ fontSize: 13, color: 'var(--as-muted)', margin: '4px 0 0' }}>
            {isAdmin ? 'Add products directly or review employee requests.' : 'Submit product requests for admin review.'}
          </p>
        </div>
        <button onClick={openNew} style={{ ...btnSt, background: 'var(--as-accent)', color: '#fff', display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: 16, lineHeight: 1 }}>+</span>
          {isAdmin ? 'Add Product' : 'New Request'}
        </button>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 24 }}>
        {[
          { label: 'Total', value: total, color: 'var(--as-badge-blue-text)' },
          { label: 'Pending',  value: total > 0 ? undefined : 0, color: 'var(--as-badge-yellow-text)' },
          { label: 'Approved', value: undefined, color: 'var(--as-badge-green-text)' },
          { label: 'Rejected', value: undefined, color: 'var(--as-badge-red-text)'  },
        ].map((s, i) => (
          <div key={i} style={{ background: 'var(--as-card)', border: '1px solid var(--as-border)', borderRadius: 10, padding: '14px 18px' }}>
            <div style={{ fontSize: 22, fontWeight: 700, color: s.color }}>{[total, stats.pending, stats.approved, stats.rejected][i]}</div>
            <div style={{ fontSize: 11, color: 'var(--as-muted)', marginTop: 2 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 2, marginBottom: 16, background: 'var(--as-card)', border: '1px solid var(--as-border)', borderRadius: 8, padding: 4, width: 'fit-content' }}>
        {STATUS_TABS.map(t => (
          <button key={t} onClick={() => { setTab(t); setPage(1); }} style={{
            padding: '6px 14px', borderRadius: 6, border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 600,
            background: tab === t ? 'var(--as-accent)' : 'transparent',
            color: tab === t ? '#fff' : 'var(--as-muted)',
            textTransform: 'capitalize', transition: 'all 0.13s',
          }}>{t}</button>
        ))}
      </div>

      {/* Table */}
      <div style={{ background: 'var(--as-card)', border: '1px solid var(--as-border)', borderRadius: 10, overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: 48, textAlign: 'center', color: 'var(--as-muted)', fontSize: 13 }}>Loading…</div>
        ) : requests.length === 0 ? (
          <div style={{ padding: 56, textAlign: 'center' }}>
            <div style={{ fontSize: 32, marginBottom: 10 }}>📦</div>
            <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--as-text)' }}>No requests yet</div>
            <div style={{ fontSize: 12, color: 'var(--as-muted)', marginTop: 4 }}>
              {isAdmin ? 'Click "Add Product" to publish or start drafting.' : 'Submit your first product request.'}
            </div>
          </div>
        ) : (
          <table style={{ width: '100%', fontSize: 13, borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: 'var(--as-table-header)' }}>
                {['Product', 'Category', 'Price', 'Status', 'Submitted By', 'Date', ''].map((h, i) => (
                  <th key={i} style={{ padding: '11px 16px', textAlign: 'left', fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--as-muted)', borderBottom: '1px solid var(--as-border)', whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {requests.map(r => {
                const sc = statusColor(r.status);
                let imgs: ImageMap = {};
                try { if (r.imageAssetsJson) imgs = JSON.parse(r.imageAssetsJson); } catch {}
                const thumb = imgs['front']?.url;
                return (
                  <tr key={r._id} style={{ borderBottom: '1px solid var(--as-border-subtle)' }}>
                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        {thumb ? (
                          /* eslint-disable-next-line @next/next/no-img-element */
                          <img src={thumb} alt="" style={{ width: 40, height: 40, objectFit: 'cover', borderRadius: 6, border: '1px solid var(--as-border)', flexShrink: 0 }} />
                        ) : (
                          <div style={{ width: 40, height: 40, borderRadius: 6, background: 'var(--as-border-subtle)', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>📦</div>
                        )}
                        <span style={{ fontWeight: 600, color: 'var(--as-text)' }}>{r.title}</span>
                      </div>
                    </td>
                    <td style={{ padding: '12px 16px', color: 'var(--as-text-secondary)' }}>{r.category || '—'}</td>
                    <td style={{ padding: '12px 16px', color: 'var(--as-text)' }}>{r.price ? `₹${r.price.toLocaleString('en-IN')}` : '—'}</td>
                    <td style={{ padding: '12px 16px' }}>
                      <span style={{ fontSize: 11, fontWeight: 600, padding: '3px 9px', borderRadius: 99, background: sc.bg, color: sc.color, textTransform: 'capitalize' }}>{r.status}</span>
                    </td>
                    <td style={{ padding: '12px 16px', color: 'var(--as-muted)' }}>{r.submittedByName || '—'}</td>
                    <td style={{ padding: '12px 16px', color: 'var(--as-muted)', whiteSpace: 'nowrap' }}>
                      {r.createdAt ? new Date(r.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button onClick={() => setDetailReq(r)} style={{ ...btnSt, padding: '5px 12px', background: 'var(--as-hover)', color: 'var(--as-text)', fontSize: 11 }}>View</button>
                        {(r.status === 'draft' || isAdmin) && (
                          <button onClick={() => { setEditReq(r); setShowForm(true); }} style={{ ...btnSt, padding: '5px 12px', background: 'var(--as-hover)', color: 'var(--as-text)', fontSize: 11 }}>Edit</button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination */}
      {total > 20 && (
        <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 20 }}>
          <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} style={{ ...btnSt, background: 'var(--as-hover)', color: 'var(--as-text)', opacity: page === 1 ? 0.4 : 1 }}>← Prev</button>
          <span style={{ fontSize: 12, color: 'var(--as-muted)', padding: '9px 0' }}>Page {page}</span>
          <button onClick={() => setPage(p => p + 1)} disabled={requests.length < 20} style={{ ...btnSt, background: 'var(--as-hover)', color: 'var(--as-text)', opacity: requests.length < 20 ? 0.4 : 1 }}>Next →</button>
        </div>
      )}

      {/* Modals */}
      {showForm && (
        <ProductFormModal
          role={role}
          categories={categories}
          editRequest={editReq}
          onClose={() => { setShowForm(false); setEditReq(null); }}
          onSaved={() => { setShowForm(false); setEditReq(null); fetchRequests(); }}
        />
      )}
      {detailReq && (
        <DetailModal
          req={detailReq}
          role={role}
          categories={categories}
          onClose={() => setDetailReq(null)}
          onRefresh={fetchRequests}
        />
      )}
    </div>
  );
}

// ── Page export ───────────────────────────────────────────────────────────────

export default function ProductRequestsPage() {
  return (
    <AdminShell title="Products">
      <ProductRequestsContent />
    </AdminShell>
  );
}
