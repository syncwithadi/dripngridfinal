'use client';

import { useState } from 'react';

const faqs = [
    {
        question: "Do you ship internationally?",
        answer: "Yes, we ship globally. International shipping rates vary by location and are calculated at checkout. Please note that customs duties may apply depending on your country's regulations."
    },
    {
        question: "How do I track my order?",
        answer: "Once your order is shipped, you will receive a tracking link via email and SMS. You can click on the link to view the real-time status of your delivery."
    },
    {
        question: "What if the size doesn't fit?",
        answer: "We offer a hassle-free exchange policy for sizing issues within 7 days of delivery. The item must be unused with original tags attached. Contact our support team to initiate an exchange."
    },
    {
        question: "Are the colors accurate to the photos?",
        answer: "We make every effort to display product colors as accurately as possible. However, due to monitor differences and lighting conditions, actual colors may vary slightly from what appears online."
    },
];

export default function FAQSection() {
    const [openIndex, setOpenIndex] = useState<number | null>(null);

    const toggleFAQ = (index: number) => {
        setOpenIndex(openIndex === index ? null : index);
    };

    return (
        <div className="py-16 md:py-24 border-t border-[var(--color-border)]">
            <div className="container mx-auto px-4 max-w-4xl">
                <div className="text-center mb-12">
                    <h2 className="text-2xl md:text-3xl font-light tracking-wide uppercase mb-2">
                        Frequently Asked Questions
                    </h2>
                </div>

                <div className="border border-[var(--color-border)] rounded-sm divide-y divide-[var(--color-border)]">
                    {faqs.map((faq, index) => (
                        <div key={index} className="bg-[var(--color-bg)]">
                            <button
                                onClick={() => toggleFAQ(index)}
                                className="w-full flex items-center justify-between p-6 text-left hover:bg-[var(--color-bg-secondary)] transition-colors"
                            >
                                <span className="font-medium text-sm md:text-base tracking-wide uppercase pr-8">
                                    {faq.question}
                                </span>
                                <span className="flex-shrink-0 ml-4">
                                    {openIndex === index ? (
                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 12h-15" />
                                        </svg>
                                    ) : (
                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                                        </svg>
                                    )}
                                </span>
                            </button>
                            <div
                                className={`overflow-hidden transition-all duration-300 ease-in-out ${openIndex === index ? 'max-h-[200px] opacity-100' : 'max-h-0 opacity-0'
                                    }`}
                            >
                                <div className="p-6 pt-0 text-sm text-[var(--color-text-secondary)] leading-relaxed">
                                    {faq.answer}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
