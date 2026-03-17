'use client';

import { useEffect, useState } from 'react';

interface OrderTrackingTimelineProps {
    status: string;
    orderNumber: string;
    createdAt?: string;
    statusUpdatedAt?: string;
}

// Status to step mapping - "Order Placed" is always done once order exists
const STATUS_STEP_MAP: Record<string, number> = {
    pending: 2,     // Processing is current
    confirmed: 2,   // Processing is current
    processing: 2,  // Processing is current
    shipped: 3,     // Shipped is current
    'in-transit': 4, // In Transit is current
    delivered: 6,   // All 5 steps complete
    cancelled: -1,  // Special cancelled state
};

// Premium minimal icons (Lucide/Phosphor style - clean, consistent stroke)
const PremiumIcons = {
    // Order Placed - Clean checkmark in circle
    orderPlaced: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
            <path d="M20 6L9 17l-5-5" />
        </svg>
    ),
    // Processing - Package/box being prepared
    processing: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
            <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
            <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
            <line x1="12" y1="22.08" x2="12" y2="12" />
        </svg>
    ),
    // Shipped - Premium minimal delivery truck (outline only, no bulk)
    shipped: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
            <path d="M1 3h15v13H1z" />
            <path d="M16 8h4l3 3v5h-7V8z" />
            <circle cx="5.5" cy="18.5" r="2.5" />
            <circle cx="18.5" cy="18.5" r="2.5" />
        </svg>
    ),
    // In Transit - Location/route indicator
    inTransit: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
            <circle cx="12" cy="10" r="3" />
            <path d="M12 2a8 8 0 0 0-8 8c0 5.4 7 12 8 12s8-6.6 8-12a8 8 0 0 0-8-8z" />
        </svg>
    ),
    // Delivered - Home with checkmark
    delivered: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
            <polyline points="9 22 9 12 15 12 15 22" />
        </svg>
    ),
    // Cancelled - X mark
    cancelled: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
        </svg>
    ),
    // Checkmark for completed steps
    check: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5">
            <polyline points="20 6 9 17 4 12" />
        </svg>
    ),
};

interface TrackingStep {
    id: number;
    label: string;
    subtext: string;
    icon: React.ReactNode;
}

const steps: TrackingStep[] = [
    {
        id: 1,
        label: 'Order Placed',
        subtext: 'Confirmed',
        icon: PremiumIcons.orderPlaced,
    },
    {
        id: 2,
        label: 'Processing',
        subtext: 'Preparing',
        icon: PremiumIcons.processing,
    },
    {
        id: 3,
        label: 'Shipped',
        subtext: 'In transit',
        icon: PremiumIcons.shipped,
    },
    {
        id: 4,
        label: 'In Transit',
        subtext: 'On the way',
        icon: PremiumIcons.inTransit,
    },
    {
        id: 5,
        label: 'Delivered',
        subtext: 'Complete',
        icon: PremiumIcons.delivered,
    },
];

