'use client';

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
    return (
        <section
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

            {/* View Collection CTA — lower centre */}
            <div className="absolute bottom-10 md:bottom-14 left-0 right-0 z-10 flex justify-center">
                <a
                    href={showcaseButtonLink || '/shop'}
                    className="inline-flex items-center px-5 py-2 border border-white text-white text-[10px] font-semibold tracking-[0.18em] uppercase rounded-xl"
                >
                    {showcaseButtonText || 'View Collection'}
                </a>
            </div>
        </section>
    );
}
