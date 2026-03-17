export const metadata = {
    title: 'DRIPNGRID Studio',
    description: 'Content management for DRIPNGRID',
};

export default function StudioRootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="en">
            <body style={{ margin: 0 }}>
                {children}
            </body>
        </html>
    );
}
