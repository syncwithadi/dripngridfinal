'use client';

import { useState, useEffect, useRef, createContext, useContext } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import AdminSidebar from './AdminSidebar';
import AdminTopbar from './AdminTopbar';
import CommandPalette from './CommandPalette';

interface AdminUser {
  employeeId: string;
  name: string;
  role: string;
  email: string;
  profileImage?: string;
}

interface AdminCtx {
  user: AdminUser | null;
  theme: 'light' | 'dark';
}

export const AdminContext = createContext<AdminCtx>({ user: null, theme: 'light' });
export const useAdmin = () => useContext(AdminContext);

const PAGE_TITLES: Record<string, string> = {
  '/admin':                  'Dashboard',
  '/admin/orders':           'Orders',
  '/admin/inventory':        'Inventory',
  '/admin/coupons':          'Coupons',
  '/admin/requests':         'Coupon Requests',
  '/admin/customers':        'Customers',
  '/admin/logs':             'Audit Logs',
  '/admin/users':            'Team',
  '/admin/settings':         'Settings',
  '/admin/hidden':           'Hidden Data',
  '/admin/archive':          'Archive',
  '/admin/product-requests': 'Product Requests',
  '/admin/tasks':            'Tasks',
  '/admin/internal':         'Internal Reports',
  '/admin/resources':        'Resource Hub',
  '/admin/communications':   'Communications',
};

