import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "FreeWave - Free Ad-free Music",
  description: "Free, ad-free browser music player. Playlists saved locally.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
