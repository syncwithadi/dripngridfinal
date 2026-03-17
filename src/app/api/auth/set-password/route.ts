import { NextRequest, NextResponse } from 'next/server';
import { sanityWriteClient } from '@/sanity/client';
import { hashPassword } from '@/lib/auth';

export async function POST(request: NextRequest) {
    try {
        const { email, userId, password } = await request.json();

        if (!email || !password) {
            return NextResponse.json(
                { success: false, error: 'Email and password are required' },
                { status: 400 }
            );
        }

        if (password.length < 6) {
            return NextResponse.json(
                { success: false, error: 'Password must be at least 6 characters' },
                { status: 400 }
            );
        }

        // Find the user
        const user = await sanityWriteClient.fetch(
            `*[_type == "user" && email == $email][0]`,
            { email }
        );

        if (!user) {
            return NextResponse.json(
                { success: false, error: 'User not found' },
                { status: 404 }
            );
        }

        // Verify user ID matches if provided
        if (userId && user._id !== userId) {
            return NextResponse.json(
                { success: false, error: 'Invalid user' },
                { status: 400 }
            );
        }

        // Check if user is verified
        if (!user.isVerified) {
            return NextResponse.json(
                { success: false, error: 'Please verify your email first' },
                { status: 400 }
            );
        }

        // Check if user needs password set
        if (!user.needsPasswordSet && user.password) {
            return NextResponse.json(
                { success: false, error: 'Password is already set. Use forgot password to reset.' },
                { status: 400 }
            );
        }

        // Hash and save the password
        const hashedPassword = await hashPassword(password);

        await sanityWriteClient
            .patch(user._id)
            .set({
                password: hashedPassword,
                needsPasswordSet: false,
            })
            .commit();

        return NextResponse.json({
            success: true,
            message: 'Password set successfully',
        });
    } catch (error: any) {
        console.error('Set password error:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to set password. Please try again.' },
            { status: 500 }
        );
    }
}
