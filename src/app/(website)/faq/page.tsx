import type { Metadata } from 'next';
import FAQSection from '@/components/product/FAQSection';

export const metadata: Metadata = {
    title: 'Frequently Asked Questions - DRIPNGRID',
    description: 'Answers to common questions about DRIPNGRID products and services.',
};

export default function FAQPage() {
    return (
        <div className="container-custom py-16 md:py-24 max-w-4xl mx-auto">
            <h1 className="text-3xl md:text-4xl font-light tracking-wide uppercase mb-12 text-center">
                Frequently Asked Questions
            </h1>

            {/* Reusing the FAQ Section component but providing it slightly different context if needed, 
          or just using it as is since it's generic enough */}
            <FAQSection />

            <div className="mt-16 text-center">
                <p className="text-[var(--color-text-muted)] mb-4">
                    Still have questions? We're here to help.
                </p>
                <a
                    href="mailto:support@dripngrid.in"
                    className="text-sm font-medium underline hover:text-[var(--color-text-muted)] transition-colors"
                >
                    Contact Support
                </a>
            </div>
        </div>
    );
}
