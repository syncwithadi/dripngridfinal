import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Return & Exchange Policy - DRIPNGRID',
    description: 'Easy returns and exchanges for your DRIPNGRID purchases.',
};

export default function ReturnsPage() {
    return (
        <div className="container-custom py-16 md:py-24 max-w-4xl mx-auto">
            <h1 className="text-3xl md:text-4xl font-light tracking-wide uppercase mb-12 text-center">
                Return & Exchange Policy
            </h1>

            <div className="space-y-12 text-[var(--color-text)]">
                <section className="space-y-4">
                    <h2 className="text-lg font-medium uppercase tracking-widest">Our Promise</h2>
                    <p className="text-[var(--color-text-muted)] leading-relaxed">
                        We want you to be completely satisfied with your purchase. If you're not entirely happy, we're here to help.
                        You have <strong className="text-[var(--color-text)]">7 calendar days</strong> to return an item from the date you received it.
                    </p>
                </section>

                <section className="space-y-4">
                    <h2 className="text-lg font-medium uppercase tracking-widest">Conditions for Returns</h2>
                    <ul className="list-disc pl-5 space-y-2 text-[var(--color-text-muted)] marker:text-[var(--color-text)]">
                        <li>Item must be unused and in the same condition that you received it.</li>
                        <li>Item must be in the original packaging.</li>
                        <li>Item needs to have the receipt or proof of purchase.</li>
                        <li>Tags must be intact and attached.</li>
                    </ul>
                </section>

                <section className="space-y-4">
                    <h2 className="text-lg font-medium uppercase tracking-widest">Refunds</h2>
                    <p className="text-[var(--color-text-muted)] leading-relaxed">
                        Once we receive your item, we will inspect it and notify you that we have received your returned item.
                        We will immediately notify you on the status of your refund after inspecting the item.
                        If your return is approved, we will initiate a refund to your credit card (or original method of payment).
                        You will receive the credit within a certain amount of days, depending on your card issuer's policies.
                    </p>
                </section>

                <section className="space-y-4">
                    <h2 className="text-lg font-medium uppercase tracking-widest">Shipping for Returns</h2>
                    <p className="text-[var(--color-text-muted)] leading-relaxed">
                        You will be responsible for paying for your own shipping costs for returning your item. Shipping costs are non-refundable.
                        If you verify a defect from our side, we will cover the return shipping costs.
                    </p>
                </section>

                <section className="p-6 bg-[var(--color-bg-secondary)] text-center">
                    <h3 className="text-sm font-medium uppercase tracking-widest mb-2">Need to start a return?</h3>
                    <p className="text-[var(--color-text-muted)] mb-4 text-sm">Send us an email with your Order ID.</p>
                    <a href="mailto:support@dripngrid.in" className="inline-block px-6 py-2 border border-[var(--color-border)] hover:bg-[var(--color-text)] hover:text-[var(--color-bg)] transition-colors text-sm uppercase tracking-wider">
                        Contact Support
                    </a>
                </section>
            </div>
        </div>
    );
}
