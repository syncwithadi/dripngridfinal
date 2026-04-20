import { NextResponse } from 'next/server';
import { sanityWriteClient } from '@/sanity/client';
import { hashPassword, generateOTP } from '@/lib/auth';
import { Resend } from 'resend';
import crypto from 'crypto';


export async function POST(req: Request) {
    const resend = new Resend(process.env.RESEND_API_KEY);
    try {
        const { name, email, password } = await req.json();

        if (!name || !email || !password) {
            return NextResponse.json({ message: 'Missing required fields' }, { status: 400 });
        }

        // Check if user exists
        const existingUser = await sanityWriteClient.fetch(
            `*[_type == "user" && email == $email][0]`,
            { email }
        );

        if (existingUser) {
            if (existingUser.isVerified) {
                return NextResponse.json({ message: 'User already exists' }, { status: 409 });
            } else {
                // Resend OTP if user exists but is not verified? Or just update password and send new OTP?
                // For simplicity, let's treat it as a new signup attempt but update the existing record
            }
        }

        const hashedPassword = await hashPassword(password);
        const otp = generateOTP();
        // Hash the OTP before storing — the plain OTP is only sent by email
        const hashedOtp = crypto.createHash('sha256').update(otp).digest('hex');

        // Create Verification Token (store hash, never plaintext)
        await sanityWriteClient.create({
            _type: 'verification-token',
            identifier: email,
            token: hashedOtp,
            expires: new Date(Date.now() + 15 * 60 * 1000), // 15 mins
        });

        // Create or Update User
        if (existingUser) {
            await sanityWriteClient.patch(existingUser._id).set({
                name,
                password: hashedPassword,
                isVerified: false
            }).commit();
        } else {
            await sanityWriteClient.create({
                _type: 'user',
                name,
                email,
                password: hashedPassword,
                isVerified: false,
                role: 'user',
            });
        }

        // Send OTP Email
        await resend.emails.send({
            from: 'DripNGrid <login@dripngrid.in>',
            to: email,
            subject: 'Welcome to DRIPNGRID - Verify Your Email',
            html: `
                <div style="font-family: 'Helvetica Neue', Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 40px 20px; background-color: #ffffff;">
                    <div style="text-align: center; margin-bottom: 30px;">
                        <h1 style="font-size: 28px; font-weight: 300; letter-spacing: 6px; margin: 0; color: #000000;">DRIPNGRID</h1>
                    </div>
                    <div style="background-color: #f8f8f8; padding: 30px; border: 1px solid #e5e5e5;">
                        <h2 style="font-size: 18px; font-weight: 500; margin: 0 0 15px 0; color: #000000;">Welcome!</h2>
                        <p style="color: #666666; line-height: 1.6; margin: 0 0 25px 0; font-size: 14px;">
                            Thank you for creating an account with us. Use the verification code below to complete your registration:
                        </p>
                        <div style="font-size: 36px; font-weight: bold; letter-spacing: 10px; padding: 25px; background: #000000; color: #ffffff; text-align: center; margin-bottom: 25px;">
                            ${otp}
                        </div>
                        <p style="color: #999999; font-size: 12px; margin: 0; text-align: center;">
                            This code expires in 15 minutes. If you didn't request this, please ignore this email.
                        </p>
                    </div>
                    <div style="text-align: center; margin-top: 30px;">
                        <p style="color: #999999; font-size: 11px; margin: 0;">
                            © ${new Date().getFullYear()} DRIPNGRID. All rights reserved.
                        </p>
                    </div>
                </div>
            `,
        });

        return NextResponse.json({ message: 'Signup successful. Please check your email for OTP.' });
    } catch (error) {
        console.error('Signup error:', error);
        return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
    }
}
