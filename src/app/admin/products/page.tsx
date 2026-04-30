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
  images: ImageMap;
  isHidden: boolean;
}

// ── Components from Request Page ─────────────────────────────────────────────

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

function ProductPreview({ form, categories }: { form: FormState; categories: Category[] }) {
  const cat      = categories.find(c => c._id === form.categoryId);
  const price    = parseFloat(form.priceINR) || 0;
  const orig     = parseFloat(form.originalPriceINR) || 0;
  const discount = orig > price && price > 0 ? Math.round(((orig - price) / orig) * 100) : 0;

  const carouselSlots = IMAGE_SLOTS.filter(s => s.key !== 'sizeGuide' && form.images[s.key]);
  const [activeIdx, setActiveIdx] = useState(0);

  useEffect(() => { setActiveIdx(0); }, [carouselSlots.map(s => s.key).join(',')]);

  const safeIdx    = carouselSlots.length > 0 ? Math.min(activeIdx, carouselSlots.length - 1) : 0;
  const activeSlot = carouselSlots[safeIdx];
  const activeImg  = activeSlot ? form.images[activeSlot.key]?.url : undefined;

  function prev(e: React.MouseEvent) { e.stopPropagation(); setActiveIdx(i => (i - 1 + carouselSlots.length) % carouselSlots.length); }
  function next(e: React.MouseEvent) { e.stopPropagation(); setActiveIdx(i => (i + 1) % carouselSlots.length); }

  return (
    <div style={{ width: '100%', maxWidth: 280, margin: '0 auto' }}>
      <div style={{ background: '#f4f3f0', borderRadius: 16, overflow: 'hidden', aspectRatio: '4/5', position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {activeImg ? (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img src={activeImg} alt="preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, color: '#bbb' }}>
            <span style={{ fontSize: 11 }}>Upload images to preview</span>
          </div>
        )}
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
        {form.badge && (
          <div style={{
            position: 'absolute', top: 10, left: 10,
            background: form.badge === 'sale' ? '#ef4444' : form.badge === 'new' ? '#000' : '#6b7280',
            color: '#fff', fontSize: 9, fontWeight: 700, letterSpacing: '0.1em',
            textTransform: 'uppercase', padding: '3px 8px', borderRadius: 4,
          }}>{form.badge}</div>
        )}
      </div>

      <div style={{ padding: '16px 4px' }}>
        <div style={{ fontSize: 10, fontWeight: 700, color: '#666', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>
          {cat?.name || 'Category'}
        </div>
        <div style={{ fontSize: 15, fontWeight: 600, color: '#111', lineHeight: 1.3, marginBottom: 8 }}>
          {form.name || 'Product Name'}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
          <span style={{ fontSize: 16, fontWeight: 700, color: '#111' }}>₹{price.toLocaleString('en-IN')}</span>
          {orig > price && (
            <>
              <span style={{ fontSize: 13, color: '#999', textDecoration: 'line-through' }}>₹{orig.toLocaleString('en-IN')}</span>
              <span style={{ fontSize: 11, fontWeight: 700, color: '#ef4444' }}>({discount}% OFF)</span>
            </>
          )}
        </div>
        {form.sizes.length > 0 && (
          <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginBottom: 6 }}>
            {form.sizes.map(s => <span key={s} style={{ border: '1px solid #ddd', borderRadius: 4, fontSize: 10, padding: '2px 6px', color: '#555' }}>{s}</span>)}
          </div>
        )}
        {form.colors.length > 0 && (
          <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
            {form.colors.map(c => <span key={c} style={{ fontSize: 10, color: '#888', border: '1px solid #eee', borderRadius: 3, padding: '1px 5px' }}>{c}</span>)}
          </div>
        )}
      </div>
    </div>
  );
}

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


// ── Edit Live Product Modal ───────────────────────────────────────────────────

function EditProductModal({
  product, categories, onClose, onSaved
}: {
  product: any; categories: Category[]; onClose: () => void; onSaved: () => void;
}) {
  const [form, setForm] = useState<FormState>(() => {
    // extract images properly from product.images obj
    const imgs: ImageMap = {};
    const slots = ['front', 'back', 'left', 'right', 'detail'];
    slots.forEach(s => {
      if (product.images?.[s]?.asset) {
        // We only have the url from the query, let's just make it editable if we had full asset ID, but the GET query might not return asset ID.
        // Wait, the API returns images directly!
      }
    });
    // the API now returns `images` object with .asset->_ref or similar if we fetched it correctly. 
    // Wait, the GET API returns `images`. In Sanity `images.front.asset._ref` is not returned unless explicitly requested.
    // Let's assume `product.images` has `.front.asset._ref`.
    return {
      name: product.name || '',
      categoryId: product.categoryId || '',
      categoryName: product.category || '',
      gender: product.gender || 'Unisex',
      priceINR: product.priceINR?.toString() || '',
      originalPriceINR: product.originalPriceINR?.toString() || '',
      badge: product.badge || '',
      sizes: product.sizes || [],
      colors: product.colors || [],
      description: product.description || '',
      material: product.material || '',
      images: product.parsedImages || {},
      isHidden: product.isHidden || false,
    };
  });

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

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

  async function save() {
    if (!form.name) { setError('Product name is required.'); return; }
    if (!form.priceINR) { setError('Price is required.'); return; }
    setError(''); setSaving(true);
    try {
      const body = {
        productId: product._id,
        name: form.name, categoryId: form.categoryId, gender: form.gender,
        priceINR: Number(form.priceINR),
        originalPriceINR: form.originalPriceINR ? Number(form.originalPriceINR) : undefined,
        badge: form.badge || 'none',
        sizes: form.sizes, colors: form.colors,
        description: form.description, material: form.material,
        images: form.images, // Note: the backend will parse this if it has .assetId
        isHidden: form.isHidden,
      };

      const res = await fetch('/api/admin/products', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'Failed to save.'); return; }
      onSaved();
    } catch { setError('Network error.'); }
    finally { setSaving(false); }
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <div style={{ background: 'var(--as-card)', borderRadius: 14, width: '100%', maxWidth: 1020, maxHeight: '93vh', display: 'flex', flexDirection: 'column', boxShadow: 'var(--as-shadow-lg)', border: '1px solid var(--as-border)', overflow: 'hidden' }}>

        <div style={{ padding: '18px 24px', borderBottom: '1px solid var(--as-border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
          <div>
            <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--as-text)' }}>Edit Live Product</div>
            <div style={{ fontSize: 12, color: 'var(--as-muted)', marginTop: 2 }}>Modify all product details. Changes will be instantly applied to the website.</div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--as-muted)', fontSize: 20, lineHeight: 1, padding: 4 }}>✕</button>
        </div>

        <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>

          <div style={{ flex: '0 0 58%', overflowY: 'auto', padding: '20px 24px', borderRight: '1px solid var(--as-border)' }}>
            
            <SectionLabel>Visibility</SectionLabel>
            <div style={{ marginBottom: 20 }}>
               <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, cursor: 'pointer', color: 'var(--as-text)', background: 'var(--as-input-bg)', padding: '12px', border: '1px solid var(--as-border)', borderRadius: 8 }}>
                 <input type="checkbox" checked={form.isHidden} onChange={e => setForm(f => ({ ...f, isHidden: e.target.checked }))} style={{ width: 16, height: 16 }} />
                 Hide this product from the website
               </label>
            </div>

            <SectionLabel>Basic Information</SectionLabel>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 14, marginBottom: 20 }}>

              <Field label="Product Name" required>
                <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} style={inputSt} />
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
                  <input type="number" value={form.priceINR} onChange={e => setForm(f => ({ ...f, priceINR: e.target.value }))} style={inputSt} />
                </Field>
                <Field label="Compare Price (₹)">
                  <input type="number" value={form.originalPriceINR} onChange={e => setForm(f => ({ ...f, originalPriceINR: e.target.value }))} style={inputSt} />
                </Field>
                <Field label="Badge">
                  <select value={form.badge} onChange={e => setForm(f => ({ ...f, badge: e.target.value }))} style={inputSt}>
                    {BADGE_OPTIONS.map(b => <option key={b.value} value={b.value}>{b.label}</option>)}
                  </select>
                </Field>
              </div>
            </div>

            <SectionLabel>Product Images</SectionLabel>
            <div style={{ fontSize: 11, color: 'var(--as-muted)', marginBottom: 10 }}>If you want to keep the existing image, leave it as is. Replacing it will overwrite the image.</div>
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

            <SectionLabel>Details</SectionLabel>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 20 }}>
              <Field label="Description">
                <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={3} style={{ ...inputSt, resize: 'vertical' }} />
              </Field>
              <Field label="Material & Care">
                <textarea value={form.material} onChange={e => setForm(f => ({ ...f, material: e.target.value }))} rows={2} style={{ ...inputSt, resize: 'vertical' }} />
              </Field>
            </div>

          </div>

          <div style={{ flex: '0 0 42%', overflowY: 'auto', padding: '24px 28px', background: 'var(--as-bg)' }}>
            <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--as-muted)', marginBottom: 16 }}>Live Preview</div>
            <ProductPreview form={form} categories={categories} />
          </div>
        </div>

        <div style={{ padding: '14px 24px', borderTop: '1px solid var(--as-border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0, background: 'var(--as-card)' }}>
          <div style={{ fontSize: 12, color: '#f87171' }}>{error}</div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={onClose} disabled={saving} style={{ ...btnSt, background: 'var(--as-hover)', color: 'var(--as-text)' }}>Cancel</button>
            <button onClick={save} disabled={saving || !form.name || !form.priceINR} style={{ ...btnSt, background: 'var(--as-accent)', color: '#fff' }}>
              {saving ? 'Saving…' : 'Save Changes'}
            </button>
          </div>
        </div>

      </div>
      <style>{`@keyframes pr-spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}


// ── Page Content ─────────────────────────────────────────────────────────────

function ProductsContent() {
  const { user } = useAdmin();
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [showHidden, setShowHidden] = useState(false);
  
  const [editProduct, setEditProduct] = useState<any | null>(null);

  const isEmployee = user?.role === 'employee';

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (search) params.set('search', search);
    try {
      const res = await fetch(`/api/admin/products?${params}`);
      const data = await res.json();
      // Parse images properly for edit modal
      const parsedProducts = (data.products || []).map((p: any) => {
        const parsedImages: ImageMap = {};
        if (p.images) {
           Object.keys(p.images).forEach(k => {
             if (p.images[k]?.url) {
               parsedImages[k] = { url: p.images[k].url, assetId: p.images[k]._ref };
             }
           });
        }
        if (p.sizeGuide?.url) {
          parsedImages['sizeGuide'] = { url: p.sizeGuide.url, assetId: p.sizeGuide._ref };
        }
        return { ...p, parsedImages };
      });
      setProducts(parsedProducts);
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => { fetchProducts(); }, [fetchProducts]);
  useEffect(() => { fetch('/api/admin/categories').then(r => r.json()).then(d => setCategories(d.categories || [])); }, []);

  const uniqueCategories = Array.from(new Set(products.map(p => p.category).filter(Boolean)));
  
  const filteredProducts = products.filter(p => {
    if (!!p.isHidden !== showHidden) return false;
    if (selectedCategory && p.category !== selectedCategory) return false;
    return true;
  });

  return (
    <>
      <div style={{ display: 'flex', gap: 14, marginBottom: 24, alignItems: 'center', flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', width: 280 }}>
          <svg style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--as-muted)' }} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8"></circle>
            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
          </svg>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search products..."
            style={{ 
              width: '100%', padding: '9px 14px 9px 34px', fontSize: 13, fontWeight: 500, 
              border: '1px solid var(--as-border)', borderRadius: 8, background: 'var(--as-card)', 
              color: 'var(--as-text)', outline: 'none', boxShadow: '0 1px 3px rgba(0,0,0,0.04)', transition: 'all 0.2s' 
            }}
            onMouseEnter={e => e.currentTarget.style.borderColor = '#ccc'}
            onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--as-border)'}
          />
        </div>

        <div style={{ position: 'relative', width: 200 }}>
          <select 
            value={selectedCategory} 
            onChange={e => setSelectedCategory(e.target.value)}
            style={{ 
              width: '100%', appearance: 'none', padding: '9px 36px 9px 14px', 
              fontSize: 13, fontWeight: 500, color: 'var(--as-text)', 
              background: 'var(--as-card)', border: '1px solid var(--as-border)', 
              borderRadius: 8, cursor: 'pointer', outline: 'none',
              boxShadow: '0 1px 3px rgba(0,0,0,0.04)', transition: 'all 0.2s'
            }}
            onMouseEnter={e => e.currentTarget.style.borderColor = '#ccc'}
            onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--as-border)'}
          >
            <option value="">All Categories</option>
            {uniqueCategories.map(c => (
              <option key={c as string} value={c as string}>{c as string}</option>
            ))}
          </select>
          <svg style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: 'var(--as-muted)' }} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="6 9 12 15 18 9"></polyline>
          </svg>
        </div>

        <button
          onClick={() => setShowHidden(!showHidden)}
          style={{
            padding: '9px 16px', fontSize: 13, fontWeight: 600, 
            background: showHidden ? 'var(--as-text)' : 'var(--as-card)', 
            color: showHidden ? 'var(--as-bg)' : 'var(--as-text)',
            border: '1px solid var(--as-border)', borderRadius: 8, cursor: 'pointer',
            boxShadow: '0 1px 3px rgba(0,0,0,0.04)', transition: 'all 0.2s',
            display: 'flex', alignItems: 'center', gap: 8
          }}
        >
          {showHidden ? (
            <>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>
              Showing Hidden
            </>
          ) : (
            <>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
              Show Hidden
            </>
          )}
        </button>
        
        <div style={{ marginLeft: 'auto', fontSize: 13, color: 'var(--as-muted)' }}>
          <span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: '50%', background: 'var(--as-badge-green)', marginRight: 6 }}></span>
          {filteredProducts.length} live products
        </div>
      </div>

      <div style={{ background: 'var(--as-card)', border: '1px solid var(--as-border)', borderRadius: 10, overflow: 'hidden', boxShadow: 'var(--as-shadow)' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr>
              {['Product', 'Status', 'Price', 'Tag/Badge', ...(isEmployee ? [] : ['Actions'])].map(h => (
                <th key={h} style={{ textAlign: 'left', padding: '10px 14px', fontSize: 11, fontWeight: 600, color: 'var(--as-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', background: 'var(--as-table-header)', borderBottom: '1px solid var(--as-border)' }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={5} style={{ textAlign: 'center', padding: 40, color: 'var(--as-muted)' }}>Loading...</td></tr>
            ) : filteredProducts.length === 0 ? (
              <tr><td colSpan={5} style={{ textAlign: 'center', padding: 40, color: 'var(--as-muted)' }}>No products found.</td></tr>
            ) : filteredProducts.map(p => (
              <tr key={p._id} style={{ borderBottom: '1px solid var(--as-border)' }}>
                <td style={{ padding: '12px 14px', fontWeight: 500, color: 'var(--as-text)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ width: 40, height: 40, borderRadius: 6, background: 'var(--as-input-bg)', overflow: 'hidden', border: '1px solid var(--as-border)' }}>
                      {p.imageUrl ? <img src={p.imageUrl} alt={p.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <div style={{width:'100%', height:'100%', display:'flex', alignItems:'center', justifyContent:'center', color:'var(--as-muted)', fontSize: 10}}>No Img</div>}
                    </div>
                    <div>
                      <div>{p.name}</div>
                      <div style={{ fontSize: 11, color: 'var(--as-muted)', marginTop: 2 }}>{p.category || 'Uncategorized'}</div>
                    </div>
                  </div>
                </td>
                <td style={{ padding: '12px 14px' }}>
                  <span style={{ padding: '3px 8px', borderRadius: 20, fontSize: 10, fontWeight: 600, background: p.isHidden ? 'var(--as-badge-red)' : 'var(--as-badge-green)', color: p.isHidden ? 'var(--as-badge-red-text)' : 'var(--as-badge-green-text)' }}>
                    {p.isHidden ? 'Hidden' : 'Live'}
                  </span>
                </td>
                <td style={{ padding: '12px 14px' }}>
                  <span style={{ fontWeight: 600, color: 'var(--as-text)' }}>₹{p.priceINR}</span>
                </td>
                <td style={{ padding: '12px 14px' }}>
                  {p.badge ? (
                    <span style={{ padding: '3px 8px', background: 'var(--as-hover)', borderRadius: 4, fontSize: 11, fontWeight: 600, color: 'var(--as-text)' }}>
                      {p.badge}
                    </span>
                  ) : <span style={{ color: 'var(--as-muted)', fontSize: 12 }}>—</span>}
                </td>
                {!isEmployee && (
                  <td style={{ padding: '12px 14px' }}>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button
                        onClick={() => setEditProduct(p)}
                        className="as-btn-premium"
                        style={{ padding: '7px 14px', fontSize: 12, fontWeight: 600, cursor: 'pointer', background: 'var(--as-text)', color: 'var(--as-bg)', border: 'none', borderRadius: 8, boxShadow: '0 2px 5px rgba(0,0,0,0.1)', transition: 'all 0.2s' }}
                        onMouseEnter={e => (e.currentTarget.style.opacity = '0.85')}
                        onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
                      >
                        Edit Details
                      </button>
                      {p.isHidden ? (
                        <button
                          onClick={async () => {
                            try {
                              const res = await fetch('/api/admin/products/preview-link', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ productId: p._id, productName: p.name })
                              });
                              const data = await res.json();
                              if (res.ok) {
                                window.open(`/preview/${data.token}`, '_blank');
                              } else {
                                alert(data.error || 'Failed to generate link');
                              }
                            } catch (e) {
                              alert('Network error');
                            }
                          }}
                          style={{ padding: '7px 14px', fontSize: 12, fontWeight: 600, cursor: 'pointer', background: 'var(--as-bg)', color: 'var(--as-text)', border: '1px solid var(--as-border)', borderRadius: 8, display: 'flex', alignItems: 'center', gap: 6, transition: 'all 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.03)' }}
                          onMouseEnter={e => { e.currentTarget.style.background = 'var(--as-hover)'; }}
                          onMouseLeave={e => { e.currentTarget.style.background = 'var(--as-bg)'; }}
                        >
                          View Secure Preview
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
                        </button>
                      ) : (
                        <a 
                          href={`/product/${p.slug?.current}`} 
                          target="_blank" 
                          rel="noreferrer"
                          style={{ padding: '7px 14px', fontSize: 12, fontWeight: 600, cursor: 'pointer', background: 'var(--as-bg)', color: 'var(--as-text)', border: '1px solid var(--as-border)', borderRadius: 8, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 6, transition: 'all 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.03)' }}
                          onMouseEnter={e => { e.currentTarget.style.background = 'var(--as-hover)'; }}
                          onMouseLeave={e => { e.currentTarget.style.background = 'var(--as-bg)'; }}
                        >
                          View Live
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
                            <polyline points="15 3 21 3 21 9"></polyline>
                            <line x1="10" y1="14" x2="21" y2="3"></line>
                          </svg>
                        </a>
                      )}
                    </div>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {editProduct && (
        <EditProductModal 
          product={editProduct} 
          categories={categories} 
          onClose={() => setEditProduct(null)} 
          onSaved={() => { setEditProduct(null); fetchProducts(); }} 
        />
      )}
    </>
  );
}

export default function ProductsPage() {
  return (
    <AdminShell>
      <ProductsContent />
    </AdminShell>
  );
}
