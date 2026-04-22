import type { Metadata } from "next";
import { Orbitron, JetBrains_Mono } from "next/font/google";
import { headers } from "next/headers";
import { cookieToInitialState } from "wagmi";
import "./globals.css";
import { Providers } from "@/components/Providers";
import { config } from "@/lib/wagmi/config";

const display = Orbitron({
  subsets: ["latin"],
  variable: "--font-display",
  weight: ["400", "600", "700", "900"],
});

const mono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  weight: ["400", "500", "600"],
});

const baseAppId =
  process.env.NEXT_PUBLIC_BASE_APP_ID ?? "configure-base-app-id";

export const metadata: Metadata = {
  title: "Gravity Simulator",
  description: "Cyberpunk gravity puzzle on Base — swipe to thrust, reach the portal.",
  metadataBase: process.env.NEXT_PUBLIC_SITE_URL
    ? new URL(process.env.NEXT_PUBLIC_SITE_URL)
    : undefined,
  icons: {
    icon: "/app-icon.jpg",
    apple: "/app-icon.jpg",
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const h = await headers();
  const cookie = h.get("cookie") ?? undefined;
  const initialState = cookieToInitialState(config, cookie);

  return (
    <html lang="en">
      <head>
        <meta name="base:app_id" content={baseAppId} />
      </head>
      <body
        className={`${display.variable} ${mono.variable} h-dvh max-h-dvh font-sans antialiased`}
        style={{ fontFamily: "var(--font-mono), ui-monospace, monospace" }}
      >
        <Providers initialState={initialState}>
          <div className="relative z-[1] flex h-dvh max-h-dvh min-h-0 flex-col overflow-hidden">
            {children}
          </div>
        </Providers>
      </body>
    </html>
  );
}
