import { NextResponse } from 'next/server';
import { sanityWriteClient } from '@/sanity/client';
import crypto from 'crypto';

export async function POST(req: Request) {
    try {
        const { email, otp } = await req.json();

        if (!email || !otp) {
            return NextResponse.json({ message: 'Missing email or OTP' }, { status: 400 });
        }

        // Hash OTP before comparing (tokens are stored hashed)
        const hashedOtp = crypto.createHash('sha256').update(otp).digest('hex');

        // Find valid token
        const tokenDoc = await sanityWriteClient.fetch(
            `*[_type == "verification-token" && identifier == $email && token == $hashedOtp && expires > now()][0]`,
            { email, hashedOtp }
        );

        if (!tokenDoc) {
            return NextResponse.json({ message: 'Invalid or expired OTP' }, { status: 400 });
        }

        // Mark user as verified
        const user = await sanityWriteClient.fetch(`*[_type == "user" && email == $email][0]`, { email });

        if (user) {
            await sanityWriteClient.patch(user._id).set({ isVerified: true }).commit();
        } else {
            return NextResponse.json({ message: 'User not found' }, { status: 404 });
        }

        // Delete used token
        await sanityWriteClient.delete(tokenDoc._id);

        return NextResponse.json({ message: 'Email verified successfully' });

    } catch (error) {
        console.error('Verification error:', error);
        return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
    }
}
