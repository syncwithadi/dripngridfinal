import { NextRequest, NextResponse } from 'next/server';
import { sanityWriteClient } from '@/sanity/client';

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { email } = body;

        if (!email) {
            return NextResponse.json({ message: 'Email is required' }, { status: 400 });
        }

        // Basic email format validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email) || email.length > 254) {
            return NextResponse.json({ message: 'Invalid email address' }, { status: 400 });
        }

        // Check if user already exists
        const existing = await sanityWriteClient.fetch(
            `*[_type == "newsletterSubscriber" && email == $email][0]`,
            { email }
        );

        if (existing) {
            // Already subscribed, just return success
            return NextResponse.json({ message: 'Already subscribed' }, { status: 200 });
        }

        // Create new subscriber
        await sanityWriteClient.create({
            _type: 'newsletterSubscriber',
            email,
            subscribedAt: new Date().toISOString(),
            status: 'subscribed',
        });

        return NextResponse.json({ message: 'Subscribed successfully' }, { status: 201 });
    } catch (error) {
        console.error('Newsletter API Error:', error);
        return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
    }
}
