import { NextResponse } from 'next/server';
import { sanityWriteClient } from '@/sanity/client';
import { hashPassword } from '@/lib/auth';

export async function POST(req: Request) {
    try {
        const { email, otp, newPassword } = await req.json();

        if (!email || !otp || !newPassword) {
            return NextResponse.json({ message: 'Missing fields' }, { status: 400 });
        }

        // Verify OTP
        const tokenDoc = await sanityWriteClient.fetch(
            `*[_type == "verification-token" && identifier == $email && token == $otp && expires > now()][0]`,
            { email, otp }
        );

        if (!tokenDoc) {
            return NextResponse.json({ message: 'Invalid or expired OTP' }, { status: 400 });
        }

        // Find User
        const user = await sanityWriteClient.fetch(`*[_type == "user" && email == $email][0]`, { email });

        if (!user) {
            return NextResponse.json({ message: 'User not found' }, { status: 404 });
        }

        // Update Password
        const hashedPassword = await hashPassword(newPassword);

        // Ideally store last password too, but for now just update
        await sanityWriteClient.patch(user._id).set({
            password: hashedPassword,
            // Optional: store old password in a history array if schema supports it
        }).commit();

        // Delete Token
        await sanityWriteClient.delete(tokenDoc._id);

        return NextResponse.json({ message: 'Password reset successfully' });

    } catch (error) {
        console.error('Reset Password error:', error);
        return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
    }
}
