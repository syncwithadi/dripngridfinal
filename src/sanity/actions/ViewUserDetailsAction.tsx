'use client';

import { useEffect, useState, useCallback } from 'react';
import { EyeOpenIcon } from '@sanity/icons';
import { DocumentActionComponent, DocumentActionProps, useClient } from 'sanity';
import { Dialog, Box, Text, Stack, Card, Flex, Badge, Heading } from '@sanity/ui';

interface UserDetails {
    _id: string;
    name?: string;
    email?: string;
    role?: string;
    isVerified?: boolean;
    phone?: string;
    address?: {
        line1?: string;
        line2?: string;
        city?: string;
        state?: string;
        postalCode?: string;
        country?: string;
    };
    wishlist?: Array<{
        _id: string;
        name: string;
        price: number;
    }>;
    orders?: Array<{
        _id: string;
        orderNumber: string;
        status: string;
        totalAmount: number;
        createdAt: string;
    }>;
}

export const ViewUserDetailsAction: DocumentActionComponent = (
    props: DocumentActionProps
) => {
    const { id, type, published, draft } = props;
    const [isDialogOpen, setDialogOpen] = useState(false);
    const [userDetails, setUserDetails] = useState<UserDetails | null>(null);
    const [loading, setLoading] = useState(false);
    const client = useClient({ apiVersion: '2024-01-01' });

    // Only show for user documents
    if (type !== 'user') {
        return null;
    }

    const fetchUserDetails = useCallback(async () => {
        setLoading(true);
        try {
            // Fetch user with expanded references
            const userData = await client.fetch(
                `*[_type == "user" && _id == $id][0]{
          _id,
          name,
          email,
          role,
          isVerified,
          phone,
          address,
          "wishlist": wishlist[]->{ _id, name, price },
          "orders": orders[]->{ _id, orderNumber, status, totalAmount, createdAt }
        }`,
                { id: published?._id || draft?._id || id }
            );
            setUserDetails(userData);
        } catch (error) {
            console.error('Error fetching user details:', error);
        } finally {
            setLoading(false);
        }
    }, [client, id, published?._id, draft?._id]);

    const handleOpen = useCallback(() => {
        setDialogOpen(true);
        fetchUserDetails();
    }, [fetchUserDetails]);

    return {
        label: 'View User Details',
        icon: EyeOpenIcon,
        onHandle: handleOpen,
        dialog: isDialogOpen && {
            type: 'dialog',
            onClose: () => setDialogOpen(false),
            header: 'User Details (Admin View)',
            content: (
                <Box padding={4}>
                    {loading ? (
                        <Text muted>Loading user details...</Text>
                    ) : userDetails ? (
                        <Stack space={5}>
                            {/* Basic Info */}
                            <Card padding={4} radius={2} shadow={1}>
                                <Stack space={3}>
                                    <Heading as="h4" size={1}>Profile Information</Heading>
                                    <Flex gap={2} align="center">
                                        <Text weight="semibold">Name:</Text>
                                        <Text>{userDetails.name || 'N/A'}</Text>
                                    </Flex>
                                    <Flex gap={2} align="center">
                                        <Text weight="semibold">Email:</Text>
                                        <Text>{userDetails.email || 'N/A'}</Text>
                                    </Flex>
                                    <Flex gap={2} align="center">
                                        <Text weight="semibold">Phone:</Text>
                                        <Text>{userDetails.phone || 'N/A'}</Text>
                                    </Flex>
                                    <Flex gap={2} align="center">
                                        <Text weight="semibold">Role:</Text>
                                        <Badge tone={userDetails.role === 'admin' ? 'positive' : 'default'}>
                                            {userDetails.role || 'user'}
                                        </Badge>
                                    </Flex>
                                    <Flex gap={2} align="center">
                                        <Text weight="semibold">Verified:</Text>
                                        <Badge tone={userDetails.isVerified ? 'positive' : 'caution'}>
                                            {userDetails.isVerified ? 'Yes' : 'No'}
                                        </Badge>
                                    </Flex>
                                </Stack>
                            </Card>

                            {/* Address */}
                            {userDetails.address && (
                                <Card padding={4} radius={2} shadow={1}>
                                    <Stack space={3}>
                                        <Heading as="h4" size={1}>Shipping Address</Heading>
                                        <Text>
                                            {[
                                                userDetails.address.line1,
                                                userDetails.address.line2,
                                                userDetails.address.city,
                                                userDetails.address.state,
                                                userDetails.address.postalCode,
                                                userDetails.address.country,
                                            ]
                                                .filter(Boolean)
                                                .join(', ') || 'No address saved'}
                                        </Text>
                                    </Stack>
                                </Card>
                            )}

                            {/* Wishlist */}
                            <Card padding={4} radius={2} shadow={1}>
                                <Stack space={3}>
                                    <Flex justify="space-between" align="center">
                                        <Heading as="h4" size={1}>Wishlist</Heading>
                                        <Badge>{userDetails.wishlist?.length || 0} items</Badge>
                                    </Flex>
                                    {userDetails.wishlist && userDetails.wishlist.length > 0 ? (
                                        <Stack space={2}>
                                            {userDetails.wishlist.map((item) => (
                                                <Card key={item._id} padding={3} radius={2} tone="default">
                                                    <Flex justify="space-between" align="center">
                                                        <Text size={1}>{item.name}</Text>
                                                        <Text size={1} weight="semibold">
                                                            ₹{item.price?.toLocaleString()}
                                                        </Text>
                                                    </Flex>
                                                </Card>
                                            ))}
                                        </Stack>
                                    ) : (
                                        <Text muted size={1}>No items in wishlist</Text>
                                    )}
                                </Stack>
                            </Card>

                            {/* Orders */}
                            <Card padding={4} radius={2} shadow={1}>
                                <Stack space={3}>
                                    <Flex justify="space-between" align="center">
                                        <Heading as="h4" size={1}>Order History</Heading>
                                        <Badge>{userDetails.orders?.length || 0} orders</Badge>
                                    </Flex>
                                    {userDetails.orders && userDetails.orders.length > 0 ? (
                                        <Stack space={2}>
                                            {userDetails.orders.map((order) => (
                                                <Card key={order._id} padding={3} radius={2} tone="default">
                                                    <Stack space={2}>
                                                        <Flex justify="space-between" align="center">
                                                            <Text size={1} weight="semibold">
                                                                Order #{order.orderNumber}
                                                            </Text>
                                                            <Badge
                                                                tone={
                                                                    order.status === 'delivered'
                                                                        ? 'positive'
                                                                        : order.status === 'cancelled'
                                                                            ? 'critical'
                                                                            : 'caution'
                                                                }
                                                            >
                                                                {order.status}
                                                            </Badge>
                                                        </Flex>
                                                        <Flex justify="space-between" align="center">
                                                            <Text muted size={1}>
                                                                {order.createdAt
                                                                    ? new Date(order.createdAt).toLocaleDateString()
                                                                    : 'N/A'}
                                                            </Text>
                                                            <Text size={1} weight="semibold">
                                                                ₹{order.totalAmount?.toLocaleString()}
                                                            </Text>
                                                        </Flex>
                                                    </Stack>
                                                </Card>
                                            ))}
                                        </Stack>
                                    ) : (
                                        <Text muted size={1}>No orders yet</Text>
                                    )}
                                </Stack>
                            </Card>

                            {/* Security Notice */}
                            <Card padding={3} radius={2} tone="caution">
                                <Text size={1} muted>
                                    ⚠️ This is a read-only view. User sessions and authentication data are not accessible for security reasons.
                                </Text>
                            </Card>
                        </Stack>
                    ) : (
                        <Text muted>Unable to load user details.</Text>
                    )}
                </Box>
            ),
        },
    };
};
