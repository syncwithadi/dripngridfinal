import { NextRequest, NextResponse } from 'next/server';
import { sanityClient, sanityWriteClient } from '@/sanity/client';
import { Resend } from 'resend';
import crypto, { randomInt } from 'crypto';

const resend = new Resend(process.env.RESEND_API_KEY || 're_123456789');

// Generate 6-digit OTP using cryptographically secure random
function generateOTP(): string {
    let otp = '';
    for (let i = 0; i < 6; i++) {
        otp += randomInt(0, 10);
    }
    return otp;
}

// Hash OTP for storage
function hashOTP(otp: string): string {
    return crypto.createHash('sha256').update(otp).digest('hex');
}

export async function POST(request: NextRequest) {
    try {
        const { email, name } = await request.json();

        if (!email) {
            console.error('Send OTP Error: Missing email');
            return NextResponse.json({ success: false, error: 'Email is required' }, { status: 400 });
        }

        // Rate limiting: Check for recent OTP requests
        // Using write client for strong consistency
        const recentOtps = await sanityWriteClient.fetch(
            `*[_type == "otp" && email == $email && expiresAt > now()] | order(_createdAt desc)[0...3]`,
            { email }
        );

        if (recentOtps.length >= 3) {
            console.warn(`Rate limit exceeded for ${email}`);
            return NextResponse.json(
                { success: false, error: 'Too many OTP requests. Please wait a few minutes.' },
                { status: 429 }
            );
        }

        // Generate OTP
        const otp = generateOTP();
        const hashedOtp = hashOTP(otp);
        const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString(); // 5 minutes

        // Delete any existing OTPs for this email
        const existingOtps = await sanityWriteClient.fetch(
            `*[_type == "otp" && email == $email]._id`,
            { email }
        );

        if (existingOtps.length > 0) {
            const tx = sanityWriteClient.transaction();
            existingOtps.forEach((id: string) => tx.delete(id));
            await tx.commit();
        }

        // Store new OTP in Sanity using write client
        await sanityWriteClient.create({
            _type: 'otp',
            email,
            otp: hashedOtp,
            expiresAt,
            attempts: 0,
            verified: false,
            purpose: 'login',
        });

        // Send OTP via email
        const { error } = await resend.emails.send({
            from: 'DRIPNGRID <noreply@dripngrid.in>',
            to: email,
            subject: 'Your DRIPNGRID Verification Code',
            html: `
                <!DOCTYPE html>
                <html>
                <head>
                    <meta charset="utf-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                </head>
                <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f5f5f5;">
                    <div style="max-width: 480px; margin: 0 auto; padding: 40px 20px;">
                        <div style="background-color: #ffffff; border: 1px solid #e5e5e5; padding: 40px;">
                            <h1 style="margin: 0 0 8px; font-size: 24px; font-weight: 400; letter-spacing: 4px; text-transform: uppercase; text-align: center;">
                                DRIPNGRID
                            </h1>
                            <p style="margin: 0 0 32px; font-size: 12px; color: #666; text-align: center; letter-spacing: 1px;">
                                VERIFY YOUR EMAIL
                            </p>
                            
                            <p style="margin: 0 0 24px; font-size: 14px; color: #333; line-height: 1.6;">
                                Hi${name ? ` ${name}` : ''},
                            </p>
                            
                            <p style="margin: 0 0 24px; font-size: 14px; color: #333; line-height: 1.6;">
                                Use this code to sign in to your account:
                            </p>
                            
                            <div style="background-color: #f8f8f8; border: 2px dashed #ddd; padding: 24px; text-align: center; margin: 0 0 24px;">
                                <span style="font-size: 32px; font-weight: 600; letter-spacing: 8px; color: #000;">
                                    ${otp}
                                </span>
                            </div>
                            
                            <p style="margin: 0 0 24px; font-size: 12px; color: #666; line-height: 1.6;">
                                This code expires in <strong>5 minutes</strong>. If you didn't request this, please ignore this email.
                            </p>
                            
                            <hr style="border: none; border-top: 1px solid #e5e5e5; margin: 32px 0;">
                            
                            <p style="margin: 0; font-size: 11px; color: #999; text-align: center;">
                                © ${new Date().getFullYear()} DRIPNGRID. All rights reserved.
                            </p>
                        </div>
                    </div>
                </body>
                </html>
            `,
        });

        if (error) {
            console.error('Resend API Error:', error);
            throw new Error(`Email delivery failed: ${error.message}`);
        }

        return NextResponse.json({ success: true, message: 'OTP sent successfully' });
    } catch (error: any) {
        console.error('Send OTP error:', error);
        return NextResponse.json(
            {
                success: false,
                error: error.message || 'Failed to send OTP. Please try again.'
            },
            { status: 500 }
        );
    }
}
