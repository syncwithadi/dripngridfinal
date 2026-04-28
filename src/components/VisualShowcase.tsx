'use client';

import { useRef, useEffect } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

interface VisualShowcaseProps {
    showcaseImage?: string | null;
    showcaseButtonText?: string | null;
    showcaseButtonLink?: string | null;
}

export default function VisualShowcase({
    showcaseImage,
    showcaseButtonText = 'View Collection',
    showcaseButtonLink = '/shop',
}: VisualShowcaseProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const textRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const ctx = gsap.context(() => {
            // Parallax effect for text
            gsap.to(textRef.current, {
                y: -50,
                ease: 'none',
                scrollTrigger: {
                    trigger: containerRef.current,
                    start: 'top bottom',
                    end: 'bottom top',
                    scrub: true,
                },
            });
        }, containerRef);

        return () => ctx.revert();
    }, []);

    return (
        <section
            ref={containerRef}
            className="relative h-[80vh] min-h-[600px] w-full overflow-hidden bg-black flex items-center justify-center"
        >
            {/* Background Image — Sanity-controlled, with Unsplash fallback */}
            <div className="absolute inset-0 z-0">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                    src="/images/view collection poster.png"
                    alt="Visual Showcase"
                    className="object-cover w-full h-full opacity-80"
                />
                {/* Gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-black/40 pointer-events-none" />
            </div>

            {/* Single glassmorphism CTA */}
            <div ref={textRef} className="relative z-10 flex items-center justify-center" style={{ marginTop: "30vh" }}>
                <a
                    href={showcaseButtonLink || '/shop'}
                    className="group inline-flex items-center gap-3
                               px-9 py-4 rounded-2xl
                               bg-white/10 backdrop-blur-md
                               border border-white/25
                               text-white text-[11px] font-semibold tracking-[0.22em] uppercase
                               hover:bg-white/20 hover:border-white/45
                               active:scale-[0.97]
                               transition-all duration-300 ease-out
                               shadow-[0_8px_32px_rgba(0,0,0,0.3)]"
                >
                    {showcaseButtonText || 'View Collection'}
                    <svg
                        className="w-3.5 h-3.5 transition-transform duration-300 group-hover:translate-x-1"
                        fill="none" stroke="currentColor" viewBox="0 0 24 24"
                    >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.25 8.25L21 12m0 0l-3.75 3.75M21 12H3" />
                    </svg>
                </a>
            </div>
        </section>
    );
}
