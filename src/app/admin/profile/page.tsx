'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAdmin } from '@/components/admin/AdminShell';
import AdminShell from '@/components/admin/AdminShell';

function ProfileRedirect() {
  const { user } = useAdmin();
  const router = useRouter();

  useEffect(() => {
    if (user?.employeeId) {
      router.replace(`/admin/users/${user.employeeId}`);
    }
  }, [user, router]);

  return (
    <div style={{ padding: 40, color: 'var(--as-muted)', fontSize: 13 }}>
      Loading your profile…
    </div>
  );
}

export default function MyProfilePage() {
  return (
    <AdminShell title="My Profile">
      <ProfileRedirect />
    </AdminShell>
  );
}
