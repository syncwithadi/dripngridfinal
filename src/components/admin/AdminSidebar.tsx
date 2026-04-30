'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { sanityClient } from '@/sanity/client';
import { siteSettingsQuery } from '@/sanity/queries';

// ── Module-level logo cache ────────────────────────────────────────────────────
let _cachedLogoUrl: string | null = null;
let _logoFetched = false;

// ── Icon Component ─────────────────────────────────────────────────────────────
const Icon = ({ d, size = 14 }: { d: string; size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
    <path d={d} />
  </svg>
);

const ICONS: Record<string, string> = {
  dashboard:       'M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z M9 22V12h6v10',
  orders:          'M20 7H4a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2z M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16',
  inventory:       'M3 9h18M9 21V9 M3 3h18v4H3z M15 21V9',
  coupons:         'M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z M7 7h.01',
  requests:        'M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2 M9 5a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2 M12 12h.01 M12 16h.01',
  customers:       'M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2 M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z',
  logs:            'M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z M14 2v6h6 M16 13H8 M16 17H8 M10 9H8',
  users:           'M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2 M23 21v-2a4 4 0 0 0-3-3.87 M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z M16 3.13a4 4 0 0 1 0 7.75',
  settings:        'M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z',
  hidden:          'M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94 M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19 M1 1l22 22',
  archive:         'M21 8v13H3V8 M1 3h22v5H1z M10 12h4',
  productRequests: 'M12 20h9 M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z',
  tasks:           'M9 11l3 3L22 4 M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11',
  internal:        'M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z',
  resources:       'M4 19.5A2.5 2.5 0 0 1 6.5 17H20 M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z',
  communications:  'M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z',
};

interface NavItem {
  href: string;
  label: string;
  iconKey: string;
  roles?: string[];
}

interface NavGroupDef {
  label: string;
  items: NavItem[];
  defaultOpen?: boolean;
  roles?: string[];
}

const NAV_GROUPS: NavGroupDef[] = [
  {
    label: 'E-commerce',
    defaultOpen: true,
    items: [
      { href: '/admin',           label: 'Dashboard',       iconKey: 'dashboard' },
      { href: '/admin/orders',    label: 'Orders',          iconKey: 'orders' },
      { href: '/admin/products',  label: 'Live Products',   iconKey: 'dashboard' },
      { href: '/admin/inventory', label: 'Inventory',       iconKey: 'inventory' },
      { href: '/admin/coupons',   label: 'Coupons',         iconKey: 'coupons' },
      { href: '/admin/requests',  label: 'Coupon Requests', iconKey: 'requests' },
      { href: '/admin/customers', label: 'Customers',       iconKey: 'customers' },
      { href: '/admin/logs',      label: 'Audit Logs',      iconKey: 'logs' },
    ],
  },
  {
    label: 'Workspace',
    defaultOpen: true,
    items: [
      { href: '/admin/product-requests', label: 'Product Requests', iconKey: 'productRequests' },
      { href: '/admin/tasks',            label: 'Tasks',            iconKey: 'tasks' },
      { href: '/admin/internal',         label: 'Internal Reports', iconKey: 'internal' },
      { href: '/admin/resources',        label: 'Resource Hub',     iconKey: 'resources' },
    ],
  },
  {
    label: 'Communication',
    defaultOpen: true,
    items: [
      { href: '/admin/communications', label: 'Communications', iconKey: 'communications' },
    ],
  },
  {
    label: 'Admin',
    defaultOpen: false,
    roles: ['super_admin', 'admin'],
    items: [
      { href: '/admin/users',    label: 'Staff',       iconKey: 'users',    roles: ['super_admin', 'admin'] },
      { href: '/admin/settings', label: 'Settings',    iconKey: 'settings', roles: ['super_admin'] },
      { href: '/admin/hidden',   label: 'Hidden Data', iconKey: 'hidden',   roles: ['super_admin'] },
      { href: '/admin/archive',  label: 'Archive',     iconKey: 'archive',  roles: ['super_admin'] },
    ],
  },
];

interface Props {
  role: string;
  employeeName: string;
  employeeId: string;
  profileImage?: string;
  isOpen?: boolean;
  onClose?: () => void;
}

function NavGroupSection({ group, role, pathname }: { group: NavGroupDef; role: string; pathname: string }) {
  const visibleItems = group.items.filter(item => !item.roles || item.roles.includes(role));
  const hasActive = visibleItems.some(item =>
    pathname === item.href || (item.href !== '/admin' && pathname.startsWith(item.href))
  );
  const [open, setOpen] = useState(group.defaultOpen || hasActive);

  if (visibleItems.length === 0) return null;

  return (
    <div style={{ marginBottom: 2 }}>
      <button
        onClick={() => setOpen(v => !v)}
        style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          width: '100%', padding: '6px 20px 4px',
          background: 'none', border: 'none', cursor: 'pointer',
          color: 'var(--as-muted)', transition: 'color 0.12s',
        }}
        onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = 'var(--as-text)'}
        onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = 'var(--as-muted)'}
      >
        <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
          {group.label}
        </span>
        <span style={{ transform: open ? 'rotate(90deg)' : 'rotate(0deg)', transition: 'transform 0.18s ease', display: 'flex' }}>
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 18l6-6-6-6" />
          </svg>
        </span>
      </button>
      <div style={{ overflow: 'hidden', maxHeight: open ? `${visibleItems.length * 38}px` : '0', transition: 'max-height 0.22s cubic-bezier(0.4,0,0.2,1)' }}>
        {visibleItems.map(item => {
          const isActive = pathname === item.href || (item.href !== '/admin' && pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              className="as-nav-item"
              style={{
                display: 'flex', alignItems: 'center', gap: 9,
                padding: '7px 14px 7px 20px', fontSize: 13,
                fontWeight: isActive ? 600 : 400,
                color: isActive ? 'var(--as-accent)' : 'var(--as-muted)',
                background: isActive ? 'var(--as-active-bg)' : 'transparent',
                borderLeft: isActive ? '2px solid var(--as-accent)' : '2px solid transparent',
                textDecoration: 'none', transition: 'all 0.1s ease',
                letterSpacing: '0.01em', lineHeight: 1,
              }}
              onMouseEnter={e => {
                if (!isActive) {
                  (e.currentTarget as HTMLElement).style.background = 'var(--as-hover)';
                  (e.currentTarget as HTMLElement).style.color = 'var(--as-text)';
                }
              }}
              onMouseLeave={e => {
                if (!isActive) {
                  (e.currentTarget as HTMLElement).style.background = 'transparent';
                  (e.currentTarget as HTMLElement).style.color = 'var(--as-muted)';
                }
              }}
            >
              <span style={{ opacity: isActive ? 1 : 0.6 }}>
                <Icon d={ICONS[item.iconKey]} size={14} />
              </span>
              {item.label}
            </Link>
          );
        })}
      </div>
    </div>
  );
}

