'use client';

import React, { useState, useEffect, useCallback } from 'react';
import AdminShell from '@/components/admin/AdminShell';
import { useAdmin } from '@/components/admin/AdminShell';

const PRIORITY_COLORS: Record<string, { bg: string; text: string }> = {
  low:    { bg: 'var(--as-badge-gray)', text: 'var(--as-badge-gray-text)' },
  medium: { bg: 'var(--as-badge-blue)', text: 'var(--as-badge-blue-text)' },
  high:   { bg: 'var(--as-badge-red)',  text: 'var(--as-badge-red-text)' },
};
const STATUS_COLS = [
  { key: 'todo',        label: 'To Do',       color: 'var(--as-badge-gray-text)' },
  { key: 'in_progress', label: 'In Progress',  color: 'var(--as-badge-blue-text)' },
  { key: 'done',        label: 'Done',         color: 'var(--as-badge-green-text)' },
];

function NewTaskModal({ onClose, onDone }: { onClose: () => void; onDone: () => void }) {
  const [form, setForm] = useState({ title: '', description: '', priority: 'medium', assignedTo: '', assignedToName: '', deadline: '' });
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch('/api/admin/users').then(r => r.json()).then(d => setUsers(d.users || [])).catch(() => {});
  }, []);

  function onSelectUser(e: React.ChangeEvent<HTMLSelectElement>) {
    const u = users.find((u: any) => u.employeeId === e.target.value);
    setForm(f => ({ ...f, assignedTo: e.target.value, assignedToName: u?.name || '' }));
  }

  async function submit() {
    if (!form.title || !form.assignedTo) { setError('Title and assignee required.'); return; }
    setLoading(true); setError('');
    try {
      const res = await fetch('/api/admin/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, deadline: form.deadline ? new Date(form.deadline).toISOString() : null }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'Failed.'); return; }
      onDone();
    } finally {
      setLoading(false);
    }
  }

  const INPUT: React.CSSProperties = { width: '100%', padding: '9px 12px', fontSize: 13, border: '1px solid var(--as-input-border)', borderRadius: 6, background: 'var(--as-input-bg)', color: 'var(--as-text)', boxSizing: 'border-box' };

  return (
    <>
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 300 }} />
      <div style={{ position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', background: 'var(--as-card)', border: '1px solid var(--as-border)', borderRadius: 12, padding: 28, width: 440, maxWidth: '92vw', zIndex: 301, boxShadow: '0 8px 32px rgba(0,0,0,0.25)' }}>
        <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--as-text)', marginBottom: 20 }}>Create Task</div>
        <div style={{ marginBottom: 14 }}>
          <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: 'var(--as-muted)', marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Task Title *</label>
          <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="What needs to be done?" style={INPUT} />
        </div>
        <div style={{ marginBottom: 14 }}>
          <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: 'var(--as-muted)', marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Description</label>
          <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={2} placeholder="Optional details..."
            style={{ ...INPUT, resize: 'vertical', fontFamily: 'inherit' }} />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
          <div>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: 'var(--as-muted)', marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Priority</label>
            <select value={form.priority} onChange={e => setForm(f => ({ ...f, priority: e.target.value }))} style={INPUT}>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: 'var(--as-muted)', marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Deadline</label>
            <input type="datetime-local" value={form.deadline} onChange={e => setForm(f => ({ ...f, deadline: e.target.value }))} style={INPUT} />
          </div>
        </div>
        <div style={{ marginBottom: 18 }}>
          <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: 'var(--as-muted)', marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Assign To *</label>
          <select value={form.assignedTo} onChange={onSelectUser} style={INPUT}>
            <option value="">Select employee...</option>
            {users.map((u: any) => <option key={u.employeeId} value={u.employeeId}>{u.name} ({u.employeeId})</option>)}
          </select>
        </div>
        {error && <div style={{ fontSize: 12, color: 'var(--as-badge-red-text)', padding: '8px 10px', background: 'var(--as-badge-red)', borderRadius: 6, marginBottom: 14 }}>{error}</div>}
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={onClose} style={{ flex: 1, padding: '9px', fontSize: 13, cursor: 'pointer', border: '1px solid var(--as-border)', borderRadius: 6, background: 'transparent', color: 'var(--as-text)' }}>Cancel</button>
          <button onClick={submit} disabled={loading} style={{ flex: 1, padding: '9px', fontSize: 13, fontWeight: 600, cursor: 'pointer', background: 'var(--as-accent)', color: '#fff', border: 'none', borderRadius: 6 }}>
            {loading ? 'Creating…' : 'Create Task'}
          </button>
        </div>
      </div>
    </>
  );
}

