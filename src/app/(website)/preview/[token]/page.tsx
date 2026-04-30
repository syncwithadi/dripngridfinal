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
            {/* Premium Admin Banner */}
            <div className="w-full relative z-50 overflow-hidden bg-[#0a0a0a] border-b border-white/10 min-h-[44px] flex items-center">
                {/* Subtle gradient glow */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/[0.03] to-transparent pointer-events-none"></div>
                
                <div className="max-w-7xl w-full mx-auto px-6 py-2 sm:py-0 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 relative">
                    <div className="flex items-center gap-3">
                        {/* Animated recording/live dot */}
                        <div className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-60"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                        </div>
                        
                        <div className="flex items-center gap-1.5">
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="text-white/40" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
                            <span className="text-[10px] sm:text-xs font-bold uppercase tracking-[0.2em] text-white/90 leading-none translate-y-[1px]">
                                Secure Preview
                            </span>
                        </div>
                    </div>

                    <span className="hidden sm:inline-block w-px h-3 bg-white/10"></span>
                    
                    <div className="text-[10px] sm:text-xs font-medium text-white/50 tracking-wider flex items-center leading-none translate-y-[1px]">
                        EXPIRES AT <span className="text-white/90 font-bold ml-1.5">{new Date(tokenDoc.expiresAt).toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata', hour: '2-digit', minute: '2-digit', hour12: true })} IST</span>
                    </div>
                </div>
                
                {/* Thin loading/progress strip aesthetic */}
                <div className="absolute bottom-0 left-0 h-[1px] bg-gradient-to-r from-transparent via-green-500/50 to-transparent w-full"></div>
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
