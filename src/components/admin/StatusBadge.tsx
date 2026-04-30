'use client';

// Status → visual config mapping
const STATUS_MAP: Record<string, { bg: string; text: string; label: string; dot?: string }> = {
  confirmed:        { bg: 'var(--as-badge-green)',  text: 'var(--as-badge-green-text)',  label: 'Confirmed',   dot: 'var(--as-badge-green-text)' },
  processing:       { bg: 'var(--as-badge-yellow)', text: 'var(--as-badge-yellow-text)', label: 'Processing',  dot: 'var(--as-badge-yellow-text)' },
  shipped:          { bg: 'var(--as-badge-blue)',   text: 'var(--as-badge-blue-text)',   label: 'Shipped',     dot: 'var(--as-badge-blue-text)' },
  'in-transit':     { bg: 'var(--as-badge-blue)',   text: 'var(--as-badge-blue-text)',   label: 'In Transit',  dot: 'var(--as-badge-blue-text)' },
  delivered:        { bg: 'var(--as-badge-green)',  text: 'var(--as-badge-green-text)',  label: 'Delivered',   dot: 'var(--as-badge-green-text)' },
  cancelled:        { bg: 'var(--as-badge-red)',    text: 'var(--as-badge-red-text)',    label: 'Cancelled',   dot: 'var(--as-badge-red-text)' },
  failed:           { bg: 'var(--as-badge-red)',    text: 'var(--as-badge-red-text)',    label: 'Failed',      dot: 'var(--as-badge-red-text)' },
  pending:          { bg: 'var(--as-badge-yellow)', text: 'var(--as-badge-yellow-text)', label: 'Pending',    dot: 'var(--as-badge-yellow-text)' },
  pending_payment:  { bg: 'var(--as-badge-yellow)', text: 'var(--as-badge-yellow-text)', label: 'Pending',    dot: 'var(--as-badge-yellow-text)' },
  paid:             { bg: 'var(--as-badge-green)',  text: 'var(--as-badge-green-text)',  label: 'Paid',        dot: 'var(--as-badge-green-text)' },
  free:             { bg: 'var(--as-badge-purple)', text: 'var(--as-badge-purple-text)', label: 'Free',        dot: 'var(--as-badge-purple-text)' },
  refunded:         { bg: 'var(--as-badge-gray)',   text: 'var(--as-badge-gray-text)',   label: 'Refunded',    dot: 'var(--as-badge-gray-text)' },
  otp_sent:         { bg: 'var(--as-badge-blue)',   text: 'var(--as-badge-blue-text)',   label: 'OTP Sent',    dot: 'var(--as-badge-blue-text)' },
  approved:         { bg: 'var(--as-badge-green)',  text: 'var(--as-badge-green-text)',  label: 'Approved',    dot: 'var(--as-badge-green-text)' },
  rejected:         { bg: 'var(--as-badge-red)',    text: 'var(--as-badge-red-text)',    label: 'Rejected',    dot: 'var(--as-badge-red-text)' },
  active:           { bg: 'var(--as-badge-green)',  text: 'var(--as-badge-green-text)',  label: 'Active',      dot: 'var(--as-badge-green-text)' },
  inactive:         { bg: 'var(--as-badge-gray)',   text: 'var(--as-badge-gray-text)',   label: 'Inactive',    dot: 'var(--as-badge-gray-text)' },
  verified:         { bg: 'var(--as-badge-blue)',   text: 'var(--as-badge-blue-text)',   label: 'Verified',    dot: 'var(--as-badge-blue-text)' },
  suspended:        { bg: 'var(--as-badge-red)',    text: 'var(--as-badge-red-text)',    label: 'Suspended',   dot: 'var(--as-badge-red-text)' },
  enabled:          { bg: 'var(--as-badge-green)',  text: 'var(--as-badge-green-text)',  label: 'Enabled',     dot: 'var(--as-badge-green-text)' },
  disabled:         { bg: 'var(--as-badge-gray)',   text: 'var(--as-badge-gray-text)',   label: 'Disabled',    dot: 'var(--as-badge-gray-text)' },
};

export default function StatusBadge({ status }: { status: string }) {
  const cfg = STATUS_MAP[status?.toLowerCase()] || {
    bg: 'var(--as-badge-gray)',
    text: 'var(--as-badge-gray-text)',
    label: status || '—',
    dot: 'var(--as-badge-gray-text)',
  };

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 5,
        padding: '3px 9px',
        borderRadius: 99,
        fontSize: 11,
        fontWeight: 500,
        letterSpacing: '0.02em',
        background: cfg.bg,
        color: cfg.text,
        whiteSpace: 'nowrap',
        lineHeight: 1.4,
      }}
    >
      <span style={{
        width: 5, height: 5, borderRadius: '50%',
        background: cfg.text, flexShrink: 0, opacity: 0.85,
      }} />
      {cfg.label}
    </span>
  );
}
