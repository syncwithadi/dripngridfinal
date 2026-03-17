// Studio layout - just passes children through
// The studio handles its own styling, no extra wrapper needed

export const metadata = {
    title: 'DRIPNGRID Studio',
    description: 'Content management for DRIPNGRID',
};

export default function StudioLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return children;
}
