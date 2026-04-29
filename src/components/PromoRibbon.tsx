'use client';

const MESSAGES = [
  'Flat 10% off on prepaid orders',
  'Free delivery on orders above ₹499',
  'Easy returns within 7 days',
  'Premium quality guaranteed',
];

// 4 copies so content is always wider than any screen (including 4K)
// Animation moves -25% = exactly one copy width — perfectly seamless
const COPIES = [...MESSAGES, ...MESSAGES, ...MESSAGES, ...MESSAGES];

export default function PromoRibbon() {
  return (
    <div
      style={{
        overflow: 'hidden',
        background: 'var(--color-inverted-bg)',
        color: 'var(--color-inverted-text)',
        padding: '10px 0',
      }}
    >
      <style>{`
        @keyframes promoScroll {
          from { transform: translateX(0); }
          to   { transform: translateX(-25%); }
        }
        .promo-track {
          display: inline-flex;
          flex-wrap: nowrap;
          white-space: nowrap;
          width: max-content;
          animation: promoScroll 32s linear infinite;
          will-change: transform;
        }
        .promo-track:hover {
          animation-play-state: paused;
        }
      `}</style>
      <div className="promo-track">
        {COPIES.map((msg, i) => (
          <span
            key={i}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              fontSize: '10px',
              fontWeight: 500,
              letterSpacing: '0.18em',
              textTransform: 'uppercase',
              padding: '0 2.5rem',
              whiteSpace: 'nowrap',
              flexShrink: 0,
            }}
          >
            <span
              style={{
                width: 4,
                height: 4,
                borderRadius: '50%',
                background: 'currentColor',
                marginRight: 14,
                opacity: 0.5,
                flexShrink: 0,
              }}
            />
            {msg}
          </span>
        ))}
      </div>
    </div>
  );
}