const ADMIN_CSS = `
@import url('https://fonts.googleapis.com/css2?family=Inter:ital,opsz,wght@0,14..32,300;0,14..32,400;0,14..32,500;0,14..32,600;0,14..32,700;1,14..32,400&display=swap');

#admin-shell[data-theme="light"] {
  --as-bg: #f4f5f7;
  --as-sidebar: #ffffff;
  --as-topbar: rgba(255,255,255,0.92);
  --as-card: #ffffff;
  --as-border: #e8eaed;
  --as-border-subtle: #f0f1f3;
  --as-text: #0f1117;
  --as-text-secondary: #3d4148;
  --as-muted: #7c8291;
  --as-accent: #4f46e5;
  --as-accent-hover: #4338ca;
  --as-accent-subtle: #eef2ff;
  --as-active-bg: #f0f1ff;
  --as-hover: #f7f8fa;
  --as-badge-green: #f0fdf4;
  --as-badge-green-text: #16a34a;
  --as-badge-yellow: #fffbeb;
  --as-badge-yellow-text: #b45309;
  --as-badge-red: #fef2f2;
  --as-badge-red-text: #dc2626;
  --as-badge-blue: #eff6ff;
  --as-badge-blue-text: #2563eb;
  --as-badge-gray: #f8f9fa;
  --as-badge-gray-text: #4b5563;
  --as-badge-purple: #faf5ff;
  --as-badge-purple-text: #7c3aed;
  --as-input-bg: #ffffff;
  --as-input-border: #dde0e5;
  --as-input-focus: #4f46e5;
  --as-table-header: #f8f9fb;
  --as-table-row-hover: #f7f8ff;
  --as-shadow: 0 1px 2px rgba(0,0,0,0.04), 0 1px 4px rgba(0,0,0,0.03);
  --as-shadow-md: 0 4px 12px rgba(0,0,0,0.06), 0 2px 4px rgba(0,0,0,0.04);
  --as-shadow-lg: 0 8px 24px rgba(0,0,0,0.08), 0 4px 8px rgba(0,0,0,0.04);
  --as-radius: 10px;
  --as-radius-sm: 6px;
  --as-radius-lg: 14px;
}
#admin-shell[data-theme="dark"] {
  --as-bg: #0c0c0e;
  --as-sidebar: #101013;
  --as-topbar: rgba(16,16,19,0.92);
  --as-card: #16161a;
  --as-border: #22222a;
  --as-border-subtle: #1c1c22;
  --as-text: #f0f0f2;
  --as-text-secondary: #c4c4cc;
  --as-muted: #64647a;
  --as-accent: #6366f1;
  --as-accent-hover: #818cf8;
  --as-accent-subtle: #1e1b4b;
  --as-active-bg: #1e1b4b;
  --as-hover: #18181e;
  --as-badge-green: #052e16;
  --as-badge-green-text: #4ade80;
  --as-badge-yellow: #1c1400;
  --as-badge-yellow-text: #fbbf24;
  --as-badge-red: #1c0505;
  --as-badge-red-text: #f87171;
  --as-badge-blue: #0c1a3a;
  --as-badge-blue-text: #60a5fa;
  --as-badge-gray: #1c1c22;
  --as-badge-gray-text: #9ca3af;
  --as-badge-purple: #1a0f2e;
  --as-badge-purple-text: #a78bfa;
  --as-input-bg: #16161a;
  --as-input-border: #2a2a34;
  --as-input-focus: #6366f1;
  --as-table-header: #13131a;
  --as-table-row-hover: #1a1a24;
  --as-shadow: 0 1px 3px rgba(0,0,0,0.5), 0 1px 2px rgba(0,0,0,0.4);
  --as-shadow-md: 0 4px 12px rgba(0,0,0,0.6), 0 2px 4px rgba(0,0,0,0.4);
  --as-shadow-lg: 0 8px 24px rgba(0,0,0,0.7), 0 4px 8px rgba(0,0,0,0.5);
  --as-radius: 10px;
  --as-radius-sm: 6px;
  --as-radius-lg: 14px;
}

/* ── Reset & Base ─────────────────────────────────────────────── */
#admin-shell * { box-sizing: border-box; }
#admin-shell { -webkit-font-smoothing: antialiased; -moz-osx-font-smoothing: grayscale; }

/* ── Links & Buttons ──────────────────────────────────────────── */
#admin-shell a { text-decoration: none; transition: opacity 0.15s ease; }
#admin-shell a:hover { opacity: 0.8; }
#admin-shell button { font-family: inherit; }
#admin-shell button:hover:not(:disabled) { opacity: 0.88; transition: opacity 0.15s ease, transform 0.1s ease; }
#admin-shell button:active:not(:disabled) { transform: scale(0.98); }

/* ── Form Inputs ──────────────────────────────────────────────── */
#admin-shell input,
#admin-shell select,
#admin-shell textarea {
  background: var(--as-input-bg);
  border: 1px solid var(--as-input-border);
  color: var(--as-text);
  border-radius: var(--as-radius-sm);
  padding: 8px 12px;
  font-size: 13px;
  font-family: inherit;
  outline: none;
  transition: border-color 0.15s ease, box-shadow 0.15s ease;
  width: 100%;
}
#admin-shell input:focus,
#admin-shell select:focus,
#admin-shell textarea:focus {
  border-color: var(--as-input-focus);
  box-shadow: 0 0 0 3px rgba(99,102,241,0.12);
}

/* ── Tables ───────────────────────────────────────────────────── */
#admin-shell table { border-collapse: collapse; }
#admin-shell tbody tr {
  transition: background 0.1s ease;
}
#admin-shell tbody tr:hover {
  background: var(--as-table-row-hover) !important;
}

/* ── Scrollbar ────────────────────────────────────────────────── */
#admin-shell ::-webkit-scrollbar { width: 5px; height: 5px; }
#admin-shell ::-webkit-scrollbar-track { background: transparent; }
#admin-shell ::-webkit-scrollbar-thumb { background: var(--as-border); border-radius: 99px; }
#admin-shell ::-webkit-scrollbar-thumb:hover { background: var(--as-muted); }

/* ── Card hover lift ──────────────────────────────────────────── */
#admin-shell .as-card-hover {
  transition: box-shadow 0.18s ease, transform 0.18s ease;
}
#admin-shell .as-card-hover:hover {
  box-shadow: var(--as-shadow-md);
  transform: translateY(-1px);
}

/* ── Sidebar backdrop on active ───────────────────────────────── */
#admin-shell .as-nav-item {
  position: relative;
  border-radius: 0 var(--as-radius-sm) var(--as-radius-sm) 0;
  margin-right: 12px;
}

/* ── Topbar backdrop blur ─────────────────────────────────────── */
#admin-shell header {
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
}

/* ── Spin animation (loading) ─────────────────────────────────── */
@keyframes as-spin { to { transform: rotate(360deg); } }
@keyframes as-pulse { 0%,100% { opacity: 1; } 50% { opacity: 0.4; } }

/* ── Mobile sidebar drawer ────────────────────────────────────── */
@media (max-width: 1023px) {
  .as-main-content {
    margin-left: 0 !important;
    padding: 20px 16px 48px !important;
  }
  .as-sidebar {
    transform: translateX(-100%);
    transition: transform 0.26s cubic-bezier(0.4,0,0.2,1),
                box-shadow 0.26s ease;
  }
  .as-sidebar.as-sidebar-open {
    transform: translateX(0);
    box-shadow: 8px 0 32px rgba(0,0,0,0.22);
  }
  .as-hamburger {
    display: flex !important;
  }
}
@media (min-width: 1024px) {
  .as-sidebar {
    transform: none !important;
    transition: none !important;
  }
  .as-sidebar-overlay {
    display: none !important;
  }
  .as-hamburger {
    display: none !important;
  }
}
`;

// Idle detection thresholds
const IDLE_THRESHOLD_MS = 5 * 60 * 1000;  // 5 minutes no input = idle
const HEARTBEAT_INTERVAL_MS = 30 * 1000;  // send heartbeat every 30s

