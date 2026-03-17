'use client';

import { useState } from 'react';
import { sanityWriteClient } from '@/sanity/client';

export default function Newsletter() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('loading');
    setErrorMessage('');

    try {
      // Validate email format
      if (!/^\S+@\S+\.\S+$/.test(email)) {
        throw new Error('Please enter a valid email address.');
      }

      // Check if client side token is available (it often isn't for security). 
      // Ideally this should use a Server Action or API Route.
      // For this demo, we'll try to use the client directly, but warn if no token.

      // Since specific instructions asked to "implement newsletter signup", 
      // we will use a server action pattern if possible, but here we are in a client component.
      // We will create an API route for this to be secure.

      const response = await fetch('/api/newsletter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Something went wrong.');
      }

      setStatus('success');
      setEmail('');
    } catch (error: any) {
      console.error('Newsletter error:', error);
      setStatus('error');
      setErrorMessage(error.message || 'Failed to subscribe. Please try again.');
    }
  };

  return (
    <section className="py-24 bg-[var(--color-bg-secondary)] border-t border-[var(--color-border)]">
      <div className="container-custom max-w-4xl mx-auto text-center px-6">
        <h2 className="text-3xl md:text-4xl font-light tracking-wide uppercase mb-4">
          Stay Connected
        </h2>
        <p className="text-[var(--color-text-muted)] mb-8 max-w-md mx-auto">
          Subscribe to receive updates, access to exclusive deals, and more.
        </p>

        {status === 'success' ? (
          <div className="p-6 bg-green-500/10 border border-green-500/20 text-green-600 rounded-2xl">
            <p>Thank you for subscribing! You're on the list.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3 max-w-lg mx-auto">
            <input
              suppressHydrationWarning
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              className="flex-1 px-5 py-3.5 bg-white border border-gray-200 rounded-xl text-sm text-gray-900
                         placeholder:text-gray-400 focus:outline-none focus:border-gray-400
                         disabled:opacity-50 transition-colors"
              disabled={status === 'loading'}
              required
            />
            <button
              suppressHydrationWarning
              type="submit"
              disabled={status === 'loading'}
              className="px-7 py-3.5 bg-black text-white text-[11px] font-semibold tracking-[0.18em] uppercase
                         rounded-xl hover:bg-black/85 active:scale-[0.98]
                         disabled:opacity-50 transition-all duration-200 whitespace-nowrap"
            >
              {status === 'loading' ? 'Joining…' : 'Subscribe'}
            </button>
          </form>
        )}

        {status === 'error' && (
          <p className="mt-4 text-red-500 text-sm">{errorMessage}</p>
        )}
      </div>
    </section>
  );
}
