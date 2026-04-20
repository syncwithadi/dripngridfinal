import { NextRequest, NextResponse } from 'next/server';
import { auth } from '../../../../../auth';

// GET — fetch the logged-in user's profile from Sanity
export async function GET(req: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user?.email) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { sanityClient } = await import('@/sanity/client');
        const user = await sanityClient.fetch(
            `*[_type == "user" && email == $email][0]{
        _id, name, email, phone, alternatePhone, dateOfBirth, gender,
        address { line1, line2, city, state, postalCode, country }
      }`,
            { email: session.user.email }
        );

        if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });
        return NextResponse.json({ success: true, user });
    } catch (err) {
        console.error('GET /api/user/profile error:', err);
        return NextResponse.json({ error: 'Server error' }, { status: 500 });
    }
}

// PATCH — update name, phone, address in the Sanity user doc
export async function PATCH(req: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user?.email) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await req.json();
        const { name, phone, alternatePhone, dateOfBirth, gender, address } = body;

        const { sanityClient, sanityWriteClient } = await import('@/sanity/client');

        const user = await sanityClient.fetch(
            `*[_type == "user" && email == $email][0]{ _id }`,
            { email: session.user.email }
        );
        if (!user?._id) return NextResponse.json({ error: 'User not found' }, { status: 404 });

        const patch: Record<string, any> = {};
        if (name !== undefined) patch.name = name;
        if (phone !== undefined) patch.phone = phone;
        if (alternatePhone !== undefined) patch.alternatePhone = alternatePhone;
        if (dateOfBirth !== undefined) patch.dateOfBirth = dateOfBirth;
        if (gender !== undefined) patch.gender = gender;
        if (address !== undefined) patch.address = address;

        await sanityWriteClient.patch(user._id).set(patch).commit();

        return NextResponse.json({ success: true });
    } catch (err) {
        console.error('PATCH /api/user/profile error:', err);
        return NextResponse.json({ error: 'Server error' }, { status: 500 });
    }
}
