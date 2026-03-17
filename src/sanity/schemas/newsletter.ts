export const newsletterSubscriberSchema = {
    name: 'newsletterSubscriber',
    title: 'Newsletter Subscriber',
    type: 'document',
    fields: [
        {
            name: 'email',
            title: 'Email Address',
            type: 'string',
            validation: (Rule: any) => Rule.required().email(),
        },
        {
            name: 'subscribedAt',
            title: 'Subscribed At',
            type: 'datetime',
            initialValue: () => new Date().toISOString(),
        },
        {
            name: 'status',
            title: 'Status',
            type: 'string',
            options: {
                list: [
                    { title: 'Subscribed', value: 'subscribed' },
                    { title: 'Unsubscribed', value: 'unsubscribed' },
                ],
            },
            initialValue: 'subscribed',
        },
    ],
    preview: {
        select: {
            title: 'email',
            subtitle: 'status',
        },
    },
};

export default newsletterSubscriberSchema;
