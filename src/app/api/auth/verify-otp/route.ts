import { NextRequest, NextResponse } from 'next/server';
import { sanityWriteClient } from '@/sanity/client';
import crypto from 'crypto';

function hashOTP(otp: string): string {
    return crypto.createHash('sha256').update(otp).digest('hex');
}

export async function POST(request: NextRequest) {
    try {
        const { email, otp, name, phone } = await request.json();

        if (!email || !otp) {
            return NextResponse.json(
                { success: false, error: 'Email and OTP are required' },
                { status: 400 }
            );
        }

        // Find the OTP record (write client for strong consistency)
        const otpRecord = await sanityWriteClient.fetch(
            `*[_type == "otp" && email == $email && !verified][0]`,
            { email }
        );

        if (!otpRecord) {
            return NextResponse.json(
                { success: false, error: 'No OTP found. Please request a new one.' },
                { status: 400 }
            );
        }

        // Check expiry
        if (new Date(otpRecord.expiresAt) < new Date()) {
            await sanityWriteClient.delete(otpRecord._id);
            return NextResponse.json(
                { success: false, error: 'OTP has expired. Please request a new one.' },
                { status: 400 }
            );
        }

        // Max 5 attempts
        if (otpRecord.attempts >= 5) {
            await sanityWriteClient.delete(otpRecord._id);
            return NextResponse.json(
                { success: false, error: 'Too many attempts. Please request a new OTP.' },
                { status: 400 }
            );
        }

        // Verify OTP
        const hashedOtp = hashOTP(otp);
        if (hashedOtp !== otpRecord.otp) {
            await sanityWriteClient
                .patch(otpRecord._id)
                .set({ attempts: otpRecord.attempts + 1 })
                .commit();
            return NextResponse.json(
                { success: false, error: 'Invalid OTP. Please try again.' },
                { status: 400 }
            );
        }

        // ── OTP is valid ──────────────────────────────────────────────────

        // Delete the used OTP record
        await sanityWriteClient.delete(otpRecord._id);

        // Upsert user
        let user = await sanityWriteClient.fetch(
            `*[_type == "user" && email == $email][0]`,
            { email }
        );

        if (!user) {
            // New user — auto-register (no password required)
            user = await sanityWriteClient.create({
                _type: 'user',
                name: name || email.split('@')[0],
                email,
                phone: phone || '',
                isVerified: true,
                emailVerified: new Date().toISOString(),
                role: 'user',
            });
        } else {
            // Existing user — mark verified, fill gaps
            await sanityWriteClient
                .patch(user._id)
                .set({
                    isVerified: true,
                    emailVerified: new Date().toISOString(),
                    ...(phone && !user.phone ? { phone } : {}),
                    ...(name && !user.name ? { name } : {}),
                })
                .commit();
        }

        // ── Generate a short-lived single-use login token ─────────────────
        // Client will exchange this for a NextAuth session via signIn('credentials', { email, loginToken })
        const rawLoginToken = crypto.randomUUID();
        const hashedLoginToken = crypto.createHash('sha256').update(rawLoginToken).digest('hex');

        await sanityWriteClient.create({
            _type: 'otp',
            email,
            otp: hashedLoginToken,
            expiresAt: new Date(Date.now() + 3 * 60 * 1000).toISOString(), // 3 minutes
            attempts: 0,
            verified: false,
            purpose: 'login-token',
        });

        return NextResponse.json({
            success: true,
            message: 'Verified successfully',
            loginToken: rawLoginToken,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                isNew: !user.emailVerified || user._createdAt === user.emailVerified,
            },
        });
    } catch (error: any) {
        console.error('Verify OTP error:', error);
        return NextResponse.json(
            { success: false, error: 'Verification failed. Please try again.' },
            { status: 500 }
        );
    }
}
