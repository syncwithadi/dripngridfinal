import { NextResponse } from 'next/server';
import { sanityWriteClient } from '@/sanity/client';
import { generateOTP } from '@/lib/auth';
import { Resend } from 'resend';

export async function POST(req: Request) {
    const resend = new Resend(process.env.RESEND_API_KEY);
    try {
        const { email } = await req.json();

        if (!email) {
            return NextResponse.json({ message: 'Email is required' }, { status: 400 });
        }

        const user = await sanityWriteClient.fetch(`*[_type == "user" && email == $email][0]`, { email });

        if (!user) {
            // Don't reveal user existence
            return NextResponse.json({ message: 'If an account exists, an OTP has been sent.' });
        }

        const otp = generateOTP();

        // Create Verification Token
        await sanityWriteClient.create({
            _type: 'verification-token',
            identifier: email,
            token: otp,
            expires: new Date(Date.now() + 15 * 60 * 1000), // 15 mins
        });

        // Send OTP
        await resend.emails.send({
            from: 'DripNGrid <login@dripngrid.in>',
            to: email,
            subject: 'DRIPNGRID - Password Reset Request',
            html: `
                <div style="font-family: 'Helvetica Neue', Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 40px 20px; background-color: #ffffff;">
                    <div style="text-align: center; margin-bottom: 30px;">
                        <h1 style="font-size: 28px; font-weight: 300; letter-spacing: 6px; margin: 0; color: #000000;">DRIPNGRID</h1>
                    </div>
                    <div style="background-color: #f8f8f8; padding: 30px; border: 1px solid #e5e5e5;">
                        <h2 style="font-size: 18px; font-weight: 500; margin: 0 0 15px 0; color: #000000;">Password Reset Request</h2>
                        <p style="color: #666666; line-height: 1.6; margin: 0 0 25px 0; font-size: 14px;">
                            We received a request to reset your password. Use the code below to proceed:
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

        return NextResponse.json({ message: 'If an account exists, an OTP has been sent.' });
    } catch (error) {
        console.error('Forgot Password error:', error);
        return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
    }
}
