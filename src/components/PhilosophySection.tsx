'use client';

import Image from 'next/image';

interface PhilosophyData {
    isActive: boolean;
    title: string;
    subtitle: string;
    description: string;
    image: string;
    stats?: {
        value: string;
        label: string;
    }[];
}

interface PhilosophySectionProps {
    data?: PhilosophyData;
}

export default function PhilosophySection({ data }: PhilosophySectionProps) {
    // Use data or fallback to defaults
    const content = {
        title: data?.title || 'Crafted with Intention',
        subtitle: data?.subtitle || 'Philosophy',
        description: data?.description || 'DRIPNGRID was founded on a simple belief: that clothing should be both beautiful and enduring. We reject fast fashion in favor of timeless pieces.',
        image: data?.image || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=800&q=80',
        stats: data?.stats || [
            { value: '50K+', label: 'Customers' },
            { value: '200+', label: 'Designs' },
            { value: '15+', label: 'Countries' },
        ],
    };

    // If explicitly disabled in Sanity, don't render (unless fallback is wanted, but usually isActive means show/hide)
    if (data && data.isActive === false) {
        return null;
    }

    return (
        <section className="py-24 bg-black text-white overflow-hidden">
            <div className="container-custom">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
                    {/* Image */}
                    <div className="relative aspect-[4/5] lg:aspect-square w-full bg-gray-900 overflow-hidden group">
                        <Image
                            src={content.image}
                            alt={content.title}
                            fill
                            className="object-cover transition-transform duration-700 group-hover:scale-105 opacity-90 group-hover:opacity-100"
                        />
                        {/* Decorative overlay */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent pointer-events-none" />
                    </div>

                    {/* Text Content */}
                    <div className="flex flex-col justify-center">
                        <span className="text-sm tracking-[0.2em] text-gray-400 uppercase mb-6">
                            {content.subtitle}
                        </span>
                        <h2 className="text-4xl md:text-5xl lg:text-6xl font-light tracking-wide mb-8 leading-tight">
                            {content.title}
                        </h2>
                        <div className="text-gray-400 text-lg leading-relaxed space-y-6 max-w-xl">
                            <p>{content.description}</p>
                            <p className="text-sm italic opacity-80">
                                Every garment is crafted with premium materials and meticulous attention to detail.
                            </p>
                        </div>

                        {/* Stats */}
                        <div className="grid grid-cols-3 gap-8 mt-16 border-t border-white/10 pt-12">
                            {content.stats.map((stat, index) => (
                                <div key={index}>
                                    <div className="text-3xl md:text-4xl font-light mb-2">
                                        {stat.value}
                                    </div>
                                    <div className="text-xs uppercase tracking-widest text-gray-500">
                                        {stat.label}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