export default function AdminShell({ children, title: titleOverride }: { children: React.ReactNode; title?: string }) {
  const [user, setUser] = useState<AdminUser | null>(null);
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  // Refs for idle tracking — avoid triggering re-renders
  const lastEventRef = useRef<number>(Date.now());
  const isIdleRef = useRef<boolean>(false);
  const activeSecsRef = useRef<number>(0);
  const idleSecsRef = useRef<number>(0);
  const heartbeatRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const userLoadedRef = useRef<boolean>(false);

  useEffect(() => {
    const saved = localStorage.getItem('admin_theme') as 'light' | 'dark' | null;
    if (saved) setTheme(saved);
  }, []);

  useEffect(() => {
    fetch('/api/admin/auth/me')
      .then(r => r.json())
      .then(data => {
        if (data.error) {
          router.push('/admin/login');
        } else {
          setUser(data);
          userLoadedRef.current = true;
          setLoading(false);
        }
      })
      .catch(() => router.push('/admin/login'));
  }, [router]);

  // Set up idle detection + heartbeat after user is authenticated
  useEffect(() => {
    if (!user) return;

    // 1-second tick: accumulate active/idle seconds
    tickRef.current = setInterval(() => {
      const msSinceEvent = Date.now() - lastEventRef.current;
      const nowIdle = msSinceEvent >= IDLE_THRESHOLD_MS;
      isIdleRef.current = nowIdle;
      if (nowIdle) {
        idleSecsRef.current += 1;
      } else {
        activeSecsRef.current += 1;
      }
    }, 1000);

    // Heartbeat every 30s: drain accumulators and POST to backend
    heartbeatRef.current = setInterval(() => {
      const activeSecs = activeSecsRef.current;
      const idleSecs = idleSecsRef.current;
      const isIdle = isIdleRef.current;

      // Reset
      activeSecsRef.current = 0;
      idleSecsRef.current = 0;

      // Skip if nothing happened (e.g. tab was in background)
      if (activeSecs === 0 && idleSecs === 0) return;

      fetch('/api/admin/activity', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isIdle, activeSecs, idleSecs }),
      }).catch(() => {/* silent — heartbeat failure is non-critical */});
    }, HEARTBEAT_INTERVAL_MS);

    // Passive activity listeners — update timestamp only, no re-renders
    const onActivity = () => { lastEventRef.current = Date.now(); };
    const opts = { passive: true };
    document.addEventListener('mousemove', onActivity, opts);
    document.addEventListener('mousedown', onActivity, opts);
    document.addEventListener('keydown', onActivity, opts);
    document.addEventListener('scroll', onActivity, opts);
    document.addEventListener('touchstart', onActivity, opts);

    return () => {
      if (tickRef.current) clearInterval(tickRef.current);
      if (heartbeatRef.current) clearInterval(heartbeatRef.current);
      document.removeEventListener('mousemove', onActivity);
      document.removeEventListener('mousedown', onActivity);
      document.removeEventListener('keydown', onActivity);
      document.removeEventListener('scroll', onActivity);
      document.removeEventListener('touchstart', onActivity);
    };
  }, [user]);

  function toggleTheme() {
    const next = theme === 'light' ? 'dark' : 'light';
    setTheme(next);
    localStorage.setItem('admin_theme', next);
  }

  const pageTitle = Object.entries(PAGE_TITLES).find(([key]) =>
    pathname === key || (key !== '/admin' && pathname.startsWith(key))
  )?.[1] || 'Admin';

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0c0c0e' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
          <div style={{ width: 22, height: 22, border: '2px solid #2a2a34', borderTopColor: '#6366f1', borderRadius: '50%', animation: 'as-spin 0.7s linear infinite' }} />
          <div style={{ fontSize: 11, color: '#64647a', letterSpacing: '0.1em', textTransform: 'uppercase', fontFamily: 'Inter, sans-serif' }}>Loading</div>
        </div>
        <style>{`@keyframes as-spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return (
    <AdminContext.Provider value={{ user, theme }}>
      <style dangerouslySetInnerHTML={{ __html: ADMIN_CSS }} />
      <CommandPalette />
      <div id="admin-shell" data-theme={theme} style={{ minHeight: '100vh', background: 'var(--as-bg)', color: 'var(--as-text)', fontFamily: "'Inter', system-ui, -apple-system, sans-serif", letterSpacing: '-0.01em' }}>
        <AdminSidebar
          role={user?.role || 'employee'}
          employeeName={user?.name || ''}
          employeeId={user?.employeeId || ''}
          profileImage={user?.profileImage}
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
        />
        <div className="as-main-content" style={{ marginLeft: 240, minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
          <AdminTopbar title={titleOverride || pageTitle} theme={theme} onToggleTheme={toggleTheme} onMenuOpen={() => setSidebarOpen(true)} />
          <main style={{ flex: 1, padding: '32px 32px 56px' }}>
            {children}
          </main>
        </div>
      </div>
    </AdminContext.Provider>
  );
}
