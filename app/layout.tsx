import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
    title: 'Appchain Value Simulator',
    description: 'Calculate the economic impact of moving to an Appchain',
}

export default function RootLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <html lang="en">
            <body>{children}</body>
        </html>
    )
}
