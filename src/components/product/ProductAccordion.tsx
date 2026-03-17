'use client';

import { useState } from 'react';

interface AccordionItemProps {
    title: string;
    icon?: React.ReactNode;
    children: React.ReactNode;
    defaultOpen?: boolean;
}

function AccordionItem({ title, icon, children, defaultOpen = false }: AccordionItemProps) {
    const [isOpen, setIsOpen] = useState(defaultOpen);

    return (
        <div className="border-b border-[var(--color-border)] last:border-b-0">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full flex items-center justify-between py-5 group text-left"
            >
                <div className="flex items-center gap-3">
                    {icon && <span className="text-[var(--color-text-muted)]">{icon}</span>}
                    <span className="text-sm font-medium tracking-wide uppercase text-[var(--color-text)]">
                        {title}
                    </span>
                </div>
                <span className={`transition-transform duration-300 ${isOpen ? 'rotate-45' : 'rotate-0'}`}>
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                    </svg>
                </span>
            </button>
            <div
                className={`overflow-hidden transition-all duration-300 ease-in-out ${isOpen ? 'max-h-[500px] opacity-100 mb-5' : 'max-h-0 opacity-0'
                    }`}
            >
                <div className="text-sm text-[var(--color-text-secondary)] leading-relaxed">
                    {children}
                </div>
            </div>
        </div>
    );
}

interface ProductAccordionProps {
    description: string;
    material?: string;
}

export default function ProductAccordion({ description, material }: ProductAccordionProps) {
    return (
        <div className="border-t border-[var(--color-border)] mt-10">
            <AccordionItem title="Description" defaultOpen>
                <p className="whitespace-pre-line">{description || "No description available."}</p>
            </AccordionItem>

            <AccordionItem
                title="Material & Care"
                icon={
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
                    </svg>
                }
            >
                <p className="whitespace-pre-line">
                    {material || "100% Premium Cotton.\nMachine wash cold.\nDo not bleach.\nTumble dry low."}
                </p>
            </AccordionItem>

            <AccordionItem
                title="Shipping Policy"
                icon={
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 00-10.026 0 1.106 1.106 0 00-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12" />
                    </svg>
                }
            >
                <p>We offer free shipping on all orders over ₹5000. All orders are processed within 1-2 business days. Standard delivery takes 3-5 business days depending on location. Discreet packaging allows for privacy.</p>
            </AccordionItem>

            <AccordionItem
                title="Return & Exchange Policy"
                icon={
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 12c0-1.232-.046-2.453-.138-3.662a4.006 4.006 0 00-3.7-3.7 48.678 48.678 0 00-7.324 0 4.006 4.006 0 00-3.7 3.7c-.017.22-.032.441-.046.662M19.5 12l3-3m-3 3l-3-3m-12 3c0 1.232.046 2.453.138 3.662a4.006 4.006 0 003.7 3.7 48.656 48.656 0 007.324 0 4.006 4.006 0 003.7-3.7c.017-.22.032-.441.046-.662M4.5 12l3 3m-3-3l-3 3" />
                    </svg>
                }
            >
                <div className="space-y-2">
                    <p>Exchange or return is available for 7-14 days from the date of delivery.</p>
                    <p>Returns are only issued for damaged products or incorrect items. Please ensure the product is unused and in original packaging with tags intact.</p>
                    <p className="italic text-xs mt-2">*Visual inspection required for all returns.</p>
                </div>
            </AccordionItem>
        </div>
    );
}
