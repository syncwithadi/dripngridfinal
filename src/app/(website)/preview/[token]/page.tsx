import { sanityClient } from '@/sanity/client';
import { notFound } from 'next/navigation';
import ProductContent from '@/app/(website)/product/[slug]/ProductContent';

export const revalidate = 0; // Prevent caching for preview links

export default async function PreviewPage({ params }: { params: Promise<{ token: string }> }) {
    const { token } = await params;

    // Validate the token
    const tokenDoc = await sanityClient.fetch(
        `*[_type == "previewToken" && token == $token][0]{
            expiresAt,
            generatedBy,
            "product": product->{
                _id, name, slug, priceINR, originalPriceINR, badge, gender,
                sizes, colors, description, material,
                "images": {
                    "front": images.front,
                    "back": images.back,
                    "left": images.left,
                    "right": images.right,
                    "detail": images.detail
                },
                sizeGuide,
                inStock
            }
        }`,
        { token } as any
    );

    if (!tokenDoc) {
        return (
            <div className="min-h-[70vh] flex flex-col items-center justify-center p-8 text-center bg-white">
                <h1 className="text-3xl font-bold mb-4 tracking-tight">Preview Link Invalid</h1>
                <p className="text-gray-600 max-w-md">This preview link is invalid or does not exist.</p>
            </div>
        );
    }

    if (new Date(tokenDoc.expiresAt) < new Date()) {
        return (
            <div className="min-h-[70vh] flex flex-col items-center justify-center p-8 text-center bg-white">
                <h1 className="text-3xl font-bold mb-4 tracking-tight">Preview Link Expired</h1>
                <p className="text-gray-600 max-w-md">This 5-minute secure preview link has expired. Please generate a new one from the admin panel.</p>
            </div>
        );
    }

    if (!tokenDoc.product) {
        return notFound();
    }

    return (
        <div className="relative">
            {/* Admin Banner overlay */}
            <div className="bg-black text-white text-[10px] font-bold tracking-widest uppercase py-2 text-center flex items-center justify-center gap-2 z-50 relative">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
                Secure Preview Mode — Link expires at {new Date(tokenDoc.expiresAt).toLocaleTimeString()}
            </div>
            
            <ProductContent 
                product={tokenDoc.product} 
                relatedProducts={[]} 
                isPreviewMode={true} 
                previewToken={token} 
            />
        </div>
    );
}
