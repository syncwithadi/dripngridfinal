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
                    className="object-cover w-full h-full"
                />
            </div>

            {/* Single glassmorphism CTA */}
            <div ref={textRef} className="relative z-10 flex items-center justify-center" style={{ marginTop: "30vh" }}>
                <a
                    href={showcaseButtonLink || '/shop'}
                    className="inline-flex items-center px-6 py-2.5
                               border border-white text-white text-[11px] font-semibold tracking-[0.18em] uppercase rounded-xl"
                >
                    {showcaseButtonText || 'View Collection'}
                </a>
            </div>
        </section>
    );
}
