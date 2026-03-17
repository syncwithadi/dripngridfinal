'use client';

import { useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import OrderTrackingTimeline from '@/components/OrderTrackingTimeline';

interface OrderDetails {
    _id: string;
    orderNumber: string;
    status: string;
    total: number;
    currency: string;
    createdAt: string;
    statusUpdatedAt?: string;
    customer?: {
        name: string;
        email: string;
    };
    items?: {
        productName: string;
        quantity: number;
        size: string;
        color: string;
        priceINR: number;
    }[];
    shippingAddress?: {
        line1: string;
        line2?: string;
        city: string;
        state: string;
        postalCode: string;
        country: string;
    };
    trackingNumber?: string;
    courierPartner?: string;
}

function TrackOrderContent() {
    const searchParams = useSearchParams();
    const defaultOrderNumber = searchParams.get('orderNumber') || searchParams.get('order') || '';

    const [searchValue, setSearchValue] = useState(defaultOrderNumber);
    const [searchType, setSearchType] = useState<'orderNumber' | 'email'>('orderNumber');
    const [order, setOrder] = useState<OrderDetails | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const handleTrack = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!searchValue.trim()) return;

        setIsLoading(true);
        setError('');
        setOrder(null);

        try {
            const queryParam = searchType === 'orderNumber'
                ? `orderNumber=${encodeURIComponent(searchValue)}`
                : `email=${encodeURIComponent(searchValue)}`;

            const res = await fetch(`/api/orders?${queryParam}`);
            const data = await res.json();

            if (data.success && data.order) {
                // If searching by email, data.order might be an array
                const orderData = Array.isArray(data.order) ? data.order[0] : data.order;
                if (orderData) {
                    setOrder(orderData);
                } else {
                    setError("We couldn't find this order. Please check your details and try again.");
                }
            } else {
                setError("We couldn't find this order. Please check your details and try again.");
            }
        } catch (err) {
            setError('Something went wrong. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    const resetSearch = () => {
        setOrder(null);
        setSearchValue('');
        setError('');
    };

    return (
        <div className="container-custom">
            {!order ? (
                // Search Form
                <div className="max-w-lg mx-auto">
                    <div className="text-center mb-10">
                        <h1 className="text-3xl md:text-4xl font-light tracking-wide uppercase text-[var(--color-text)] mb-4">
                            Track Your Order
                        </h1>
                        <p className="text-[var(--color-text-muted)]">
                            Enter your order number or email address to see the latest status.
                        </p>
                    </div>

                    <div className="bg-[var(--color-bg-secondary)] border border-[var(--color-border)] p-8">
                        {/* Search Type Toggle */}
                        <div className="flex border border-[var(--color-border)] mb-6">
                            <button
                                type="button"
                                onClick={() => setSearchType('orderNumber')}
                                className={`flex-1 py-3 text-sm font-medium uppercase tracking-wider transition-colors ${searchType === 'orderNumber'
                                        ? 'bg-[var(--color-inverted-bg)] text-[var(--color-inverted-text)]'
                                        : 'bg-transparent text-[var(--color-text-muted)] hover:text-[var(--color-text)]'
                                    }`}
                            >
                                Order Number
                            </button>
                            <button
                                type="button"
                                onClick={() => setSearchType('email')}
                                className={`flex-1 py-3 text-sm font-medium uppercase tracking-wider transition-colors ${searchType === 'email'
                                        ? 'bg-[var(--color-inverted-bg)] text-[var(--color-inverted-text)]'
                                        : 'bg-transparent text-[var(--color-text-muted)] hover:text-[var(--color-text)]'
                                    }`}
                            >
                                Email Address
                            </button>
                        </div>

                        <form onSubmit={handleTrack} className="space-y-6">
                            <div>
                                <label htmlFor="search" className="sr-only">
                                    {searchType === 'orderNumber' ? 'Order Number' : 'Email Address'}
                                </label>
                                <input
                                    type={searchType === 'email' ? 'email' : 'text'}
                                    id="search"
                                    value={searchValue}
                                    onChange={(e) => setSearchValue(e.target.value)}
                                    className="w-full bg-[var(--color-bg)] border border-[var(--color-border)] px-4 py-4 text-[var(--color-text)] focus:outline-none focus:border-[var(--color-text)] transition-colors text-center text-lg tracking-wider"
                                    placeholder={
                                        searchType === 'orderNumber'
                                            ? 'e.g. DRIP-3001'
                                            : 'e.g. your@email.com'
                                    }
                                    required
                                />
                            </div>

                            {error && (
                                <div className="p-4 bg-[var(--color-bg)] border border-red-300 dark:border-red-800">
                                    <div className="flex items-center gap-3">
                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-red-500">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" />
                                        </svg>
                                        <p className="text-sm text-[var(--color-text)]">{error}</p>
                                    </div>
                                </div>
                            )}

                            <button
                                type="submit"
                                disabled={isLoading || !searchValue.trim()}
                                className="w-full btn-primary justify-center py-4 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isLoading ? (
                                    <span className="flex items-center gap-2">
                                        <svg className="animate-spin w-4 h-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                        </svg>
                                        Searching...
                                    </span>
                                ) : (
                                    'Track Order'
                                )}
                            </button>
                        </form>
                    </div>

                    {/* Help Text */}
                    <div className="mt-8 text-center">
                        <p className="text-sm text-[var(--color-text-muted)]">
                            Can't find your order?{' '}
                            <Link href="/faq" className="underline hover:no-underline">
                                Contact Support
                            </Link>
                        </p>
                    </div>
                </div>
            ) : (
                // Order Details with Timeline
                <div className="max-w-4xl mx-auto">
                    {/* Back Button */}
                    <button
                        onClick={resetSearch}
                        className="flex items-center gap-2 text-sm text-[var(--color-text-muted)] hover:text-[var(--color-text)] transition-colors mb-8"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
                        </svg>
                        Track Another Order
                    </button>

                    {/* Tracking Timeline */}
                    <div className="bg-[var(--color-bg-secondary)] border border-[var(--color-border)] p-8 md:p-12 mb-8">
                        <OrderTrackingTimeline
                            status={order.status}
                            orderNumber={order.orderNumber}
                            createdAt={order.createdAt}
                            statusUpdatedAt={order.statusUpdatedAt}
                        />
                    </div>

                    {/* Order Details Grid */}
                    <div className="grid md:grid-cols-2 gap-6">
                        {/* Shipping Details */}
                        {order.shippingAddress && (
                            <div className="bg-[var(--color-bg-secondary)] border border-[var(--color-border)] p-6">
                                <h3 className="text-xs uppercase tracking-wider text-[var(--color-text-muted)] mb-4">
                                    Shipping Address
                                </h3>
                                <div className="space-y-1 text-sm text-[var(--color-text)]">
                                    <p>{order.customer?.name}</p>
                                    <p>{order.shippingAddress.line1}</p>
                                    {order.shippingAddress.line2 && <p>{order.shippingAddress.line2}</p>}
                                    <p>
                                        {order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.postalCode}
                                    </p>
                                    <p>{order.shippingAddress.country}</p>
                                </div>
                            </div>
                        )}

                        {/* Tracking Info */}
                        <div className="bg-[var(--color-bg-secondary)] border border-[var(--color-border)] p-6">
                            <h3 className="text-xs uppercase tracking-wider text-[var(--color-text-muted)] mb-4">
                                Delivery Information
                            </h3>
                            {order.trackingNumber ? (
                                <div className="space-y-3">
                                    <div>
                                        <p className="text-xs text-[var(--color-text-muted)]">Tracking Number</p>
                                        <p className="text-sm font-medium text-[var(--color-text)]">{order.trackingNumber}</p>
                                    </div>
                                    {order.courierPartner && (
                                        <div>
                                            <p className="text-xs text-[var(--color-text-muted)]">Courier</p>
                                            <p className="text-sm text-[var(--color-text)] capitalize">{order.courierPartner}</p>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <p className="text-sm text-[var(--color-text-muted)]">
                                    Tracking details will be available once your order is shipped.
                                </p>
                            )}
                        </div>
                    </div>

                    {/* Order Summary */}
                    {order.items && order.items.length > 0 && (
                        <div className="mt-6 bg-[var(--color-bg-secondary)] border border-[var(--color-border)] p-6">
                            <h3 className="text-xs uppercase tracking-wider text-[var(--color-text-muted)] mb-4">
                                Order Items
                            </h3>
                            <div className="space-y-3">
                                {order.items.map((item, index) => (
                                    <div key={index} className="flex justify-between items-center text-sm">
                                        <div>
                                            <p className="text-[var(--color-text)]">{item.productName}</p>
                                            <p className="text-xs text-[var(--color-text-muted)]">
                                                Size: {item.size} • Color: {item.color} • Qty: {item.quantity}
                                            </p>
                                        </div>
                                        <p className="text-[var(--color-text)] font-medium">
                                            ₹{(item.priceINR * item.quantity).toLocaleString()}
                                        </p>
                                    </div>
                                ))}
                                <div className="border-t border-[var(--color-border)] pt-3 mt-3 flex justify-between items-center">
                                    <p className="text-sm font-medium text-[var(--color-text)]">Total</p>
                                    <p className="text-lg font-medium text-[var(--color-text)]">
                                        ₹{order.total?.toLocaleString()}
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Need Help */}
                    <div className="mt-8 text-center">
                        <p className="text-sm text-[var(--color-text-muted)]">
                            Need help with your order?{' '}
                            <Link href="/faq" className="underline hover:no-underline">
                                Contact Support
                            </Link>
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
}

// Empty state component for no orders
function EmptyOrderState() {
    return (
        <div className="container-custom py-24 min-h-[60vh] flex flex-col items-center justify-center">
            <div className="text-center max-w-md">
                <div className="w-24 h-24 mx-auto mb-8 border border-[var(--color-border)] rounded-full flex items-center justify-center">
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth={1}
                        stroke="currentColor"
                        className="w-12 h-12 text-[var(--color-text-muted)]"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z"
                        />
                    </svg>
                </div>
                <h2 className="text-2xl font-light tracking-wide uppercase mb-4 text-[var(--color-text)]">
                    No Order Found
                </h2>
                <p className="text-[var(--color-text-muted)] mb-8">
                    We couldn't find an order with those details. Please double-check your information and try again.
                </p>
                <Link href="/shop" className="btn-primary">
                    Start Shopping
                </Link>
            </div>
        </div>
    );
}

export default function TrackOrderPage() {
    return (
        <div className="min-h-screen bg-[var(--color-bg)] pt-24 pb-16">
            <Suspense
                fallback={
                    <div className="container-custom text-center py-24">
                        <div className="w-8 h-8 border-2 border-[var(--color-text)] border-t-transparent rounded-full animate-spin mx-auto" />
                    </div>
                }
            >
                <TrackOrderContent />
            </Suspense>
        </div>
    );
}
