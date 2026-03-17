'use client';

import { useMemo } from 'react';

// Deterministic random number generator
function seededRandom(seed: string) {
    let h = 0x811c9dc5;
    for (let i = 0; i < seed.length; i++) {
        h ^= seed.charCodeAt(i);
        h = Math.imul(h, 0x01000193);
    }
    return function () {
        h = Math.imul(h ^ (h >>> 13), 0x5bd1e995);
        h ^= h >>> 15;
        return (h >>> 0) / 4294967296;
    };
}

interface ReviewSystemProps {
    productId: string;
}

export default function ReviewSystem({ productId }: ReviewSystemProps) {
    // Generate stable random stats based on product ID
    const { rating, count } = useMemo(() => {
        const random = seededRandom(productId);
        // Rating between 4.2 and 5.0
        const rating = (4.2 + (random() * 0.8)).toFixed(1);
        // Count between 12 and 125
        const count = Math.floor(12 + (random() * 113));
        return { rating, count };
    }, [productId]);

    return (
        <div className="flex items-center gap-2 mb-4">
            <div className="flex text-[var(--color-text)]">
                {[1, 2, 3, 4, 5].map((star) => (
                    <svg
                        key={star}
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        fill="currentColor"
                        className={`w-4 h-4 ${star <= Number(rating) ? 'text-[var(--color-text)]' : 'text-gray-300 dark:text-gray-600'}`}
                    >
                        <path
                            fillRule="evenodd"
                            d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.007 5.404.433c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.433 2.082-5.006z"
                            clipRule="evenodd"
                        />
                    </svg>
                ))}
            </div>
            <span className="text-sm font-medium underline cursor-pointer hover:text-[var(--color-text-muted)] text-[var(--color-text)]">
                {rating} ({count} reviews)
            </span>
        </div>
    );
}
