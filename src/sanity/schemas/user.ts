import { defineField, defineType } from 'sanity';

export default defineType({
    name: 'user',
    title: 'User',
    type: 'document',
    fieldsets: [
        {
            name: 'security',
            title: 'Security (Admin Only)',
            options: { collapsible: true, collapsed: true },
        },
        {
            name: 'profile',
            title: 'Profile Information',
            options: { collapsible: true, collapsed: false },
        },
    ],
    fields: [
        defineField({
            name: 'name',
            title: 'Name',
            type: 'string',
        }),
        defineField({
            name: 'email',
            title: 'Email',
            type: 'string',
        }),
        defineField({
            name: 'role',
            title: 'Role',
            type: 'string',
            initialValue: 'user',
            options: {
                list: ['user', 'admin'],
            },
        }),
        defineField({
            name: 'isVerified',
            title: 'Is Verified',
            type: 'boolean',
            initialValue: false,
        }),
        defineField({
            name: 'needsPasswordSet',
            title: 'Needs Password Set',
            type: 'boolean',
            initialValue: false,
            description: 'True if user was created via guest checkout and needs to set a password',
        }),
        defineField({
            name: 'emailVerified',
            title: 'Email Verified',
            type: 'datetime',
        }),
        defineField({
            name: 'image',
            title: 'Profile Image',
            type: 'url',
        }),
        // Profile fields
        defineField({
            name: 'phone',
            title: 'Phone',
            type: 'string',
            fieldset: 'profile',
        }),
        defineField({
            name: 'alternatePhone',
            title: 'Alternate Phone',
            type: 'string',
            fieldset: 'profile',
        }),
        defineField({
            name: 'address',
            title: 'Address',
            type: 'object',
            fieldset: 'profile',
            fields: [
                { name: 'line1', title: 'Address Line 1', type: 'string' },
                { name: 'line2', title: 'Address Line 2', type: 'string' },
                { name: 'city', title: 'City', type: 'string' },
                { name: 'state', title: 'State', type: 'string' },
                { name: 'postalCode', title: 'Postal Code', type: 'string' },
                { name: 'country', title: 'Country', type: 'string' },
            ],
        }),
        // Security fields (visible to admin)
        defineField({
            name: 'password',
            title: 'Current Password (Hashed)',
            type: 'string',
            fieldset: 'security',
            readOnly: true,
            description: 'Hashed password - never store plain text',
        }),
        defineField({
            name: 'passwordHistory',
            title: 'Previous Passwords (Hashed)',
            type: 'array',
            fieldset: 'security',
            of: [
                {
                    type: 'object',
                    fields: [
                        { name: 'hash', title: 'Password Hash', type: 'string', readOnly: true },
                        { name: 'changedAt', title: 'Changed At', type: 'datetime', readOnly: true },
                    ],
                },
            ],
            readOnly: true,
            description: 'History of previous password hashes',
        }),
        // Relations to other documents
        defineField({
            name: 'wishlist',
            title: 'Wishlist',
            type: 'array',
            of: [{ type: 'reference', to: [{ type: 'product' }] }],
        }),
        defineField({
            name: 'orders',
            title: 'Orders',
            type: 'array',
            of: [{ type: 'reference', to: [{ type: 'order' }] }],
        }),
    ],
    preview: {
        select: {
            title: 'name',
            subtitle: 'email',
        },
    },
});
