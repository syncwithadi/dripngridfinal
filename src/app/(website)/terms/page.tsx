import { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Terms of Service — DRIPNGRID',
  description: 'Terms and conditions for shopping at DRIPNGRID.',
};

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-white pt-24 pb-20">
      <div className="container-custom max-w-2xl">
        <nav className="text-[11px] tracking-[0.2em] uppercase text-gray-400 mb-10">
          <Link href="/" className="hover:text-black transition-colors">Home</Link>
          <span className="mx-2">/</span>
          <span className="text-black">Terms of Service</span>
        </nav>

        <h1 className="text-3xl font-light tracking-wide text-black mb-2">Terms of Service</h1>
        <p className="text-sm text-gray-400 mb-10">Last updated: January 2025</p>

        <div className="space-y-8 text-[15px] text-gray-600 leading-relaxed">
          <section>
            <h2 className="text-base font-normal tracking-wide text-black mb-3">Orders & Payment</h2>
            <p>By placing an order you confirm that the information provided is accurate and complete. All prices are in Indian Rupees (INR) and include applicable taxes. Payment is processed securely via Razorpay.</p>
          </section>

          <section>
            <h2 className="text-base font-normal tracking-wide text-black mb-3">Shipping</h2>
            <p>We ship across India. Estimated delivery times and shipping fees are displayed at checkout. DRIPNGRID is not responsible for delays caused by third-party couriers or customs.</p>
          </section>

          <section>
            <h2 className="text-base font-normal tracking-wide text-black mb-3">Returns & Exchanges</h2>
            <p>Items may be returned within 7 days of delivery, provided they are unused, unwashed, and in original packaging. Sale items and customised products are final sale. See our <Link href="/returns" className="underline underline-offset-2 hover:text-black">Returns Policy</Link> for full details.</p>
          </section>

          <section>
            <h2 className="text-base font-normal tracking-wide text-black mb-3">Intellectual Property</h2>
            <p>All content on this website — including images, text, and design — is owned by DRIPNGRID and may not be reproduced without written permission.</p>
          </section>

          <section>
            <h2 className="text-base font-normal tracking-wide text-black mb-3">Limitation of Liability</h2>
            <p>DRIPNGRID is not liable for indirect, incidental, or consequential damages arising from the use of our products or website. Our liability is limited to the value of the order in question.</p>
          </section>

          <section>
            <h2 className="text-base font-normal tracking-wide text-black mb-3">Contact</h2>
            <p>For any questions, contact us at <a href="mailto:support@dripngrid.in" className="underline underline-offset-2 hover:text-black">support@dripngrid.in</a>.</p>
          </section>
        </div>
      </div>
    </div>
  );
}