export default function AdminSidebar({ role, employeeName, employeeId, profileImage, isOpen = false, onClose }: Props) {
  const pathname = usePathname();
  const [brandLogo, setBrandLogo] = useState<string | null>(_cachedLogoUrl);
  const [loadingLogo, setLoadingLogo] = useState(!_logoFetched);

  useEffect(() => {
    if (_logoFetched) return;
    sanityClient.fetch(siteSettingsQuery).then(data => {
      _cachedLogoUrl = data?.brandLogo || null;
      _logoFetched = true;
      setBrandLogo(_cachedLogoUrl);
    }).catch(console.error).finally(() => setLoadingLogo(false));
  }, []);

  // Close mobile drawer on route change
  useEffect(() => { onClose?.(); }, [pathname]); // eslint-disable-line react-hooks/exhaustive-deps

  const initials = employeeName
    ? employeeName.split(' ').map((n: string) => n[0]).slice(0, 2).join('').toUpperCase()
    : '?';

  const visibleGroups = NAV_GROUPS.filter(g => !g.roles || g.roles.includes(role));

  return (
    <>
      {/* Mobile overlay */}
      <div
        className="as-sidebar-overlay"
        onClick={onClose}
        style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.48)',
          zIndex: 199, opacity: isOpen ? 1 : 0,
          pointerEvents: isOpen ? 'auto' : 'none',
          transition: 'opacity 0.25s ease',
        }}
      />

      <aside
        className={`as-sidebar${isOpen ? ' as-sidebar-open' : ''}`}
        style={{
          width: 232, minHeight: '100vh',
          background: 'var(--as-sidebar)', borderRight: '1px solid var(--as-border)',
          display: 'flex', flexDirection: 'column',
          position: 'fixed', top: 0, left: 0, bottom: 0, zIndex: 200,
        }}
      >
        {/* Brand */}
        <div style={{ height: 55, padding: '0 20px', borderBottom: '1px solid var(--as-border)', display: 'flex', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {loadingLogo ? (
              <div style={{ width: 28, height: 28, flexShrink: 0 }} />
            ) : brandLogo ? (
              <img src={brandLogo} alt="Logo" style={{ width: 28, height: 28, objectFit: 'contain', flexShrink: 0, transform: 'scale(2.2)' }} />
            ) : (
              <div style={{ width: 28, height: 28, borderRadius: 7, background: 'var(--as-accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="white" stroke="none">
                  <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
                </svg>
              </div>
            )}
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, letterSpacing: '0.06em', color: 'var(--as-text)', textTransform: 'uppercase', lineHeight: 1 }}>DRIPNGRID</div>
              <div style={{ fontSize: 10, color: 'var(--as-muted)', marginTop: 3, letterSpacing: '0.05em', textTransform: 'uppercase' }}>Admin Console</div>
            </div>
          </div>
        </div>

        {/* Search / Ctrl+K hint */}
        <button
          onClick={() => document.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', ctrlKey: true, bubbles: true }))}
          style={{
            margin: '10px 12px 4px', padding: '7px 10px',
            background: 'var(--as-hover)', border: '1px solid var(--as-border)',
            borderRadius: 6, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6,
            color: 'var(--as-muted)', fontSize: 11, transition: 'all 0.12s',
          }}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--as-accent)'; (e.currentTarget as HTMLElement).style.color = 'var(--as-text)'; }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--as-border)'; (e.currentTarget as HTMLElement).style.color = 'var(--as-muted)'; }}
        >
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/>
          </svg>
          <span style={{ flex: 1 }}>Search…</span>
          <kbd style={{ fontSize: 9, padding: '1px 4px', border: '1px solid var(--as-border)', borderRadius: 3, background: 'var(--as-bg)', fontFamily: 'inherit' }}>⌘K</kbd>
        </button>

        {/* Grouped navigation */}
        <nav style={{ flex: 1, padding: '6px 0 10px', overflowY: 'auto' }}>
          {visibleGroups.map((group, i) => (
            <div key={group.label} style={{ marginTop: i > 0 ? 4 : 0 }}>
              {i > 0 && <div style={{ height: 1, background: 'var(--as-border)', margin: '8px 16px 10px' }} />}
              <NavGroupSection group={group} role={role} pathname={pathname} />
            </div>
          ))}
        </nav>

        {/* User profile footer */}
        <Link
          href="/admin/settings"
          style={{ padding: '10px 14px', borderTop: '1px solid var(--as-border)', textDecoration: 'none', display: 'block', transition: 'background 0.12s' }}
          onMouseEnter={e => (e.currentTarget.style.background = 'var(--as-hover)')}
          onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {profileImage ? (
              <img src={profileImage} alt="Profile" style={{ width: 30, height: 30, borderRadius: 8, objectFit: 'cover', flexShrink: 0, border: '1px solid var(--as-border)' }} />
            ) : (
              <div style={{ width: 30, height: 30, borderRadius: 8, background: 'var(--as-accent)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, flexShrink: 0 }}>
                {initials}
              </div>
            )}
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--as-text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{employeeName}</div>
              <div style={{ fontSize: 10, color: 'var(--as-muted)', marginTop: 2, textTransform: 'capitalize' }}>{role.replace('_', ' ')} · {employeeId}</div>
            </div>
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" style={{ marginLeft: 'auto', opacity: 0.25, flexShrink: 0 }}>
              <path d="M9 18l6-6-6-6" />
            </svg>
          </div>
        </Link>
      </aside>
    </>
  );
}
