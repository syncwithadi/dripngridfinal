export default async function Page({ params }: { params: Promise<{ page: string }> }) {
    const slug = (await params).page;
    const title = slug.replace(/-/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());

    return (
        <div className="min-h-[60vh] flex flex-col items-center justify-center p-8 bg-[var(--color-bg)]">
            <div className="max-w-2xl text-center space-y-6">
                <h1 className="text-4xl md:text-5xl font-light tracking-wide uppercase">
                    {title}
                </h1>
                <div className="w-16 h-1 bg-[var(--color-text)] mx-auto opacity-20" />
                <p className="text-[var(--color-text-muted)] text-lg leading-relaxed">
                    This page is currently under construction.
                    Please check back later for detailed information about our {title.toLowerCase()}.
                </p>
                <div className="pt-8">
                    <a
                        href="/"
                        className="inline-flex items-center text-sm font-medium uppercase tracking-widest hover:text-[var(--color-text-muted)] transition-colors"
                    >
                        ← Return Home
                    </a>
                </div>
            </div>
        </div>
    );
}
