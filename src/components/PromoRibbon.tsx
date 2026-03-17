'use client';

export default function PromoRibbon() {
  const messages = [
    'Flat 10% off on prepaid orders',
    'Free delivery on orders above ₹499',
    'Easy returns within 7 days',
    'Premium quality guaranteed',
  ];

  // Double the messages for seamless loop
  const allMessages = [...messages, ...messages];

  return (
    <div className="promo-ribbon overflow-hidden bg-[var(--color-inverted-bg)] text-[var(--color-inverted-text)] py-2.5">
      <div className="promo-ribbon-track flex whitespace-nowrap">
        {allMessages.map((message, index) => (
          <span
            key={index}
            className="inline-flex items-center text-[10px] md:text-xs font-medium tracking-widest uppercase mx-8 md:mx-12"
          >
            <span className="w-1 h-1 rounded-full bg-current mr-4 opacity-60" />
            {message}
          </span>
        ))}
      </div>
    </div>
  );
}
