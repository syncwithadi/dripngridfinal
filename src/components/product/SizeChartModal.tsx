'use client';

import { useEffect, useRef } from 'react';
import Image from 'next/image';
import { urlFor } from '@/sanity/image';

interface SizeChartModalProps {
    isOpen: boolean;
    onClose: () => void;
    sizeGuideImage?: any;
}

export default function SizeChartModal({ isOpen, onClose, sizeGuideImage }: SizeChartModalProps) {
    const modalRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => {
            document.body.style.overflow = '';
        };
    }, [isOpen]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div
                ref={modalRef}
                className="bg-white w-full max-w-2xl max-h-[90vh] overflow-y-auto relative animate-fadeIn"
            >
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 z-10 w-10 h-10 flex items-center justify-center bg-white/90 rounded-full hover:bg-black hover:text-white transition-colors border border-black/10"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                    </svg>
                </button>

                <div className="p-8 text-center text-black">
                    <h3 className="text-display-sm mb-6 uppercase tracking-widest">Size Guide</h3>

                    {sizeGuideImage ? (
                        <div className="relative w-full aspect-square md:aspect-[4/3]">
                            <Image
                                src={urlFor(sizeGuideImage)?.width(800).url() || ''}
                                alt="Size Guide"
                                fill
                                className="object-contain"
                            />
                        </div>
                    ) : (
                        <div className="py-12 text-gray-400">
                            <p>No size guide available for this product.</p>
                            <p className="text-sm mt-2">Please contact support for sizing help.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