export default function OrderTrackingTimeline({
    status,
    orderNumber,
    createdAt,
    statusUpdatedAt,
}: OrderTrackingTimelineProps) {
    const [mounted, setMounted] = useState(false);
    const currentStep = STATUS_STEP_MAP[status] ?? 1;
    const isCancelled = status === 'cancelled';

    useEffect(() => {
        // Stagger the mount animation
        const timer = setTimeout(() => setMounted(true), 100);
        return () => clearTimeout(timer);
    }, []);

    const formatDate = (dateString?: string) => {
        if (!dateString) return '';
        return new Date(dateString).toLocaleDateString('en-IN', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
        });
    };

    const formatTime = (dateString?: string) => {
        if (!dateString) return '';
        return new Date(dateString).toLocaleTimeString('en-IN', {
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    // Cancelled state - Premium minimal
    if (isCancelled) {
        return (
            <div className="w-full max-w-3xl mx-auto">
                <div className="text-center py-16 px-8">
                    <div
                        className={`w-24 h-24 mx-auto mb-8 rounded-full border-2 border-red-400 dark:border-red-500 flex items-center justify-center transition-all duration-700 ${mounted ? 'opacity-100 scale-100' : 'opacity-0 scale-50'
                            }`}
                    >
                        <div className="text-red-500 dark:text-red-400 w-10 h-10">
                            {PremiumIcons.cancelled}
                        </div>
                    </div>
                    <h3 className={`text-2xl font-light tracking-wide text-[var(--color-text)] mb-3 transition-all duration-500 delay-200 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
                        }`}>
                        Order Cancelled
                    </h3>
                    <p className={`text-[var(--color-text-muted)] transition-all duration-500 delay-300 ${mounted ? 'opacity-100' : 'opacity-0'
                        }`}>
                        {orderNumber}
                    </p>
                    {statusUpdatedAt && (
                        <p className={`text-sm text-[var(--color-text-muted)] mt-4 transition-all duration-500 delay-400 ${mounted ? 'opacity-100' : 'opacity-0'
                            }`}>
                            Cancelled on {formatDate(statusUpdatedAt)}
                        </p>
                    )}
                </div>
            </div>
        );
    }

    return (
        <div className="w-full max-w-4xl mx-auto">
            {/* Order Info Header - Premium minimal */}
            <div className={`text-center mb-12 transition-all duration-700 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
                }`}>
                <p className="text-xs text-[var(--color-text-muted)] uppercase tracking-[0.2em] mb-2">
                    Order
                </p>
                <h2 className="text-xl md:text-2xl font-medium text-[var(--color-text)] tracking-wide">
                    {orderNumber}
                </h2>
                {createdAt && (
                    <p className="text-sm text-[var(--color-text-muted)] mt-2">
                        Placed {formatDate(createdAt)} at {formatTime(createdAt)}
                    </p>
                )}
            </div>

            {/* Desktop Timeline - Horizontal Premium */}
            <div className="hidden md:block">
                <div className="relative">
                    {/* Progress Line Background */}
                    <div className="absolute top-[40px] left-[10%] right-[10%] h-[2px] bg-[var(--color-border)]" />

                    {/* Progress Line Active - Animated */}
                    <div
                        className="absolute top-[40px] left-[10%] h-[2px] bg-[var(--color-text)] transition-all duration-1000 ease-out"
                        style={{
                            width: mounted
                                ? `${Math.min((currentStep - 1) / (steps.length - 1), 1) * 80}%`
                                : '0%',
                        }}
                    />

                    {/* Steps */}
                    <div className="relative flex justify-between px-[5%]">
                        {steps.map((step, index) => {
                            const stepNumber = index + 1;
                            const isComplete = stepNumber < currentStep;
                            const isCurrent = stepNumber === currentStep - 1 + 1; // Adjust for mapping
                            const isPending = stepNumber > currentStep;
                            const isActive = isComplete || (isCurrent && stepNumber <= currentStep);

                            return (
                                <div
                                    key={step.id}
                                    className={`flex flex-col items-center w-[18%] transition-all duration-700 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
                                        }`}
                                    style={{ transitionDelay: `${150 + index * 100}ms` }}
                                >
                                    {/* Icon Circle with elegant styling */}
                                    <div className="relative">
                                        <div
                                            className={`w-20 h-20 rounded-full flex items-center justify-center transition-all duration-500 ${isActive
                                                ? 'bg-[var(--color-text)] text-[var(--color-bg)] shadow-lg'
                                                : 'bg-[var(--color-bg)] text-[var(--color-text-muted)] border-2 border-[var(--color-border)]'
                                                } ${isCurrent && !isComplete ? 'ring-4 ring-[var(--color-text)]/10' : ''}`}
                                        >
                                            {step.icon}
                                        </div>

                                        {/* Completion checkmark badge */}
                                        {isComplete && (
                                            <div
                                                className={`absolute -top-1 -right-1 w-6 h-6 bg-emerald-500 rounded-full flex items-center justify-center shadow-md transition-all duration-300 ${mounted ? 'scale-100 opacity-100' : 'scale-0 opacity-0'
                                                    }`}
                                                style={{ transitionDelay: `${400 + index * 100}ms` }}
                                            >
                                                <span className="text-white">
                                                    {PremiumIcons.check}
                                                </span>
                                            </div>
                                        )}

                                        {/* Current step pulse indicator */}
                                        {isCurrent && !isComplete && (
                                            <div className="absolute inset-0 rounded-full border-2 border-[var(--color-text)] animate-ping opacity-20" />
                                        )}
                                    </div>

                                    {/* Label */}
                                    <p className={`mt-4 text-sm font-medium text-center transition-colors duration-300 ${isActive ? 'text-[var(--color-text)]' : 'text-[var(--color-text-muted)]'
                                        }`}>
                                        {step.label}
                                    </p>

                                    {/* Subtext */}
                                    <p className="text-xs text-[var(--color-text-muted)] mt-1 text-center">
                                        {step.subtext}
                                    </p>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* Mobile Timeline - Vertical Premium */}
            <div className="md:hidden">
                <div className="pl-4">
                    <div className="space-y-0">
                        {steps.map((step, index) => {
                            const stepNumber = index + 1;
                            const isComplete = stepNumber < currentStep;
                            const isCurrent = stepNumber === currentStep;
                            const isActive = isComplete || isCurrent;
                            const isLast = index === steps.length - 1;

                            return (
                                <div
                                    key={step.id}
                                    className={`relative flex gap-6 pb-8 last:pb-0 transition-all duration-500 ${mounted ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-4'
                                        }`}
                                    style={{ transitionDelay: `${150 + index * 80}ms` }}
                                >
                                    {/* Connecting Line (Segment) */}
                                    {!isLast && (
                                        <div
                                            className={`absolute left-[19px] top-5 h-full w-[2px] -z-10 ${isComplete ? 'bg-[var(--color-text)]' : 'bg-[var(--color-border)]'
                                                }`}
                                        />
                                    )}

                                    {/* Icon Circle - Mobile */}
                                    <div className="relative z-10 shrink-0">
                                        <div
                                            className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-500 ${isActive
                                                ? 'bg-[var(--color-text)] text-[var(--color-bg)]'
                                                : 'bg-[var(--color-bg)] text-[var(--color-text-muted)] border-2 border-[var(--color-border)]'
                                                }`}
                                        >
                                            <div className="w-5 h-5 flex items-center justify-center">{step.icon}</div>
                                        </div>

                                        {/* Completion badge - Mobile */}
                                        {isComplete && (
                                            <div className="absolute -right-1 -top-1 w-4 h-4 bg-emerald-500 rounded-full flex items-center justify-center shadow-sm">
                                                <span className="text-white w-3 h-3 flex items-center justify-center">
                                                    {PremiumIcons.check}
                                                </span>
                                            </div>
                                        )}
                                    </div>

                                    {/* Content */}
                                    <div className="flex-1 pt-2.5">
                                        <div className="flex items-center justify-between">
                                            <p className={`text-sm font-medium transition-colors duration-300 ${isActive ? 'text-[var(--color-text)]' : 'text-[var(--color-text-muted)]'
                                                }`}>
                                                {step.label}
                                            </p>
                                            {isComplete && (
                                                <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                                                    Done
                                                </span>
                                            )}
                                            {isCurrent && !isComplete && (
                                                <span className="text-xs text-[var(--color-text)] font-medium flex items-center gap-1">
                                                    <span className="w-1.5 h-1.5 bg-[var(--color-text)] rounded-full animate-pulse" />
                                                    Current
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-xs text-[var(--color-text-muted)] mt-0.5">
                                            {step.subtext}
                                        </p>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* Current Status Message - Premium */}
            <div className={`mt-12 pt-8 border-t border-[var(--color-border)] text-center transition-all duration-700 delay-500 ${mounted ? 'opacity-100' : 'opacity-0'
                }`}>
                <div className="inline-flex items-center gap-3 px-6 py-3 bg-[var(--color-bg-secondary)] rounded-full">
                    <span className={`w-2 h-2 rounded-full ${status === 'delivered' ? 'bg-emerald-500' : 'bg-[var(--color-text)] animate-pulse'
                        }`} />
                    <p className="text-sm text-[var(--color-text)]">
                        {status === 'processing' && 'Your order is being prepared'}
                        {status === 'shipped' && 'Your order has been shipped'}
                        {status === 'in-transit' && 'Your order is out for delivery'}
                        {(status === 'pending' || status === 'confirmed') && 'Order confirmed, processing soon'}
                        {status === 'delivered' && 'Your order has been delivered'}
                    </p>
                </div>
                {statusUpdatedAt && (
                    <p className="text-xs text-[var(--color-text-muted)] mt-4">
                        Updated {formatDate(statusUpdatedAt)} at {formatTime(statusUpdatedAt)}
                    </p>
                )}
            </div>
        </div>
    );
}