function TaskCard({ task, onStatusChange }: { task: any; onStatusChange: (id: string, status: string) => void }) {
  const pc = PRIORITY_COLORS[task.priority] || PRIORITY_COLORS.medium;
  const isOverdue = task.deadline && !task.completedAt && new Date(task.deadline) < new Date();
  const initials = (task.assignedToName || task.assignedTo || '?')
    .split(' ').map((n: string) => n[0]).slice(0, 2).join('').toUpperCase();

  return (
    <div style={{
      background: 'var(--as-card)', border: '1px solid var(--as-border)',
      borderRadius: 8, padding: '12px 14px', marginBottom: 8,
      boxShadow: 'var(--as-shadow)',
      borderLeft: `3px solid ${pc.text}`,
      transition: 'box-shadow 0.15s',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 7 }}>
        <span style={{
          padding: '2px 8px', borderRadius: 20, fontSize: 10, fontWeight: 700,
          background: pc.bg, color: pc.text, textTransform: 'uppercase', letterSpacing: '0.05em',
        }}>{task.priority}</span>
        {task.deadline && (
          <span style={{ fontSize: 10, color: isOverdue ? 'var(--as-badge-red-text)' : 'var(--as-muted)', marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 3 }}>
            {isOverdue && '⚠ '}Due {new Date(task.deadline).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
          </span>
        )}
      </div>

      <div style={{ fontWeight: 600, color: 'var(--as-text)', fontSize: 13, marginBottom: 4, lineHeight: 1.3 }}>{task.title}</div>

      {task.description && (
        <div style={{ fontSize: 11.5, color: 'var(--as-muted)', marginBottom: 8, lineHeight: 1.5,
          display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
          {task.description}
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <div style={{
            width: 22, height: 22, borderRadius: 6, background: 'var(--as-accent)',
            color: '#fff', fontSize: 9, fontWeight: 700,
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          }}>{initials}</div>
          <span style={{ fontSize: 11, color: 'var(--as-muted)' }}>{task.assignedToName || task.assignedTo}</span>
        </div>
        {task.status !== 'done' ? (
          <select value={task.status} onChange={e => onStatusChange(task._id, e.target.value)}
            style={{ fontSize: 11, padding: '3px 6px', border: '1px solid var(--as-border)', borderRadius: 4, background: 'var(--as-input-bg)', color: 'var(--as-muted)', cursor: 'pointer' }}>
            <option value="todo">To Do</option>
            <option value="in_progress">In Progress</option>
            <option value="done">Done</option>
          </select>
        ) : (
          <span style={{ fontSize: 10, color: 'var(--as-badge-green-text)', fontWeight: 600 }}>✓ Done</span>
        )}
      </div>
    </div>
  );
}

function TasksContent() {
  const { user } = useAdmin();
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNew, setShowNew] = useState(false);

  const canCreate = user?.role === 'admin' || user?.role === 'super_admin';

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/tasks');
      const data = await res.json();
      setTasks(data.tasks || []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  async function updateStatus(id: string, status: string) {
    await fetch(`/api/admin/tasks/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    fetchData();
  }

  return (
    <>
      {showNew && <NewTaskModal onClose={() => setShowNew(false)} onDone={() => { setShowNew(false); fetchData(); }} />}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h2 style={{ fontSize: 20, fontWeight: 700, color: 'var(--as-text)', margin: 0, letterSpacing: '-0.02em' }}>Tasks</h2>
          <p style={{ fontSize: 13, color: 'var(--as-muted)', margin: '4px 0 0' }}>
            {tasks.length} task{tasks.length !== 1 ? 's' : ''} ·{' '}
            {tasks.filter(t => t.status === 'done').length} done ·{' '}
            {tasks.filter(t => t.priority === 'high' && t.status !== 'done').length} high priority
          </p>
        </div>
        {canCreate && (
          <button onClick={() => setShowNew(true)} style={{ padding: '9px 18px', fontSize: 13, fontWeight: 600, cursor: 'pointer', background: 'var(--as-accent)', color: '#fff', border: 'none', borderRadius: 8 }}>
            + New Task
          </button>
        )}
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: 60, color: 'var(--as-muted)' }}>Loading…</div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
          {STATUS_COLS.map(col => {
            const colTasks = tasks.filter(t => t.status === col.key);
            return (
              <div key={col.key}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: col.color }} />
                  <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--as-text)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{col.label}</span>
                  <span style={{ fontSize: 11, color: 'var(--as-muted)', marginLeft: 'auto' }}>{colTasks.length}</span>
                </div>
                <div style={{ background: 'var(--as-hover)', borderRadius: 8, padding: 8, minHeight: 120 }}>
                  {colTasks.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '20px 0', color: 'var(--as-muted)', fontSize: 12 }}>No tasks</div>
                  ) : colTasks.map(t => (
                    <TaskCard key={t._id} task={t} onStatusChange={updateStatus} />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}

export default function TasksPage() {
  return <AdminShell><TasksContent /></AdminShell>;
}
