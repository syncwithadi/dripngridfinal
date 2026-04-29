'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { sanityClient } from '@/sanity/client';
import { siteSettingsQuery } from '@/sanity/queries';

// ── SVG Icon System (Lucide-style, consistent 16×16 stroke) ───────────────────
const Icon = ({ d, size = 16 }: { d: string; size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
    <path d={d} />
  </svg>
);

const ICONS: Record<string, string> = {
  dashboard:  'M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z M9 22V12h6v10',
  orders:     'M20 7H4a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2z M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16',
  inventory:  'M3 9h18M9 21V9 M3 3h18v4H3z M15 21V9',
  coupons:    'M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z M7 7h.01',
  requests:   'M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2 M9 5a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2 M9 5a2 2 0 0 0 2-2h2a2 2 0 0 0 2 2 M12 12h.01 M12 16h.01',
  customers:  'M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2 M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z',
  logs:       'M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z M14 2v6h6 M16 13H8 M16 17H8 M10 9H8',
  users:      'M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2 M23 21v-2a4 4 0 0 0-3-3.87 M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z M16 3.13a4 4 0 0 1 0 7.75',
  settings:   'M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z',
  hidden:     'M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94 M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19 M1 1l22 22',
  archive:    'M21 8v13H3V8 M1 3h22v5H1z M10 12h4',
};

interface NavItem {
  href: string;
  label: string;
  iconKey: string;
  roles?: string[];
  dividerBefore?: boolean;
}

const NAV_ITEMS: NavItem[] = [
  { href: '/admin',            label: 'Dashboard',  iconKey: 'dashboard' },
  { href: '/admin/orders',     label: 'Orders',     iconKey: 'orders' },
  { href: '/admin/inventory',  label: 'Inventory',  iconKey: 'inventory' },
  { href: '/admin/coupons',    label: 'Coupons',    iconKey: 'coupons' },
  { href: '/admin/requests',   label: 'Requests',   iconKey: 'requests' },
  { href: '/admin/customers',  label: 'Customers',  iconKey: 'customers' },
  { href: '/admin/logs',       label: 'Audit Logs', iconKey: 'logs' },
  { href: '/admin/users',      label: 'Staff',      iconKey: 'users',    roles: ['super_admin', 'admin'], dividerBefore: true },
  { href: '/admin/settings',   label: 'Settings',   iconKey: 'settings', roles: ['super_admin'] },
  { href: '/admin/hidden',     label: 'Hidden Data', iconKey: 'hidden',  roles: ['super_admin'] },
  { href: '/admin/archive',    label: 'Archive',    iconKey: 'archive',  roles: ['super_admin'] },
];

interface Props {
  role: string;
  employeeName: string;
  employeeId: string;
  profileImage?: string;
}

export default function AdminSidebar({ role, employeeName, employeeId, profileImage }: Props) {
  const pathname = usePathname();
  const [brandLogo, setBrandLogo] = useState<string | null>(null);
  const [loadingLogo, setLoadingLogo] = useState(true);

  useEffect(() => {
    sanityClient.fetch(siteSettingsQuery).then(data => {
      if (data?.brandLogo) setBrandLogo(data.brandLogo);
    }).catch(console.error).finally(() => setLoadingLogo(false));
  }, []);

  const visibleItems = NAV_ITEMS.filter(item =>
    !item.roles || item.roles.includes(role)
  );

  const initials = employeeName
    ? employeeName.split(' ').map((n: string) => n[0]).slice(0, 2).join('').toUpperCase()
    : '?';

  return (
    <aside
      style={{
        width: 232,
        minHeight: '100vh',
        background: 'var(--as-sidebar)',
        borderRight: '1px solid var(--as-border)',
        display: 'flex',
        flexDirection: 'column',
        position: 'fixed',
        top: 0,
        left: 0,
        bottom: 0,
        zIndex: 100,
      }}
    >
      {/* Brand */}
      <div style={{ height: 55, padding: '0 20px', borderBottom: '1px solid var(--as-border)', display: 'flex', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {/* Brand mark */}
          {loadingLogo ? (
            <div style={{ width: 28, height: 28, flexShrink: 0 }} />
          ) : brandLogo ? (
            <img 
              src={brandLogo} 
              alt="Brand Logo" 
              style={{ width: 28, height: 28, objectFit: 'contain', flexShrink: 0, transform: 'scale(2.2)' }} 
            />
          ) : (
            <div style={{
              width: 28, height: 28, borderRadius: 7,
              background: 'var(--as-accent)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0,
            }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="white" stroke="none">
                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
              </svg>
            </div>
          )}
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, letterSpacing: '0.06em', color: 'var(--as-text)', textTransform: 'uppercase', lineHeight: 1 }}>
              DRIPNGRID
            </div>
            <div style={{ fontSize: 10, color: 'var(--as-muted)', marginTop: 3, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
              Admin Console
            </div>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: '10px 0 10px', overflowY: 'auto' }}>
        {visibleItems.map((item, idx) => {
          const isActive = pathname === item.href || (item.href !== '/admin' && pathname.startsWith(item.href));
          const showDivider = item.dividerBefore && idx > 0;

          return (
            <div key={item.href}>
              {showDivider && (
                <div style={{ height: 1, background: 'var(--as-border)', margin: '8px 16px' }} />
              )}
              <Link
                href={item.href}
                className="as-nav-item"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  padding: '8px 16px 8px 20px',
                  fontSize: 13,
                  fontWeight: isActive ? 600 : 400,
                  color: isActive ? 'var(--as-accent)' : 'var(--as-muted)',
                  background: isActive ? 'var(--as-active-bg)' : 'transparent',
                  borderLeft: isActive ? '2px solid var(--as-accent)' : '2px solid transparent',
                  textDecoration: 'none',
                  transition: 'all 0.12s ease',
                  letterSpacing: '0.01em',
                  lineHeight: 1,
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
                <span style={{ opacity: isActive ? 1 : 0.65, transition: 'opacity 0.12s' }}>
                  <Icon d={ICONS[item.iconKey]} size={15} />
                </span>
                {item.label}
              </Link>
            </div>
          );
        })}
      </nav>

      {/* User profile footer */}
      <Link
        href={`/admin/users/${employeeId}`}
        style={{
          padding: '12px 16px',
          borderTop: '1px solid var(--as-border)',
          textDecoration: 'none',
          display: 'block',
          transition: 'background 0.12s',
        }}
        onMouseEnter={e => (e.currentTarget.style.background = 'var(--as-hover)')}
        onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
        title="View your profile"
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {profileImage ? (
            <img 
              src={profileImage} 
              alt="Profile" 
              style={{ width: 30, height: 30, borderRadius: 8, objectFit: 'cover', flexShrink: 0, border: '1px solid var(--as-border)' }} 
            />
          ) : (
            <div style={{
              width: 30, height: 30, borderRadius: 8,
              background: 'var(--as-accent)',
              color: '#ffffff',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 11, fontWeight: 700, flexShrink: 0,
              letterSpacing: '0.02em',
            }}>
              {initials}
            </div>
          )}
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--as-text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {employeeName}
            </div>
            <div style={{ fontSize: 10, color: 'var(--as-muted)', marginTop: 2, display: 'flex', alignItems: 'center', gap: 4 }}>
              <span style={{ textTransform: 'capitalize' }}>{role.replace('_', ' ')}</span>
              <span style={{ opacity: 0.4 }}>·</span>
              <span>{employeeId}</span>
            </div>
          </div>
          {/* Arrow hint */}
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" style={{ marginLeft: 'auto', opacity: 0.3, flexShrink: 0 }}>
            <path d="M9 18l6-6-6-6" />
          </svg>
        </div>
      </Link>
    </aside>
  );
}
