import { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Privacy Policy — DRIPNGRID',
  description: 'How DRIPNGRID collects, uses, and protects your personal information.',
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-white pt-24 pb-20">
      <div className="container-custom max-w-2xl">
        <nav className="text-[11px] tracking-[0.2em] uppercase text-gray-400 mb-10">
          <Link href="/" className="hover:text-black transition-colors">Home</Link>
          <span className="mx-2">/</span>
          <span className="text-black">Privacy Policy</span>
        </nav>

        <h1 className="text-3xl font-light tracking-wide text-black mb-2">Privacy Policy</h1>
        <p className="text-sm text-gray-400 mb-10">Last updated: January 2025</p>

        <div className="space-y-8 text-[15px] text-gray-600 leading-relaxed">
          <section>
            <h2 className="text-base font-normal tracking-wide text-black mb-3">Information We Collect</h2>
            <p>We collect information you provide directly to us, such as your name, email address, shipping address, and payment details when you place an order. We also collect usage data to improve your experience.</p>
          </section>

          <section>
            <h2 className="text-base font-normal tracking-wide text-black mb-3">How We Use Your Information</h2>
            <p>We use the information to process your orders, send shipping updates, and improve our services. We do not sell your personal data to third parties. Email communication is limited to order updates and, with your consent, occasional announcements about new drops.</p>
          </section>

          <section>
            <h2 className="text-base font-normal tracking-wide text-black mb-3">Cookies</h2>
            <p>We use essential cookies for cart and session functionality, and analytics cookies (with your consent) to understand how visitors interact with our site.</p>
          </section>

          <section>
            <h2 className="text-base font-normal tracking-wide text-black mb-3">Data Security</h2>
            <p>All payment information is processed through Razorpay and is never stored on our servers. Your data is protected with industry-standard encryption.</p>
          </section>

          <section>
            <h2 className="text-base font-normal tracking-wide text-black mb-3">Your Rights</h2>
            <p>You can request access to, correction of, or deletion of your personal data at any time by contacting us at <a href="mailto:support@dripngrid.in" className="underline underline-offset-2 hover:text-black">support@dripngrid.in</a>.</p>
          </section>

          <section>
            <h2 className="text-base font-normal tracking-wide text-black mb-3">Contact</h2>
            <p>Questions about this policy? Reach us at <a href="mailto:support@dripngrid.in" className="underline underline-offset-2 hover:text-black">support@dripngrid.in</a>.</p>
          </section>
        </div>
      </div>
    </div>
  );
}
