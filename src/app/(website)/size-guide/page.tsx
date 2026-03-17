import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Size Guide - DRIPNGRID',
    description: 'Find your perfect fit with our detailed size charts.',
};

export default function SizeGuidePage() {
    return (
        <div className="container-custom py-16 md:py-24 max-w-4xl mx-auto">
            <h1 className="text-3xl md:text-4xl font-light tracking-wide uppercase mb-8 text-center">
                Size Guide
            </h1>
            <p className="text-center text-[var(--color-text-muted)] mb-16 max-w-2xl mx-auto">
                All measurements are properly defined. We recommend taking your own measurements
                to ensure the perfect fit. Our cuts are generally true to size unless stated otherwise.
            </p>

            <div className="space-y-16">
                {/* Tops */}
                <section>
                    <h2 className="text-xl font-light uppercase tracking-widest mb-6 border-b border-[var(--color-border)] pb-4">
                        Tops (Tees, Hoodies, Jackets)
                    </h2>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-[var(--color-text-muted)] text-center">
                            <thead className="text-[var(--color-text)] bg-[var(--color-bg-secondary)] uppercase tracking-wider text-xs">
                                <tr>
                                    <th className="px-4 py-3 font-medium">Size</th>
                                    <th className="px-4 py-3 font-medium">Chest (in)</th>
                                    <th className="px-4 py-3 font-medium">Length (in)</th>
                                    <th className="px-4 py-3 font-medium">Shoulder (in)</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[var(--color-border)]">
                                <tr>
                                    <td className="px-4 py-3 font-bold text-[var(--color-text)]">S</td>
                                    <td className="px-4 py-3">38 - 40</td>
                                    <td className="px-4 py-3">27</td>
                                    <td className="px-4 py-3">17</td>
                                </tr>
                                <tr>
                                    <td className="px-4 py-3 font-bold text-[var(--color-text)]">M</td>
                                    <td className="px-4 py-3">40 - 42</td>
                                    <td className="px-4 py-3">28</td>
                                    <td className="px-4 py-3">18</td>
                                </tr>
                                <tr>
                                    <td className="px-4 py-3 font-bold text-[var(--color-text)]">L</td>
                                    <td className="px-4 py-3">42 - 44</td>
                                    <td className="px-4 py-3">29</td>
                                    <td className="px-4 py-3">19</td>
                                </tr>
                                <tr>
                                    <td className="px-4 py-3 font-bold text-[var(--color-text)]">XL</td>
                                    <td className="px-4 py-3">44 - 46</td>
                                    <td className="px-4 py-3">30</td>
                                    <td className="px-4 py-3">20</td>
                                </tr>
                                <tr>
                                    <td className="px-4 py-3 font-bold text-[var(--color-text)]">XXL</td>
                                    <td className="px-4 py-3">46 - 48</td>
                                    <td className="px-4 py-3">31</td>
                                    <td className="px-4 py-3">21</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </section>

                {/* Bottoms */}
                <section>
                    <h2 className="text-xl font-light uppercase tracking-widest mb-6 border-b border-[var(--color-border)] pb-4">
                        Bottoms (Jeans, Trousers, Cargos)
                    </h2>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-[var(--color-text-muted)] text-center">
                            <thead className="text-[var(--color-text)] bg-[var(--color-bg-secondary)] uppercase tracking-wider text-xs">
                                <tr>
                                    <th className="px-4 py-3 font-medium">Size</th>
                                    <th className="px-4 py-3 font-medium">Waist (in)</th>
                                    <th className="px-4 py-3 font-medium">Inseam (in)</th>
                                    <th className="px-4 py-3 font-medium">Length (in)</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[var(--color-border)]">
                                <tr>
                                    <td className="px-4 py-3 font-bold text-[var(--color-text)]">30</td>
                                    <td className="px-4 py-3">30</td>
                                    <td className="px-4 py-3">30</td>
                                    <td className="px-4 py-3">40</td>
                                </tr>
                                <tr>
                                    <td className="px-4 py-3 font-bold text-[var(--color-text)]">32</td>
                                    <td className="px-4 py-3">32</td>
                                    <td className="px-4 py-3">30.5</td>
                                    <td className="px-4 py-3">41</td>
                                </tr>
                                <tr>
                                    <td className="px-4 py-3 font-bold text-[var(--color-text)]">34</td>
                                    <td className="px-4 py-3">34</td>
                                    <td className="px-4 py-3">31</td>
                                    <td className="px-4 py-3">41.5</td>
                                </tr>
                                <tr>
                                    <td className="px-4 py-3 font-bold text-[var(--color-text)]">36</td>
                                    <td className="px-4 py-3">36</td>
                                    <td className="px-4 py-3">31.5</td>
                                    <td className="px-4 py-3">42</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </section>

                <div className="p-6 bg-[var(--color-bg-secondary)] rounded-sm text-center">
                    <p className="text-sm text-[var(--color-text-muted)]">
                        Measurements may vary by +/- 0.5 inches.
                        <br />
                        Model is 6'1" wearing size L in tops and 32 in bottoms.
                    </p>
                </div>
            </div>
        </div>
    );
}
