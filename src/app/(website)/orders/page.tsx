'use client';

import { useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useCurrency } from '@/context/CurrencyContext';

interface Order {
    _id: string;
    orderNumber: string;
    total: number;
    currency: string;
    status: string;
    paymentStatus: string;
    createdAt: string;
    items: {
        productName: string;
        quantity: number;
        size: string;
        color: string;
        priceINR: number;
    }[];
}

const statusColors: Record<string, string> = {
    pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
    confirmed: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
    processing: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
    shipped: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-400',
    delivered: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
    cancelled: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
};

export default function OrdersPage() {
    const { data: session, status } = useSession();
    const { formatPrice } = useCurrency();
    const [orders, setOrders] = useState<Order[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        async function fetchOrders() {
            if (!session?.user?.email) return;

            try {
                const response = await fetch(`/api/orders?email=${encodeURIComponent(session.user.email)}`);
                const data = await response.json();

                if (data.success) {
                    setOrders(Array.isArray(data.order) ? data.order : [data.order].filter(Boolean));
                } else {
                    setError(data.error || 'Failed to fetch orders');
                }
            } catch (err) {
                setError('Failed to load orders');
            } finally {
                setIsLoading(false);
            }
        }

        if (status === 'authenticated') {
            fetchOrders();
        } else if (status === 'unauthenticated') {
            setIsLoading(false);
        }
    }, [session, status]);

    // Loading state
    if (status === 'loading' || isLoading) {
        return (
            <div className="container-custom py-24 min-h-[70vh] flex flex-col items-center justify-center">
                <div className="w-8 h-8 border-2 border-[var(--color-text)] border-t-transparent rounded-full animate-spin" />
                <p className="mt-4 text-[var(--color-text-muted)]">Loading orders...</p>
            </div>
        );
    }

    // Not logged in
    if (!session) {
        return (
            <div className="container-custom py-24 min-h-[70vh] flex flex-col items-center justify-center">
                <div className="text-center max-w-md">
                    <h1 className="text-3xl font-light tracking-wide uppercase mb-4">My Orders</h1>
                    <p className="text-[var(--color-text-muted)] mb-8">
                        Please sign in to view your orders.
                    </p>
                    <Link href="/account" className="btn-primary">
                        Sign In
                    </Link>
                </div>
            </div>
        );
    }

    // Error state
    if (error) {
        return (
            <div className="container-custom py-24 min-h-[70vh] flex flex-col items-center justify-center">
                <div className="text-center max-w-md">
                    <h1 className="text-3xl font-light tracking-wide uppercase mb-4">My Orders</h1>
                    <p className="text-red-500 mb-8">{error}</p>
                    <button onClick={() => window.location.reload()} className="btn-secondary">
                        Try Again
                    </button>
                </div>
            </div>
        );
    }

    // Empty state - no orders
    if (orders.length === 0) {
        return (
            <div className="container-custom py-24 min-h-[70vh] flex flex-col items-center justify-center">
                <div className="text-center max-w-md">
                    <div className="w-20 h-20 mx-auto mb-6 border border-[var(--color-border)] rounded-full flex items-center justify-center">
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                            strokeWidth={1}
                            stroke="currentColor"
                            className="w-10 h-10 text-[var(--color-text-muted)]"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M15.75 10.5V6a3.75 3.75 0 1 0-7.5 0v4.5m11.356-1.993 1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 0 1-1.12-1.243l1.264-12A1.125 1.125 0 0 1 5.513 7.5h12.974c.576 0 1.059.435 1.119 1.007ZM8.625 10.5a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm7.5 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z"
                            />
                        </svg>
                    </div>
                    <h1 className="text-3xl font-light tracking-wide uppercase mb-4">No Orders Yet</h1>
                    <p className="text-[var(--color-text-muted)] mb-8">
                        You haven't placed any orders yet. Start exploring our collection and find something you love.
                    </p>
                    <Link href="/shop" className="btn-primary">
                        Start Shopping
                    </Link>
                </div>
            </div>
        );
    }

    // Orders list
    return (
        <div className="container-custom py-24 min-h-[70vh]">
            <div className="max-w-4xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <Link
                        href="/account"
                        className="text-sm text-[var(--color-text-muted)] hover:text-[var(--color-text)] transition-colors"
                    >
                        ← Back to Account
                    </Link>
                    <h1 className="text-3xl font-light tracking-wide uppercase mt-4">My Orders</h1>
                    <p className="text-[var(--color-text-muted)] mt-2">
                        {orders.length} order{orders.length !== 1 ? 's' : ''}
                    </p>
                </div>

                {/* Orders List */}
                <div className="space-y-6">
                    {orders.map((order) => (
                        <div
                            key={order._id}
                            className="bg-[var(--color-bg-secondary)] border border-[var(--color-border)] p-6"
                        >
                            {/* Order Header */}
                            <div className="flex flex-wrap items-start justify-between gap-4 mb-4 pb-4 border-b border-[var(--color-border)]">
                                <div>
                                    <p className="text-xs text-[var(--color-text-muted)] uppercase tracking-wider mb-1">
                                        Order Number
                                    </p>
                                    <p className="font-medium text-[var(--color-text)]">{order.orderNumber}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-[var(--color-text-muted)] uppercase tracking-wider mb-1">
                                        Date
                                    </p>
                                    <p className="text-[var(--color-text)]">
                                        {new Date(order.createdAt).toLocaleDateString('en-IN', {
                                            day: 'numeric',
                                            month: 'short',
                                            year: 'numeric',
                                        })}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-xs text-[var(--color-text-muted)] uppercase tracking-wider mb-1">
                                        Total
                                    </p>
                                    <p className="font-medium text-[var(--color-text)]">{formatPrice(order.total)}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-[var(--color-text-muted)] uppercase tracking-wider mb-1">
                                        Status
                                    </p>
                                    <span
                                        className={`inline-block px-3 py-1 text-xs font-medium uppercase tracking-wider rounded-full ${statusColors[order.status] || 'bg-gray-100 text-gray-800'
                                            }`}
                                    >
                                        {order.status}
                                    </span>
                                </div>
                            </div>

                            {/* Order Items */}
                            <div className="space-y-3">
                                {order.items?.slice(0, 3).map((item, index) => (
                                    <div key={index} className="flex justify-between text-sm">
                                        <span className="text-[var(--color-text)]">
                                            {item.productName} × {item.quantity}
                                            <span className="text-[var(--color-text-muted)] ml-2">
                                                ({item.size}, {item.color})
                                            </span>
                                        </span>
                                        <span className="text-[var(--color-text)]">
                                            {formatPrice(item.priceINR * item.quantity)}
                                        </span>
                                    </div>
                                ))}
                                {order.items?.length > 3 && (
                                    <p className="text-sm text-[var(--color-text-muted)]">
                                        + {order.items.length - 3} more item{order.items.length - 3 !== 1 ? 's' : ''}
                                    </p>
                                )}
                            </div>

                            {/* Track Order Link */}
                            <div className="mt-4 pt-4 border-t border-[var(--color-border)] flex items-center justify-between">
                                <Link
                                    href={`/track-order?orderNumber=${encodeURIComponent(order.orderNumber)}`}
                                    className="inline-flex items-center gap-2 text-sm text-[var(--color-text)] hover:underline"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" />
                                    </svg>
                                    Track Order
                                </Link>
                                {order.status === 'delivered' && (
                                    <span className="text-xs text-green-600 dark:text-green-400 flex items-center gap-1">
                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3 h-3">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                                        </svg>
                                        Delivered
                                    </span>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
