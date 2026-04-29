'use client';

import { useEffect } from 'react';

const AWAY_TITLES = [
    'We miss you! 💔',
    '🔥 Don\'t miss out!',
    '👀 Come back!',
    '⚡️ New drops waiting!',
];
const DEFAULT_TITLE = 'DRIP N GRID';

export default function TabTitleEffect() {
    useEffect(() => {
        let intervalId: ReturnType<typeof setInterval> | null = null;
        let titleIndex = 0;

        const handleVisibilityChange = () => {
            if (document.hidden) {
                // User switched away — start cycling
                titleIndex = 0;
                document.title = AWAY_TITLES[titleIndex];
                intervalId = setInterval(() => {
                    titleIndex = (titleIndex + 1) % AWAY_TITLES.length;
                    document.title = AWAY_TITLES[titleIndex];
                }, 2000);
            } else {
                // User came back — clear and reset
                if (intervalId) {
                    clearInterval(intervalId);
                    intervalId = null;
                }
                document.title = DEFAULT_TITLE;
            }
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);
        return () => {
            document.removeEventListener('visibilitychange', handleVisibilityChange);
            if (intervalId) clearInterval(intervalId);
        };
    }, []);

    return null;
}
