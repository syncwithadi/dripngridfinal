import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Shipping Policy - DRIPNGRID',
    description: 'Information about DRIPNGRID shipping policies, delivery times, and rates.',
};

export default function ShippingPage() {
    return (
        <div className="container-custom py-16 md:py-24 max-w-4xl mx-auto">
            <h1 className="text-3xl md:text-4xl font-light tracking-wide uppercase mb-12 text-center">
                Shipping Policy
            </h1>

            <div className="space-y-12 text-[var(--color-text)]">
                <section className="space-y-4">
                    <h2 className="text-lg font-medium uppercase tracking-widest">Processing Time</h2>
                    <p className="text-[var(--color-text-muted)] leading-relaxed">
                        All orders are processed within 1-2 business days. Orders are not shipped or delivered on weekends or holidays.
                        If we are experiencing a high volume of orders, shipments may be delayed by a few days. Please allow additional days in transit for delivery.
                    </p>
                </section>

                <section className="space-y-4">
                    <h2 className="text-lg font-medium uppercase tracking-widest">Shipping Rates & Estimates</h2>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-[var(--color-text-muted)]">
                            <thead className="text-[var(--color-text)] bg-[var(--color-bg-secondary)] uppercase tracking-wider text-xs">
                                <tr>
                                    <th className="px-6 py-4 text-left font-medium">Order Value</th>
                                    <th className="px-6 py-4 text-left font-medium">Shipping Cost</th>
                                    <th className="px-6 py-4 text-left font-medium">Estimated Time</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[var(--color-border)]">
                                <tr>
                                    <td className="px-6 py-4">Above ₹499</td>
                                    <td className="px-6 py-4 font-medium text-green-600">FREE</td>
                                    <td className="px-6 py-4">3-5 Business Days</td>
                                </tr>
                                <tr>
                                    <td className="px-6 py-4">Below ₹499</td>
                                    <td className="px-6 py-4">₹99</td>
                                    <td className="px-6 py-4">3-5 Business Days</td>
                                </tr>
                                <tr>
                                    <td className="px-6 py-4">Express</td>
                                    <td className="px-6 py-4">₹199</td>
                                    <td className="px-6 py-4">1-2 Business Days</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </section>

                <section className="space-y-4">
                    <h2 className="text-lg font-medium uppercase tracking-widest">Shipment Confirmation & Order Tracking</h2>
                    <p className="text-[var(--color-text-muted)] leading-relaxed">
                        You will receive a Shipment Confirmation email once your order has shipped containing your tracking number(s).
                        The tracking number will be active within 24 hours.
                    </p>
                </section>

                <section className="space-y-4">
                    <h2 className="text-lg font-medium uppercase tracking-widest">International Shipping</h2>
                    <p className="text-[var(--color-text-muted)] leading-relaxed">
                        We currently do not ship outside of India. Stay tuned for updates on our international expansion.
                    </p>
                </section>
            </div>
        </div>
    );
}
