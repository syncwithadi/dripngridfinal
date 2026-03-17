import { defineField, defineType } from 'sanity';

export default defineType({
    name: 'account',
    title: 'Account',
    type: 'document',
    fields: [
        defineField({
            name: 'userId',
            type: 'string',
        }),
        defineField({
            name: 'type',
            type: 'string',
        }),
        defineField({
            name: 'provider',
            type: 'string',
        }),
        defineField({
            name: 'providerAccountId',
            type: 'string',
        }),
        defineField({
            name: 'refresh_token',
            type: 'string',
        }),
        defineField({
            name: 'access_token',
            type: 'string',
        }),
        defineField({
            name: 'expires_at',
            type: 'number',
        }),
        defineField({
            name: 'token_type',
            type: 'string',
        }),
        defineField({
            name: 'scope',
            type: 'string',
        }),
        defineField({
            name: 'id_token',
            type: 'string',
        }),
        defineField({
            name: 'session_state',
            type: 'string',
        }),
        defineField({
            name: 'user',
            title: 'User',
            type: 'reference',
            to: { type: 'user' },
        }),
    ],
});
