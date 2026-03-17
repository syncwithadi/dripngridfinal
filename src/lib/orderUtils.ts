import { sanityWriteClient } from '@/sanity/client';

// Get and increment order counter atomically
export async function getNextOrderNumber(): Promise<string> {
    // Try to get existing counter
    let counter = await sanityWriteClient.fetch(
        `*[_type == "orderCounter" && name == "main"][0]`
    );

    if (!counter) {
        // Create counter document if it doesn't exist
        counter = await sanityWriteClient.create({
            _type: 'orderCounter',
            name: 'main',
            lastOrderNumber: 3000,
        });
    }

    // Increment counter atomically
    const newNumber = (counter.lastOrderNumber || 3000) + 1;

    await sanityWriteClient.patch(counter._id)
        .set({ lastOrderNumber: newNumber })
        .commit();

    // Generate random uppercase segments
    const randomSegment1 = Math.random().toString(36).substring(2, 6).toUpperCase();
    const randomSegment2 = Math.random().toString(36).substring(2, 4).toUpperCase();

    // Format: DNG-XXXX-XX-3002
    return `DNG-${randomSegment1}-${randomSegment2}-${newNumber}`;
}

// Update user profile with checkout data
export async function syncUserProfile(
    email: string,
    data: {
        phone?: string;
        alternatePhone?: string;
        address?: {
            line1: string;
            line2?: string;
            city: string;
            state: string;
            postalCode: string;
            country: string;
        };
    }
): Promise<void> {
    // Find user by email
    const user = await sanityWriteClient.fetch(
        `*[_type == "user" && email == $email][0]`,
        { email }
    );

    if (!user) return;

    // Build update object - only update empty fields
    const updates: Record<string, any> = {};

    if (data.phone && !user.phone) {
        updates.phone = data.phone;
    }

    if (data.alternatePhone && !user.alternatePhone) {
        updates.alternatePhone = data.alternatePhone;
    }

    if (data.address && !user.address?.line1) {
        updates.address = data.address;
    }

    // Only patch if there are updates
    if (Object.keys(updates).length > 0) {
        await sanityWriteClient.patch(user._id)
            .set(updates)
            .commit();
    }
}
