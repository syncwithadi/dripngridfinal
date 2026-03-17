import { defineField, defineType } from 'sanity';

export default defineType({
    name: 'otp',
    title: 'OTP Verification',
    type: 'document',
    fields: [
        defineField({
            name: 'email',
            title: 'Email',
            type: 'string',
            validation: (Rule) => Rule.required().email(),
        }),
        defineField({
            name: 'otp',
            title: 'OTP Hash',
            type: 'string',
            description: 'Hashed OTP value',
        }),
        defineField({
            name: 'expiresAt',
            title: 'Expires At',
            type: 'datetime',
        }),
        defineField({
            name: 'attempts',
            title: 'Verification Attempts',
            type: 'number',
            initialValue: 0,
        }),
        defineField({
            name: 'verified',
            title: 'Verified',
            type: 'boolean',
            initialValue: false,
        }),
        defineField({
            name: 'purpose',
            title: 'Purpose',
            type: 'string',
            options: {
                list: ['checkout', 'login', 'password-reset'],
            },
            initialValue: 'checkout',
        }),
    ],
    preview: {
        select: {
            title: 'email',
            subtitle: 'expiresAt',
        },
    },
});
