'use client';

import { useState, useEffect, useCallback } from 'react';
import AdminShell from '@/components/admin/AdminShell';
import { useAdmin } from '@/components/admin/AdminShell';
import StatsCard from '@/components/admin/StatsCard';
import StatusBadge from '@/components/admin/StatusBadge';

interface DashboardData {
  ordersToday: number;
  pendingOrders: number;
  pendingRequests: number;
  lowStockCount: number;
  recentOrders: any[];
  recentLogs: any[];
  visibleFrom: string | null;
  role: string;
}

interface UserStatus {
  employeeId: string;
  name: string;
  role: string;
  status: 'online' | 'idle' | 'offline';
  lastActivityAt: string | null;
  lastLogin: string | null;
}

function OnlineUsersWidget() {
  const [users, setUsers] = useState<UserStatus[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchStatus = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/users/status');
      if (!res.ok) return;
      const data = await res.json();
      setUsers(data.users || []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStatus();
    const iv = setInterval(fetchStatus, 60_000);
    return () => clearInterval(iv);
  }, [fetchStatus]);

  const online = users.filter(u => u.status === 'online').length;
  const idle   = users.filter(u => u.status === 'idle').length;
  const offline = users.filter(u => u.status === 'offline').length;

  const STATUS_DOT: Record<string, string> = {
    online:  '#22c55e',
    idle:    '#f59e0b',
    offline: '#6b7280',
  };

  return (
    <div className="as-card-hover" style={{ background: 'var(--as-card)', border: '1px solid var(--as-border)', borderRadius: 'var(--as-radius)', overflow: 'hidden', boxShadow: 'var(--as-shadow)' }}>
      <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--as-border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--as-text)', letterSpacing: '-0.01em' }}>Team Status</span>
        <div style={{ display: 'flex', gap: 14, fontSize: 11, color: 'var(--as-muted)' }}>
          <span style={{ color: '#22c55e', fontWeight: 600 }}>● {online} online</span>
          <span style={{ color: '#f59e0b', fontWeight: 600 }}>● {idle} idle</span>
          <span>● {offline} offline</span>
        </div>
      </div>
      <div style={{ overflow: 'auto', maxHeight: 280 }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: 40, color: 'var(--as-muted)', fontSize: 13 }}>Loading status...</div>
        ) : users.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 40, color: 'var(--as-muted)', fontSize: 13 }}>No team members found.</div>
        ) : users.map(u => (
          <div key={u.employeeId} style={{ padding: '12px 20px', borderBottom: '1px solid var(--as-border-subtle)', display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: STATUS_DOT[u.status], flexShrink: 0, boxShadow: u.status === 'online' ? `0 0 0 3px ${STATUS_DOT[u.status]}30` : undefined }} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--as-text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{u.name}</div>
              <div style={{ fontSize: 11, color: 'var(--as-muted)', marginTop: 2 }}>
                {u.employeeId} <span style={{ opacity: 0.5, margin: '0 4px' }}>·</span>
                <span style={{ textTransform: 'capitalize' }}>{u.role === 'employee' ? 'Member' : u.role.replace('_', ' ')}</span>
              </div>
            </div>
            <div style={{ fontSize: 11, color: 'var(--as-muted)', textAlign: 'right', flexShrink: 0 }}>
              <div style={{ fontWeight: 600, color: STATUS_DOT[u.status], textTransform: 'capitalize' }}>{u.status}</div>
              {u.lastActivityAt && (
                <div style={{ marginTop: 4 }}>
                  {new Date(u.lastActivityAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function DashboardContent() {
  const { user } = useAdmin();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/admin/dashboard')
      .then(r => {
        if (!r.ok) throw new Error('Not authorized');
        return r.json();
      })
      .then(d => {
        setData({
          ordersToday:      d.ordersToday ?? 0,
          pendingOrders:    d.pendingOrders ?? 0,
          pendingRequests:  d.pendingRequests ?? 0,
          lowStockCount:    d.lowStockCount ?? 0,
          recentOrders:     Array.isArray(d.recentOrders) ? d.recentOrders : [],
          recentLogs:       Array.isArray(d.recentLogs) ? d.recentLogs : [],
          visibleFrom:      d.visibleFrom ?? null,
          role:             d.role ?? user?.role ?? 'employee',
        });
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [user]);

  if (loading) return <Spinner />;
  if (!data) return (
    <div style={{ color: 'var(--as-muted)', fontSize: 13, padding: 40, textAlign: 'center' }}>
      Failed to load dashboard data.
    </div>
  );

  const isSuperAdmin = data.role === 'super_admin';

  return (
    <>

      {/* Greeting */}
      <div style={{ marginBottom: 32 }}>
        <h2 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: 'var(--as-text)', letterSpacing: '-0.02em' }}>
          Welcome back, {user?.name?.split(' ')[0]} 👋
        </h2>
        <p style={{ margin: '6px 0 0', fontSize: 13, color: 'var(--as-muted)', display: 'flex', alignItems: 'center', gap: 6 }}>
          <span>{user?.employeeId}</span>
          <span style={{ opacity: 0.5 }}>·</span>
          <span style={{ textTransform: 'capitalize' }}>{user?.role === 'employee' ? 'Member' : user?.role?.replace('_', ' ')}</span>
          <span style={{ opacity: 0.5 }}>·</span>
          <span>{new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })}</span>
        </p>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 20, marginBottom: 32 }}>
        <StatsCard label="Orders Today"      value={data.ordersToday}     icon="orders" />
        <StatsCard label="Pending Orders"    value={data.pendingOrders}   icon="pending"   accent={data.pendingOrders > 0 ? 'var(--as-badge-yellow-text)' : undefined} />
        <StatsCard label="Low Stock"         value={data.lowStockCount}   icon="stock"     accent={data.lowStockCount > 0 ? 'var(--as-badge-red-text)' : undefined} />
        <StatsCard label="Pending Requests"  value={data.pendingRequests} icon="requests"  accent={data.pendingRequests > 0 ? 'var(--as-badge-blue-text)' : undefined} />
      </div>

      {/* Main grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: 24 }}>
        {/* Recent Orders */}
        <Card title="Recent Orders">
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr>
                {['Order', 'Customer', 'Amount', 'Status'].map(h => (
                  <th key={h} style={{ textAlign: 'left', padding: '10px 16px', fontSize: 11, fontWeight: 600, color: 'var(--as-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', background: 'var(--as-table-header)', borderBottom: '1px solid var(--as-border)' }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.recentOrders.map(o => (
                <tr key={o._id} style={{ borderBottom: '1px solid var(--as-border-subtle)' }}>
                  <td style={{ padding: '12px 16px', color: 'var(--as-text)', fontWeight: 500 }}>#{o.orderNumber}</td>
                  <td style={{ padding: '12px 16px', color: 'var(--as-muted)' }}>{o.customerName}</td>
                  <td style={{ padding: '12px 16px', color: 'var(--as-text)' }}>₹{o.total?.toLocaleString('en-IN')}</td>
                  <td style={{ padding: '12px 16px' }}><StatusBadge status={o.status} /></td>
                </tr>
              ))}
              {data.recentOrders.length === 0 && (
                <tr><td colSpan={4} style={{ textAlign: 'center', padding: 40, color: 'var(--as-muted)', fontSize: 13 }}>No recent orders.</td></tr>
              )}
            </tbody>
          </table>
        </Card>

        {/* Recent Activity */}
        <Card title="Recent Activity">
          <div style={{ fontSize: 13 }}>
            {data.recentLogs.map(log => (
              <div key={log._id} style={{ padding: '12px 20px', borderBottom: '1px solid var(--as-border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
                <div>
                  <div style={{ fontWeight: 500, color: 'var(--as-text)' }}>{log.action}</div>
                  <div style={{ fontSize: 12, color: 'var(--as-muted)', marginTop: 4, display: 'flex', gap: 6, alignItems: 'center' }}>
                    <span>{log.employeeName}</span>
                    <span style={{ opacity: 0.5 }}>·</span>
                    <span>{log.entity || 'System'}</span>
                  </div>
                </div>
                <div style={{ fontSize: 11, color: 'var(--as-muted)', whiteSpace: 'nowrap' }}>
                  {new Date(log.timestamp).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            ))}
            {data.recentLogs.length === 0 && (
              <div style={{ textAlign: 'center', padding: 40, color: 'var(--as-muted)' }}>No recent activity logs.</div>
            )}
          </div>
        </Card>
      </div>

      {/* Team Status — admin+ only */}
      {(isSuperAdmin || data.role === 'admin') && <OnlineUsersWidget />}
    </>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="as-card-hover" style={{ background: 'var(--as-card)', border: '1px solid var(--as-border)', borderRadius: 'var(--as-radius)', overflow: 'hidden', boxShadow: 'var(--as-shadow)' }}>
      <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--as-border)', fontSize: 13, fontWeight: 600, color: 'var(--as-text)', letterSpacing: '-0.01em', background: 'var(--as-table-header)' }}>
        {title}
      </div>
      <div style={{ overflow: 'auto', maxHeight: 380 }}>{children}</div>
    </div>
  );
}

function Spinner() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 80, gap: 14 }}>
      <div style={{ width: 22, height: 22, border: '2px solid var(--as-border)', borderTopColor: 'var(--as-accent)', borderRadius: '50%', animation: 'as-spin 0.7s linear infinite' }} />
      <div style={{ fontSize: 11, color: 'var(--as-muted)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>Loading</div>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <AdminShell>
      <DashboardContent />
    </AdminShell>
  );
}
