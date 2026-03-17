'use client';

import { useState } from 'react';
import Image from 'next/image';
import { urlFor } from '@/sanity/image';

interface ProductGalleryProps {
    images: {
        front?: any;
        back?: any;
        left?: any;
        right?: any;
        detail?: any;
    };
    productName: string;
}

export default function ProductGallery({ images, productName }: ProductGalleryProps) {
    // Normalize images to array
    const imageList = [
        { key: 'front', asset: images?.front },
        { key: 'back', asset: images?.back },
        { key: 'left', asset: images?.left },
        { key: 'right', asset: images?.right },
        { key: 'detail', asset: images?.detail },
    ].filter(img => img.asset?.asset); // Filter out missing images

    const [selectedImage, setSelectedImage] = useState(imageList[0] || null);

    if (!selectedImage) return <div className="bg-gray-100 aspect-[3/4] w-full" />;

    return (
        <div className="flex flex-col-reverse lg:flex-row gap-4 lg:sticky lg:top-24">
            {/* Thumbnails */}
            <div className="flex lg:flex-col gap-4 overflow-x-auto lg:overflow-y-auto no-scrollbar lg:h-[calc(100vh-200px)] lg:w-24 flex-shrink-0">
                {imageList.map((img, index) => (
                    <button
                        key={img.key}
                        onClick={() => setSelectedImage(img)}
                        className={`relative w-20 h-24 lg:w-full lg:h-32 flex-shrink-0 border transition-all ${selectedImage.key === img.key
                            ? 'border-[var(--color-text)] opacity-100'
                            : 'border-transparent opacity-60 hover:opacity-100'
                            }`}
                    >
                        <Image
                            src={urlFor(img.asset)?.width(200).url() || ''}
                            alt={`${productName} - ${img.key} view`}
                            fill
                            className="object-cover"
                        />
                    </button>
                ))}
            </div>

            {/* Main Image */}
            <div className="relative flex-1 aspect-[3/4] bg-gray-50 overflow-hidden">
                <Image
                    src={urlFor(selectedImage.asset)?.width(1200).url() || ''}
                    alt={`${productName} - ${selectedImage.key} view`}
                    fill
                    className="object-cover"
                    priority
                />
            </div>
        </div>
    );
}
