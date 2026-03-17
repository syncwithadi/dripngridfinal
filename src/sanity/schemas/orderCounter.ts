// Order Counter Schema for Sequential Order Numbers
// This document tracks the next order number for sequential generation

export const orderCounterSchema = {
    name: 'orderCounter',
    title: 'Order Counter',
    type: 'document',
    fields: [
        {
            name: 'name',
            title: 'Counter Name',
            type: 'string',
            initialValue: 'main',
            readOnly: true,
        },
        {
            name: 'lastOrderNumber',
            title: 'Last Order Number',
            type: 'number',
            description: 'The last assigned order number. Next order will be this + 1.',
            initialValue: 3000, // Starting point, first order will be 3001
        },
    ],
    preview: {
        select: {
            lastNumber: 'lastOrderNumber',
        },
        prepare(selection: Record<string, unknown>) {
            const lastNumber = (selection.lastNumber as number) || 3000;
            return {
                title: 'Order Counter',
                subtitle: `Last: DRIP-${lastNumber}, Next: DRIP-${lastNumber + 1}`,
            };
        },
    },
};

export default orderCounterSchema;
