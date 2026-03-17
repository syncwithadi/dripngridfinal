export const philosophySectionSchema = {
    name: 'philosophySection',
    title: 'Philosophy Section',
    type: 'document',
    fields: [
        {
            name: 'isActive',
            title: 'Active',
            type: 'boolean',
            initialValue: true,
        },
        {
            name: 'title',
            title: 'Title',
            type: 'string',
            initialValue: 'Crafted with Intention',
        },
        {
            name: 'subtitle',
            title: 'Subtitle',
            type: 'string',
            initialValue: 'Philosophy',
        },
        {
            name: 'description',
            title: 'Description',
            type: 'text',
            rows: 4,
            initialValue: 'DRIPNGRID was founded on a simple belief: that clothing should be both beautiful and enduring.',
        },
        {
            name: 'image',
            title: 'Main Image',
            type: 'image',
            options: { hotspot: true },
        },
        {
            name: 'stats',
            title: 'Statistics',
            type: 'array',
            of: [
                {
                    type: 'object',
                    fields: [
                        { name: 'value', type: 'string', title: 'Value (e.g. 50K+)' },
                        { name: 'label', type: 'string', title: 'Label (e.g. Customers)' },
                    ],
                },
            ],
        },
    ],
    preview: {
        select: {
            title: 'title',
            media: 'image',
        },
    },
};

export default philosophySectionSchema;
