'use client';

import { useState, useEffect, useCallback } from 'react';
import AdminShell, { useAdmin } from '@/components/admin/AdminShell';
import StatusBadge from '@/components/admin/StatusBadge';

function ArchiveContent() {
  const { user } = useAdmin();
  const [unlocked, setUnlocked] = useState(false);
  const [password, setPassword] = useState('');
  const [unlocking, setUnlocking] = useState(false);
  const [unlockError, setUnlockError] = useState('');
  const [expiresAt, setExpiresAt] = useState<number | null>(null);
  const [timeLeft, setTimeLeft] = useState('');

  // Tab state
  const [activeTab, setActiveTab] = useState<'orders' | 'customers'>('orders');

  // Orders
  const [orders, setOrders] = useState<any[]>([]);
  const [orderTotal, setOrderTotal] = useState(0);
  const [orderPage, setOrderPage] = useState(1);
  const [orderSearch, setOrderSearch] = useState('');
  const [loadingOrders, setLoadingOrders] = useState(false);

  // Users
  const [users, setUsers] = useState<any[]>([]);
  const [userTotal, setUserTotal] = useState(0);
  const [userPage, setUserPage] = useState(1);
  const [userSearch, setUserSearch] = useState('');
  const [loadingUsers, setLoadingUsers] = useState(false);

  // Migration
  const [showMigrate, setShowMigrate] = useState(false);
  const [cutoffDate, setCutoffDate] = useState('');
  const [includeUsers, setIncludeUsers] = useState(false);
  const [preview, setPreview] = useState<{ orders: number; users: number } | null>(null);
  const [previewing, setPreviewing] = useState(false);
  const [migrating, setMigrating] = useState(false);
  const [migrateResult, setMigrateResult] = useState('');

  // Countdown
  useEffect(() => {
    if (!expiresAt) return;
    const iv = setInterval(() => {
      const remaining = Math.max(0, expiresAt - Date.now());
      if (remaining <= 0) {
        setUnlocked(false);
        setExpiresAt(null);
        setTimeLeft('');
        clearInterval(iv);
        return;
      }
      const mins = Math.floor(remaining / 60000);
      const secs = Math.floor((remaining % 60000) / 1000);
      setTimeLeft(`${mins}:${secs.toString().padStart(2, '0')}`);
    }, 1000);
    return () => clearInterval(iv);
  }, [expiresAt]);

  const handleUnlock = async () => {
    setUnlocking(true);
    setUnlockError('');
    try {
      const res = await fetch('/api/admin/archive/unlock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });
      const data = await res.json();
      if (data.success) {
        setUnlocked(true);
        setPassword('');
        setExpiresAt(Date.now() + data.expiresIn * 1000);
      } else {
        setUnlockError(data.error || 'Failed to unlock');
      }
    } catch {
      setUnlockError('Network error');
    } finally {
      setUnlocking(false);
    }
  };

  const handleLock = async () => {
    await fetch('/api/admin/archive/unlock', { method: 'DELETE' });
    setUnlocked(false);
    setExpiresAt(null);
    setOrders([]);
    setUsers([]);
  };

  const fetchOrders = useCallback(async () => {
    setLoadingOrders(true);
    try {
      const p = new URLSearchParams({ page: orderPage.toString() });
      if (orderSearch) p.set('search', orderSearch);
      const res = await fetch(`/api/admin/archive/orders?${p}`);
      if (res.status === 403) { setUnlocked(false); return; }
      const data = await res.json();
      setOrders(data.orders || []);
      setOrderTotal(data.total || 0);
    } catch { /* silent */ } finally { setLoadingOrders(false); }
  }, [orderPage, orderSearch]);

  const fetchUsers = useCallback(async () => {
    setLoadingUsers(true);
    try {
      const p = new URLSearchParams({ page: userPage.toString() });
      if (userSearch) p.set('search', userSearch);
      const res = await fetch(`/api/admin/archive/users?${p}`);
      if (res.status === 403) { setUnlocked(false); return; }
      const data = await res.json();
      setUsers(data.users || []);
      setUserTotal(data.total || 0);
    } catch { /* silent */ } finally { setLoadingUsers(false); }
  }, [userPage, userSearch]);

  useEffect(() => { if (unlocked && activeTab === 'orders') fetchOrders(); }, [unlocked, fetchOrders, activeTab]);
  useEffect(() => { if (unlocked && activeTab === 'customers') fetchUsers(); }, [unlocked, fetchUsers, activeTab]);

  const handlePreview = async () => {
    if (!cutoffDate) return;
    setPreviewing(true);
    setPreview(null);
    try {
      const res = await fetch(`/api/admin/archive/migrate?cutoffDate=${encodeURIComponent(new Date(cutoffDate).toISOString())}`);
      const data = await res.json();
      setPreview({ orders: data.orders ?? 0, users: data.users ?? 0 });
    } catch { setMigrateResult('Failed to preview'); } finally { setPreviewing(false); }
  };

  const handleMigrate = async () => {
    if (!cutoffDate || !preview) return;
    const lines = [
      `This will PERMANENTLY MOVE data from production to the archive dataset:`,
      `  • ${preview.orders} orders`,
      includeUsers ? `  • ${preview.users} inactive customers` : '',
      ``,
      `Data will be DELETED from production and stored in the isolated archive dataset.`,
      `Only YOU (super admin) can access archive data after unlock.`,
      ``,
      `This is NOT reversible without manual database intervention.`,
      ``,
      `Proceed?`
    ].filter(Boolean).join('\n');

    if (!window.confirm(lines)) return;

    setMigrating(true);
    setMigrateResult('');
    try {
      const res = await fetch('/api/admin/archive/migrate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cutoffDate: new Date(cutoffDate).toISOString(),
          includeUsers,
          confirm: true,
        }),
      });
      const data = await res.json();
      if (data.success) {
        const r = data.results;
        setMigrateResult(
          `✅ Migration complete — ${r.orders?.migrated ?? 0} orders` +
          (includeUsers ? ` and ${r.users?.migrated ?? 0} customers` : '') +
          ` moved to archive dataset.`
        );
        setPreview(null);
        setCutoffDate('');
        setShowMigrate(false);
        if (activeTab === 'orders') fetchOrders();
        else fetchUsers();
      } else {
        setMigrateResult(`❌ ${data.error}`);
      }
    } catch { setMigrateResult('❌ Migration failed'); } finally { setMigrating(false); }
  };

  if (user?.role !== 'super_admin') {
    return <div style={{ textAlign: 'center', padding: 80, color: 'var(--as-muted)', fontSize: 14 }}>🔒 Archive access is restricted to super admins.</div>;
  }

  // Unlock gate
  if (!unlocked) {
    return (
      <div style={{ maxWidth: 400, margin: '60px auto', textAlign: 'center' }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>🗃️</div>
        <h2 style={{ fontSize: 18, fontWeight: 700, color: 'var(--as-text)', margin: '0 0 8px' }}>Archive Access</h2>
        <p style={{ fontSize: 13, color: 'var(--as-muted)', margin: '0 0 6px' }}>
          Enter your password to unlock for 10 minutes.
        </p>
        <p style={{ fontSize: 11, color: 'var(--as-muted)', margin: '0 0 20px', lineHeight: 1.6 }}>
          Archive data is stored in a separate, isolated Sanity dataset.<br />
          It is inaccessible to all other users at all times.
        </p>
        <input
          type="password"
          placeholder="Enter your password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleUnlock()}
          style={{ marginBottom: 12, textAlign: 'center' }}
        />
        {unlockError && <div style={{ fontSize: 12, color: 'var(--as-badge-red-text)', marginBottom: 12 }}>{unlockError}</div>}
        <button
          onClick={handleUnlock}
          disabled={unlocking || !password}
          style={{ width: '100%', padding: '10px 0', fontSize: 13, fontWeight: 600, background: 'var(--as-accent)', color: 'var(--as-bg)', border: 'none', borderRadius: 6, cursor: 'pointer', opacity: unlocking || !password ? 0.5 : 1 }}
        >
          {unlocking ? 'Verifying...' : '🔓 Unlock Archive'}
        </button>
      </div>
    );
  }

  const tabStyle = (tab: string) => ({
    padding: '8px 18px', fontSize: 13, fontWeight: activeTab === tab ? 600 : 400,
    background: activeTab === tab ? 'var(--as-accent)' : 'transparent',
    color: activeTab === tab ? 'var(--as-bg)' : 'var(--as-muted)',
    border: '1px solid var(--as-border)', borderRadius: 6, cursor: 'pointer',
  });

  return (
    <>
      {/* Access banner */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 16px', background: 'var(--as-badge-yellow)', borderRadius: 8, marginBottom: 20, fontSize: 13 }}>
        <span style={{ color: 'var(--as-badge-yellow-text)' }}>
          🗃️ <strong>Archive</strong> — Isolated dataset. Access expires in <strong>{timeLeft}</strong>
        </span>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={() => setShowMigrate(v => !v)} style={{ padding: '5px 12px', fontSize: 12, fontWeight: 600, background: 'var(--as-badge-blue)', color: 'var(--as-badge-blue-text)', border: 'none', borderRadius: 4, cursor: 'pointer' }}>
            📥 Move to Archive
          </button>
          <button onClick={handleLock} style={{ padding: '5px 12px', fontSize: 12, fontWeight: 600, background: 'var(--as-badge-red)', color: 'var(--as-badge-red-text)', border: 'none', borderRadius: 4, cursor: 'pointer' }}>
            🔒 Lock
          </button>
        </div>
      </div>

      {/* Migration panel */}
      {showMigrate && (
        <div style={{ background: 'var(--as-card)', border: '1px solid #dc2626', borderRadius: 10, padding: 20, marginBottom: 20 }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--as-text)', marginBottom: 4 }}>📥 Migrate Data to Archive Dataset</div>
          <p style={{ fontSize: 12, color: 'var(--as-muted)', margin: '0 0 16px', lineHeight: 1.6 }}>
            Data will be <strong>moved</strong> (not copied) from production to the isolated archive dataset and <strong>deleted from production</strong>.
            Only you can access it. This is <strong>permanent</strong>.
          </p>
          <div style={{ display: 'flex', gap: 12, alignItems: 'flex-end', flexWrap: 'wrap', marginBottom: 12 }}>
            <div>
              <label style={{ display: 'block', fontSize: 11, color: 'var(--as-muted)', fontWeight: 600, marginBottom: 4 }}>ARCHIVE DATA BEFORE THIS DATE</label>
              <input type="date" value={cutoffDate} onChange={e => { setCutoffDate(e.target.value); setPreview(null); }} style={{ width: 200 }} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <label style={{ fontSize: 11, color: 'var(--as-muted)', fontWeight: 600 }}>INCLUDE CUSTOMERS</label>
              <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, cursor: 'pointer', color: 'var(--as-text)' }}>
                <input type="checkbox" checked={includeUsers} onChange={e => setIncludeUsers(e.target.checked)} />
                Archive inactive customers too
              </label>
            </div>
            <button onClick={handlePreview} disabled={!cutoffDate || previewing} style={{ padding: '8px 14px', fontSize: 12, fontWeight: 600, background: 'var(--as-badge-gray)', color: 'var(--as-badge-gray-text)', border: 'none', borderRadius: 4, cursor: 'pointer', opacity: !cutoffDate || previewing ? 0.5 : 1 }}>
              {previewing ? 'Checking...' : 'Preview'}
            </button>
            {preview && (
              <button onClick={handleMigrate} disabled={migrating || (preview.orders === 0 && preview.users === 0)} style={{ padding: '8px 14px', fontSize: 12, fontWeight: 700, background: '#dc2626', color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer', opacity: migrating ? 0.5 : 1 }}>
                {migrating ? 'Migrating...' : `⚠️ Migrate Now`}
              </button>
            )}
          </div>
          {preview && (
            <div style={{ fontSize: 12, padding: '10px 12px', background: 'var(--as-badge-yellow)', borderRadius: 6, color: 'var(--as-badge-yellow-text)' }}>
              Will move: <strong>{preview.orders} orders</strong>{includeUsers ? ` and <strong>${preview.users} customers</strong>` : ''} → archive dataset (deleted from production)
            </div>
          )}
          {migrateResult && <div style={{ marginTop: 10, fontSize: 12, fontWeight: 500, color: 'var(--as-text)' }}>{migrateResult}</div>}
        </div>
      )}

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        <button onClick={() => setActiveTab('orders')} style={tabStyle('orders')}>📦 Orders ({orderTotal})</button>
        <button onClick={() => setActiveTab('customers')} style={tabStyle('customers')}>👤 Customers ({userTotal})</button>
      </div>

      {/* Orders tab */}
      {activeTab === 'orders' && (
        <>
          <div style={{ marginBottom: 12 }}>
            <input type="text" placeholder="Search archived orders..." value={orderSearch} onChange={e => { setOrderSearch(e.target.value); setOrderPage(1); }} style={{ maxWidth: 300 }} />
          </div>
          <div style={{ background: 'var(--as-card)', border: '1px solid var(--as-border)', borderRadius: 10, overflow: 'hidden', boxShadow: 'var(--as-shadow)' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr>{['Order', 'Customer', 'Amount', 'Status', 'Payment', 'Date'].map(h => (
                  <th key={h} style={{ textAlign: 'left', padding: '10px 12px', fontSize: 11, fontWeight: 600, color: 'var(--as-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', background: 'var(--as-table-header)', borderBottom: '1px solid var(--as-border)' }}>{h}</th>
                ))}</tr>
              </thead>
              <tbody>
                {loadingOrders ? (
                  <tr><td colSpan={6} style={{ textAlign: 'center', padding: 32, color: 'var(--as-muted)' }}>Loading...</td></tr>
                ) : orders.length === 0 ? (
                  <tr><td colSpan={6} style={{ textAlign: 'center', padding: 40, color: 'var(--as-muted)' }}>
                    <div style={{ fontSize: 28, marginBottom: 8 }}>📭</div>
                    <div>No archived orders yet.</div>
                    <div style={{ fontSize: 11, marginTop: 4 }}>Use "📥 Move to Archive" to migrate past orders.</div>
                  </td></tr>
                ) : orders.map(o => (
                  <tr key={o._id} style={{ borderBottom: '1px solid var(--as-border)' }}>
                    <td style={{ padding: '10px 12px', fontWeight: 500, color: 'var(--as-text)' }}>#{o.orderNumber}</td>
                    <td style={{ padding: '10px 12px', color: 'var(--as-muted)' }}>{o.customerName}</td>
                    <td style={{ padding: '10px 12px', color: 'var(--as-text)' }}>₹{o.total?.toLocaleString('en-IN')}</td>
                    <td style={{ padding: '10px 12px' }}><StatusBadge status={o.status} /></td>
                    <td style={{ padding: '10px 12px' }}><StatusBadge status={o.paymentStatus} /></td>
                    <td style={{ padding: '10px 12px', color: 'var(--as-muted)', fontSize: 12 }}>
                      {new Date(o.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {orderTotal > 20 && (
            <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 16 }}>
              <button disabled={orderPage <= 1} onClick={() => setOrderPage(p => p - 1)} style={{ padding: '6px 14px', fontSize: 12, border: '1px solid var(--as-border)', borderRadius: 4, background: 'var(--as-card)', color: 'var(--as-text)', cursor: orderPage <= 1 ? 'default' : 'pointer', opacity: orderPage <= 1 ? 0.4 : 1 }}>← Previous</button>
              <span style={{ padding: '6px 14px', fontSize: 12, color: 'var(--as-muted)' }}>Page {orderPage} of {Math.ceil(orderTotal / 20)}</span>
              <button disabled={orderPage >= Math.ceil(orderTotal / 20)} onClick={() => setOrderPage(p => p + 1)} style={{ padding: '6px 14px', fontSize: 12, border: '1px solid var(--as-border)', borderRadius: 4, background: 'var(--as-card)', color: 'var(--as-text)', cursor: orderPage >= Math.ceil(orderTotal / 20) ? 'default' : 'pointer', opacity: orderPage >= Math.ceil(orderTotal / 20) ? 0.4 : 1 }}>Next →</button>
            </div>
          )}
        </>
      )}

      {/* Users tab */}
      {activeTab === 'customers' && (
        <>
          <div style={{ marginBottom: 12 }}>
            <input type="text" placeholder="Search archived customers..." value={userSearch} onChange={e => { setUserSearch(e.target.value); setUserPage(1); }} style={{ maxWidth: 300 }} />
          </div>
          <div style={{ background: 'var(--as-card)', border: '1px solid var(--as-border)', borderRadius: 10, overflow: 'hidden', boxShadow: 'var(--as-shadow)' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr>{['Name', 'Email', 'Phone', 'Role', 'Joined', 'Archived'].map(h => (
                  <th key={h} style={{ textAlign: 'left', padding: '10px 12px', fontSize: 11, fontWeight: 600, color: 'var(--as-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', background: 'var(--as-table-header)', borderBottom: '1px solid var(--as-border)' }}>{h}</th>
                ))}</tr>
              </thead>
              <tbody>
                {loadingUsers ? (
                  <tr><td colSpan={6} style={{ textAlign: 'center', padding: 32, color: 'var(--as-muted)' }}>Loading...</td></tr>
                ) : users.length === 0 ? (
                  <tr><td colSpan={6} style={{ textAlign: 'center', padding: 40, color: 'var(--as-muted)' }}>
                    <div style={{ fontSize: 28, marginBottom: 8 }}>👤</div>
                    <div>No archived customers yet.</div>
                    <div style={{ fontSize: 11, marginTop: 4 }}>Check "Archive inactive customers too" during migration.</div>
                  </td></tr>
                ) : users.map(u => (
                  <tr key={u._id} style={{ borderBottom: '1px solid var(--as-border)' }}>
                    <td style={{ padding: '10px 12px', fontWeight: 500, color: 'var(--as-text)' }}>{u.name || '—'}</td>
                    <td style={{ padding: '10px 12px', color: 'var(--as-muted)' }}>{u.email}</td>
                    <td style={{ padding: '10px 12px', color: 'var(--as-muted)' }}>{u.phone || '—'}</td>
                    <td style={{ padding: '10px 12px', color: 'var(--as-muted)', textTransform: 'capitalize' }}>{u.role || 'user'}</td>
                    <td style={{ padding: '10px 12px', color: 'var(--as-muted)', fontSize: 12 }}>
                      {u._createdAt ? new Date(u._createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}
                    </td>
                    <td style={{ padding: '10px 12px', color: 'var(--as-muted)', fontSize: 12 }}>
                      {u._archivedAt ? new Date(u._archivedAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {userTotal > 20 && (
            <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 16 }}>
              <button disabled={userPage <= 1} onClick={() => setUserPage(p => p - 1)} style={{ padding: '6px 14px', fontSize: 12, border: '1px solid var(--as-border)', borderRadius: 4, background: 'var(--as-card)', color: 'var(--as-text)', cursor: userPage <= 1 ? 'default' : 'pointer', opacity: userPage <= 1 ? 0.4 : 1 }}>← Previous</button>
              <span style={{ padding: '6px 14px', fontSize: 12, color: 'var(--as-muted)' }}>Page {userPage} of {Math.ceil(userTotal / 20)}</span>
              <button disabled={userPage >= Math.ceil(userTotal / 20)} onClick={() => setUserPage(p => p + 1)} style={{ padding: '6px 14px', fontSize: 12, border: '1px solid var(--as-border)', borderRadius: 4, background: 'var(--as-card)', color: 'var(--as-text)', cursor: userPage >= Math.ceil(userTotal / 20) ? 'default' : 'pointer', opacity: userPage >= Math.ceil(userTotal / 20) ? 0.4 : 1 }}>Next →</button>
            </div>
          )}
        </>
      )}
    </>
  );
}

export default function ArchivePage() {
  return (
    <AdminShell>
      <ArchiveContent />
    </AdminShell>
  );
}
