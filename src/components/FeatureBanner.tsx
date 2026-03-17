'use client';

import Image from 'next/image';

interface FeatureBannerProps {
    featuredImages?: {
        id: string | number;
        title: string;
        image: string;
    }[];
}

export default function FeatureBanner({ featuredImages = [] }: FeatureBannerProps) {
    // Use passed images or fallback to specific static ones if list is empty
    const image1 = featuredImages[0]?.image || "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=600&q=80";
    const image2 = featuredImages[1]?.image || "https://images.unsplash.com/photo-1529139574466-a303027c1d8b?w=600&q=80";

    return (
        <section className="relative py-32 overflow-hidden bg-black border-t border-white/10">
            {/* Background Image with Overlay */}
            <div className="absolute inset-0 z-0">
                <Image
                    src="https://images.unsplash.com/photo-1617325247661-675ab4b64ae4?q=80&w=2071&auto=format&fit=crop"
                    alt="Community background"
                    fill
                    className="object-cover opacity-60 grayscale hover:grayscale-0 transition-all duration-1000"
                />
                {/* Gradient Overlay for text readability */}
                <div className="absolute inset-0 bg-gradient-to-r from-black via-black/70 to-transparent pointer-events-none" />
            </div>

            <div className="container-custom relative z-10">
                <div className="flex flex-col lg:flex-row items-center justify-between">

                    {/* Content Side */}
                    <div className="max-w-2xl">
                        <div className="flex items-center gap-4 mb-6">
                            <span className="px-3 py-1 bg-red-600 text-white text-[10px] font-bold tracking-widest uppercase">
                                Community Spotlight
                            </span>
                            <span className="h-[1px] w-12 bg-white/50"></span>
                        </div>

                        <h2 className="text-5xl md:text-7xl lg:text-8xl font-black text-white tracking-tighter mb-8 leading-[0.9]">
                            WANT TO BE <br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-500 hover:text-white transition-colors duration-500 cursor-default">
                                FEATURED?
                            </span>
                        </h2>

                        <p className="text-lg md:text-xl text-gray-300 mb-10 max-w-lg leading-relaxed font-light">
                            Your style, our grid. Tag <span className="text-white font-medium">@dripngrid</span> in your fits or send a photo/video to secure your spot on our official grid and homepage.
                        </p>

                        <div className="flex flex-wrap gap-4">
                            <a
                                href="https://instagram.com/dripngrid"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="group inline-flex items-center gap-3
                                           px-7 py-3.5 rounded-2xl
                                           bg-white/10 backdrop-blur-md
                                           border border-white/25
                                           text-white text-[11px] font-semibold tracking-[0.18em] uppercase
                                           hover:bg-white/20 hover:border-white/45
                                           active:scale-[0.97]
                                           transition-all duration-300 ease-out
                                           shadow-[0_8px_24px_rgba(0,0,0,0.25)]"
                            >
                                <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                                </svg>
                                <span className="transition-transform duration-300 group-hover:translate-x-0.5">
                                    Submit on Instagram
                                </span>
                            </a>
                        </div>
                    </div>

                    {/* Visual Elements - Floating "Polaroids" */}
                    <div className="hidden lg:flex relative w-1/2 h-[400px] items-center justify-center pointer-events-none">
                        {/* Image 1 */}
                        <div className="absolute right-20 top-0 w-64 h-80 bg-white p-2 shadow-2xl rotate-6 transform hover:rotate-2 hover:scale-105 transition-all duration-500 z-10">
                            <div className="relative w-full h-full grayscale hover:grayscale-0 transition-all duration-500">
                                <Image src={image1} fill className="object-cover" alt="Community feature" />
                            </div>
                            <div className="absolute bottom-4 left-0 right-0 text-center">
                                <span className="text-black text-[10px] font-bold tracking-widest uppercase opacity-0">@user_style</span>
                            </div>
                        </div>

                        {/* Image 2 */}
                        <div className="absolute right-60 top-20 w-56 h-72 bg-white p-2 shadow-2xl -rotate-6 transform hover:rotate-0 hover:scale-105 transition-all duration-500 z-0">
                            <div className="relative w-full h-full grayscale hover:grayscale-0 transition-all duration-500">
                                <Image src={image2} fill className="object-cover" alt="Community feature" />
                            </div>
                        </div>

                        <div className="absolute right-10 bottom-10 w-24 h-24 bg-red-600 rounded-full flex items-center justify-center animate-bounce">
                            <span className="text-white text-xs font-bold uppercase text-center leading-tight">
                                Get<br />Feats
                            </span>
                        </div>
                    </div>

                </div>
            </div>
        </section>
    );
}
